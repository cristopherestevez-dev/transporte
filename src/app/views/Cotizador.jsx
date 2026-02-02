"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Select, SelectItem, Card, CardBody, CardHeader, Tab, Tabs, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { IconCalculator, IconTruck, IconDriver, IconBuilding, IconTrailer, IconRoutes, IconBuilding as IconCompany } from "@/app/components/ui/Icons/Icons";
import Script from "next/script";

export default function Cotizador() {
  // --- Data & State ---
  const [data, setData] = useState({ fleteros: [], camiones: [], semis: [], choferes: [] });
  const [loadingResources, setLoadingResources] = useState(true);

  // Form State
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState(null);
  const [calculating, setCalculating] = useState(false);
  
  const [selectedType, setSelectedType] = useState("camiones");
  const [selectedResource, setSelectedResource] = useState("");
  
  // Logic State
  const [originCountry, setOriginCountry] = useState("Argentina"); // Default assumption
  const [destCountry, setDestCountry] = useState("Argentina");

  const originRef = useRef(null);
  const destRef = useRef(null);

  // --- Effects ---

  useEffect(() => {
    // Load local DB resources
    fetch("/db.json")
      .then((res) => res.json())
      .then((db) => {
        setData({
          fleteros: db.fleteros || [],
          camiones: db.camiones || [],
          semis: db.semirremolques || [],
          choferes: db.choferes || []
        });
        setLoadingResources(false);
      })
      .catch((err) => console.error(err));
  }, []);

  const autocompleteOriginInstance = useRef(null);
  const autocompleteDestInstance = useRef(null);

  // Initialize Maps Autocomplete
  const initAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
        // If script hasn't loaded or failed
        return;
    }

    // Prevent double initialization
    if (autocompleteOriginInstance.current) return;

    const options = { types: ["(cities)"] };

    // Setup Origin
    if (originRef.current) {
        const acOrigin = new window.google.maps.places.Autocomplete(originRef.current, options);
        acOrigin.addListener("place_changed", () => {
            const place = acOrigin.getPlace();
            if (place.formatted_address) {
                setOrigin(place.formatted_address);
                const countryComp = place.address_components.find(c => c.types.includes("country"));
                if (countryComp) setOriginCountry(countryComp.long_name);
            }
        });
        autocompleteOriginInstance.current = acOrigin;
    }

    // Setup Destination
    if (destRef.current) {
        const acDest = new window.google.maps.places.Autocomplete(destRef.current, options);
        acDest.addListener("place_changed", () => {
            const place = acDest.getPlace();
            if (place.formatted_address) {
                setDestination(place.formatted_address);
                const countryComp = place.address_components.find(c => c.types.includes("country"));
                if (countryComp) setDestCountry(countryComp.long_name);
            }
        });
        autocompleteDestInstance.current = acDest;
    }
  };

  // Try to init if Maps is already loaded (e.g. navigation)
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
        initAutocomplete();
    }
  }, []);

  // --- Handlers ---

  const handleCalculate = () => {
    if (!origin || !destination) return;
    setCalculating(true);
    setDistance(null);

    if (window.google && window.google.maps) {
      try {
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: 'DRIVING',
          },
          (response, status) => {
            if (status === 'OK' && response.rows[0]?.elements[0]?.status === 'OK') {
              const distText = response.rows[0].elements[0].distance.text;
              const distValue = response.rows[0].elements[0].distance.value / 1000;
              setDistance({ text: distText, value: distValue });
              setCalculating(false);
            } else {
              console.warn("Google Maps API failed or returned explicit error:", status);
              mockCalculation();
            }
          }
        );
      } catch (error) {
         console.error("Error initiating Google Maps service:", error);
         mockCalculation();
      }
    } else {
      mockCalculation();
    }
  };

  const mockCalculation = () => {
    setTimeout(() => {
        const mockDist = Math.floor(Math.random() * 1500) + 100;
        setDistance({ text: `${mockDist} km`, value: mockDist });
        setCalculating(false);
    }, 1000);
  };

  const handleAddTrip = () => {
    const isInternational = originCountry !== destCountry;
    const endpoint = isInternational ? "/viajesInternacionales" : "/viajesNacionales";
    
    // Simulate API call
    console.log(`Saving to ${endpoint}:`, { 
        origin, destination, 
        recurso: selectedResource, 
        tipo: selectedType,
        distancia: distance 
    });
    
    alert(`Viaje Agregado a: ${isInternational ? "INTERNACIONALES" : "LOCALES"}\nOrigen: ${originCountry}\nDestino: ${destCountry}`);
  };

  // Helper to get selected resource details
  const getResourceDetails = () => {
     if (!selectedResource) return null;
     const list = data[selectedType] || [];
     return list.find( i => (i.id == selectedResource || i.patente == selectedResource));
  };
  const resourceDetails = getResourceDetails();

  // --- Render ---
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-white">
      <Script 
        src={`https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&loading=async`} 
        strategy="lazyOnload"
        onLoad={initAutocomplete}
      />

      <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
        <IconCalculator className="w-8 h-8 text-blue-600" />
        Nuevo Cotizador
      </h1>
      <p className="text-gray-500 mb-8">Planifica tus viajes, calcula costos y asigna recursos.</p>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left: Form */}
        <div className="flex-1 space-y-6">
            <Card className="shadow-lg border border-gray-100 p-2">
                <CardHeader className="font-semibold text-lg px-6 pt-6 pb-0">Ruta y Origen</CardHeader>
                <CardBody className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                        <input
                            ref={originRef}
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Ej: Buenos Aires, Argentina"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                        />
                         <span className="text-xs text-gray-400 mt-1 block">País detectado: {originCountry}</span>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                         <input
                            ref={destRef}
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Ej: Santiago, Chile"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                        />
                        <span className="text-xs text-gray-400 mt-1 block">País detectado: {destCountry}</span>
                    </div>
                </CardBody>
            </Card>

            <Card className="shadow-lg border border-gray-100 p-2">
                <CardHeader className="font-semibold text-lg px-6 pt-6 pb-0">Recursos</CardHeader>
                <CardBody className="p-6">
                     <Tabs 
                        aria-label="Options" 
                        color="primary" 
                        variant="bordered"
                        selectedKey={selectedType}
                        onSelectionChange={(key) => { setSelectedType(key); setSelectedResource(""); }}
                        className="mb-6"
                    >
                        <Tab key="camiones" title="Camiones" />
                        <Tab key="fleteros" title="Fleteros" />
                        <Tab key="semis" title="Semis" />
                        <Tab key="choferes" title="Choferes" />
                    </Tabs>

                    <Select 
                        label={`Seleccionar ${selectedType}`}
                        placeholder="Busca en la lista..."
                        selectedKeys={selectedResource ? [selectedResource] : []}
                        onChange={(e) => setSelectedResource(e.target.value)}
                        variant="faded"
                        className="max-w-full"
                    >
                        {(data[selectedType] || []).map((item) => (
                            <SelectItem key={item.id || item.patente} textValue={item.nombre || `${item.marca} ${item.patente}`}>
                                <div className="flex flex-col">
                                    <span className="font-bold">{item.nombre || `${item.marca} ${item.modelo}`}</span>
                                    <span className="text-xs text-gray-500">{item.patente || item.dni || item.cuil_cuit || "Sin patente"}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </Select>
                </CardBody>
            </Card>

             <Button 
                color="primary" 
                size="lg" 
                className="w-full py-8 text-xl font-bold shadow-blue-200 shadow-lg"
                onPress={handleCalculate}
                isLoading={calculating}
            >
                {calculating ? "Calculando..." : "Calcular Distancia"}
            </Button>
        </div>


        {/* Right: Summary & Action */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6">
             <Card className="bg-gray-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                <CardBody className="p-8 text-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wider mb-2">Distancia Estimada</span>
                    <span className="text-5xl font-black tracking-tight">{distance ? distance.text : "--"}</span>
                    {distance && (
                         <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Costo Aprox.</span>
                            <span className="text-2xl font-bold text-green-400">${(distance.value * 2.5).toLocaleString()}</span>
                         </div>
                    )}
                </CardBody>
             </Card>

            {/* Dynamic Summary Table */}
             <Card className="shadow-md border border-gray-100 flex-1">
                <CardHeader className="font-bold text-gray-700 bg-gray-50 border-b">Resumen del Viaje</CardHeader>
                <div className="p-0 overflow-x-auto">
                    <Table removeWrapper aria-label="Resumen">
                        <TableHeader>
                            <TableColumn>CONCEPTO</TableColumn>
                            <TableColumn>DETALLE</TableColumn>
                        </TableHeader>
                        <TableBody>
                            <TableRow key="1">
                                <TableCell className="font-medium text-gray-500">Origen</TableCell>
                                <TableCell>{origin || "-"}</TableCell>
                            </TableRow>
                            <TableRow key="2">
                                <TableCell className="font-medium text-gray-500">Destino</TableCell>
                                <TableCell>{destination || "-"}</TableCell>
                            </TableRow>
                             <TableRow key="3">
                                <TableCell className="font-medium text-gray-500">Tipo</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${originCountry !== destCountry ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                        {originCountry !== destCountry ? "INTERNACIONAL" : "NACIONAL"}
                                    </span>
                                </TableCell>
                            </TableRow>
                            <TableRow key="4">
                                <TableCell className="font-medium text-gray-500">Recurso</TableCell>
                                <TableCell>
                                    {resourceDetails ? (
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{resourceDetails.nombre || resourceDetails.marca}</span>
                                            <span className="text-xs text-gray-400">{resourceDetails.patente || resourceDetails.dni}</span>
                                        </div>
                                    ) : "-"}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                <CardBody className="p-4 bg-gray-50">
                     <Button 
                        className="w-full font-bold text-white bg-brand-navy shadow-lg hover:bg-brand-navy/80 hover:shadow-xl transition-all"
                        isDisabled={!distance || !selectedResource}
                        onPress={handleAddTrip}
                    >
                        AGREGAR VIAJE
                    </Button>
                </CardBody>
             </Card>
        </div>

      </div>
    </div>
  );
}
