export function amounts(item) {
  const total = Math.round(Number(item.monto || 0) * 100);
  const settled = item.estado === "pagado" || item.estado === "cobrado";
  const paid = settled ? total : Math.min(total, Math.max(0, Math.round(Number(item.monto_pagado || 0) * 100)));
  const sign = item.tipo_comprobante === "nota_credito" ? -1 : 1;
  return { total: sign * total, paid: sign * paid, pending: sign * (total - paid) };
}

export function summarize(rows) {
  const result = { emitted: 0, received: 0, collected: 0, paid: 0, receivable: 0, payable: 0 };
  for (const row of rows) {
    const value = amounts(row);
    if (row.direction === "emitida") {
      result.emitted += value.total;
      result.collected += value.paid;
      result.receivable += value.pending;
    } else {
      result.received += value.total;
      result.paid += value.paid;
      result.payable += value.pending;
    }
  }
  return { ...result, balance: result.emitted - result.received, cash: result.collected - result.paid, pending: result.receivable - result.payable };
}
