"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import { useAuth } from "@/app/contexts/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { permisos, logout, user, authenticated } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const allMenuItems = [
    {
      name: "Dashboard",
      icon: <HiOutlineHome />,
      href: "/dashboard",
      permiso: "dashboard",
    },
    {
      name: "Empresas",
      icon: <IconBuilding />,
      href: "/empresas",
      permiso: "empresas",
    },
    {
      name: "Camiones",
      icon: <IconTruck />,
      href: "/camiones",
      permiso: "camiones",
    },
    {
      name: "Viajes",
      icon: <IconRoutes />,
      href: "/viajes",
      permiso: "viajes",
    },
    {
      name: "Choferes",
      icon: <IconDriver />,
      href: "/choferes",
      permiso: "choferes",
    },
    {
      name: "Cotizador",
      icon: <IconCalculator />,
      href: "/cotizador",
      permiso: "cotizador",
    },
    {
      name: "Facturación",
      icon: <HiOutlineDocumentText />,
      href: "/facturacion",
      permiso: "facturacion",
    },
    {
      name: "Configuración",
      icon: <HiOutlineAdjustments />,
      href: "/configuracion",
      permiso: "configuracion",
    },
  ];

  // Filtrar menú según permisos del usuario
  const menuItems =
    permisos.length > 0
      ? allMenuItems.filter((item) => permisos.includes(item.permiso))
      : allMenuItems; // Si no hay permisos, mostrar todo (para desarrollo)

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
          className="text-foreground min-w-10 h-10 px-0"
        >
          <HiMenuAlt3 size={collapsed ? 26 : 32} />
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
              className={`relative flex items-center gap-3 p-2 rounded-xl transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                !isActive &&
                "hover:bg-content2 text-default-500 hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-sidebar-item"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
              <div
                className={`relative z-10 text-xl ${
                  isActive
                    ? "text-primary"
                    : "text-default-500 group-hover:text-foreground"
                }`}
              >
                {icon}
              </div>
              {!collapsed && (
                <span
                  className={`relative z-10 font-medium ${
                    isActive ? "text-primary" : "text-foreground"
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
        {mounted && (
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-between px-2"
            }`}
          >
            {!collapsed && (
              <span className="text-sm font-medium text-foreground">
                {theme === "dark" ? "Modo Oscuro" : "Modo Claro"}
              </span>
            )}

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`relative flex items-center justify-center rounded-full transition-colors focus:outline-none ${
                collapsed
                  ? "w-10 h-10 hover:bg-content2 text-foreground"
                  : "w-14 h-8 bg-default-200 dark:bg-default-100"
              }`}
            >
              {collapsed ? (
                // Collapsed state: Rotating icon
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === "dark" ? 0 : 360 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  {theme === "dark" ? (
                    <HiMoon size={24} className="text-secondary" />
                  ) : (
                    <HiSun size={24} className="text-orange-500" />
                  )}
                </motion.div>
              ) : (
                // Expanded state: Toggle Switch
                <>
                  <motion.div
                    className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center z-10"
                    initial={false}
                    animate={{ x: theme === "dark" ? 24 : 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 700,
                      damping: 30,
                    }}
                  >
                    {theme === "dark" ? (
                      <HiMoon size={14} className="text-secondary" />
                    ) : (
                      <HiSun size={14} className="text-orange-500" />
                    )}
                  </motion.div>
                </>
              )}
            </button>
          </div>
        )}

        
      </div>
    </div>
  );
}
