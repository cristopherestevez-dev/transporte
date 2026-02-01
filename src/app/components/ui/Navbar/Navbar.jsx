"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Dropdown } from "@heroui/react";
import { HiOutlineUser, HiOutlineLogout, HiMenu } from "react-icons/hi";
import WeatherWidget from "@/app/components/ui/WeatherWidget/WeatherWidget";

export default function Navbar({ onToggleSidebar }) {
  // Simulamos usuario logueado (más adelante podrás usar contexto o estado global)
  const usuario = { email: "admin@empresa.com", nombre: "Administrador" };
  const pathname = usePathname();

  // Estado para abrir/cerrar dropdown de usuario
  const [openDropdown, setOpenDropdown] = useState(false);

  const toggleDropdown = () => setOpenDropdown(!openDropdown);

  const handleLogout = () => {
    // Aquí tu lógica para logout (limpiar token, redirigir, etc)
    alert("Cerrar sesión");
  };

  return (
    <header className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center">
      {/* Botón para toggle sidebar (opcional) */}
      {/* {onToggleSidebar && (
        <Button variant="ghost" onPress={onToggleSidebar} className=" mr-4 text-gray-700">
          <HiMenu size={24}/>
        </Button>
      )} */}

      {/* Logo o nombre */}
      <div className="text-l font-bold text-gray-800">
        Transporte Cargas SaaS
      </div>

      <div className="flex items-center gap-4">
        {/* Weather Widget (Navbar mode) - oculto en dashboard */}
        {pathname !== "/dashboard" && <WeatherWidget mode="navbar" />}

        {/* Usuario y acciones */}
        <div className="relative">
            <button
            onClick={toggleDropdown}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
            >
            <HiOutlineUser size={24} />
            <span className="hidden sm:inline">{usuario.email}</span>
            </button>

            {/* Dropdown */}
            {openDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50">
                <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 font-semibold"
                >
                Cerrar sesión
                </button>
            </div>
            )}
        </div>
      </div>
    </header>
  );
}


