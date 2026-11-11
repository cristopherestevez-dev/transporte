const endpoint = "https://rest-sit.mop.gob.cl/arcgis/rest/services/VIALIDAD/Pasos_Fronterizos/MapServer/0/query";
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

function reportFrom(data, now) {
  const fields = data?.features?.[0]?.attributes;
  if (!Number.isFinite(fields?.ACTUAL)) return { status: "unknown" };

  const reportedAt = new Date(fields.ACTUAL).toISOString();
  const age = now - fields.ACTUAL;
  const fresh = age >= 0 && age < maxReportAge &&
    fields.ESTADOINFORME?.toUpperCase() === "ACTUAL";
  const status = fresh ? (statuses[fields.TRANSITABILIDAD] ?? "unknown") : "unknown";

  return {
    status,
    reportedAt,
    restriction: status === "restricted" ? (fields.HABILITADO || null) : null,
  };
}

export async function GET() {
  try {
    const response = await fetch(endpoint + "?" + query, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return Response.json({ status: "unknown" });
    return Response.json(reportFrom(await response.json(), Date.now()));
  } catch {
    return Response.json({ status: "unknown" });
  }
}