"use client"
import React from 'react'
import TabsWrapper from '../components/ui/TabsWrapper/TabsWrapper'
import CrudTable from '../components/ui/CrudTable/CrudTable'
import { useState, useEffect } from 'react'

const CamionesList = () => {
    const [camiones, setCamiones] = useState([]);
    const [semirremolques, setSemirremolques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


  useEffect(() => {
      async function fetchData() {
        try {
          setLoading(true);
          const res = await fetch('/db.json');
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const data = await res.json();
          setCamiones(data.camiones);
          setSemirremolques(data.semirremolques);
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
            { label: "Patente", key: "patente" },
            { label: "Marca", key: "marca" },
            { label: "Modelo", key: "modelo" },
            { label: "Año", key: "anio" },
            { label:"Seguro", key: "seguro" },
            { label: "Vencimiento Seguro", key: "vencimiento_seguro" },
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
          apiUrl="http://localhost:3001/api/semiremolque"
          columns={[
              { label: "Patente", key: "patente" },
              { label: "Marca", key: "marca" },
              { label: "Modelo", key: "modelo" },
              { label: "Año", key: "anio" },
              { label:"Seguro", key: "seguro" },
              { label: "Vencimiento Seguro", key: "vencimiento_seguro" },
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