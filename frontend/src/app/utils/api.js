export async function apiFetch(url, options = {}) {
  let token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
  };

  let response = await fetch(url, { ...options, headers });

  // Si el token expiró o es inválido (403), intentamos refresh
  if (response.status === 403) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      return;
    }

    const { token: newToken } = await refreshRes.json();
    localStorage.setItem("token", newToken);
    token = newToken;

    // Reintentar la llamada original con el nuevo token
    const retryHeaders = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    response = await fetch(url, { ...options, headers: retryHeaders });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Error en la API");
  }

  return response.json();
}
