"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiSelector, HiCheck, HiSearch } from "react-icons/hi";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm(""); // Resetear búsqueda al cerrar
    }
  }, [isOpen]);

  // Lógica de búsqueda (Case & Accent Insensitive)
  const normalize = (text) => {
    return text
      ?.toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const normalizedSearch = normalize(searchTerm);
    return options.filter((opt) =>
      normalize(opt.label).includes(normalizedSearch),
    );
  }, [options, searchTerm]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 bg-content1 border border-divider rounded-lg shadow-sm text-foreground hover:bg-content2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span
          className={`block truncate ${!selectedOption ? "text-default-400" : ""}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <HiSelector className="w-5 h-5 text-default-400" />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, type: "spring" }}
            className="absolute z-[9999] mt-1 w-full bg-content1 border border-divider rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col"
          >
            {/* Search Input */}
            <div className="p-2 border-b border-divider bg-content2/30 sticky top-0">
              <div className="relative">
                <HiSearch className="absolute left-2 top-2.5 text-default-400" />
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-content1 border border-divider rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-default-400"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Options List */}
            <ul className="overflow-auto flex-1 p-1 custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 rounded-lg transition-colors ${
                      opt.value === value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-content2"
                    }`}
                  >
                    <span className="block truncate">{opt.label}</span>
                    {opt.value === value && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                        <HiCheck className="w-5 h-5" />
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li className="py-3 px-3 text-center text-sm text-default-400">
                  No hay coincidencias
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
