export function idViaje(numero, tipo) {
  if (!numero) return "—";
  return (tipo === "internacional" ? "I" : "N") + numero;
}
