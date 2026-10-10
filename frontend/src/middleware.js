import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { firstAllowedRoute, isCompanySuspended } from "@/lib/access.mjs";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Rutas públicas que no requieren autenticación
  // Incluimos /landing y /login
  const publicRoutes = ["/landing", "/login", "/registro", "/api/auth"];
  const isStatic = pathname.startsWith("/_next") || pathname.includes(".");
  const suspended = isCompanySuspended(token);
  if (suspended && !['/servicio-suspendido', '/landing'].includes(pathname) && !pathname.startsWith('/api/') && !isStatic) return NextResponse.redirect(new URL('/servicio-suspendido', req.url));
  if (pathname === "/registro" && !token) return NextResponse.redirect(new URL("/login", req.url));
  const needsCompany = token && !token.empresaId && !(token.perfiles || [token.perfil]).includes("superadmin");
  const pending = token && (token.estado === "pendiente" || token.estado === "rechazado" || token.activo === false || needsCompany);
  if (pending && !suspended && !["/registro", "/landing"].includes(pathname) && !pathname.startsWith("/api/") && !isStatic) return NextResponse.redirect(new URL("/registro", req.url));
  const home = firstAllowedRoute(token?.permisos || []);
  if (token && !pending && pathname === '/servicio-suspendido') return NextResponse.redirect(new URL(home, req.url));
  if (token && !pending && ((pathname === "/dashboard" && !token.permisos?.includes("dashboard")) || pathname === "/registro")) return NextResponse.redirect(new URL(home, req.url));

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // 1. Si el usuario está logueado y va a /login, redirigir a /dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL(home, req.url));
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
