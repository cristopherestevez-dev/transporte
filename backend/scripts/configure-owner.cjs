// Explicit one-time setup of the platform owner and an existing company master.
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const mongoose = require('mongoose');
async function main() {
  const [ownerEmail, masterEmail] = process.argv.slice(2).map(value => value.toLowerCase());
  if (!ownerEmail || !masterEmail || ownerEmail === masterEmail) throw new Error('Indicá emails distintos para el dueño y el administrador de empresa');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const users = mongoose.connection.collection('usuarios');
    const owner = await users.findOne({ email: ownerEmail });
    const master = await users.findOne({ email: masterEmail });
    if (!owner || !master) throw new Error('Las dos cuentas deben existir');
    if (!master.empresaId) throw new Error('Seleccioná la empresa del administrador antes de configurar el dueño');
    const companies = mongoose.connection.collection('empresasOperadoras');
    const company = await companies.findOne({ _id: new mongoose.Types.ObjectId(master.empresaId) });
    if (!company) throw new Error('La empresa del administrador no existe');
    if (await users.findOne({ email: { $ne: ownerEmail }, $or: [{ perfil: 'superadmin' }, { perfiles: 'superadmin' }] })) throw new Error('Ya existe otra cuenta Superadmin. Revisá la configuración antes de continuar');
    await users.updateOne({ _id: owner._id }, { $set: { perfil: 'superadmin', perfiles: ['superadmin'], permisos: ['configuracion'], estado: 'aprobado', activo: true, updatedAt: new Date() }, $unset: { empresaId: '', choferId: '' } });
    const profiles = [...new Set([...(master.perfiles?.length ? master.perfiles : master.perfil ? [master.perfil] : []), 'operador_seguridad'])].filter(value => value !== 'superadmin');
    await users.updateOne({ _id: master._id }, { $set: { perfiles: profiles, perfil: 'operador_seguridad', activo: true, estado: 'aprobado', updatedAt: new Date() } });
    await companies.updateOne({ _id: company._id }, { $set: { administradorId: master._id.toString(), updatedAt: new Date() } });
    const envFile = path.resolve('.env.local');
    const previous = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
    const content = previous.replace(/^SUPERADMIN_EMAIL=.*(?:\r?\n|$)/gm, '').trimEnd() + `\nSUPERADMIN_EMAIL=${ownerEmail}\n`;
    fs.writeFileSync(envFile, content);
    console.log(`Superadmin: ${ownerEmail}. Administrador de ${company.nombre}: ${masterEmail}.`);
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
