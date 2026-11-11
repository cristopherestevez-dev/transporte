"use client";
import EmpresaDetail from "@/app/views/EmpresaDetail";

export default async function FleteroDetailPage({ params }) {
  return <EmpresaDetail id={(await params).id} tipo="fletero" />;
}
