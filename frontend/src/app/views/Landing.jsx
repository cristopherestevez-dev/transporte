"use client";
import { Calculator, ChartColumn, ClipboardList, FileText, Globe, ShieldCheck, Truck, UsersRound, Zap } from "lucide-react";


import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/app/components/ui/Button/button";

import { FcGoogle } from "react-icons/fc";
import { Logo } from "@/app/components/ui/Logo";
import { Copyright } from "@/app/components/ui/AppFooter";
import "../globals.css";

const tripSteps = [
  { label: "Cotizá", icon: Calculator },
  { label: "Asigná", icon: Truck },
  { label: "Seguí", icon: Globe },
  { label: "Facturá", icon: FileText },
];

const supportEmail = "soporte@atlasops.com.ar";

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
    icon: Truck,
    title: "Gestión de Flota",
    description: "Control total de camiones, semirremolques y mantenimientos",
  },
  {
    icon: ClipboardList,
    title: "Viajes en Tiempo Real",
    description: "Seguimiento de viajes nacionales e internacionales",
  },
  {
    icon: ChartColumn,
    title: "Dashboard Inteligente",
    description: "Métricas y KPIs de tu operación logística",
  },
  {
    icon: Calculator,
    title: "Cotizador Integrado",
    description: "Cotizaciones rápidas y precisas para tus clientes",
  },
  {
    icon: FileText,
    title: "Facturación Automática",
    description: "Gestión de cobranzas y pagos simplificada",
  },
  {
    icon: UsersRound,
    title: "Gestión de Equipo",
    description: "Choferes, fleteros y proveedores en un solo lugar",
  },
];

export default function LandingView() {
  const [copyMessage, setCopyMessage] = useState("");

  async function copySupportEmail() {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopyMessage("Correo copiado.");
    } catch {
      setCopyMessage("Copiá la dirección manualmente.");
    }
  }
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
          <Logo
            width={280}
            height={75}
            className="text-white"
            forceWhite={true}
          />
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-gray-300 hover:text-white transition"
          >
            Funcionalidades
          </a>
          <a href="#nosotros" className="text-gray-300 transition hover:text-white">Nosotros</a>
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
            <Zap className="w-4 h-4" />
            Plataforma de gestión logística
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

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-12 max-w-5xl md:mt-16"
        >
          <div className="relative isolate overflow-hidden rounded-2xl border border-blue-300/20 bg-slate-950/60 px-6 py-7 shadow-2xl shadow-black/40 sm:px-8 sm:py-10">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/15 via-transparent to-cyan-400/10" />
            <ol aria-label="Recorrido de un viaje" className="relative mx-auto grid max-w-sm grid-cols-1 gap-5 sm:max-w-none sm:grid-cols-4 sm:gap-0">
              <li aria-hidden="true" className="pointer-events-none absolute bottom-7 left-7 top-7 w-px -translate-x-1/2 border-l-2 border-dashed border-cyan-300/45 sm:inset-x-[12.5%] sm:bottom-auto sm:top-8 sm:h-px sm:w-auto sm:translate-x-0 sm:border-l-0 sm:border-t-2" />
              {tripSteps.map(({ label, icon: Icon }) => (
                <li key={label} className="relative flex items-center gap-4 sm:flex-col sm:gap-3">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/35 bg-slate-900 text-cyan-200 shadow-lg shadow-blue-950/60 sm:size-16">
                    <Icon className="size-6 sm:size-7" aria-hidden="true" />
                  </span>
                  <span className="text-base font-semibold text-slate-100">{label}</span>
                </li>
              ))}
            </ol>
          </div>
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

      <section id="nosotros" aria-labelledby="nosotros-title" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold text-cyan-300">Nosotros</p>
          <h2 id="nosotros-title" className="text-3xl font-bold tracking-tight md:text-5xl">Cada viaje, en una sola operación</h2>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Nuestro objetivo es que las empresas de transporte puedan seguir cada viaje desde la cotización hasta la facturación. Con Atlas Ops, tu equipo puede consultar qué está en ruta, qué unidad está asignada y qué falta por cerrar desde el mismo lugar.
          </p>
        </div>
        <dl className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <dt className="text-xl font-semibold text-white">Misión</dt>
            <dd className="mt-3 leading-relaxed text-slate-300">Simplificar el trabajo diario de choferes, operadores y administración con herramientas que conecten la ruta con la oficina.</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <dt className="text-xl font-semibold text-white">Visión</dt>
            <dd className="mt-3 leading-relaxed text-slate-300">Ser una plataforma de referencia para las empresas de transporte de Argentina y la región que quieren crecer con una operación ordenada.</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <dt className="text-xl font-semibold text-white">Valores</dt>
            <dd className="mt-3 leading-relaxed text-slate-300">Claridad para tomar decisiones, responsabilidad con los datos y cercanía con quienes hacen el trabajo todos los días.</dd>
          </div>
        </dl>
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
          <Globe className="w-16 h-16 mx-auto text-blue-400 mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comenzá a optimizar tu operación hoy
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Gestioná tus viajes, tu flota y tu facturación desde Atlas Ops.
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
            <Logo
              width={180}
              height={50}
              className="text-white"
              forceWhite={true}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400 text-sm">
            <Link href="/terminos" className="hover:text-white transition">Términos</Link>
            <Link href="/privacidad" className="hover:text-white transition">Privacidad</Link>
            <a href="#nosotros" className="hover:text-white transition">Nosotros</a>
            <div className="flex flex-col items-center gap-1 text-center">
              <span>Atención al cliente</span>
              <a href={`mailto:${supportEmail}`} className="transition hover:text-white">
                {supportEmail}
              </a>
              <Button
                native
                type="button"
                onClick={copySupportEmail}
                className="cursor-pointer underline underline-offset-4 hover:text-white"
              >
                Copiar correo
              </Button>
              <span role="status" className="min-h-5 text-sm">{copyMessage}</span>
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            <Copyright />
          </div>
        </div>
      </footer>
    </div>
  );
}
