import { createHmac } from "node:crypto";

export const backendUrl = () => {
  const url = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  if (!/^https?:\/\//.test(url)) throw new Error("Configurá BACKEND_API_URL con la URL absoluta del backend");
  return url.replace(/\/$/, "");
};

export function backendToken(email, purpose = "session", perfil) {
  if (!process.env.JWT_SECRET) throw new Error("Falta JWT_SECRET en el servidor frontend");
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const content = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ email, purpose, perfil, iat: now, exp: now + 60, iss: "transporte-frontend", aud: "transporte-api" })}`;
  return `${content}.${createHmac("sha256", process.env.JWT_SECRET).update(content).digest("base64url")}`;
}

export function backendHeaders(email, purpose, perfil) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${backendToken(email, purpose, perfil)}` };
}
