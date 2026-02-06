"use client";
import { useState } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/ui/Navbar/Navbar";
import Sidebar from "./components/ui/SideBar/Sidebar";
import { usePathname } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

import { Providers } from "./providers";
import { ToastProvider } from "./components/ui/Toast/Toast";

// Rutas públicas sin sidebar/navbar
const publicRoutes = ["/landing", "/login"];

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname?.startsWith(route),
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/faviconAtlas.svg" type="image/svg+xml" />
      </head>
      <body className={`font-sans ${poppins.variable}`}>
        <Providers>
          <ToastProvider>
            {isPublicRoute ? (
              // Layout limpio para rutas públicas
              <>{children}</>
            ) : (
              // Layout con sidebar/navbar para rutas protegidas
              <div className="flex min-h-screen bg-background text-foreground">
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                />
                <div className="flex flex-col flex-1">
                  <Navbar
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  />
                  <main className="p-6 overflow-auto">{children}</main>
                </div>
              </div>
            )}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
