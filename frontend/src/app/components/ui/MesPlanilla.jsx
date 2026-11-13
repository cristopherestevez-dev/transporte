"use client";

const timeZone = "America/Argentina/Buenos_Aires";
const calendar = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" });
const label = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", month: "long", year: "numeric" });

export function mesesPlanilla() {
  const parts = calendar.formatToParts();
  const year = Number(parts.find(part => part.type === "year").value);
  const month = Number(parts.find(part => part.type === "month").value);
  return [month - 1, month].map(index => new Date(Date.UTC(year, index, 1)).toISOString().slice(0, 7));
}

export default function MesPlanilla({ value, onChange, fechaOriginal }) {
  const meses = mesesPlanilla();
  const editing = fechaOriginal !== undefined;
  const selected = value || (editing ? "" : meses[0]);
  if (value && !meses.includes(value)) meses.unshift(value);

  return (
    <label className="grid gap-1 text-sm">
      Mes de la planilla
      <select className="rounded-[10px] border border-divider bg-content1 p-2"
        value={selected} onChange={event => onChange(event.target.value)}>
        {editing && !value && <option value="">Según fecha de salida</option>}
        {meses.map(mes => <option key={mes} value={mes}>{label.format(new Date(mes + "-01T00:00:00Z"))}</option>)}
      </select>
    </label>
  );
}
