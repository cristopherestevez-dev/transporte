import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Sincronizar usuario con backend
      try {
        const res = await fetch(`${API_URL}/usuarios/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            nombre: user.name,
            imagen: user.image,
          }),
        });
        if (!res.ok) {
          console.error("Error syncing user with backend");
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      // Obtener permisos del backend
      if (token.email) {
        try {
          const res = await fetch(
            `${API_URL}/usuarios/permisos/${token.email}`,
          );
          if (res.ok) {
            const data = await res.json();
            token.perfil = data.data?.perfil || null;
            token.permisos = data.data?.permisos || [];
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.image = token.picture;
      session.user.perfil = token.perfil;
      session.user.permisos = token.permisos || [];
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
