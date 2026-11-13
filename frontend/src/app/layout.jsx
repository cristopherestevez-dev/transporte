"use client";
import { useState } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/ui/Navbar/Navbar";
import Sidebar from "./components/ui/SideBar/Sidebar";
import AccessGate from "./components/AccessGate";
import AppFooter from "./components/ui/AppFooter";
import { usePathname } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

import { Providers } from "./providers";
import { ToastProvider } from "./components/ui/Toast/Toast";

// Rutas públicas sin sidebar/navbar
const publicRoutes = ["/landing", "/login", "/registro", "/servicio-suspendido"];

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const driverPage = pathname === "/mis-viajes" || pathname === "/mi-camion";

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname?.startsWith(route),
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/faviconAtlas.svg" type="image/svg+xml" />
        {driverPage && (
          <>
            <link rel="manifest" href="/atlas-choferes.webmanifest" />
            <link rel="apple-touch-icon" href="/atlas-choferes-192.png" />
          </>
        )}
      </head>
      <body className={`font-sans ${poppins.variable}`}>
        <Providers>
          <ToastProvider>
            {isPublicRoute ? (
              pathname === "/landing" ? children : (
                <div className="flex min-h-screen flex-col">
                  <div className="flex flex-1 flex-col">{children}</div>
                  <AppFooter />
                </div>
              )
            ) : (
              // Layout con sidebar/navbar para rutas protegidas
              <div className={`flex min-h-screen bg-background text-foreground ${driverPage ? "flex-col md:flex-row" : ""}`}>
                <Sidebar
                  driverPage={driverPage}
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />
                <div className={`flex min-w-0 flex-col flex-1 ${driverPage ? "max-md:contents" : ""}`}>
                  <Navbar
                    driverPage={driverPage}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  />
                  <main className={driverPage ? "order-2 min-w-0 flex-1 overflow-auto p-3 md:order-none md:p-6" : "min-w-0 flex-1 overflow-auto p-6"}>
                    <AccessGate>{children}</AccessGate>
                  </main>
                  <AppFooter className={driverPage ? "order-3 md:order-none" : ""} />
                </div>
              </div>
            )}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
