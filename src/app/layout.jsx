"use client";
import { useState } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/ui/Navbar/Navbar";
import Sidebar from "./components/ui/SideBar/Sidebar";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
});






import { Providers } from "./providers";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(false);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/faviconAtlas.svg" type="image/svg+xml" />
      </head>
      <body className={`font-sans ${poppins.variable}`}>
        <Providers>
            <div className="flex min-h-screen bg-background text-foreground">
                {/* Sidebar: oculto en sm, visible según estado */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="flex flex-col flex-1">
                    <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                    <main className="p-6 overflow-auto">{children}</main>
                </div>
            </div>
        </Providers>
      </body>
    </html>
  );
}


