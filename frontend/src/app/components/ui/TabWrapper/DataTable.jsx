"use client";
import Button from "@/app/components/ui/Button/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";


import { useState, useMemo } from "react";
import ColumnFilters from "../ColumnFilters";
import AppSelect from '../AppSelect/AppSelect';
import { Card } from "@heroui/react";



export default function DataTable({ title, columns, data, pagination, onPageChange, onPageSizeChange, filterFields = [], filters = {}, onFiltersChange, loading = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(5);
  const rowsPerPage = pagination?.pageSize || localPageSize;
  const shownPage = pagination?.page || currentPage;

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Ordenar datos
  const sortedData = useMemo(() => {
    let sortableItems = [...data];

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortConfig.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [data, sortConfig]);

  // Paginación
  const pageCount = Math.max(1, pagination?.totalPages ?? Math.ceil(sortedData.length / rowsPerPage));
  const currentData = pagination ? sortedData : sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Cambiar orden
  const requestSort = (colIndex) => {
    if (pagination) return;
    let direction = "asc";
    if (sortConfig.key === colIndex && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: colIndex, direction });
  };

  // Icono orden
  const SortIcon = ({ colIndex }) => {
    if (sortConfig.key !== colIndex) return <ChevronsUpDown className="inline-block ml-1 text-gray-400" />;
    if (sortConfig.direction === "asc") return <ChevronUp className="inline-block ml-1 text-gray-600" />;
    return <ChevronDown className="inline-block ml-1 text-gray-600" />;
  };

  return (
    <Card className="min-w-0 overflow-visible shadow-none ring-0">
      <Card.Header className="flex flex-row flex-wrap items-center justify-end gap-2 border-b border-divider">
        <h3 className="mr-auto text-xl font-bold text-foreground">{title}</h3>
        <AppSelect
          ariaLabel="Mostrar resultados"
          value={String(rowsPerPage)}
          options={[5, 15, 25].map(value => ({ value: String(value), label: `Mostrar ${value}` }))}
          onChange={value => { setLocalPageSize(Number(value)); setCurrentPage(1); onPageSizeChange?.(Number(value)); }}
          compact
          className="w-36 shrink-0 self-end sm:self-auto"
        />
        <ColumnFilters fields={filterFields} values={filters} onChange={onFiltersChange} />
      </Card.Header>

      <Card.Content className="table-frame p-0">
        <table className="min-w-full border-collapse table-auto text-foreground">
          <thead className="bg-brand-navy border-b border-brand-navy">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  onClick={() => requestSort(i)}
                  className="py-3 px-6 text-left font-semibold text-white border-b border-brand-navy cursor-pointer select-none"
                  style={{ userSelect: "none" }}
                >
                  {col}
                  <SortIcon colIndex={i} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-6 text-center text-default-500">
                  No se encontraron datos
                </td>
              </tr>
            ) : (
              currentData.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-divider hover:bg-content2 transition-colors bg-content1 cursor-default"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="py-4 px-6 whitespace-nowrap text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card.Content>

      <div className="flex justify-end items-center gap-2 p-4">
        {loading && <span className="text-sm text-default-500">Cargando…</span>}
        <Button native
          onClick={() => onPageChange ? onPageChange(Math.max(shownPage - 1, 1)) : setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={shownPage === 1 || loading}
          className="px-3 py-1 rounded-md bg-blue-500 disabled:opacity-50 hover:bg-blue-300 transition"
        >
         <ChevronLeft size={20} className="text-white" />
        </Button>

        <span className="text-foreground font-medium">
          Página {shownPage} de {pageCount}{pagination ? ` · ${pagination.total} resultados` : ''}
        </span>

        <Button native
          onClick={() => onPageChange ? onPageChange(Math.min(shownPage + 1, pageCount)) : setCurrentPage((p) => Math.min(p + 1, pageCount))}
          disabled={shownPage >= pageCount || loading}
          className="px-3 py-1 rounded-md bg-blue-500 disabled:opacity-50 hover:bg-blue-300 transition"
        >
         <ChevronRight size={20} className="text-white" />
        </Button>
      </div>
    </Card>
  );
}


