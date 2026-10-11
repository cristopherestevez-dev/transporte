# Notificaciones automáticas por empresa

Seguridad de empresa administra múltiples reglas por evento: licencias, seguros,
cobranzas, pagos y cambios de estado de viaje. Las reglas iniciales mantienen
las alertas existentes y habilitan cambios de viaje para perfiles con permiso
de Viajes. Permiten cambiar nombre, destinatarios, canales y estado activo.
La baja es lógica para impedir que la inicialización recree reglas eliminadas.

Las reglas permiten seleccionar perfiles activos o Todos los perfiles, incluidos futuros perfiles. La entrega exige permiso para la vista.
Las preferencias personales se guardan por usuario, empresa y perfil. La
campana respeta reglas activas, destinatarios, permiso actual, canal web y
preferencias personales. No hay avisos manuales ni eventos arbitrarios:
agregar un nuevo evento requiere instrumentar su origen en el backend.

## Cambios de estado de viajes

Se guarda el estado y un evento pendiente en la misma actualización del viaje,
con control de concurrencia. Un cambio sin transición no genera evento.
El servicio intenta procesarlo inmediatamente; una consulta de notificaciones
reintenta eventos pendientes. La alerta usa el identificador del evento para
evitar duplicados. Los cambios históricos anteriores no se reconstruyen.
La alerta abre el detalle nacional o internacional correspondiente.

## Preparación para las apps móviles

El canal móvil guarda entregas en NotificationDelivery por usuario y perfil,
con título, mensaje, tipo y ruta. La clave única evita duplicados. Estados:
pending, sent, failed y cancelled. Desactivar una preferencia o dar de baja una
regla cancela las entregas pendientes aplicables.

No se envía push todavía. Para las apps se debe implementar:

- Registro autenticado de dispositivos y tokens por usuario; desvinculación al
  cerrar sesión y eliminación de tokens inválidos.
- Un worker periódico independiente de la campana para eventos y vencimientos.
- Integración con el proveedor elegido para Android/iOS y manejo de credenciales.
- Revalidación antes del envío de empresa activa, usuario activo, perfil asignado,
  permisos, regla activa, canal y preferencias; las entregas sin permiso se cancelan.
- Reintentos con backoff y actualización de attempts, availableAt y status.
- Apertura del recurso mediante enlace de la app, validando acceso nuevamente;
  si el perfil activo no corresponde, ofrecer un perfil asignado autorizado.

Hasta incorporar ese worker, los vencimientos se generan al consultar la
campana y las entregas móviles permanecen pendientes. El ABM muestra esta
limitación y el número de entregas pendientes.

## Actualización de múltiples reglas

Se admite más de una regla por evento. Antes de desplegar sobre una base con la versión anterior, reemplazar el índice único notificationrules.empresaId_1_type_1 por un índice no único con las mismas columnas. La base local ya fue actualizada sin borrar reglas. Todos los perfiles se evalúa dinámicamente e incluye perfiles futuros; la entrega sigue exigiendo permisos actuales. Las reglas coincidentes se combinan sin duplicar la alerta ni la entrega móvil.


Las preferencias de la ruedita muestran el nombre y el identificador de cada regla, y se guardan individualmente. Las preferencias antiguas por tipo se conservan hasta que el usuario guarda la selección por reglas. Una nueva regla aparece al abrir la configuración, siempre sujeta al permiso de acceso.

