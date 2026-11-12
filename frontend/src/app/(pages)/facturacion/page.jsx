import Facturacion from "@/app/views/Facturacion";

export const metadata = {
  title: "Facturación y balance | Atlas Ops",
};

export default async function FacturacionPage({ searchParams }) {
  const { tab, ambito } = await searchParams;
  return <Facturacion notificationTab={tab} notificationScope={ambito} />;
}
