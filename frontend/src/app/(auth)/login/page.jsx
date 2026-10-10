"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { Logo } from "@/app/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    const messages = { AccessDenied: 'No se pudo validar tu cuenta. El backend debe estar disponible para ingresar con Google. Intentá nuevamente.', BackendUnavailable: 'No se pudo conectar con el backend. Verificá que esté iniciado e intentá nuevamente.', AccountDisabled: 'Tu cuenta está inactiva o fue rechazada. Contactá al administrador de tu empresa.' };
    if (code) setError(messages[code] || 'No se pudo iniciar sesión. Intentá nuevamente.');
  }, []);
  const handlePasswordLogin = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
      if (result?.ok) { setPassword(""); router.replace("/dashboard"); router.refresh(); }
      else { setError(result?.error === "CredentialsSignin" ? "Usuario o contraseña incorrectos" : "No se pudo iniciar sesión. Intentá nuevamente en unos minutos."); setSaving(false); }
    } catch { setError("No se pudo conectar con el servidor"); setSaving(false); }
  };
  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* Background decorations matching Landing */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="p-8 flex flex-col items-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-2"
          >
            <Logo
              width={350}
              height={200}
              className="text-white"
              forceWhite={true}
              layout="vertical"
            />
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-10"
          >
            <p className="text-gray-200 text-lg font-medium tracking-wide">
              Sistema de gestión logística integral
            </p>
          </motion.div>

          <form onSubmit={handlePasswordLogin} className="w-full space-y-4 mb-6">
            <label className="grid gap-1 text-sm text-gray-200">Usuario o email
              <input required type="text" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-[10px] bg-white/10 border border-white/10 text-white px-3 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40" />
            </label>
            <label className="grid gap-1 text-sm text-gray-200">Contraseña
              <input required type="password" autoComplete="current-password" maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-[10px] bg-white/10 border border-white/10 text-white px-3 py-3 outline-none focus:ring-2 focus:ring-cyan-400/40" />
            </label>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button disabled={saving} className="w-full rounded-[10px] bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 disabled:opacity-60">{saving ? "Ingresando…" : "Ingresar"}</button>
          </form>
          <div className="flex items-center gap-3 w-full text-xs text-gray-400 mb-5"><span className="h-px bg-white/10 flex-1" />O continuá con<span className="h-px bg-white/10 flex-1" /></div>
          {/* Botón de Google */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300"
          >
            <FcGoogle className="text-3xl" />
            <span className="text-lg">Continuar con Google</span>
          </motion.button>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-gray-500 text-sm mt-8"
          >
            Al continuar, aceptás nuestros términos y condiciones
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
