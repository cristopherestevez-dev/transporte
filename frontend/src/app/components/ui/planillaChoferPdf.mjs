import { jsPDF } from "jspdf";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const columns = [
  ["ID", 18],
  ["Origen", 38],
  ["Destino", 38],
  ["Patente semi", 25],
  ["Tipo de carga", 33],
  ["Total chofer", 30],
];

function tipoCarga(viaje) {
  if (viaje.tipoCarga === "byl" || viaje.carga === "ByL") return "ByL";
  if (viaje.tipoCarga === "contenedor" || viaje.carga) return viaje.carga?.trim() || "Contenedor";
  return "—";
}

export function crearPdfPlanilla(planilla) {
  const pdf = new jsPDF({ format: "a4" });
  const left = 14;
  const lineHeight = 4;
  let y;

  function header() {
    pdf.setTextColor("#172033");
    pdf.setFont("helvetica", "bold").setFontSize(16);
    pdf.text("Atlas Ops · Planilla de viajes", left, 20);
    pdf.setFont("helvetica", "normal").setFontSize(10);
    const title = pdf.splitTextToSize(planilla.chofer + " · " + planilla.mes, 182);
    pdf.text(title, left, 27);
    y = 31 + title.length * lineHeight;
    pdf.setFillColor("#eef2f8");
    pdf.rect(left, y, 182, 8, "F");
    pdf.setFont("helvetica", "bold").setFontSize(9);
    let x = left;
    for (const [label, width] of columns) {
      pdf.text(label, x + 2, y + 5);
      x += width;
    }
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setDrawColor("#cbd5e1");
  }

  header();
  for (const viaje of planilla.viajes) {
    const id = viaje.numeroOperativo
      ? (viaje.tipo === "internacional" ? "I" : "N") + viaje.numeroOperativo
      : "—";
    const values = [
      id, viaje.origen, viaje.destino, viaje.semirremolquePatente, tipoCarga(viaje),
      viaje.totalChofer == null ? "—" : money.format(viaje.totalChofer),
    ];
    const cells = values.map((value, index) => pdf.splitTextToSize(String(value || "—"), columns[index][1] - 4));
    const lineCount = Math.max(...cells.map(lines => lines.length));
    for (let start = 0; start < lineCount;) {
      if (y + 3 + lineHeight > 283) {
        pdf.addPage();
        header();
      }
      const linesOnPage = Math.min(lineCount - start, Math.floor((283 - y - 3) / lineHeight));
      const rowHeight = 3 + linesOnPage * lineHeight;
      let x = left;
      cells.forEach((lines, index) => {
        const width = columns[index][1];
        const amount = index === columns.length - 1;
        pdf.rect(x, y, width, rowHeight);
        pdf.text(lines.slice(start, start + linesOnPage), amount ? x + width - 2 : x + 2, y + 4.5, {
          align: amount ? "right" : "left",
        });
        x += width;
      });
      y += rowHeight;
      start += linesOnPage;
    }
  }
  if (y + 11 > 283) {
    pdf.addPage();
    header();
  }
  pdf.setFillColor("#eef2f8");
  pdf.rect(left, y, 182, 11, "F");
  pdf.setFont("helvetica", "bold").setFontSize(10);
  pdf.text("Total neto liquidado del mes (ARS)", left + 2, y + 7);
  pdf.text(money.format(planilla.neto), left + 180, y + 7, { align: "right" });

  return pdf;
}
