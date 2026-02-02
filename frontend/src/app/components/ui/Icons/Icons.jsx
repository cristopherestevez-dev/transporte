"use client";
import React from "react";

/**
 * BaseIcon
 * - stroke usa currentColor (lo controlás con className text-*)
 * - detalles de acento opcional con accentClassName (ej: text-[#06B6D4])
 */
function BaseIcon({
  children,
  className = "w-7 h-7",
  accentClassName = "",
  ...props
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {typeof children === "function" ? children(accentClassName) : children}
    </svg>
  );
}

/* ---------------------------
   Proveedores (Building)
--------------------------- */
export function IconBuilding({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          <path
            d="M6.5 20V5.8c0-.5.3-.9.7-1.1l4.2-2c.4-.2.9-.2 1.3 0l4.2 2c.4.2.7.6.7 1.1V20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 20h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* ventanas */}
          <path
            d="M9 7.5h.01M12 7.5h.01M15 7.5h.01M9 10.5h.01M12 10.5h.01M15 10.5h.01M9 13.5h.01M12 13.5h.01M15 13.5h.01"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* puerta/acento */}
          <path
            d="M11 20v-3.3c0-.7.6-1.2 1.3-1.2h.4c.7 0 1.3.5 1.3 1.2V20"
            className={accent}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </BaseIcon>
  );
}

/* ---------------------------
   Fleteros / Choferes (Driver)
--------------------------- */
export function IconDriver({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          <path
            d="M12 12.2c2 0 3.6-1.6 3.6-3.6S14 5 12 5 8.4 6.6 8.4 8.6s1.6 3.6 3.6 3.6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6.2 20c.6-3 3.1-5.1 5.8-5.1s5.2 2.1 5.8 5.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* corbata/acento */}
          <path
            d="M12 13.2l1.4 1.8-1.4 5-1.4-5 1.4-1.8Z"
            className={accent}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </>
      )}
    </BaseIcon>
  );
}

/* ---------------------------
   Camiones (Truck)
--------------------------- */
export function IconTruck({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          <path
            d="M3.5 17V7.8c0-.7.6-1.3 1.3-1.3h8.2c.7 0 1.3.6 1.3 1.3V17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M14.3 10h3.6c.4 0 .8.2 1 .6l1.2 2.3c.2.3.3.6.3 1V17h-2.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.7 17h6.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* ruedas */}
          <path
            d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {/* detalle/acento */}
          <path
            d="M16.3 12.2h2.6"
            className={accent}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </BaseIcon>
  );
}

/* ---------------------------
   Semirremolques (Trailer)
--------------------------- */
export function IconTrailer({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          <path
            d="M4 16V7.6c0-.6.5-1.1 1.1-1.1h12.8c.6 0 1.1.5 1.1 1.1V16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 16h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* enganche/acento */}
          <path
            d="M4 12h-1.2c-.7 0-1.3.6-1.3 1.3V16"
            className={accent}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* ruedas */}
          <path
            d="M7.2 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM15.8 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </>
      )}
    </BaseIcon>
  );
}

/* ---------------------------
   Viajes / Rutas (Routes + Pin)
--------------------------- */
export function IconRoutes({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          <path
            d="M7 6.8c.9-1 2.3-1 3.2 0 .9 1 .9 2.6 0 3.6l-1.6 1.8-1.6-1.8c-.9-1-.9-2.6 0-3.6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.6 9.1h.01"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          {/* ruta */}
          <path
            d="M10.8 9.4c2.2-.8 5.2-.3 6.6 1.2 1.6 1.6 1.1 3.7-1 4.6-2 .9-4.3.3-5.5-.7-1.1-.9-2.8-1.2-4.1-.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* destino/acento */}
          <path
            d="M18.5 18.6c.7 0 1.3-.6 1.3-1.3S19.2 16 18.5 16s-1.3.6-1.3 1.3.6 1.3 1.3 1.3Z"
            className={accent}
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </>
      )}
    </BaseIcon>
  );
}

/* ---------------------------
   Usuarios (Users)
--------------------------- */
export function IconUsers({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          {/* user 1 */}
          <path
            d="M10 12c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M5.2 20c.5-2.6 2.7-4.4 4.8-4.4s4.3 1.8 4.8 4.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* user 2 (acento) */}
          <path
            d="M17.2 12.2c1.3 0 2.4-1.1 2.4-2.4S18.5 7.4 17.2 7.4"
             className={accent}
             stroke="currentColor"
             strokeWidth="1.8"
             strokeLinecap="round"
          />
          <path
            d="M16.1 15.9c1.7.3 3 1.7 3.3 4.1"
             className={accent}
             stroke="currentColor"
             strokeWidth="1.8"
             strokeLinecap="round"
          />
        </>
      )}
    </BaseIcon>
  );
}

/* ---------------------------
   Clima (Weather)
--------------------------- */
export function IconWeather({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          {/* Nube */}
          <path
            d="M17.5 19c2.5 0 4.5-2 4.5-4.5S20 10 17.5 10c-.3 0-.6.1-.9.1-.5-2.8-3-4.9-6-4.9-2.9 0-5.3 1.9-6.1 4.5-.4-.1-.8-.2-1.2-.2C5.9 9.5 4 11.4 4 13.7c0 2.3 1.8 4.2 4.1 4.3h.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 19h-9.3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Sol (acento) */}
           <path
            d="M12 3v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
             className={accent}
             stroke="currentColor"
             strokeWidth="1.8"
             strokeLinecap="round"
          />
        </>
      )}
    </BaseIcon>
  );
}

/* ---------------------------
   Cotizador (Calculator)
--------------------------- */
export function IconCalculator({ className, accentClassName = "", ...props }) {
  return (
    <BaseIcon className={className} accentClassName={accentClassName} {...props}>
      {(accent) => (
        <>
          <rect
            x="5"
            y="4"
            width="14"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Pantalla */}
          <path
            d="M8 8h8"
            className={accent}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Botones */}
          <path
            d="M8 12h1M12 12h1M15 12h.01M8 16h1M12 16h1M15 16h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </BaseIcon>
  );
}
