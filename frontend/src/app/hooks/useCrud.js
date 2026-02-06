"use client";
import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Hook genérico para operaciones CRUD
 * @param endpoint - Endpoint de la API (ej: '/viajes/nacionales')
 */
export function useCrud(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fullUrl = `${API_URL}${endpoint}`;

  // Fetch inicial de datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [fullUrl]);

  // Cargar datos al montar
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Crear nuevo registro
  const create = useCallback(
    async (newItem) => {
      const res = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al crear");
      }
      const json = await res.json();
      const createdItem = json.data;
      setData((prev) => [...prev, createdItem]);
      return createdItem;
    },
    [fullUrl],
  );

  // Actualizar registro existente
  const update = useCallback(
    async (id, updates) => {
      const res = await fetch(`${fullUrl}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al actualizar");
      }
      const json = await res.json();
      const updatedItem = json.data;
      setData((prev) =>
        prev.map((item) =>
          item._id === id || item.id === id ? updatedItem : item,
        ),
      );
      return updatedItem;
    },
    [fullUrl],
  );

  // Eliminar registro
  const remove = useCallback(
    async (id) => {
      const res = await fetch(`${fullUrl}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Error al eliminar");
      }
      setData((prev) =>
        prev.filter((item) => item._id !== id && item.id !== id),
      );
      return true;
    },
    [fullUrl],
  );

  // Refrescar datos
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    setData,
    loading,
    error,
    create,
    update,
    remove,
    refresh,
    apiUrl: fullUrl,
  };
}

export default useCrud;
