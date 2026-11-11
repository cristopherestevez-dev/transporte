"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./contexts/AuthContext";

export function Providers({ children }) {
  return (
    <SessionProvider refetchInterval={60} refetchOnWindowFocus>
      <AuthProvider>
          <NextThemesProvider attribute="class" defaultTheme="light">
            {children}
          </NextThemesProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
