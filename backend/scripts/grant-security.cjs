// Local bootstrap: npm run admin:grant -- usuario@empresa.com
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Indicá el email de un usuario que ya haya iniciado sesión');
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI');
  await mongoose.connect(process.env.MONGODB_URI);
  const users = mongoose.connection.collection('usuarios');
  const user = await users.findOne({ email });
  if (!user) throw new Error('Usuario no encontrado. Primero debe iniciar sesión con Google');
  const perfiles = [...new Set([...(user.perfiles?.length ? user.perfiles : user.perfil ? [user.perfil] : []), 'operador_seguridad'])];
  const permissions = { operador_logistico: ['dashboard', 'camiones', 'viajes', 'choferes', 'cotizador', 'empresas'], operador_administrativo: ['dashboard', 'cotizador', 'facturacion', 'empresas'], operador_seguridad: ['dashboard', 'configuracion'] };
  const result = await users.updateOne({ email }, {
    $set: { perfil: 'operador_seguridad', perfiles, permisos: [...new Set(perfiles.flatMap(profile => permissions[profile] || []))], activo: true, updatedAt: new Date() },
  });
  if (!result.matchedCount) throw new Error('Usuario no encontrado. Primero debe iniciar sesión con Google');
  console.log('Perfil de seguridad asignado. Volvé a iniciar sesión para actualizar los permisos.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
