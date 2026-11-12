import ViajeDetail from "../../../../views/ViajeDetail";

export const metadata = {
  title: "Detalle del viaje | Atlas Ops",
};

export default async function TripDetailPage({ searchParams }) {
  const { desde } = await searchParams;
  return <ViajeDetail backHref={desde === "viajes" ? "/viajes" : "/dashboard"} />;
}
