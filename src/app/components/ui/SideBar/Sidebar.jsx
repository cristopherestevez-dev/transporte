"use client";

import { useState } from "react";
import {
  HiMenuAlt3,
  HiOutlineHome,
  HiOutlineLogout,
  HiOutlineAdjustments,
  HiOutlineDocumentText,
  HiSun,
  HiMoon,
} from "react-icons/hi";
import { usePathname } from "next/navigation";
import {
  IconBuilding,
  IconUsers,
  IconTruck,
  IconTrailer,
  IconRoutes,
  IconDriver,
  IconWeather,
  IconCalculator,
} from "../Icons/Icons";
import { Button, Switch } from "@heroui/react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const menuItems = [
    { name: "Dashboard", icon: <HiOutlineHome />, href: "/dashboard" },
    { name: "Empresas", icon: <IconBuilding />, href: "/empresas" },
    { name: "Usuarios", icon: <IconUsers />, href: "/usuarios" },
    { name: "Camiones", icon: <IconTruck />, href: "/camiones" },
    // { name: "Semis", icon: <IconTrailer />, href: "/semis" },
    { name: "Viajes", icon: <IconRoutes />, href: "/viajes" },
    { name: "Choferes", icon: <IconDriver />, href: "/choferes" },
    { name: "Cotizador", icon: <IconCalculator />, href: "/cotizador" },
    { name: "Facturación", icon: <HiOutlineDocumentText />, href: "/facturacion" },
    {
      name: "Configuración",
      icon: <HiOutlineAdjustments />,
      href: "/configuracion",
    },
  ];

  return (
    <div
      className={`bg-content1 border-r border-divider h-screen sticky top-0 left-0 flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Toggle button */}
      <div className="flex justify-end p-3 border-b border-divider">
        <Button
          variant="ghost"
          onPress={toggleSidebar}
          aria-label="Toggle sidebar"
          className="text-foreground"
        >
          <HiMenuAlt3 size={24} />
        </Button>
      </div>

      {/* Menu items */}
      <nav className="flex flex-col mt-4 space-y-2 px-2">
        {menuItems.map(({ name, icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`flex items-center space-x-3 p-2 rounded transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-secondary/10 text-secondary"
                  : "hover:bg-content2 text-default-500 hover:text-foreground"
              }`}
            >
              <div
                className={`text-xl ${
                  isActive ? "text-secondary" : "text-default-500 group-hover:text-foreground"
                }`}
              >
                {icon}
              </div>
              {!collapsed && (
                <span
                  className={`font-medium ${
                    isActive ? "text-secondary" : "text-foreground"
                  }`}
                >
                  {name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme Switch & Logout */}
      <div className="mt-auto p-4 border-t border-divider space-y-4">
        {!collapsed && mounted && (
             <div className="flex justify-between items-center px-2">
                <span className="text-sm font-medium text-foreground">
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
                <Switch
                    defaultSelected={theme === 'dark'}
                    size="sm"
                    color="secondary"
                    thumbIcon={({ isSelected, className }) =>
                        isSelected ? (
                            <HiMoon className={className} />
                        ) : (
                            <HiSun className={className} />
                        )
                    }
                    onValueChange={(isSelected) => setTheme(isSelected ? 'dark' : 'light')}
                />
             </div>
        )}
        {collapsed && mounted && (
            <div className="flex justify-center mb-2">
                 <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-foreground hover:text-secondary">
                    {theme === 'dark' ? <HiMoon size={20} /> : <HiSun size={20} />}
                 </button>
            </div>
        )}
        <button
          className={`w-full flex items-center space-x-3 p-2 rounded hover:bg-danger/10 transition-colors text-danger font-semibold ${
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
