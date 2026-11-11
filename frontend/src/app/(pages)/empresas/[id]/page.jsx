"use client";
import EmpresaDetail from "@/app/views/EmpresaDetail";

export default async function EmpresaDetailPage({ params }) {
  return <EmpresaDetail id={(await params).id} />;
}
