"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { FaSortUp, FaSortDown, FaSort } from "react-icons/fa";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export default function DataTable({ title, columns, data }) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filtrar por búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    return sortedData.filter(row =>
      row.some(cell =>
        String(cell).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, sortedData]);

  // Paginación
  const pageCount = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Cambiar orden
  const requestSort = (colIndex) => {
    let direction = "asc";
    if (sortConfig.key === colIndex && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: colIndex, direction });
  };

  // Icono orden
  const SortIcon = ({ colIndex }) => {
    if (sortConfig.key !== colIndex) return <FaSort className="inline-block ml-1 text-gray-400" />;
    if (sortConfig.direction === "asc") return <FaSortUp className="inline-block ml-1 text-gray-600" />;
    return <FaSortDown className="inline-block ml-1 text-gray-600" />;
  };

  return (
    <Card shadow="md" className="rounded-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-divider">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-64 px-3 py-2 border rounded-md border-divider bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-default-400"
        />
      </CardHeader>

      <CardBody className="p-0 overflow-x-auto">
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
      </CardBody>

      <div className="flex justify-end items-center gap-2 p-4 border-t border-divider">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-blue-500 disabled:opacity-50 hover:bg-blue-300 transition"
        >
         <HiChevronLeft size={20} className="text-white" />
        </button>

        <span className="text-foreground font-medium">
          Página {currentPage} de {pageCount}
        </span>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
          disabled={currentPage === pageCount}
          className="px-3 py-1 rounded-md bg-blue-500 disabled:opacity-50 hover:bg-blue-300 transition"
        >
         <HiChevronRight size={20} className="text-white" />
        </button>
      </div>
    </Card>
  );
}


