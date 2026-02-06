"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "./contexts/AuthContext";

export function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <HeroUIProvider>
          <NextThemesProvider attribute="class" defaultTheme="light">
            {children}
          </NextThemesProvider>
        </HeroUIProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
