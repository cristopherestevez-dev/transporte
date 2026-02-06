"use client";
import { useState, useMemo } from "react";
import SearchableSelect from "../SearchableSelect/SearchableSelect";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlus,
  HiSearch,
  HiChevronLeft,
  HiChevronRight,
  HiCheck,
  HiOutlineX,
} from "react-icons/hi";
import ModalWrapper from "../ModalWrapper/ModalWrapper";
import ConfirmModal from "../ModalWrapper/ConfirmModal";
import SuccessModal from "../ModalWrapper/SuccessModal";
import { useToast } from "../Toast/Toast";
import { Switch } from "@heroui/react";

export default function CrudTable({
  title,
  data = [],
  setData,
  columns,
  formFields,
  apiUrl, // URL de la API para CRUD
  openProveedorModal, // Función para abrir modal de proveedor
  validate, // NEW: Función de validación opcional (formData) => errorString | null
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [successAddOpen, setSuccessAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const toast = useToast();

  // Filtrar datos por búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const value = item[col.key];
        return value && String(value).toLowerCase().includes(term);
      }),
    );
  }, [data, searchTerm, columns]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset página cuando cambia búsqueda
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const estadoOptions = [
    { value: "pendiente", label: "Pendiente", color: "orange" },
    { value: "en_transito", label: "En Tránsito", color: "blue" },
    { value: "finalizado", label: "Finalizado", color: "green" },
    { value: "cancelado", label: "Cancelado", color: "red" },
  ];

  function openModal(item = null) {
    setEditingItem(item);
    const initialForm = {};
    formFields.forEach((f) => {
      if (f.type === "date" && item && item[f.key]) {
        initialForm[f.key] = new Date(item[f.key]).toISOString().split("T")[0];
      } else {
        // Asegurar que si el item existe, se copien todas las props, no solo las de formFields
        // Esto es util para IDs ocultos o campos extras como proveedorId
        initialForm[f.key] =
          item && item[f.key] !== undefined && item[f.key] !== null
            ? item[f.key]
            : "";
      }
    });
    // Si editamos, preservamos todo el objeto original en el form para no perder datos extras
    if (item) {
      Object.keys(item).forEach((k) => {
        if (initialForm[k] === undefined) initialForm[k] = item[k];
      });
    }
    setForm(initialForm);
    setModalOpen(true);
  }

  function closeModal() {
    // Si estamos confirmando o guardando, no permitir cerrar el modal principal aún
    // Esto evita que se pierda el estado 'editingItem' y 'form' antes de 'handleSave'
    if (confirmAddOpen || saving) return;

    setModalOpen(false);
    setEditingItem(null);
    const resetForm = {};
    formFields.forEach((f) => (resetForm[f.key] = ""));
    setForm(resetForm);
  }

  const requiredFilled = formFields.every(
    (f) => !f.required || (form[f.key] && form[f.key].toString().trim() !== ""),
  );

  const handleSave = async () => {
    // 1. Validar si existe la prop validate
    if (validate) {
      const errorMsg = validate(form);
      if (errorMsg) {
        toast.error(errorMsg);
        return;
      }
    }

    setSaving(true);
    try {
      let savedItem;
      if (editingItem) {
        // Editar - PATCH al API
        const idToUpdate = editingItem._id || editingItem.id;
        const response = await fetch(`${apiUrl}/${idToUpdate}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error("Error al actualizar");
        const json = await response.json();
        savedItem = json.data;
        // Actualizar en el estado local
        setData(
          data.map((item) => {
            // Check _id match if both exist
            if (item._id && editingItem._id && item._id === editingItem._id) {
              return savedItem;
            }
            // Check id match if both exist
            if (item.id && editingItem.id && item.id === editingItem.id) {
              return savedItem;
            }
            return item;
          }),
        );
        toast.success("Registro actualizado correctamente");
      } else {
        // Agregar - POST al API
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error("Error al crear");
        const json = await response.json();
        savedItem = json.data;
        // Agregar al estado local
        setData([...(data || []), savedItem]);
        toast.success("Registro agregado correctamente");
      }
      setConfirmAddOpen(false);
      setModalOpen(false);
      setSuccessAddOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Error guardando:", error);
      toast.error("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      setSaving(true);
      try {
        const response = await fetch(
          `${apiUrl}/${itemToDelete._id || itemToDelete.id}`,
          {
            method: "DELETE",
          },
        );
        if (!response.ok && response.status !== 204)
          throw new Error("Error al eliminar");
        // Eliminar del estado local
        const newData = data.filter(
          (item) =>
            item._id !== itemToDelete._id && item.id !== itemToDelete.id,
        );
        setData(newData);
        setConfirmOpen(false);
        setSuccessOpen(false);
        setItemToDelete(null);
        toast.success("Registro eliminado correctamente");
      } catch (error) {
        console.error("Error eliminando:", error);
        toast.error("Error al eliminar: " + error.message);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-brand-navy dark:text-foreground">
          {title}
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:flex-none">
            <HiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-divider rounded-md bg-content1 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-navy/50 w-full sm:w-64"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1 px-3 py-2 bg-brand-navy text-white rounded-md font-medium hover:bg-brand-navy/80 hover:shadow-md transition-all whitespace-nowrap"
          >
            <HiOutlinePlus size={16} /> Agregar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
        <thead className="bg-brand-navy border-b border-brand-navy">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-sm font-semibold text-white uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-6 py-8 text-center text-foreground/60"
              >
                {searchTerm
                  ? "No se encontraron resultados"
                  : "No hay registros"}
              </td>
            </tr>
          ) : (
            paginatedData.map((item) => (
              <tr
                key={item._id || item.id}
                className="bg-content1 hover:bg-content2 transition-colors border-b border-divider"
              >
                {columns.map((col) => {
                  // Combo de estados
                  if (col.key === "estado") {
                    <td
                      key={`${item._id || item.id}-estado`}
                      className="px-6 py-4"
                    >
                      <SearchableSelect
                        value={item.estado}
                        onChange={(val) => {
                          const updatedData = data.map((r) => {
                            if (item._id && r._id === item._id)
                              return { ...r, estado: val };
                            if (item.id && r.id === item.id)
                              return { ...r, estado: val };
                            return r;
                          });
                          setData(updatedData);
                        }}
                        options={estadoOptions}
                        placeholder="Estado"
                        className="w-40"
                      />
                    </td>;
                  }

                  // Columnas normales o personalizadas
                  if (col.render) {
                    return (
                      <td
                        key={`${item._id || item.id}-${col.key}`}
                        className="px-6 py-4"
                      >
                        {col.render(item[col.key], item)}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${item._id || item.id}-${col.key}`}
                      className="px-6 py-4 text-foreground"
                    >
                      {item[col.key] || "-"}
                    </td>
                  );
                })}

                {/* Acciones */}
                <td className="px-6 py-4 text-center space-x-3">
                  <button
                    onClick={() => openModal(item)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <HiOutlinePencil size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(item);
                      setConfirmOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <HiOutlineTrash size={20} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {filteredData.length > pageSize && (
        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm text-foreground/60">
            Mostrando {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, filteredData.length)} de{" "}
            {filteredData.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-divider hover:bg-content2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium px-3">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-divider hover:bg-content2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal agregar/editar */}
      <ModalWrapper
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingItem ? `Editar ${title}` : `Agregar ${title}`}
      >
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmAddOpen(true);
            }}
            className="space-y-4"
          >
            {formFields.map((f) => (
              <div key={f.key}>
                {f.render ? (
                  f.render({ form, setForm, field: f })
                ) : (
                  <>
                    {f.type !== "switch" && (
                      <label className="block mb-1 font-medium">
                        {f.label} {f.required ? "*" : ""}
                      </label>
                    )}
                    {f.type === "select" ? (
                      <SearchableSelect
                        value={form[f.key] || ""}
                        onChange={(val) => setForm({ ...form, [f.key]: val })}
                        options={f.options || []}
                        placeholder="Seleccionar..."
                        className="w-full"
                        disabled={false}
                        variant="inline"
                      />
                    ) : f.type === "switch" ? (
                      <div
                        className="flex items-center justify-between p-4 rounded-xl border border-divider bg-content2/30 hover:bg-content2 transition-colors cursor-pointer"
                        onClick={() =>
                          setForm({ ...form, [f.key]: !form[f.key] })
                        }
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-foreground font-medium">
                            {f.label}
                          </span>
                          <span
                            className={`text-tiny ${form[f.key] ? "text-success" : "text-default-500"}`}
                          >
                            {form[f.key]
                              ? "Usuario Activo"
                              : "Usuario Inactivo"}
                          </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Switch
                            isSelected={!!form[f.key]}
                            onValueChange={(val) =>
                              setForm({ ...form, [f.key]: val })
                            }
                            size="lg"
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-green-500 group-data-[selected=false]:bg-red-500 transition-colors duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-95",
                              thumb:
                                "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[selected=true]:ml-6 group-data-[selected=false]:ml-0 group-active:w-7 group-data-[selected=true]:group-active:ml-5",
                            }}
                            thumbIcon={({ isSelected, className }) =>
                              isSelected ? (
                                <HiCheck className={className} />
                              ) : (
                                <HiOutlineX className={className} />
                              )
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        type={f.type || "text"}
                        value={form[f.key] || ""}
                        min={
                          f.type === "date" && f.minDateFrom
                            ? form[f.minDateFrom]
                            : undefined
                        }
                        onChange={(e) =>
                          setForm({ ...form, [f.key]: e.target.value })
                        }
                        className="w-full p-2 border border-divider rounded-md focus:outline-none focus:ring-2 focus:ring-secondary bg-transparent text-foreground"
                        required={f.required}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!requiredFilled}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>

      {/* Confirmaciones y éxito */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que querés eliminar "${itemToDelete?.nombre || itemToDelete?.razon_social || itemToDelete?.origen || "este registro"}"?`}
        label="Eliminar"
        bgcolor="bg-red-600"
        bghover="red"
      />
      <SuccessModal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        message="Registro eliminado con éxito"
      />
      <ConfirmModal
        isOpen={confirmAddOpen}
        onClose={() => setConfirmAddOpen(false)}
        onConfirm={handleSave}
        title={editingItem ? "Confirmar edición" : "Confirmar registro"}
        message={
          editingItem
            ? "¿Seguro que querés guardar los cambios?"
            : "¿Seguro que querés agregar este registro?"
        }
        label={editingItem ? "Guardar" : "Agregar"}
        bgcolor="bg-green-600"
        bghover="green"
      />
      <SuccessModal
        isOpen={successAddOpen}
        onClose={() => setSuccessAddOpen(false)}
        message="Registro agregado con éxito"
      />
    </div>
  );
}
