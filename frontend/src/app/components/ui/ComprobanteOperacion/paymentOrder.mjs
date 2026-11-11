import { jsPDF } from 'jspdf';

const ink = '#172033';
const muted = '#52617a';
const tint = '#eef2f8';
const left = 16;
const right = 194;
const pageBottom = 281;

export function createPaymentOrder({ item, company, form, signature, remaining, methods, invoices = [] }) {
  const doc = new jsPDF({ format: 'a4' });
  const money = value => Number(value || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const movements = item.historial_pagos?.length ? item.historial_pagos : [item];
  const cheques = movements.flatMap(movement => movement.cheques || []);
  const paymentRows = methods.flatMap(({ value, label }) => {
    const cents = movements.reduce((sum, movement) => {
      if (value === 'cheque' && movement.cheques?.length) {
        return movement.cheques.reduce((subtotal, cheque) => subtotal + Math.round(Number(cheque.monto) * 100), sum);
      }
      const method = movement.metodos_pago?.[value];
      return method?.enabled ? sum + Math.round(Number(method.monto) * 100) : sum;
    }, 0);
    return cents > 0 ? [[label, money(cents / 100)]] : [];
  });

  let y = 19;
  const style = (size, weight = 'normal', color = ink) => {
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
    doc.setTextColor(color);
  };
  const title = label => {
    style(11, 'bold');
    doc.text(label, left, y);
    y += 4;
  };
  const details = (columns) => {
    const bottoms = columns.map((fields, index) => {
      let rowY = y;
      const x = left + index * 91;
      for (const [label, value] of fields) {
        style(8, 'bold', muted);
        doc.text(label, x, rowY);
        style(10);
        const lines = doc.splitTextToSize(String(value ?? '—'), 85);
        doc.text(lines, x, rowY + 4);
        rowY += 6 + lines.length * 4;
      }
      return rowY;
    });
    y = Math.max(...bottoms);
  };

  function table(label, headings, widths, rows, reserve = 0) {
    const start = () => {
      title(label);
      doc.setFillColor(tint);
      doc.rect(left, y, right - left, 7, 'F');
      style(9, 'bold');
      let x = left;
      headings.forEach((heading, index) => {
        const last = index === headings.length - 1;
        doc.text(heading, last ? right - 3 : x + 3, y + 4.8, { align: last ? 'right' : 'left' });
        x += widths[index];
      });
      y += 7;
    };
    start();
    rows.forEach((row, rowIndex) => {
      style(9);
      const cells = row.map((value, index) => doc.splitTextToSize(String(value), widths[index] - 6));
      const height = Math.max(6, 2 + Math.max(...cells.map(lines => lines.length)) * 4);
      const afterRow = rowIndex === rows.length - 1 ? reserve : 0;
      if (y + height + afterRow > pageBottom) {
        doc.addPage();
        y = 19;
        start();
        style(9);
      }
      let x = left;
      cells.forEach((lines, index) => {
        const last = index === cells.length - 1;
        doc.text(lines, last ? right - 3 : x + 3, y + 4.2, { align: last ? 'right' : 'left' });
        x += widths[index];
      });
      y += height;
      doc.setDrawColor(tint);
      doc.line(left, y, right, y);
    });
    y += 9;
  }

  style(23, 'bold');
  doc.text(invoices.length ? 'Orden de pago agrupada' : 'Orden de pago', left, y);
  style(10, 'normal', muted);
  const companyLines = doc.splitTextToSize(company.nombre, 135);
  doc.text(companyLines, left, y + 7);
  if (company.logo) {
    const { width, height, fileType } = doc.getImageProperties(company.logo);
    const scale = Math.min(32 / width, 20 / height);
    doc.addImage(company.logo, fileType, right - width * scale, 13, width * scale, height * scale);
  }
  y = Math.max(39, y + 9 + companyLines.length * 4);
  details([
    [['Beneficiario', item.razon_social], ['CUIT', item.cuit], ['Fecha de emisión', form.fecha]],
    [[invoices.length ? 'Comprobantes incluidos' : 'Factura', invoices.length || item.numero_comprobante], ['Moneda', item.moneda || 'Sin definir'], ['Estado', item.estado?.replaceAll('_', ' ')]],
  ]);
  details([
    [['Importe de la factura', money(item.monto)], ['Saldo pendiente', money(remaining)]],
    [['Pagado acumulado', money(item.monto_pagado)]],
  ]);
  y += 2;

  const amountHeader = item.moneda ? 'Importe (' + item.moneda + ')' : 'Importe';
  if (invoices.length) {
    table('Facturas incluidas', ['Comprobante', 'Importe de la factura', 'Importe de la orden'], [78, 50, 50],
      invoices.map(invoice => [invoice.numero_comprobante, money(invoice.monto), money(invoice.importeOrden)]));
  }
  const signatureSpace = 48;
  table('Formas de pago', ['Medio', amountHeader], [110, 68], paymentRows.length ? paymentRows : [['Sin pagos registrados', '—']], cheques.length ? 0 : signatureSpace);
  if (cheques.length) {
    if (y + 17 + signatureSpace > pageBottom) {
      doc.addPage();
      y = 19;
    }
    table('Detalle de cheques', ['Número', 'Vencimiento', amountHeader], [80, 48, 50],
      cheques.map(cheque => [cheque.numero, cheque.vencimiento || 'Sin registrar', money(cheque.monto)]),
      signatureSpace);
  }
  style(9);
  doc.text(form.nombre.trim() + ' · DNI ' + form.dni, left, y);
  doc.addImage(signature, 'PNG', left, y + 3, 72, 21.6);
  doc.setDrawColor(muted);
  doc.line(left, y + 26, left + 72, y + 26);
  style(8, 'normal', muted);
  doc.text('Firma del autorizante', left, y + 31);

  return doc;
}

