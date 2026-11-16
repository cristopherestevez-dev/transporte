const chileUrl = "https://rest-sit.mop.gob.cl/arcgis/rest/services/VIALIDAD/Pasos_Fronterizos/MapServer/0/query";
const argentinaUrl = "https://www.argentina.gob.ar/seguridad/pasosinternacionales/detalle/ruta/29/Sistema-Cristo-Redentor";
const query = new URLSearchParams({
  where: "PASO = 'SCREDENTOR'",
  outFields: "ACTUAL,ESTADOINFORME,TRANSITABILIDAD,HABILITADO",
  orderByFields: "ACTUAL DESC",
  resultRecordCount: "1",
  returnGeometry: "false",
  f: "json",
});

const statuses = {
  "TRÁNSITO SIN RESTRICCIÓN": "open",
  "TRÁNSITO CON RESTRICCIÓN": "restricted",
  "TRÁNSITO INTERRUMPIDO": "closed",
};
const maxReportAge = 48 * 60 * 60 * 1000;
const timeZone = "America/Argentina/Buenos_Aires";
const unknown = { status: "unknown" };
let latestReport = unknown;

function isFresh(timestamp, now) {
  const age = now - timestamp;
  return Number.isFinite(timestamp) && age >= 0 && age < maxReportAge;
}

function chileReport(data, now) {
  const fields = data?.features?.[0]?.attributes;
  if (!Number.isFinite(fields?.ACTUAL) || !Number.isFinite(new Date(fields.ACTUAL).getTime()) || fields.ACTUAL > now) return unknown;
  const fresh = isFresh(fields.ACTUAL, now) && fields.ESTADOINFORME?.toUpperCase() === "ACTUAL";
  const status = fresh ? (statuses[fields.TRANSITABILIDAD] ?? "unknown") : "unknown";
  return {
    status,
    source: "Vialidad de Chile",
    reportedAt: new Date(fields.ACTUAL).toISOString(),
    restriction: status === "restricted" ? fields.HABILITADO || null : null,
  };
}

function fechaInforme(html, organismo) {
  const pattern = new RegExp(organismo + String.raw`\s*\([^<]*?(\d{2})/(\d{2})/(\d{4})\s*-\s*(\d{2}):(\d{2})`, "i");
  const match = html.match(pattern);
  if (!match) return NaN;
  const [, day, month, year, hour, minute] = match;
  return Date.parse(year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":00-03:00");
}

function estadoPorHorario(html, now) {
  const horario = html.match(/\bvar\s+fechaSchema\s*=\s*'([^']+)'/)?.[1]?.trim();
  if (!horario) return null;

  const [rule, note] = horario.split('"');
  if (/^24\/7(?:\s+open)?\s*$/.test(rule)) return { open: true, note };
  if (/^(?:24\/7\s+)?off\s*$/.test(rule)) return { open: false };

  const daily = rule.match(/^Mo-Su\s+(\d{2}:\d{2})-(\d{2}:\d{2})(?:\s+open)?\s*$/);
  if (!daily) return null;
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
  const [, from, to] = daily;
  if (from >= to) return null;
  return { open: localTime >= from && localTime < to, note };
}

function argentinaReport(html, now) {
  const pasoAt = fechaInforme(html, "Vicejefatura de Gabinete del Interior");
  const rutaAt = fechaInforme(html, "Vialidad Nacional");
  const latest = [pasoAt, rutaAt].filter(date => Number.isFinite(date) && date <= now).sort((a, b) => b - a)[0];
  if (latest === undefined) return unknown;

  const source = "Argentina.gob.ar";
  const last = { ...unknown, source, reportedAt: new Date(latest).toISOString() };
  if (!isFresh(pasoAt, now)) return last;

  const paso = html.match(/\bvar\s+estadoPrioridad\s*=\s*"([^"]+)"/)?.[1]?.toUpperCase();
  if (paso === "CERRADO") return { status: "closed", source, reportedAt: new Date(pasoAt).toISOString() };
  if (paso !== "ABIERTO") return last;

  const horario = estadoPorHorario(html, now);
  const pasoReport = { source, reportedAt: new Date(pasoAt).toISOString() };
  if (horario?.open === false) return { ...pasoReport, status: "closed", restriction: "Fuera del horario publicado" };
  if (!horario || !isFresh(rutaAt, now)) return last;

  const ruta = html.match(/\bvar\s+estadoVialidad\s*=\s*"([^"]+)"/)?.[1]?.toUpperCase();
  if (ruta === "CORTE TOTAL") return { ...last, status: "closed" };
  if (ruta === "RESTRINGIDA") return { ...last, status: "restricted", restriction: horario.note || null };
  if (ruta === "HABILITADA") return { ...last, status: horario.note ? "restricted" : "open", restriction: horario.note || null };
  return last;
}

async function consultar(url, parse, read, now) {
  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    return response.ok ? parse(await read(response), now) : unknown;
  } catch {
    return unknown;
  }
}

function recordar(report) {
  if (report.reportedAt && (!latestReport.reportedAt || report.reportedAt > latestReport.reportedAt)) {
    latestReport = { ...unknown, source: report.source, reportedAt: report.reportedAt };
  }
}

export async function GET() {
  const now = Date.now();
  const chile = await consultar(chileUrl + "?" + query, chileReport, response => response.json(), now);
  recordar(chile);
  if (chile.status !== "unknown") return Response.json(chile);

  const argentina = await consultar(argentinaUrl, argentinaReport, response => response.text(), now);
  recordar(argentina);
  return Response.json(argentina.status !== "unknown" ? argentina : latestReport);
}
