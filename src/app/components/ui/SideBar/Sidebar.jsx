"use client";

import { useState } from "react";
import { HiMenuAlt3, HiOutlineHome, HiOutlineTruck, HiOutlineUser, HiOutlineLogout,HiOutlineOfficeBuilding, HiOutlineMap, HiOutlineAdjustments } from "react-icons/hi";
import { Button } from "@heroui/react";
import Link from "next/link";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const menuItems = [
    { name: "Dashboard", icon: <HiOutlineHome />, href: "/dashboard" },
    { name: "Empresas", icon: <HiOutlineOfficeBuilding />, href: "/empresas" },
    { name: "Usuarios", icon: <HiOutlineUser />, href: "/usuarios" },
    { name: "Camiones", icon: <HiOutlineTruck />, href: "/camiones" },
    { name: "Viajes", icon: <HiOutlineMap />, href: "/viajes" },
    { name: "Configuración", icon: <HiOutlineAdjustments />, href: "/configuracion" },
    
  ];

  return (
    <div
      className={`bg-white shadow-md h-screen sticky top-0 left-0 flex flex-col transition-width duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Toggle button */}
      <div className="flex justify-end p-3 border-b border-gray-200">
        <Button variant="ghost" onPress={toggleSidebar} aria-label="Toggle sidebar">
          <HiMenuAlt3 size={24} color="#374151" />
        </Button>
      </div>

      {/* Menu items */}
      <nav className="flex flex-col mt-4 space-y-2 px-2">
        {menuItems.map(({ name, icon, href }) => (
          <Link
            key={name}
            href={href}
            className={`flex items-center space-x-3 p-2 rounded hover:bg-gray-100 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="text-xl text-gray-700">{icon}</div>
            {!collapsed && <span className="text-gray-800 font-medium">{name}</span>}
          </Link>
        ))}
        
        
      </nav>

      {/* Logout button at bottom */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <button
          className={`w-full flex items-center space-x-3 p-2 rounded hover:bg-red-100 transition-colors text-red-600 font-semibold ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <HiOutlineLogout size={20} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
}


