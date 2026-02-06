"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineX } from "react-icons/hi";

const ProveedorWrapper = ({ isOpen, onClose, proveedores = [], onSelect }) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  // Filtrar proveedores según búsqueda
  const filtered = proveedores.filter(
    (p) =>
      (p.nombre && p.nombre.toLowerCase().includes(search.toLowerCase())) ||
      (p.cuil_cuit && p.cuil_cuit.toString().includes(search)),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative w-full max-w-md bg-content1 rounded-2xl shadow-xl border border-divider flex flex-col max-h-[80vh] z-10 m-4"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-divider">
              <h2 className="text-xl font-bold text-foreground">
                Seleccionar proveedor
              </h2>
              <button
                onClick={onClose}
                className="text-default-400 hover:text-foreground transition-colors"
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            {/* Buscador */}
            <div className="p-4 border-b border-divider bg-content2/50">
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-content1 border border-divider rounded-lg p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 p-2">
              <ul className="space-y-1">
                {filtered.length > 0 ? (
                  filtered.map((p) => (
                    <li
                      key={p.id}
                      className="p-3 hover:bg-content2 rounded-lg cursor-pointer flex justify-between items-center transition-colors border border-transparent hover:border-divider"
                      onClick={() => {
                        onSelect(p);
                        onClose();
                      }}
                    >
                      <div>
                        <span className="font-semibold text-foreground block">
                          {p.nombre}
                        </span>
                        <div className="text-xs text-default-500">
                          {p.cuil_cuit}
                        </div>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        Seleccionar
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="p-8 text-center text-default-400">
                    No se encontraron proveedores
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProveedorWrapper;
