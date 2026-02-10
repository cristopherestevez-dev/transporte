"use client";
import EmpresaDetail from "@/app/views/EmpresaDetail";

export default function EmpresaDetailPage({ params }) {
  return <EmpresaDetail id={params.id} />;
}
