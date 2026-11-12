import EmpresaDetail from "@/app/views/EmpresaDetail";

export const metadata = {
  title: "Detalle del fletero | Atlas Ops",
};

export default async function FleteroDetailPage({ params }) {
  return <EmpresaDetail id={(await params).id} tipo="fletero" />;
}
