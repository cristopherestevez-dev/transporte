import ViajeDetail from "../../../../views/ViajeDetail";

export default async function TripDetailPage({ searchParams }) {
  const { desde } = await searchParams;
  return <ViajeDetail backHref={desde === "viajes" ? "/viajes" : "/dashboard"} />;
}
