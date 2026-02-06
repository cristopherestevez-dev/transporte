"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import {
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineCalculator,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
} from "react-icons/hi";
import { FcGoogle } from "react-icons/fc";
import "../../globals.css";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: HiOutlineTruck,
    title: "Gestión de Flota",
    description: "Control total de camiones, semirremolques y mantenimientos",
  },
  {
    icon: HiOutlineClipboardList,
    title: "Viajes en Tiempo Real",
    description: "Seguimiento de viajes nacionales e internacionales",
  },
  {
    icon: HiOutlineChartBar,
    title: "Dashboard Inteligente",
    description: "Métricas y KPIs de tu operación logística",
  },
  {
    icon: HiOutlineCalculator,
    title: "Cotizador Integrado",
    description: "Cotizaciones rápidas y precisas para tus clientes",
  },
  {
    icon: HiOutlineDocumentText,
    title: "Facturación Automática",
    description: "Gestión de cobranzas y pagos simplificada",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Gestión de Equipo",
    description: "Choferes, fleteros y proveedores en un solo lugar",
  },
];

const stats = [
  { value: "500+", label: "Empresas activas" },
  { value: "10K+", label: "Viajes gestionados" },
  { value: "99.9%", label: "Uptime garantizado" },
  { value: "24/7", label: "Soporte técnico" },
];

export default function LandingPage() {
  // Forzar scroll al inicio al cargar para que las animaciones funcionen bien
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-50 flex items-center justify-between px-6 py-4 md:px-12 lg:px-20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <HiOutlineTruck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">Atlas Transporte</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-gray-300 hover:text-white transition"
          >
            Funcionalidades
          </a>
          <a
            href="#stats"
            className="text-gray-300 hover:text-white transition"
          >
            Estadísticas
          </a>
          <Link
            href="/login"
            className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
          >
            Iniciar Sesión
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32 md:px-12 lg:px-20 lg:pt-32">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm mb-8"
          >
            <HiOutlineLightningBolt className="w-4 h-4" />
            Plataforma líder en gestión logística
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
          >
            Gestiona tu flota con{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
              inteligencia
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            La solución integral para empresas de transporte. Optimiza
            operaciones, reduce costos y toma decisiones basadas en datos.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold text-lg shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <FcGoogle className="text-2xl bg-white rounded-full p-0.5" />
              Comenzar con Google
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-white/20 hover:bg-white/10 rounded-xl font-semibold text-lg transition"
            >
              Ver funcionalidades
            </a>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-5xl mx-auto mt-20"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
            <div className="aspect-video bg-slate-800 flex overflow-hidden">
              {/* Fake Sidebar */}
              <div className="w-16 md:w-64 border-r border-white/10 flex flex-col p-4 gap-4 bg-slate-900/50">
                <div className="h-8 w-8 md:w-32 bg-white/10 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-3 mt-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-full bg-white/5 rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Fake Main Content */}
              <div className="flex-1 flex flex-col bg-slate-900/20">
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center px-8 gap-4">
                  <div className="h-8 w-64 bg-white/5 rounded-lg" />
                  <div className="ml-auto h-8 w-8 bg-white/10 rounded-full" />
                </div>

                {/* Stats Grid */}
                <div className="p-8 grid grid-cols-3 gap-6">
                  {/* Card 1: Chart */}
                  <div className="col-span-2 h-64 bg-slate-800/50 rounded-xl border border-white/5 p-4 flex flex-col gap-4 relative overflow-hidden">
                    <div className="h-6 w-32 bg-white/10 rounded" />
                    <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
                      {[40, 70, 50, 90, 60, 80, 50].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t-sm opacity-60"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card 2: Stats */}
                  <div className="col-span-1 space-y-6">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-28 bg-slate-800/50 rounded-xl border border-white/5 p-4"
                      >
                        <div className="h-5 w-20 bg-white/10 rounded mb-4" />
                        <div className="h-10 w-24 bg-blue-500/20 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section
        id="stats"
        className="relative z-10 py-20 border-y border-white/10 bg-white/5"
      >
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={fadeInUp} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                {stat.value}
              </div>
              <div className="text-gray-400 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-10 py-24 px-6 md:px-12 lg:px-20"
      >
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para operar
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Una suite completa de herramientas diseñadas para optimizar cada
              aspecto de tu operación logística.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30"
        >
          <HiOutlineGlobe className="w-16 h-16 mx-auto text-blue-400 mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comenzá a optimizar tu operación hoy
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Unite a cientos de empresas que ya confían en Atlas Transporte para
            gestionar su logística.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-gray-100 transition transform hover:scale-105"
          >
            <FcGoogle className="text-2xl" />
            Crear cuenta gratis
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <HiOutlineTruck className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">Atlas Transporte</span>
          </div>
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <a href="#" className="hover:text-white transition">
              Términos
            </a>
            <a href="#" className="hover:text-white transition">
              Privacidad
            </a>
            <a href="#" className="hover:text-white transition">
              Contacto
            </a>
          </div>
          <p className="text-gray-500 text-sm">
            © 2026 Atlas Transporte. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
