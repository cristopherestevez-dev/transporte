"use client";
import React, { useState, useEffect } from "react";

const ProveedorWrapper = ({ isOpen, onClose, proveedores = [], onSelect }) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  // Filtrar proveedores según búsqueda
  const filtered = proveedores.filter(
    (p) =>
      (p.nombre && p.nombre.toLowerCase().includes(search.toLowerCase())) ||
      (p.cuil_cuit && p.cuil_cuit.toString().includes(search))
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Seleccionar proveedor</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Buscador */}
        <div className="p-4">
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded p-2 mb-3"
          />
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1">
          <ul className="divide-y">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <li
                  key={p.id}
                  className="p-3 hover:bg-gray-200 cursor-pointer flex justify-between items-center"
                  onClick={() => {
                    onSelect(p); // devuelve el proveedor elegido
                    onClose(); // cierra el modal
                  }}
                >
                  <div>
                    <span className="font-semibold">{p.nombre}</span>
                    <div className="text-sm text-gray-500">{p.cuil_cuit}</div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Seleccionar
                  </span>
                </li>
              ))
            ) : (
              <li className="p-3 text-gray-500 text-sm">
                No se encontraron proveedores
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProveedorWrapper;
