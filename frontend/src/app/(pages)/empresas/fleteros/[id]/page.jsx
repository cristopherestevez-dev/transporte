"use client";
import EmpresaDetail from "@/app/views/EmpresaDetail";

export default function FleteroDetailPage({ params }) {
  return <EmpresaDetail id={params.id} tipo="fletero" />;
}
