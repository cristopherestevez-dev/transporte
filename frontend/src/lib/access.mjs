const sectionOrder = ['dashboard', 'mis-viajes', 'mi-camion', 'empresas', 'camiones', 'viajes', 'choferes', 'cotizador', 'facturacion', 'configuracion'];
export function permissionForPath(pathname) {
  const section = pathname.split(/[?#]/)[0].split('/')[1];
  return section === 'balance' ? 'facturacion' : section;
}
export function firstAllowedRoute(permisos = []) {
  const section = sectionOrder.find(value => permisos.includes(value));
  return section ? `/${section}` : '/sin-acceso';
}
export function destinationForProfile(permisos, pathname) {
  return permisos.includes(permissionForPath(pathname)) ? pathname : firstAllowedRoute(permisos);
}
export function isCompanySuspended(user) {
  return !!user?.empresaId && user.empresaActiva === false && !['pendiente', 'rechazada'].includes(user.empresaEstado);
}
