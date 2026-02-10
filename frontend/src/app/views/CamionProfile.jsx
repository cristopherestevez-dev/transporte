"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaOilCan,
  FaCog,
  FaTruckMonster,
  FaWrench,
  FaSave,
  FaEdit,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import ConfirmModal from "@/app/components/ui/ModalWrapper/ConfirmModal";

// --- Components ---

const SectionHeader = ({ icon: Icon, title, className = "" }) => (
  <div
    className={`flex items-center gap-2 text-sm font-semibold text-foreground/80 mb-3 border-b border-divider pb-1 ${className}`}
  >
    {Icon && <Icon className="text-primary" />}
    <span>{title}</span>
  </div>
);

const InputGroup = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
        {label}
      </label>
    )}
    {children}
  </div>
);

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  disabled = false,
}) => (
  <input
    type={type}
    disabled={disabled}
    className={`w-full bg-content2 border border-divider rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
      disabled ? "opacity-60 cursor-not-allowed" : ""
    } ${className}`}
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
  />
);

const Checkbox = ({ checked, onChange, label, disabled = false }) => (
  <label
    className={`flex items-center gap-2 cursor-pointer select-none group ${
      disabled ? "opacity-60 cursor-not-allowed" : ""
    }`}
  >
    <div
      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${
        checked
          ? "bg-primary border-primary shadow-lg shadow-primary/30"
          : "border-divider bg-content2 group-hover:border-primary/50"
      }`}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-2.5 h-2.5 bg-white rounded-[2px]"
          />
        )}
      </AnimatePresence>
    </div>
    <input
      type="checkbox"
      className="hidden"
      checked={checked || false}
      onChange={(e) => !disabled && onChange(e.target.checked)}
      disabled={disabled}
    />
    {label && (
      <span
        className={`text-xs transition-colors ${
          checked ? "text-foreground font-medium" : "text-foreground/70"
        }`}
      >
        {label}
      </span>
    )}
  </label>
);

const MaintenanceCard = ({
  row,
  index,
  handleChange,
  requestDelete,
  previousRow,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-edit new rows
  useEffect(() => {
    if (row.isNew) {
      setIsEditing(true);
      setExpanded(true);
    }
  }, []);

  // Calculate Row Total
  const total = useMemo(() => {
    let t = 0;
    // Aceite
    t +=
      (parseFloat(row.aceite_precioxl) || 0) *
      (parseFloat(row.aceite_litros) || 0);
    // Cubiertas
    t +=
      (parseFloat(row.cubiertas_precio_unit) || 0) *
      (parseFloat(row.cubiertas_cantidad) || 0);
    // Resto
    const simpleFields = [
      "filtro_aceite",
      "filtro_gasoil",
      "trampa_agua",
      "secado_aire",
      "filtro_aire",
      "filtro_habitaculo",
      "bomba_agua",
      "valvulas",
      "toberas",
      "extras",
    ];
    simpleFields.forEach((p) => {
      t += parseFloat(row[p + "_precio"]) || 0;
    });
    return t;
  }, [row]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setErrors({});
    setIsEditing(true);
    setExpanded(true);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    const newErrors = {};

    // Validation: Check vs Previous Row (Chronological order)
    if (previousRow) {
      const currentKm = parseFloat(row.km) || 0;
      const prevKm = parseFloat(previousRow.km) || 0;
      if (currentKm < prevKm) {
        newErrors.km = `El kilometraje no puede ser menor al registro anterior (${previousRow.km} km)`;
      }
      if (row.fecha < previousRow.fecha) {
        newErrors.fecha = `La fecha no puede ser anterior al registro previo (${previousRow.fecha})`;
      }
    }

    // Validation: at least one item must be filled
    const hasAnyItem = [
      "aceite_cambio",
      "filtro_aceite_cambio",
      "filtro_gasoil_cambio",
      "trampa_agua_cambio",
      "filtro_aire_cambio",
      "secado_aire_cambio",
      "filtro_habitaculo_cambio",
      "bomba_agua_cambio",
      "valvulas_cambio",
      "cubiertas_cambio",
      "toberas_cambio",
    ].some((field) => row[field]);

    const hasExtras =
      row.extras_descripcion || parseFloat(row.extras_precio) > 0;

    if (!hasAnyItem && !hasExtras) {
      newErrors.general =
        "Debés seleccionar al menos un ítem de mantenimiento o cargar un extra";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsEditing(false);
    setExpanded(false);
  };

  // Generic Field Renderers
  const renderStandardInputs = (prefix, label) => (
    <div className="bg-content2/50 p-3 rounded-lg border border-divider/50 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-foreground/70">{label}</span>
        <Checkbox
          checked={row[prefix + "_cambio"]}
          onChange={(v) => handleChange(index, prefix + "_cambio", v)}
          disabled={!isEditing}
        />
      </div>
      {row[prefix + "_cambio"] && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="grid grid-cols-2 gap-2 mt-2"
        >
          <InputGroup label="Marca">
            <TextInput
              value={row[prefix + "_marca"]}
              onChange={(v) => handleChange(index, prefix + "_marca", v)}
              disabled={!isEditing}
            />
          </InputGroup>
          <InputGroup label="Código">
            <TextInput
              value={row[prefix + "_codigo"]}
              onChange={(v) => handleChange(index, prefix + "_codigo", v)}
              disabled={!isEditing}
            />
          </InputGroup>
          <InputGroup label="Precio" className="col-span-2">
            <TextInput
              type="number"
              value={row[prefix + "_precio"]}
              onChange={(v) => handleChange(index, prefix + "_precio", v)}
              disabled={!isEditing}
            />
          </InputGroup>
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
        isEditing
          ? "bg-content1 border-primary/50 ring-1 ring-primary/20"
          : "bg-content1 border-divider"
      }`}
    >
      {/* Header / Summary Row */}
      <div
        className={`p-4 flex flex-wrap items-center gap-4 transition-colors ${
          isEditing ? "cursor-default" : "cursor-pointer hover:bg-content2/50"
        }`}
        onClick={() => !isEditing && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div
            className={`p-2 rounded-full transition-colors ${
              expanded
                ? "bg-primary/20 text-primary"
                : "bg-content2 text-foreground/50"
            }`}
          >
            {expanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
          </div>
          <div>
            <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">
              Fecha
            </p>
            {isEditing ? (
              <div className="flex flex-col">
                <input
                  type="date"
                  className={`bg-transparent font-medium text-foreground focus:outline-none border-b transition-colors ${
                    errors.fecha ? "border-red-500" : "border-primary/50"
                  }`}
                  value={row.fecha}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    handleChange(index, "fecha", e.target.value);
                    if (errors.fecha)
                      setErrors((prev) => {
                        const { fecha, ...rest } = prev;
                        return rest;
                      });
                  }}
                />
                {errors.fecha && (
                  <span className="text-red-500 text-[10px] mt-0.5 font-medium">
                    {errors.fecha}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-medium text-foreground">
                {row.fecha || "-"}
              </span>
            )}
          </div>
        </div>

        <div className="w-[1px] h-8 bg-divider hidden sm:block" />

        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">
            Kilometraje
          </p>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {isEditing ? (
                <TextInput
                  type="number"
                  value={row.km}
                  onChange={(v) => {
                    handleChange(index, "km", v);
                    if (errors.km)
                      setErrors((prev) => {
                        const { km, ...rest } = prev;
                        return rest;
                      });
                  }}
                  placeholder="0"
                  className={`w-24 bg-transparent focus:bg-content2 px-0 ${
                    errors.km
                      ? "!border-red-500 !ring-red-500/30"
                      : "border-transparent focus:border-divider"
                  }`}
                />
              ) : (
                <span className="font-medium text-foreground">
                  {row.km || 0}
                </span>
              )}
              <span className="text-xs text-foreground/50">km</span>
            </div>
            {errors.km && (
              <span className="text-red-500 text-[10px] mt-0.5 font-medium">
                {errors.km}
              </span>
            )}
          </div>
        </div>

        <div className="w-[1px] h-8 bg-divider hidden sm:block" />

        <div className="flex-1 min-w-[120px] text-right sm:text-left">
          <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">
            Costo Total
          </p>
          <p className="font-bold text-success text-lg">
            ${total.toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto pl-4 border-l border-divider flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSaveClick}
              className="p-2 text-success hover:bg-success/10 rounded-lg transition-colors"
              title="Guardar cambios"
            >
              <FaSave size={16} />
            </button>
          ) : (
            <button
              onClick={handleEditClick}
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Editar registro"
            >
              <FaEdit size={16} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              requestDelete(row.id);
            }}
            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
            title="Eliminar registro"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>

      {/* General Validation Error */}
      {errors.general && (
        <div className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-red-500 text-xs font-medium">
            {errors.general}
          </span>
        </div>
      )}

      {/* Detailed Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-divider"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-content2/20">
              {/* NOTE: All inputs inside renderStandardInputs and here have disabled={!isEditing} passed */}

              {/* 1. Aceite y Motor */}
              <div className="space-y-4">
                <SectionHeader icon={FaOilCan} title="Lubricación y Motor" />

                {/* Aceite Block */}
                <div className="bg-content1 p-4 rounded-xl border border-divider shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-sm">Aceite Motor</span>
                    <Checkbox
                      checked={row.aceite_cambio}
                      onChange={(v) => handleChange(index, "aceite_cambio", v)}
                      disabled={!isEditing}
                    />
                  </div>
                  {row.aceite_cambio && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="Marca">
                          <TextInput
                            value={row.aceite_marca}
                            onChange={(v) =>
                              handleChange(index, "aceite_marca", v)
                            }
                            disabled={!isEditing}
                          />
                        </InputGroup>
                        <InputGroup label="Código">
                          <TextInput
                            value={row.aceite_codigo}
                            onChange={(v) =>
                              handleChange(index, "aceite_codigo", v)
                            }
                            disabled={!isEditing}
                          />
                        </InputGroup>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="Precio / Litro">
                          <TextInput
                            type="number"
                            value={row.aceite_precioxl}
                            onChange={(v) =>
                              handleChange(index, "aceite_precioxl", v)
                            }
                            disabled={!isEditing}
                          />
                        </InputGroup>
                        <InputGroup label="Litros">
                          <TextInput
                            type="number"
                            value={row.aceite_litros}
                            onChange={(v) =>
                              handleChange(index, "aceite_litros", v)
                            }
                            disabled={!isEditing}
                          />
                        </InputGroup>
                      </div>
                      <div className="pt-2 border-t border-divider flex justify-between text-xs">
                        <span className="text-foreground/60">
                          Subtotal Aceite:
                        </span>
                        <span className="font-bold">
                          $
                          {(
                            (parseFloat(row.aceite_precioxl) || 0) *
                            (parseFloat(row.aceite_litros) || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Filtros Relacionados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderStandardInputs("filtro_aceite", "Filtro Aceite")}
                  {renderStandardInputs("filtro_gasoil", "Filtro Gasoil")}
                  {renderStandardInputs("trampa_agua", "Trampa de Agua")}
                </div>
              </div>

              {/* 2. Aire y Refrigeración */}
              <div className="space-y-4">
                <SectionHeader icon={FaWrench} title="Aire y Sistemas" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderStandardInputs("filtro_aire", "Filtro Aire")}
                  {renderStandardInputs("secado_aire", "Secado de Aire")}
                  {renderStandardInputs(
                    "filtro_habitaculo",
                    "Filtro Habitáculo",
                  )}
                  {renderStandardInputs("bomba_agua", "Bomba de Agua")}
                </div>

                {/* Valvulas Special Case */}
                <div className="bg-content2/50 p-3 rounded-lg border border-divider/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-foreground/70">
                      Válvulas
                    </span>
                    <Checkbox
                      checked={row.valvulas_cambio}
                      onChange={(v) =>
                        handleChange(index, "valvulas_cambio", v)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  {row.valvulas_cambio && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-2 mt-2"
                    >
                      <InputGroup label="Marca">
                        <TextInput
                          value={row.valvulas_marca}
                          onChange={(v) =>
                            handleChange(index, "valvulas_marca", v)
                          }
                          disabled={!isEditing}
                        />
                      </InputGroup>
                      <label className="flex items-center gap-2 p-2 bg-content1 rounded border border-divider">
                        <input
                          type="checkbox"
                          checked={row.valvulas_regular}
                          onChange={(e) =>
                            handleChange(
                              index,
                              "valvulas_regular",
                              e.target.checked,
                            )
                          }
                          disabled={!isEditing}
                          className="w-4 h-4 rounded border-divider bg-content2 text-primary focus:ring-primary"
                        />
                        <span className="text-xs">Requiere Regulación</span>
                      </label>
                      <InputGroup label="Precio">
                        <TextInput
                          type="number"
                          value={row.valvulas_precio}
                          onChange={(v) =>
                            handleChange(index, "valvulas_precio", v)
                          }
                          disabled={!isEditing}
                        />
                      </InputGroup>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 3. Rodado y Extras */}
              <div className="space-y-4">
                <SectionHeader icon={FaTruckMonster} title="Rodado y Extras" />

                {/* Cubiertas */}
                <div className="bg-content1 p-4 rounded-xl border border-divider shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-sm">Cubiertas</span>
                    <Checkbox
                      checked={row.cubiertas_cambio}
                      onChange={(v) =>
                        handleChange(index, "cubiertas_cambio", v)
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  {row.cubiertas_cambio && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="space-y-3"
                    >
                      <InputGroup label="Marca">
                        <TextInput
                          value={row.cubiertas_marca}
                          onChange={(v) =>
                            handleChange(index, "cubiertas_marca", v)
                          }
                          disabled={!isEditing}
                        />
                      </InputGroup>
                      <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="Cantidad">
                          <TextInput
                            type="number"
                            value={row.cubiertas_cantidad}
                            onChange={(v) =>
                              handleChange(index, "cubiertas_cantidad", v)
                            }
                            disabled={!isEditing}
                          />
                        </InputGroup>
                        <InputGroup label="Precio Unit.">
                          <TextInput
                            type="number"
                            value={row.cubiertas_precio_unit}
                            onChange={(v) =>
                              handleChange(index, "cubiertas_precio_unit", v)
                            }
                            disabled={!isEditing}
                          />
                        </InputGroup>
                      </div>
                      <div className="pt-2 border-t border-divider flex justify-between text-xs">
                        <span className="text-foreground/60">
                          Subtotal Cubiertas:
                        </span>
                        <span className="font-bold">
                          $
                          {(
                            (parseFloat(row.cubiertas_precio_unit) || 0) *
                            (parseFloat(row.cubiertas_cantidad) || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Toberas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderStandardInputs("toberas", "Toberas")}
                </div>

                {/* Extras */}
                <div className="bg-content1 p-4 rounded-xl border border-divider shadow-sm mt-4">
                  <SectionHeader title="Extras / Varios" className="mb-3" />
                  <div className="space-y-3">
                    <InputGroup label="Descripción">
                      <textarea
                        value={row.extras_descripcion || ""}
                        onChange={(e) =>
                          handleChange(
                            index,
                            "extras_descripcion",
                            e.target.value,
                          )
                        }
                        placeholder="Detalle..."
                        disabled={!isEditing}
                        maxLength={150}
                        rows={3}
                        className={`w-full bg-content2 border border-divider rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none ${
                          !isEditing ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      />
                      <span className="text-[10px] text-foreground/40 text-right">
                        {(row.extras_descripcion || "").length}/150
                      </span>
                    </InputGroup>
                    <InputGroup label="Precio">
                      <TextInput
                        type="number"
                        value={row.extras_precio}
                        onChange={(v) =>
                          handleChange(index, "extras_precio", v)
                        }
                        disabled={!isEditing}
                      />
                    </InputGroup>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function CamionProfile({ id }) {
  const [truck, setTruck] = useState(null);
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // Search State
  const [searchFecha, setSearchFecha] = useState("");
  const [searchKmMin, setSearchKmMin] = useState("");
  const [searchKmMax, setSearchKmMax] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  // Load Truck Data
  useEffect(() => {
    async function fetchTruck() {
      try {
        setLoading(true);
        const [camiones, semirremolques] = await Promise.all([
          api.getCamiones(),
          api.getSemirremolques(),
        ]);
        const found =
          camiones.find((c) => c._id.toString() === id.toString()) ||
          semirremolques?.find((c) => c._id.toString() === id.toString());
        setTruck(found);
      } catch (err) {
        console.error("Error loading truck:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTruck();
  }, [id]);

  // Load Maintenance Log from API
  const fetchMaintenanceLog = async () => {
    try {
      const data = await api.getMantenimiento(id);
      setMaintenanceLog(data || []);
      setIsFiltered(false);
    } catch (err) {
      console.error("Error loading maintenance log:", err);
    }
  };

  useEffect(() => {
    if (id) fetchMaintenanceLog();
  }, [id]);

  const addRow = async () => {
    try {
      const newData = {
        fecha: new Date().toISOString().split("T")[0],
        patente: truck?.patente || "",
        km: 0,
      };
      const created = await api.createMantenimiento(id, newData);
      // Mark as new for auto-edit
      setMaintenanceLog([{ ...created, isNew: true }, ...maintenanceLog]);
    } catch (err) {
      console.error("Error creating maintenance record:", err);
    }
  };

  const requestDelete = (rowId) => {
    setRowToDelete(rowId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (rowToDelete) {
      try {
        await api.deleteMantenimiento(rowToDelete);
        setMaintenanceLog(maintenanceLog.filter((r) => r._id !== rowToDelete));
        setRowToDelete(null);
        setDeleteModalOpen(false);
      } catch (err) {
        console.error("Error deleting maintenance record:", err);
      }
    }
  };

  const handleChange = (index, field, value) => {
    // Prevent negative numbers
    if (
      (field.includes("precio") ||
        field.includes("litros") ||
        field.includes("cantidad") ||
        field === "km") &&
      parseFloat(value) < 0
    ) {
      return;
    }

    const newLog = [...maintenanceLog];
    const updatedRow = { ...newLog[index], [field]: value };
    newLog[index] = updatedRow;
    setMaintenanceLog(newLog);

    // Persist to backend (debounced by React batching)
    if (updatedRow._id && field !== "isNew") {
      api
        .updateMantenimiento(updatedRow._id, { [field]: value })
        .catch((err) =>
          console.error("Error updating maintenance record:", err),
        );
    }
  };

  // Search
  const handleSearch = async () => {
    const filters = {};
    if (searchFecha) filters.fecha = searchFecha;
    if (searchKmMin) filters.kmMin = searchKmMin;
    if (searchKmMax) filters.kmMax = searchKmMax;

    if (!filters.fecha && !filters.kmMin && !filters.kmMax) return;

    try {
      setIsSearching(true);
      const data = await api.searchMantenimiento(id, filters);
      setMaintenanceLog(data || []);
      setIsFiltered(true);
    } catch (err) {
      console.error("Error searching maintenance records:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setSearchFecha("");
    setSearchKmMin("");
    setSearchKmMax("");
    setIsFiltered(false);
    fetchMaintenanceLog();
  };

  const grandTotal = useMemo(() => {
    return maintenanceLog.reduce((acc, row) => {
      let t = 0;
      t +=
        (parseFloat(row.aceite_precioxl) || 0) *
        (parseFloat(row.aceite_litros) || 0);
      t +=
        (parseFloat(row.cubiertas_precio_unit) || 0) *
        (parseFloat(row.cubiertas_cantidad) || 0);
      [
        "filtro_aceite",
        "filtro_gasoil",
        "trampa_agua",
        "secado_aire",
        "filtro_aire",
        "filtro_habitaculo",
        "bomba_agua",
        "valvulas",
        "toberas",
        "extras",
      ].forEach((p) => {
        t += parseFloat(row[p + "_precio"]) || 0;
      });
      return acc + t;
    }, 0);
  }, [maintenanceLog]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  if (!truck)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <FaTruckMonster className="text-6xl text-foreground/20" />
        <p className="text-lg text-foreground/60">Vehículo no encontrado</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          Volver al Dashboard
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-divider">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/flota"
              className="p-2 -ml-2 rounded-full hover:bg-content2 transition-colors"
            >
              <FaArrowLeft className="text-foreground/70" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {truck.marca} {truck.modelo}
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-content2 border border-divider">
                  {truck.patente}
                </span>
              </h1>
              <p className="text-xs text-foreground/50">
                Historial de Mantenimiento y Service
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-foreground/40">
                Inversión Total
              </p>
              <p className="text-xl font-bold text-primary">
                ${grandTotal.toLocaleString()}
              </p>
            </div> */}
            <button
              onClick={addRow}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <FaPlus size={14} />
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6 bg-content1 border border-divider rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FaSearch className="text-primary" size={14} />
            <span className="text-sm font-semibold text-foreground/70">
              Buscar Registros
            </span>
            {isFiltered && (
              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                Filtrado
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                Fecha
              </label>
              <input
                type="date"
                value={searchFecha}
                onChange={(e) => setSearchFecha(e.target.value)}
                className="bg-content2 border border-divider rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                Km Mínimo
              </label>
              <input
                type="number"
                value={searchKmMin}
                onChange={(e) => setSearchKmMin(e.target.value)}
                placeholder="Desde"
                className="w-28 bg-content2 border border-divider rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-foreground/50 tracking-wider">
                Km Máximo
              </label>
              <input
                type="number"
                value={searchKmMax}
                onChange={(e) => setSearchKmMax(e.target.value)}
                placeholder="Hasta"
                className="w-28 bg-content2 border border-divider rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={
                isSearching || (!searchFecha && !searchKmMin && !searchKmMax)
              }
              className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSearch size={11} />
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-foreground/60 hover:text-danger px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-danger/10 transition-all"
              >
                <FaTimes size={11} />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
        {maintenanceLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-content1 rounded-2xl border border-dashed border-divider">
            <div className="w-16 h-16 bg-content2 rounded-full flex items-center justify-center mb-4">
              <FaCog className="text-3xl text-foreground/20 animate-slow-spin" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/70">
              Sin registros de mantenimiento
            </h3>
            <p className="text-sm text-foreground/40 max-w-xs text-center mt-2">
              Comenzá un historial detallado para este vehículo agregando el
              primer registro.
            </p>
            <button
              onClick={addRow}
              className="mt-6 text-primary font-medium hover:underline text-sm"
            >
              Crear primer registro
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {maintenanceLog.map((row, index) => (
                <MaintenanceCard
                  key={row._id}
                  row={row}
                  index={index}
                  handleChange={handleChange}
                  requestDelete={() => requestDelete(row._id)}
                  previousRow={maintenanceLog[index + 1]}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar Registro"
        message="¿Estás seguro de que deseas eliminar este registro de mantenimiento? Esta acción no se puede deshacer."
        label="Eliminar"
        bgcolor="bg-red-600"
        bghover="red"
      />
    </div>
  );
}
