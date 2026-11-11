"use client";

import Button from "@/app/components/ui/Button/button";
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@heroui/react";
import { AppTabs, AppTab } from "@/app/components/ui/TabsWrapper/AppTabs";
import { IconCalculator, IconTruck, IconDriver, IconBuilding, IconTrailer, IconRoutes, IconBuilding as IconCompany } from "@/app/components/ui/Icons/Icons";
import Script from "next/script";
import api from "@/services/api";
import SelectSearch from "../components/ui/SelectSearch/Select";
import { useToast } from "@/app/components/ui/Toast/Toast";

export default function Cotizador() {
  const toast = useToast();
  const [savingTrip, setSavingTrip] = useState(false);
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
    // Load resources from API
    async function loadResources() {
      try {
        const [fleteros, camiones, semis, choferes] = await Promise.all([
          api.getFleteros(),
          api.getCamiones(),
          api.getSemirremolques(),
          api.getChoferes()
        ]);
        setData({
          fleteros: fleteros || [],
          camiones: camiones || [],
          semis: semis || [],
          choferes: choferes || []
        });
      } catch (err) {
        console.error("Error loading resources:", err);
      } finally {
        setLoadingResources(false);
      }
    }
    loadResources();
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
              calculationFailed();
            }
          }
        );
      } catch (error) {
         console.error("Error initiating Google Maps service:", error);
         calculationFailed();
      }
    } else {
      calculationFailed();
    }
  };

  const calculationFailed = () => {
    setDistance(null);
    setCalculating(false);
    toast.error("No se pudo calcular la distancia. Revisá la configuración de Maps y la ruta.");
  };

  const handleAddTrip = async () => {
    if (!origin || !destination) return;
    setSavingTrip(true);
    try {
      const isInternational = originCountry !== destCountry;
      const calculatedTarifa = distance ? Math.round(distance.value * 2.5) : 0;
      
      const payload = {
        origen: origin,
        destino: destination,
        estado: "pendiente",
        tipoAsignacion: selectedType === "choferes" ? "chofer" : selectedType === "fleteros" ? "fletero" : "ninguno",
        asignadoId: selectedResource || undefined,
        tarifaTotalAr: isInternational ? undefined : calculatedTarifa,
        tarifaTotalUsd: isInternational ? calculatedTarifa : undefined,
      };

      if (isInternational) {
        await api.createViajeInternacional(payload);
      } else {
        await api.createViajeNacional(payload);
      }

      toast.success("Viaje cotizado y guardado con éxito.");
      
      // Limpiar formulario
      setOrigin("");
      setDestination("");
      setDistance(null);
      setSelectedResource("");
    } catch (error) {
      console.error("Error saving trip:", error);
      toast.error("Error al guardar el viaje: " + error.message);
    } finally {
      setSavingTrip(false);
    }
  };

  // Helper to get selected resource details
  const getResourceDetails = () => {
     if (!selectedResource) return null;
     const list = data[selectedType] || [];
     return list.find( i => (i._id === selectedResource || i.id === selectedResource || i.patente === selectedResource));
  };
  const resourceDetails = getResourceDetails();

  // --- Render ---
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-white">
      <Script 
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&libraries=places&loading=async`}
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
                <Card.Header className="font-semibold text-lg px-6 pt-6 pb-0">Ruta y Origen</Card.Header>
                <Card.Content className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </Card.Content>
            </Card>

            <Card className="shadow-lg border border-gray-100 p-2">
                <Card.Header className="font-semibold text-lg px-6 pt-6 pb-0">Recursos</Card.Header>
                <Card.Content className="p-6">
                     <AppTabs 
                        aria-label="Options" 
                        variant="bordered"
                        selectedKey={selectedType}
                        onSelectionChange={(key) => { setSelectedType(key); setSelectedResource(""); }}
                        className="mb-6"
                        classNames={{ tab: "app-tab" }}
                    >
                        <AppTab key="camiones" id="camiones" title="Camiones" />
                        <AppTab key="fleteros" id="fleteros" title="Fleteros" />
                        <AppTab key="semis" id="semis" title="Semis" />
                        <AppTab key="choferes" id="choferes" title="Choferes" />
                    </AppTabs>

                    {(() => {
                        const options = (data[selectedType] || []).map((item) => {
                            const val = item._id || item.id || item.patente;
                            const selectedLabel = item.nombre || `${item.marca} ${item.modelo}`;
                            return {
                                value: val,
                                selectedLabel,
                                label: (
                                    <div className="flex flex-col py-1">
                                        <span className="font-semibold text-sm text-foreground">{item.nombre || `${item.marca} ${item.modelo}`}</span>
                                        <span className="text-xs text-default-500">{item.patente || item.dni || item.cuil_cuit || "Sin patente"}</span>
                                    </div>
                                )
                            };
                        });
                        const selectedOption = options.find((opt) => opt.value === selectedResource) || null;
                        return (
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-foreground/80">Seleccionar {selectedType}</label>
                                <SelectSearch
                                    options={options}
                                    selectedOption={selectedOption}
                                    onOptionChange={(opt) => setSelectedResource(opt ? opt.value : "")}
                                    placeholder="Busca en la lista..."
                                    className="w-full text-foreground"
                                />
                            </div>
                        );
                    })()}
                </Card.Content>
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
                <Card.Content className="p-8 text-center">
                    <span className="text-gray-400 text-sm uppercase tracking-wider mb-2">Distancia Estimada</span>
                    <span className="text-5xl font-black tracking-tight">{distance ? distance.text : "--"}</span>
                    {distance && (
                         <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Costo Aprox.</span>
                            <span className="text-2xl font-bold text-green-400">${(distance.value * 2.5).toLocaleString()}</span>
                         </div>
                    )}
                </Card.Content>
             </Card>

            {/* Dynamic Summary Table */}
             <Card className="min-w-0 flex-1 shadow-none ring-0">
                <Card.Header className="font-bold text-gray-700 bg-gray-50 border-b">Resumen del Viaje</Card.Header>
                <div className="table-frame">
                    <table className="w-full text-left text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_thead]:bg-content2" aria-label="Resumen">
                        <thead>
                            <tr><th scope="col">CONCEPTO</th><th scope="col">DETALLE</th></tr>
                        </thead>
                        <tbody>
                            <tr key="1">
                                <td className="font-medium text-gray-500">Origen</td>
                                <td>{origin || "-"}</td>
                            </tr>
                            <tr key="2">
                                <td className="font-medium text-gray-500">Destino</td>
                                <td>{destination || "-"}</td>
                            </tr>
                             <tr key="3">
                                <td className="font-medium text-gray-500">Tipo</td>
                                <td>
                                    <span className={`px-2 py-0.5 rounded text-xs text-white ${originCountry !== destCountry ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                        {originCountry !== destCountry ? "INTERNACIONAL" : "NACIONAL"}
                                    </span>
                                </td>
                            </tr>
                            <tr key="4">
                                <td className="font-medium text-gray-500">Recurso</td>
                                <td>
                                    {resourceDetails ? (
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{resourceDetails.nombre || resourceDetails.marca}</span>
                                            <span className="text-xs text-gray-400">{resourceDetails.patente || resourceDetails.dni}</span>
                                        </div>
                                    ) : "-"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <Card.Content className="p-4 bg-gray-50">
                     <Button 
                        className="w-full font-bold text-white bg-brand-navy shadow-lg hover:bg-brand-navy/80 hover:shadow-xl transition-all"
                        isDisabled={!distance || !selectedResource}
                        isLoading={savingTrip}
                        onPress={handleAddTrip}
                    >
                        AGREGAR VIAJE
                     </Button>
                </Card.Content>
             </Card>
        </div>

      </div>
    </div>
  );
}
