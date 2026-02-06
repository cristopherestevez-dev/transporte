import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Rutas públicas que no requieren autenticación
  // Incluimos /landing y /login
  const publicRoutes = ["/landing", "/login", "/api/auth"];

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // 1. Si el usuario está logueado y va a /login, redirigir a /dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Si el usuario NO está logueado y ruta NO es pública (y no es estático), redirigir a /login
  // Excluimos archivos estáticos (/_next, images, favicon)
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico";

  if (!token && !isPublicRoute && !isStaticAsset) {
    // Si intenta entrar a dashboard u otras rutas protegidas sin sesión
    // Nota: / redirige a /landing en page.jsx, así que permitimos que pase
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
