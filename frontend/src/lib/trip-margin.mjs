export function tripMargin(trip) {
  const rows = Object.fromEntries(["ARS", "USD", "CLP"].map((currency) => [
    currency, { currency, income: null, costs: [] },
  ]));
  const cents = (amount) => Math.round(amount * 100);
  const add = (currency, label, amount) => {
    if (Number.isFinite(amount) && amount !== 0) {
      rows[currency].costs.push({ label, cents: cents(amount) });
    }
  };

  for (const [currency, tariff] of [["ARS", trip.tarifaTotalAr], ["USD", trip.tarifaTotalUsd]]) {
    if (Number.isFinite(tariff) && tariff !== 0) {
      if (trip.direccion_facturacion === "recibida") add(currency, "Tarifa recibida", tariff);
      else rows[currency].income = cents(tariff);
    }
  }

  const driverCosts = [
    ["ARS", "Honorarios", trip.tarifaChoferAr],
    ["USD", "Honorarios", trip.tarifaChoferUsd || undefined],
    ["ARS", "Estadía", trip.estadiaAr],
    ["CLP", "Estadía", trip.estadiaCh],
  ];
  if (!trip.tarifaChoferUsd) {
    driverCosts.push(["ARS", "Honorarios convertidos a ARS", trip.tarifaChoferUsdAr]);
  }
  if (driverCosts.some(([, , amount]) => Number.isFinite(amount) && amount !== 0)) {
    driverCosts.forEach(([currency, label, amount]) => add(currency, label, amount));
  } else {
    add("ARS", "Total chofer", trip.totalChofer);
  }

  add("ARS", "Peajes", trip.peajeAr);
  add("CLP", "Peajes", trip.peajeCh);
  const fuel = { ARS: 0, USD: 0, CLP: 0 };
  for (const carga of trip.cargasCombustible ?? []) {
    if (Object.hasOwn(fuel, carga.moneda)) fuel[carga.moneda] += cents(carga.importe);
  }
  for (const currency of Object.keys(fuel)) {
    if (fuel[currency]) rows[currency].costs.push({ label: "Combustible", cents: fuel[currency] });
  }

  return Object.values(rows)
    .filter(({ income, costs }) => income !== null || costs.length)
    .map((row) => {
      const cost = row.costs.reduce((total, item) => total + item.cents, 0);
      return { ...row, cost, margin: row.income === null ? null : row.income - cost };
    });
}
