import EmpresaDetail from "@/app/views/EmpresaDetail";

export const metadata = {
  title: "Detalle de la empresa | Atlas Ops",
};

export default async function EmpresaDetailPage({ params }) {
  return <EmpresaDetail id={(await params).id} />;
}
