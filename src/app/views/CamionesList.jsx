import React from 'react'
import TabsWrapper from '../components/ui/TabsWrapper/TabsWrapper'
import CrudTable from '../components/ui/CrudTable/CrudTable'

const CamionesList = () => {
  return (
    <TabsWrapper
    tabs={[
      {label: "Camiones", content: (
        <CrudTable
        title="Camiones"
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
        {label:"Semiremolques", content: (
          <CrudTable
          title="Semirremolques"
          key="semirremolques-list"
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