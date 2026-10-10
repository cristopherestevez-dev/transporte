import { getToken } from "next-auth/jwt";
import { backendUrl, backendHeaders } from "@/lib/backend";

export const dynamic = "force-dynamic";

async function proxy(request, { params }) {
  const origin = request.headers.get("origin");
  if (!["GET", "HEAD"].includes(request.method) && origin && origin !== new URL(request.url).origin) {
    return Response.json({ message: "Origen no permitido" }, { status: 403 });
  }
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.email) return Response.json({ message: "Iniciá sesión para continuar" }, { status: 401 });
  const path = params.path.map(encodeURIComponent).join("/");
  if (path === "usuarios/sync" || path === "usuarios/login" || path.startsWith("usuarios/permisos/")) {
    return Response.json({ message: "Operación no permitida" }, { status: 403 });
  }
  try {
    const response = await fetch(`${backendUrl()}/${path}${new URL(request.url).search}`, {
      method: request.method,
      headers: backendHeaders(token.email, "session", token.perfil || undefined),
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
      cache: "no-store",
      redirect: "error",
    });
    return new Response(response.status === 204 ? null : await response.arrayBuffer(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Backend request failed:", error.message);
    return Response.json({ message: "No se pudo conectar con el servidor" }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
