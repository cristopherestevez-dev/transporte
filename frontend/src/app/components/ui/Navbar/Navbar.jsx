"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Dropdown } from "@heroui/react";
import { HiOutlineUser, HiOutlineLogout, HiMenu, HiBell } from "react-icons/hi";
import WeatherWidget from "@/app/components/ui/WeatherWidget/WeatherWidget";
import { Logo } from "@/app/components/ui/Logo";
import ConfirmModal from "@/app/components/ui/ModalWrapper/ConfirmModal";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, authenticated } = useAuth();
  const pathname = usePathname();

  // Estado para abrir/cerrar dropdown de usuario
  const [openDropdown, setOpenDropdown] = useState(false);

  // Estado para notificaciones
  const [alerts, setAlerts] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);

  // Fetch logic para notificaciones usando API
  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      // Ensure data is array
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (alert) => {
    try {
      if (!alert.isRead) {
        await api.markNotificationAsRead(alert._id);
        // Optimistic update
        setAlerts((prev) => prev.filter((a) => a._id !== alert._id));
      }
      // Close dropdown and redirect
      setOpenNotifications(false);
      setOpenDropdown(false);
      // If link exists, it will navigate natively by Link wrapper or window.location
      // But we are wrapping it in Link in the render
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearNotifications();
      setAlerts([]);
    } catch (error) {
      console.error("Error clearing notifications", error);
    }
  };

  // Estado para confirmación de logout
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Ref para el dropdown
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setOpenDropdown(!openDropdown);
    setOpenNotifications(false);
  };
  const toggleNotifications = () => {
    setOpenNotifications(!openNotifications);
    setOpenDropdown(false);
  };

  const handleLogoutClick = () => {
    setOpenDropdown(false);
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logout();
  };

  // ... existing code ...

  return (
    <header className="w-full bg-content1 shadow-md px-6 py-4 flex justify-between items-center border-b border-divider transition-colors duration-300">
      {/* ... Logo ... */}
      <div className="flex items-center">
        <Link href="/dashboard">
          <Logo width={260} height={70} className="cursor-pointer" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {pathname !== "/dashboard" && <WeatherWidget mode="navbar" />}

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative p-2 text-foreground/60 hover:text-foreground focus:outline-none"
          >
            <HiBell size={24} />
            {alerts.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                {alerts.length}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-content1 border border-divider rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-divider bg-content2 flex justify-between items-center sticky top-0 z-10">
                <span className="font-semibold text-sm text-foreground">
                  Notificaciones
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground/50">
                    {alerts.length} alertas
                  </span>
                  {alerts.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Borrar todas
                    </button>
                  )}
                </div>
              </div>
              <div>
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-foreground/50 text-sm">
                    Sin alertas pendientes
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Link
                      href={alert.link || "#"}
                      key={alert._id}
                      onClick={() => handleNotificationClick(alert)}
                      className="block px-4 py-3 border-b border-divider hover:bg-content2 last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {alert.title}
                          </p>
                          <p className="text-xs text-foreground/50 mt-1">
                            {alert.message}
                          </p>
                        </div>
                        <span
                          className={`flex-shrink-0 px-2 py-1 text-[10px] font-bold rounded-full ${
                            alert.severity === "danger"
                              ? "text-red-500 bg-red-500/15"
                              : alert.severity === "warning"
                                ? "text-orange-500 bg-orange-500/15"
                                : "text-blue-500 bg-blue-500/15"
                          }`}
                        >
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/40 mt-1 text-right">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Usuario y acciones */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-2 text-foreground/70 hover:text-foreground focus:outline-none"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-divider"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs">
                {user?.name?.charAt(0) || <HiOutlineUser size={16} />}
              </div>
            )}
            <span className="hidden sm:inline font-medium">
              {user?.name || "Invitado"}
            </span>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {openDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-64 bg-content1 border border-divider rounded-2xl shadow-xl ring-1 ring-black/5 z-50 overflow-hidden"
              >
                {/* User Info Header */}
                <div className="px-5 py-4 border-b border-divider bg-content2/50">
                  <div className="flex items-center gap-3">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-foreground text-sm truncate">
                        {user?.name || "Usuario"}
                      </span>
                      <span className="text-xs text-foreground/50 truncate">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-red-500/10 text-foreground/70 hover:text-red-500 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-content2 group-hover:bg-red-500/15 text-foreground/50 group-hover:text-red-500 transition-colors">
                      <HiOutlineLogout size={16} />
                    </div>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm Modal de Logout */}
      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="Cerrar sesión"
        message="¿Estás seguro que querés cerrar sesión?"
        label="Cerrar sesión"
        bgcolor="bg-red-600"
        bghover="red"
      />
    </header>
  );
}
