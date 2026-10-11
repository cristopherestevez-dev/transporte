"use client";
import { Bell, LogOut, Menu, UserRound, Settings, ArrowLeft } from "lucide-react";


import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Dropdown } from "@heroui/react";

import WeatherWidget from "@/app/components/ui/WeatherWidget/WeatherWidget";
import { Logo } from "@/app/components/ui/Logo";
import ConfirmModal from "@/app/components/ui/ModalWrapper/ConfirmModal";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import AppSelect from "@/app/components/ui/AppSelect/AppSelect";
import { perfilOptions } from "@/lib/perfiles";
import { useToast } from "@/app/components/ui/Toast/Toast";
import { useAuth } from "@/app/contexts/AuthContext";
import useCompanyProfile from "@/hooks/useCompanyProfile";
import { permissionForPath } from "@/lib/access.mjs";

export default function Navbar({ onToggleSidebar }) {
  const { user, perfil, perfiles, cambiarPerfil, logout, authenticated, tienePermiso } = useAuth();
  const { profile: companyProfile } = useCompanyProfile();
  const [switchingProfile, setSwitchingProfile] = useState(false);
  const toast = useToast();
  const handleProfileChange = async (value) => {
    setSwitchingProfile(true);
    try { await cambiarPerfil(value); }
    catch (error) { toast.error(error.message); setSwitchingProfile(false); }
  };
  const pathname = usePathname();

  // Estado para abrir/cerrar dropdown de usuario
  const [openDropdown, setOpenDropdown] = useState(false);

  // Estado para notificaciones
  const [alerts, setAlerts] = useState([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(false);
  const [notificationOptions, setNotificationOptions] = useState([]);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [loadingNotificationOptions, setLoadingNotificationOptions] = useState(false);
  const [notificationOptionsError, setNotificationOptionsError] = useState('');
  const notificationsRequest = useRef(0);
  const notificationOptionsRequest = useRef(0);
  const notificationRef = useRef(null);

  // Fetch logic para notificaciones usando API
  const fetchNotifications = async () => {
    const request = ++notificationsRequest.current;
    try {
      const data = await api.getNotifications();
      if (request !== notificationsRequest.current) return;

      // Ensure data is array
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  };

  useEffect(() => {
    setAlerts([]);
    setNotificationOptions([]);
    setNotificationSettings(false);
    setOpenNotifications(false);
    if (!authenticated || !user?.empresaId) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => { clearInterval(interval); ++notificationsRequest.current; ++notificationOptionsRequest.current; };
  }, [perfil, authenticated, user?.empresaId, JSON.stringify(user?.permisos || [])]);

  const loadNotificationOptions = async () => {
    setLoadingNotificationOptions(true);
    setNotificationOptionsError('');
    const request = ++notificationOptionsRequest.current;
    try {
      const options = await api.get('/notifications/preferences');
      if (request === notificationOptionsRequest.current) setNotificationOptions(options || []);
    } catch (error) {
      if (request === notificationOptionsRequest.current) setNotificationOptionsError(error.message);
    } finally {
      if (request === notificationOptionsRequest.current) setLoadingNotificationOptions(false);
    }
  };

  const saveNotificationOptions = async () => {
    setSavingNotifications(true);
    try {
      await api.put('/notifications/preferences', { enabledRuleIds: notificationOptions.filter(option => option.enabled).map(option => option.ruleId) });
      await fetchNotifications();
      setNotificationSettings(false);
      toast.success('Preferencias de notificaciones guardadas');
    } catch (error) { toast.error(error.message); }
    finally { setSavingNotifications(false); }
  };

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
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setOpenNotifications(false);
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
    <header className="w-full bg-content1 shadow-md px-6 py-4 flex flex-wrap gap-3 justify-between items-center border-b border-divider transition-colors duration-300">
      {/* ... Logo ... */}
      <div className="flex items-center">
        <Link href="/dashboard">
          <Logo width={260} height={70} className="cursor-pointer" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">

        {pathname !== "/dashboard" && <WeatherWidget mode="navbar" />}

        {/* Notificaciones */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            aria-label="Abrir notificaciones"
            className="relative p-2 text-foreground/60 hover:text-foreground focus:outline-none"
          >
            <Bell size={24} />
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
                  {!notificationSettings && alerts.length > 0 && (
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
                {notificationSettings ? (
                  <div className="p-4 space-y-4">
                    <p className="text-xs text-foreground/60">Elegí las alertas para tu perfil activo. Solo se muestran las permitidas.</p>
                    {loadingNotificationOptions && <p role="status" className="text-sm">Cargando opciones…</p>}
                    {notificationOptionsError && <p role="alert" className="text-sm text-danger">{notificationOptionsError}</p>}
                    {!loadingNotificationOptions && !notificationOptionsError && notificationOptions.length === 0 && <p className="text-sm text-foreground/50">Este perfil no tiene tipos de notificación habilitados.</p>}
                    {!loadingNotificationOptions && !notificationOptionsError && notificationOptions.map(option => <label key={option.ruleId || option.type} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={savingNotifications} checked={option.enabled} onChange={event => setNotificationOptions(previous => previous.map(item => item.ruleId === option.ruleId ? { ...item, enabled: event.target.checked } : item))} />{option.label}</label>)}
                    {!loadingNotificationOptions && !notificationOptionsError && notificationOptions.length > 0 && <Button size="sm" color="primary" isLoading={savingNotifications} onPress={saveNotificationOptions}>Guardar preferencias</Button>}
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="p-4 text-center text-foreground/50 text-sm">
                    Sin alertas pendientes
                  </div>
                ) : (
                  alerts.filter(alert => alert.link?.startsWith('/') && !alert.link.startsWith('//') && tienePermiso(permissionForPath(alert.link))).map((alert) => (
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
              <div className="sticky bottom-0 border-t border-divider bg-content1 px-4 py-2 flex justify-end">
                <button type="button" disabled={savingNotifications} aria-label={notificationSettings ? 'Volver a notificaciones' : 'Configurar notificaciones'} onClick={() => { setNotificationSettings(!notificationSettings); if (!notificationSettings) loadNotificationOptions(); }} className="flex items-center gap-2 p-1 rounded text-xs text-foreground/60 hover:text-foreground">
                  {notificationSettings ? <ArrowLeft size={17} /> : <Settings size={17} />}
                  {notificationSettings ? 'Volver' : 'Configurar notificaciones'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Usuario y acciones */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDropdown}
              aria-label="Abrir menú de usuario"
              className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
            >
              {user?.image ? (
                <img src={user.image} alt="Imagen de perfil" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs">
                  {user?.name?.charAt(0) || <UserRound size={16} />}
                </div>
              )}
            </button>
            <div className="flex min-w-0 flex-col items-start">
              <button
                type="button"
                onClick={toggleDropdown}
                className="px-2 text-left font-medium text-sm leading-tight text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 rounded"
              >
                {user?.name || "Invitado"}
              </button>
              {authenticated && perfiles.length > 0 && <AppSelect
                compact
                ariaLabel="Perfil activo"
                className="w-[195px] max-w-full"
                value={perfil}
                options={perfiles.map((value) => ({ value, label: user?.perfilLabels?.[value] || perfilOptions.find((option) => option.value === value)?.label || value }))}
                disabled={switchingProfile}
                onChange={handleProfileChange}
              />}
              {switchingProfile && <span role="status" className="px-2 text-[10px] text-default-500">Cambiando perfil…</span>}
            </div>
          </div>

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

                {companyProfile && <div className="px-5 py-3 border-b border-divider flex items-center gap-3">{companyProfile.logo && <img src={companyProfile.logo} alt={`Logo de ${companyProfile.nombre}`} className="w-10 h-10 object-contain rounded-[10px] bg-white p-1" />}<span className="text-sm font-medium truncate">{companyProfile.nombre}</span></div>}
                <div className="p-2">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-red-500/10 text-foreground/70 hover:text-red-500 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-content2 group-hover:bg-red-500/15 text-foreground/50 group-hover:text-red-500 transition-colors">
                      <LogOut size={16} />
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
