"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Dropdown } from "@heroui/react";
import { HiOutlineUser, HiOutlineLogout, HiMenu, HiBell } from "react-icons/hi";
import WeatherWidget from "@/app/components/ui/WeatherWidget/WeatherWidget";
import { Logo } from "@/app/components/ui/Logo";
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
  useEffect(() => {
    const checkExpirations = async () => {
      try {
        // Obtener datos desde la API
        const [
          choferes,
          camiones,
          semirremolques,
          cobranzasNac,
          cobranzasInt,
          pagosNac,
          pagosInt,
        ] = await Promise.all([
          api.getChoferes().catch(() => []),
          api.getCamiones().catch(() => []),
          api.getSemirremolques().catch(() => []),
          api.getCobranzasNacionales().catch(() => []),
          api.getCobranzasInternacionales().catch(() => []),
          api.getPagosNacionales().catch(() => []),
          api.getPagosInternacionales().catch(() => []),
        ]);

        const today = new Date();
        const fourMonths = 120; // Dias aprox
        let newAlerts = [];

        // Helper para chequear fechas
        const checkDate = (dateStr, name, type, id) => {
          if (!dateStr) return;
          const expDate = new Date(dateStr);
          const diffTime = expDate - today;
          const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysDiff <= fourMonths) {
            let severity = "text-yellow-600 bg-yellow-100";
            if (daysDiff <= 60) severity = "text-red-600 bg-red-100";
            else if (daysDiff <= 90) severity = "text-orange-600 bg-orange-100";

            newAlerts.push({
              id: `${type}-${id}`,
              type,
              name,
              date: dateStr,
              days: daysDiff,
              severity,
            });
          }
        };

        // Helper para chequear facturas vencidas
        const checkFactura = (item, typeName) => {
          if (item.estado === "pagado" || item.estado === "cobrado") return;

          const fechaEmision = new Date(item.fecha);
          const plazo = item.plazo || 30;
          const fechaVencimiento = new Date(fechaEmision);
          fechaVencimiento.setDate(fechaEmision.getDate() + plazo);

          const diffTime = fechaVencimiento - today;
          const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Alertar si está vencido (días negativos) o por vencer (próximos 5 días)
          if (daysDiff <= 5) {
            let severity = "text-orange-600 bg-orange-100"; // Por vencer
            let label = "Por vencer";

            if (daysDiff < 0) {
              severity = "text-red-600 bg-red-100"; // Vencido
              label = "Vencido";
            }

            newAlerts.push({
              id: `factura-${item._id}-${typeName}`,
              type: `Factura (${typeName})`,
              name: `${item.razon_social} - ${label}`,
              date: fechaVencimiento.toLocaleDateString(),
              days: daysDiff,
              severity,
            });
          }
        };

        // Chequear Choferes
        (choferes || []).forEach((c) =>
          checkDate(c.licencia, c.nombre, "Licencia", c._id),
        );
        // Chequear Camiones
        (camiones || []).forEach((c) =>
          checkDate(
            c.vencimiento_seguro,
            `Camión ${c.patente}`,
            "Seguro",
            c.patente,
          ),
        );
        // Chequear Semis
        (semirremolques || []).forEach((s) =>
          checkDate(
            s.vencimiento_seguro,
            `Semi ${s.patente}`,
            "Seguro",
            s.patente,
          ),
        );

        // Chequear Facturación (Cobranzas y Pagos)
        (cobranzasNac || []).forEach((i) => checkFactura(i, "Cobranza Nac."));
        (cobranzasInt || []).forEach((i) => checkFactura(i, "Cobranza Int."));
        (pagosNac || []).forEach((i) => checkFactura(i, "Pago Nac."));
        (pagosInt || []).forEach((i) => checkFactura(i, "Pago Int."));

        setAlerts(newAlerts.sort((a, b) => a.days - b.days));
      } catch (error) {
        console.error("Error checking alerts", error);
      }
    };

    // Chequear al montar y cada 30 segundos
    checkExpirations();
    const interval = setInterval(checkExpirations, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleLogout = () => {
    setOpenDropdown(false);
    logout();
  };

  return (
    <header className="w-full bg-content1 shadow-md px-6 py-4 flex justify-between items-center border-b border-divider transition-colors duration-300">
      {/* Botón para toggle sidebar (opcional) */}
      {/* {onToggleSidebar && (
        <Button variant="ghost" onPress={onToggleSidebar} className=" mr-4 text-gray-700">
          <HiMenu size={24}/>
        </Button>
      )} */}

      {/* Logo o nombre */}
      <div className="flex items-center">
        <Link href="/dashboard">
          <Logo width={260} height={70} className="cursor-pointer" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Weather Widget (Navbar mode) - oculto en dashboard */}
        {pathname !== "/dashboard" && <WeatherWidget mode="navbar" />}

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            <HiBell size={24} />
            {alerts.length > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                {alerts.length}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-md z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-sm text-gray-700">
                  Notificaciones
                </span>
                <span className="text-xs text-gray-500">
                  {alerts.length} alertas
                </span>
              </div>
              <div>
                {alerts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Sin alertas pendientes
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="px-4 py-3 border-b hover:bg-gray-50 last:border-b-0"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {alert.name}
                          </p>
                          <p className="text-xs text-gray-500">{alert.type}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-[10px] font-bold rounded-full ${alert.severity}`}
                        >
                          {alert.days > 0 ? `${alert.days} días` : "Vencido"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Vence: {alert.date}
                      </p>
                    </div>
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
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            <HiOutlineUser size={24} />
            <span className="hidden sm:inline">
              {user?.email || "Invitado"}
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
                className="absolute right-0 mt-3 w-64 bg-white border border-gray-100/50 rounded-2xl shadow-xl shadow-slate-200/50 ring-1 ring-black/5 z-50 overflow-hidden glass-morphism"
              >
                {/* User Info Header */}
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
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
                      <span className="font-semibold text-gray-800 text-sm truncate">
                        {user?.name || "Usuario"}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-red-100 text-gray-500 group-hover:text-red-500 transition-colors">
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
    </header>
  );
}
