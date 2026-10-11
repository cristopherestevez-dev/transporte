import Facturacion from "@/app/views/Facturacion";

export default function FacturacionPage({ searchParams }) {
  return <Facturacion notificationTab={searchParams?.tab} notificationScope={searchParams?.ambito} />;
}
