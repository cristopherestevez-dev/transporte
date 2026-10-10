"use client";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AppSelect from '../AppSelect/AppSelect';
export function PageSizeSelect({ pageSize, onPageSizeChange }) {
  return <div className="flex justify-end mb-3"><AppSelect ariaLabel="Mostrar resultados" value={String(pageSize)} options={[5, 15, 25].map(value => ({ value: String(value), label: `Mostrar ${value}` }))} onChange={value => onPageSizeChange(Number(value))} compact className="w-36" /></div>;
}
export default function Pagination({ page, pageSize, total = 0, totalPages = 0, onPageChange, onPageSizeChange, loading }) {
  const pages = Math.max(1, totalPages);
  return <div className="flex flex-wrap items-center gap-3 py-4 text-sm"><span className="text-default-500 mr-auto">{total} resultados</span><button aria-label="Página anterior" disabled={loading || page <= 1} onClick={() => onPageChange(page - 1)} className="p-2 bg-content2 rounded-[10px] disabled:opacity-40"><ChevronLeft size={18} /></button><span>{page} / {pages}</span><button aria-label="Página siguiente" disabled={loading || page >= pages} onClick={() => onPageChange(page + 1)} className="p-2 bg-content2 rounded-[10px] disabled:opacity-40"><ChevronRight size={18} /></button></div>;
}

