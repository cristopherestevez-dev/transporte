"use client"
import React from 'react'
import TabsWrapper from '../components/ui/TabsWrapper/TabsWrapper'
import CrudTable from '../components/ui/CrudTable/CrudTable'
import { useState, useEffect } from 'react'
import Link from 'next/link';
import api from '@/services/api';

// Helper para calcular dias restantes y color
const ExpirationBadge = ({ date }) => {
  if (!date) return <span className="text-gray-400">Sin fecha</span>;

  const today = new Date();
  const expirationDate = new Date(date);
  const diffTime = expirationDate - today;
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let colorClass = "bg-green-100 text-green-800";
  
  if (daysDiff <= 60) {
    colorClass = "bg-red-100 text-red-800";
  } else if (daysDiff <= 90) {
    colorClass = "bg-orange-100 text-orange-800";
  } else if (daysDiff <= 120) {
    colorClass = "bg-yellow-100 text-yellow-800";
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {date} ({daysDiff > 0 ? `${daysDiff} días` : "Vencido"})
    </span>
  );
};

const CamionesList = () => {
    const [camiones, setCamiones] = useState([]);
    const [semirremolques, setSemirremolques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


  useEffect(() => {
      async function fetchData() {
        try {
          setLoading(true);
          const [camionesData, semirremolquesData] = await Promise.all([
            api.getCamiones(),
            api.getSemirremolques()
          ]);
          setCamiones(camionesData || []);
          setSemirremolques(semirremolquesData || []);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, []);


  return (
    <TabsWrapper
    tabs={[
      {label: "Camiones", content: (
        <CrudTable
        title="Camiones"
        data={camiones}
        setData={setCamiones}
        key="camiones-list"
        apiUrl="http://localhost:3001/api/camiones"
        columns={[
            { 
              label: "Patente", 
              key: "patente",
              render: (value, row) => (
                <Link href={`/camiones/${row._id}`} className="text-blue-600 hover:underline font-bold">
                  {value}
                </Link>
              )
            },
            { label: "Marca", key: "marca" },
            { label: "Modelo", key: "modelo" },
            { label: "Año", key: "anio" },
            { label:"Seguro", key: "seguro" },
            { 
              label: "Vencimiento Seguro", 
              key: "vencimiento_seguro",
              render: (value) => <ExpirationBadge date={value} />
            },
            {label: "N° de Chasis", key: "numero_chasis"},
            { label: "N° de Motor", key: "numero_motor" },
            
            ]}
            formFields={[
                { label: "Patente", key: "patente", required: true },
                { label: "Marca", key: "marca", required: true },
                { label: "Modelo", key: "modelo", required: true },
                { label: "Año", key: "anio", type: "number", required: true },
                { label: "Seguro", key: "seguro", required: true },
                { label: "Vencimiento Seguro", key: "vencimiento_seguro", type: "date" },
                { label: "N° de Chasis", key: "numero_chasis" },
                { label: "N° de Motor", key: "numero_motor" },      
            ]}
        />
        ),
    },
        {label:"Semirremolques", content: (
          <CrudTable
          title="Semirremolques"
          key="semirremolques-list"
          data={semirremolques}
          setData={setSemirremolques}
          apiUrl="http://localhost:3001/api/semirremolques"
          columns={[
              { label: "Patente", key: "patente" },
              { label: "Marca", key: "marca" },
              { label: "Modelo", key: "modelo" },
              { label: "Año", key: "anio" },
              { label:"Seguro", key: "seguro" },
              { 
                label: "Vencimiento Seguro", 
                key: "vencimiento_seguro",
                render: (value) => <ExpirationBadge date={value} />
              },
              {label: "N° de Chasis", key: "numero_chasis"},
              { label: "N° de Ejes", key: "numero_ejes" },
              
              ]}
              formFields={[
                  { label: "Patente", key: "patente", required: true },
                  { label: "Marca", key: "marca", required: true },
                  { label: "Modelo", key: "modelo", required: true },
                  { label: "Año", key: "anio", type: "number", required: true },
                  { label: "Seguro", key: "seguro", required: true },
                  { label: "Vencimiento Seguro", key: "vencimiento_seguro", type: "date" },
                  { label: "N° de Chasis", key: "numero_chasis" },
                  { label: "N° de Ejes", key: "numero_ejes" },      
              ]}
          />
        ),
      }
    ]}
    />
  )
}

export default CamionesList