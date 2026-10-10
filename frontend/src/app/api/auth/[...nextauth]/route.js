import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { backendUrl, backendHeaders } from "@/lib/backend";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Usuario y contraseña",
      credentials: { email: { label: "Usuario o email", type: "text" }, password: { label: "Contraseña", type: "password" } },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || typeof password !== "string" || password.length > 128) return null;
        const response = await fetch(`${backendUrl()}/usuarios/login`, {
          method: "POST", headers: backendHeaders(email, "login"), body: JSON.stringify({ email, password }), cache: "no-store",
        });
        if (response.status === 429) throw new Error("Demasiados intentos. Intentá nuevamente en unos minutos");
        if (!response.ok) return null;
        const data = await response.json();
        return data.data;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider !== "google" || profile?.email_verified !== true) return false;
      // Sincronizar usuario con backend
      try {
        const res = await fetch(`${backendUrl()}/usuarios/sync`, {
          method: "POST",
          headers: backendHeaders(user.email, "sync"),
          body: JSON.stringify({
            email: user.email,
            nombre: user.name,
            imagen: user.image,
          }),
        });
        if (!res.ok) {
          const failure = await res.json().catch(() => ({}));
          console.error("Google sync rejected:", res.status, failure.message || "Sin detalle");
          return `/login?error=${res.status >= 500 ? 'BackendUnavailable' : 'AccountDisabled'}`;
        }
      } catch (error) {
        console.error("Error syncing user:", error.message);
        return "/login?error=BackendUnavailable";
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      // Obtener permisos del backend
      if (token.email) {
        try {
          const res = await fetch(
            `${backendUrl()}/usuarios/permisos/${encodeURIComponent(token.email)}`,
            { headers: backendHeaders(token.email), cache: "no-store" },
          );
          if (res.ok) {
            const data = await res.json();
            token.empresaId = data.data?.empresaId || null;
            token.empresaNombre = data.data?.empresaNombre || null;
            token.empresaActiva = data.data?.empresaActiva;
            token.empresaEstado = data.data?.empresaEstado;
            token.estado = data.data?.estado || "aprobado";
            token.perfilLabels = data.data?.perfilLabels || {};
            token.perfiles = data.data?.perfiles || [];
            const requested = trigger === "update" && typeof session?.perfil === "string" ? session.perfil : token.perfil;
            token.perfil = token.perfiles.includes(requested) ? requested : token.perfiles.includes(token.perfil) ? token.perfil : token.perfiles.includes(data.data?.perfil) ? data.data.perfil : token.perfiles[0] || null;
            token.permisos = data.data?.permisosPorPerfil?.[token.perfil] || [];
            token.activo = data.data?.activo === true;
          } else { token.activo = false; token.permisos = []; token.perfiles = []; token.perfil = null; }
        } catch (error) {
          token.activo = false; token.permisos = []; token.perfiles = []; token.perfil = null;
          console.error("Error fetching permissions:", error.message);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.picture;
      session.user.empresaId = token.empresaId;
      session.user.empresaNombre = token.empresaNombre;
      session.user.empresaActiva = token.empresaActiva;
      session.user.empresaEstado = token.empresaEstado;
      session.user.estado = token.estado;
      session.user.perfilLabels = token.perfilLabels || {};
      session.user.perfil = token.perfil;
      session.user.perfiles = token.activo ? token.perfiles || [] : [];
      session.user.permisos = token.activo ? token.permisos || [] : [];
      session.user.activo = token.activo === true;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
