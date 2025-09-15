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






export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-100 font-sans">
        {/* Sidebar: oculto en sm, visible según estado */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col flex-1">
          <Navbar onToggleSidebar={toggleSidebar} />
          <main className="p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}


