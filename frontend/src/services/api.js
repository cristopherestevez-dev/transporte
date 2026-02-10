const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiService {
  async get(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const json = await res.json();
    return json.data;
  }

  async post(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const json = await res.json();
    return json.data;
  }

  async patch(endpoint, data) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const json = await res.json();
    return json.data;
  }

  async delete(endpoint) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204)
      throw new Error(`Error HTTP: ${res.status}`);
    return true;
  }

  // Dashboard
  async getStats() {
    return this.get("/dashboard/stats");
  }

  async getRecentTrips() {
    return this.get("/dashboard/recent-trips");
  }

  // Notifications
  async getNotifications() {
    return this.get("/notifications");
  }

  async markNotificationAsRead(id) {
    // Assuming marking as read might not return data, or returns a simple status
    // If the backend returns data, adjust this to return json.data
    return this.put(`/notifications/${id}/read`, {});
  }

  async clearNotifications() {
    return this.delete("/notifications");
  }

  // Proveedores
  async getProveedores() {
    return this.get("/proveedores");
  }

  async createProveedor(data) {
    return this.post("/proveedores", data);
  }

  async updateProveedor(id, data) {
    return this.patch(`/proveedores/${id}`, data);
  }

  async deleteProveedor(id) {
    return this.delete(`/proveedores/${id}`);
  }

  // Fleteros
  async getFleteros() {
    return this.get("/fleteros");
  }

  async createFletero(data) {
    return this.post("/fleteros", data);
  }

  async updateFletero(id, data) {
    return this.patch(`/fleteros/${id}`, data);
  }

  async deleteFletero(id) {
    return this.delete(`/fleteros/${id}`);
  }

  // Camiones
  async getCamiones() {
    return this.get("/camiones");
  }

  async createCamion(data) {
    return this.post("/camiones", data);
  }

  async updateCamion(id, data) {
    return this.patch(`/camiones/${id}`, data);
  }

  async deleteCamion(id) {
    return this.delete(`/camiones/${id}`);
  }

  // Semirremolques
  async getSemirremolques() {
    return this.get("/semirremolques");
  }

  async createSemirremolque(data) {
    return this.post("/semirremolques", data);
  }

  async updateSemirremolque(id, data) {
    return this.patch(`/semirremolques/${id}`, data);
  }

  async deleteSemirremolque(id) {
    return this.delete(`/semirremolques/${id}`);
  }

  // Choferes
  async getChoferes() {
    return this.get("/choferes");
  }

  async createChofer(data) {
    return this.post("/choferes", data);
  }

  async updateChofer(id, data) {
    return this.patch(`/choferes/${id}`, data);
  }

  async deleteChofer(id) {
    return this.delete(`/choferes/${id}`);
  }

  // Viajes Nacionales
  async getViajesNacionales() {
    return this.get("/viajes/nacionales");
  }

  async createViajeNacional(data) {
    return this.post("/viajes/nacionales", data);
  }

  async updateViajeNacional(id, data) {
    return this.patch(`/viajes/nacionales/${id}`, data);
  }

  async deleteViajeNacional(id) {
    return this.delete(`/viajes/nacionales/${id}`);
  }

  // Viajes Internacionales
  async getViajesInternacionales() {
    return this.get("/viajes/internacionales");
  }

  async createViajeInternacional(data) {
    return this.post("/viajes/internacionales", data);
  }

  async updateViajeInternacional(id, data) {
    return this.patch(`/viajes/internacionales/${id}`, data);
  }

  async deleteViajeInternacional(id) {
    return this.delete(`/viajes/internacionales/${id}`);
  }

  // Facturación - Cobranzas
  async getCobranzasNacionales() {
    return this.get("/facturacion/cobranzas/nacionales");
  }

  async getCobranzasInternacionales() {
    return this.get("/facturacion/cobranzas/internacionales");
  }

  async updateCobranzaNacional(id, data) {
    return this.patch(`/facturacion/cobranzas/nacionales/${id}`, data);
  }

  async updateCobranzaInternacional(id, data) {
    return this.patch(`/facturacion/cobranzas/internacionales/${id}`, data);
  }

  // Facturación - Pagos
  async getPagosNacionales() {
    return this.get("/facturacion/pagos/nacionales");
  }

  async getPagosInternacionales() {
    return this.get("/facturacion/pagos/internacionales");
  }

  async updatePagoNacional(id, data) {
    return this.patch(`/facturacion/pagos/nacionales/${id}`, data);
  }

  async updatePagoInternacional(id, data) {
    return this.patch(`/facturacion/pagos/internacionales/${id}`, data);
  }

  // Users
  async getUsers() {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const json = await res.json();
    return json.data.users;
  }

  // Mantenimiento
  async getMantenimiento(vehiculoId) {
    return this.get(`/mantenimiento/${vehiculoId}`);
  }

  async searchMantenimiento(vehiculoId, filters = {}) {
    const params = new URLSearchParams();
    if (filters.fecha) params.append("fecha", filters.fecha);
    if (filters.kmMin) params.append("kmMin", filters.kmMin);
    if (filters.kmMax) params.append("kmMax", filters.kmMax);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.get(`/mantenimiento/${vehiculoId}/search${query}`);
  }

  async createMantenimiento(vehiculoId, data) {
    return this.post(`/mantenimiento/${vehiculoId}`, data);
  }

  async updateMantenimiento(id, data) {
    return this.patch(`/mantenimiento/${id}`, data);
  }

  async deleteMantenimiento(id) {
    return this.delete(`/mantenimiento/${id}`);
  }
}

export const api = new ApiService();
export default api;
