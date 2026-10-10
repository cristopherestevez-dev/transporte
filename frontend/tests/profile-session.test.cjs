const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../backend/node_modules/typescript');

function callbacks(data) {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/api/auth/[...nextauth]/route.js'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, process: { env: {} }, console,
    require: (name) => {
      if (name === 'next-auth') return { default: () => () => {} };
      if (name === 'next-auth/providers/google') return { default: () => ({}) };
      if (name === '@/lib/backend') return { backendUrl: () => 'http://mock/api', backendHeaders: () => ({}) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    fetch: async () => ({ ok: true, json: async () => ({ data }) }),
  });
  return exports.authOptions.callbacks;
}

test('session updates select an assigned profile without trusting supplied permissions', async () => {
  const cb = callbacks({ activo: true, perfiles: ['operador_logistico', 'operador_administrativo'], permisosPorPerfil: { operador_logistico: ['viajes'], operador_administrativo: ['facturacion'] } });
  const result = await cb.jwt({ token: { email: 'test@example.com', perfil: 'operador_logistico' }, trigger: 'update', session: { perfil: 'operador_administrativo', permisos: ['configuracion'] } });
  assert.equal(result.perfil, 'operador_administrativo');
  assert.deepEqual(result.permisos, ['facturacion']);
  const forged = await cb.jwt({ token: result, trigger: 'update', session: { perfil: 'operador_seguridad' } });
  assert.equal(forged.perfil, 'operador_administrativo');
  assert.deepEqual(forged.permisos, ['facturacion']);
});

test('revoking the selected profile falls back to a remaining assignment', async () => {
  const cb = callbacks({ activo: true, perfiles: ['operador_logistico'], permisosPorPerfil: { operador_logistico: ['viajes'] } });
  const result = await cb.jwt({ token: { email: 'test@example.com', perfil: 'operador_administrativo', permisos: ['facturacion'] } });
  assert.equal(result.perfil, 'operador_logistico');
  assert.deepEqual(result.permisos, ['viajes']);
  const session = await cb.session({ session: { user: {} }, token: result });
  assert.equal(session.user.perfil, 'operador_logistico');
  assert.deepEqual(session.user.perfiles, ['operador_logistico']);
});
