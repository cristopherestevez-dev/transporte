"use client";
import { useState } from "react";
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from "react-icons/hi";
import ModalWrapper from "../ModalWrapper/ModalWrapper";
import ConfirmModal from "../ModalWrapper/ConfirmModal";
import SuccessModal from "../ModalWrapper/SuccessModal";

export default function CrudTable({
  title,
  data = [],
  setData,
  columns,
  formFields,
  openProveedorModal, // Función para abrir modal de proveedor
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [successAddOpen, setSuccessAddOpen] = useState(false);

  const estadoOptions = [
    { value: "pendiente", label: "Pendiente", color: "yellow" },
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
        initialForm[f.key] = item && item[f.key] !== null ? item[f.key] : "";
      }
    });
    setForm(initialForm);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    const resetForm = {};
    formFields.forEach((f) => (resetForm[f.key] = ""));
    setForm(resetForm);
  }

  const requiredFilled = formFields.every(
    (f) => !f.required || (form[f.key] && form[f.key].toString().trim() !== "")
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{title}</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <HiOutlinePlus size={16} /> Agregar {title.toLowerCase()}
        </button>
      </div>

      {/* Tabla */}
      <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
              >
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item) => (
            <tr
              key={item.id}
              className="bg-white hover:bg-blue-50 transition-colors"
            >
              {columns.map((col) => {
                // Botón para seleccionar proveedor
                if (col.key === "proveedor") {
                  return (
                    <td key={item.id + "-proveedor"}>
                      <button
                        type="button"
                        onClick={() => openProveedorModal(item)}
                        className="px-2 py-1 bg-blue-500 text-white rounded"
                      >
                        {item.proveedorNombre || "Seleccionar Proveedor"}
                      </button>
                    </td>
                  );
                }

                // Combo de estados
                if (col.key === "estado") {
                  return (
                    <td key={`${item.id}-estado`} className="px-6 py-4">
                      <select
                        value={item.estado}
                        onChange={(e) => {
                          const updatedData = data.map((r) =>
                            r.id === item.id ? { ...r, estado: e.target.value } : r
                          );
                          setData(updatedData);
                        }}
                        className="px-2 py-1 rounded font-semibold"
                        style={{
                          color:
                            estadoOptions.find((opt) => opt.value === item.estado)
                              ?.color || "black",
                        }}
                      >
                        {estadoOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                }

                // Columnas normales
                return (
                  <td key={`${item.id}-${col.key}`} className="px-6 py-4">
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
          ))}
        </tbody>
      </table>

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
                <label className="block mb-1 font-medium">
                  {f.label} {f.required ? "*" : ""}
                </label>
                <input
                  type={f.type || "text"}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required={f.required}
                />
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
        onConfirm={() => {}}
        title="Confirmar eliminación"
        message="¿Seguro que querés eliminar este registro?"
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
        onConfirm={() => {}}
        title="Confirmar registro"
        message="¿Seguro que querés agregar este registro?"
        label="Agregar"
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
