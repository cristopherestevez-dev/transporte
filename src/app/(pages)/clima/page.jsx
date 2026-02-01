"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { IconWeather } from "@/app/components/ui/Icons/Icons";

export default function ClimaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Aquí integraremos la API de clima más adelante
    // Por ahora simulamos una carga
    const timer = setTimeout(() => {
        setData({ temp: 24, condition: "Soleado", city: "Buenos Aires" });
        setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <IconWeather className="w-8 h-8 text-blue-500" />
        Clima
      </h1>

      <Card className="max-w-md">
        <CardHeader className="font-bold text-xl text-gray-700">Pronóstico Actual</CardHeader>
        <CardBody>
            {loading ? (
                <p className="text-gray-500">Cargando datos del clima...</p>
            ) : (
                <div className="flex flex-col items-center py-6">
                    <IconWeather className="w-24 h-24 text-yellow-500 mb-4" />
                    <h2 className="text-4xl font-bold text-gray-900">{data.temp}°C</h2>
                    <p className="text-lg text-gray-600">{data.condition}</p>
                    <p className="text-sm text-gray-400 mt-2">{data.city}</p>
                </div>
            )}
        </CardBody>
      </Card>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
        <p><strong>Nota:</strong> Esta sección está lista para integrar la API de clima que proveerás.</p>
      </div>
    </div>
  );
}
