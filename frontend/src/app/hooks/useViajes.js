"use client";
import { useState, useEffect } from "react";
import { useCrud } from "./useCrud";
import api from "@/services/api";

/**
 * Hook específico para viajes con carga de datos relacionados
 * @param tipo - 'nacionales' | 'internacionales'
 */
export function useViajes(tipo = "nacionales") {
  const endpoint = `/viajes/${tipo}`;
  const crud = useCrud(endpoint);

  // Datos relacionados
  const [proveedores, setProveedores] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [fleteros, setFleteros] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Cargar datos relacionados
  useEffect(() => {
    async function fetchRelated() {
      try {
        setLoadingRelated(true);
        const [provData, chofData, fletData] = await Promise.all([
          api.getProveedores(),
          api.getChoferes(),
          api.getFleteros(),
        ]);
        setProveedores(provData || []);
        setChoferes(chofData || []);
        setFleteros(fletData || []);
      } catch (err) {
        console.error("Error fetching related data:", err);
      } finally {
        setLoadingRelated(false);
      }
    }
    fetchRelated();
  }, []);

  // Obtener nombre del asignado
  const getAsignadoNombre = (item) => {
    if (item.tipoAsignacion === "chofer") {
      const chofer = choferes.find(
        (c) => c._id?.toString() === item.asignadoId?.toString(),
      );
      return chofer?.nombre || "-";
    }
    if (item.tipoAsignacion === "fletero") {
      const fletero = fleteros.find(
        (f) => f._id?.toString() === item.asignadoId?.toString(),
      );
      return fletero?.nombre || "-";
    }
    return "-";
  };

  return {
    ...crud,
    loading: crud.loading || loadingRelated,
    proveedores,
    choferes,
    fleteros,
    getAsignadoNombre,
  };
}

export default useViajes;
