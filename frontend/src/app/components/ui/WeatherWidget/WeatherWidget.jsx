"use client";

import React, { useEffect, useState } from "react";
import { IconWeather } from "../Icons/Icons";
import {
  HiOutlineStatusOnline,
  HiExclamationCircle,
  HiCheckCircle,
} from "react-icons/hi";

const LAT = -32.8167;
const LON = -70.0833;

function getWeatherDescription(code) {
  if (code === 0) return "Despejado";
  if (code >= 1 && code <= 3) return "Parcialmente nublado";
  if (code >= 45 && code <= 48) return "Niebla";
  if (code >= 51 && code <= 55) return "Llovizna";
  if (code >= 61 && code <= 65) return "Lluvia";
  if (code >= 71 && code <= 77) return "Nieve";
  if (code >= 80 && code <= 82) return "Lluvia Fuerte";
  if (code >= 95 && code <= 99) return "Tormenta";
  return "Variable";
}

function getPassStatus(code) {
  // Logic to simulate pass status
  // Snow (71-77) or Thunderstorm (95-99) or Freezing Drizzle (56-57) usually closes the pass
  if (code >= 71 && code <= 77)
    return {
      status: "CERRADO",
      color: "bg-red-500",
      icon: <HiExclamationCircle />,
    };
  if (code >= 95 && code <= 99)
    return {
      status: "CERRADO",
      color: "bg-red-500",
      icon: <HiExclamationCircle />,
    };
  if (code >= 51 && code <= 67)
    return {
      status: "PRECAUCIÓN",
      color: "bg-yellow-500",
      icon: <HiExclamationCircle />,
    };
  return { status: "ABIERTO", color: "bg-green-500", icon: <HiCheckCircle /> };
}

const RenderWeatherEffects = ({ code }) => {
  const isRain =
    (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const isSnow = code >= 71 && code <= 77;

  if (!isRain && !isSnow) return null;

  const drops = Array.from({ length: 50 }).map((_, i) => (
    <div
      key={i}
      className="drop"
      style={{
        left: `${Math.random() * 100}%`,
        animationDuration: `${0.5 + Math.random()}s`,
        animationDelay: `${Math.random()}s`,
        background: isSnow ? "white" : "rgba(255, 255, 255, 0.6)",
        width: isSnow ? "4px" : "2px",
        height: isSnow ? "4px" : "10px",
        borderRadius: isSnow ? "50%" : "0",
      }}
    />
  ));

  return <div className="weather-rain">{drops}</div>;
};

export default function WeatherWidget({ mode = "card", className = "" }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`,
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          condition: getWeatherDescription(data.current.weather_code),
          wind: data.current.wind_speed_10m,
        });
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  if (loading) {
    if (mode === "navbar")
      return (
        <div className="text-sm text-foreground/50 animate-pulse">...</div>
      );
    return (
      <div
        className={`p-6 rounded-2xl shadow-lg bg-content2 flex items-center justify-center animate-pulse h-64 ${className}`}
      >
        <IconWeather className="w-12 h-12 text-foreground/30" />
      </div>
    );
  }

  if (!weather) return null;

  if (mode === "navbar") {
    const passStatus = getPassStatus(weather.code);
    return (
      <div
        className={`flex items-center gap-3 text-foreground bg-content1 shadow-sm px-4 py-1.5 rounded-full border border-divider ${className}`}
      >
        <div className="flex items-center gap-2">
          <IconWeather className="w-5 h-5 text-blue-500" />
          <span className="font-bold">{weather.temp}°C</span>
        </div>
        <span className="text-xs text-foreground/50 hidden md:inline border-l border-divider pl-2">
          {weather.condition}
        </span>
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${passStatus.color} text-white`}
        >
          {passStatus.status}
        </div>
      </div>
    );
  }

  // Card Mode (Dashboard Hero)
  const passStatus = getPassStatus(weather.code);
  const bgGradient =
    weather.code >= 71
      ? "from-gray-700 to-gray-900" // Snow
      : weather.code >= 51
        ? "from-slate-700 to-slate-900" // Rain
        : "from-blue-500 to-blue-700"; // Clear/Cloudy

  return (
    <div
      className={`relative overflow-hidden p-0 rounded-3xl shadow-xl bg-gradient-to-br ${bgGradient} text-white hover:shadow-2xl transition-all duration-500 ${className}`}
    >
      {/* Weather Animation Layer */}
      <RenderWeatherEffects code={weather.code} />

      <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 h-full">
        {/* Left: Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <div className="flex items-center gap-2 text-white/80 uppercase tracking-wider text-xs font-semibold mb-1">
            <IconWeather className="w-4 h-4" />
            <span>Paso Cristo Redentor</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-7xl font-extrabold tracking-tighter">
              {weather.temp}°
            </span>
            <span className="text-2xl font-medium mb-3 opacity-90">
              {weather.condition}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/70 mt-2">
            <span>Viento: {weather.wind} km/h</span>
          </div>
        </div>

        {/* Right: Pass Status */}
        <div className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
          <span className="text-white/80 text-sm font-medium uppercase tracking-widest">
            Estado del Paso
          </span>
          <div
            className={`flex items-center gap-3 px-6 py-2 rounded-full shadow-lg ${passStatus.color} transition-transform hover:scale-105`}
          >
            <span className="text-2xl">{passStatus.icon}</span>
            <span className="text-2xl font-bold tracking-wide">
              {passStatus.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
