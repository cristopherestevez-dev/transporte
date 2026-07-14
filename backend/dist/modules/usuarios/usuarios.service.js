"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuariosService = void 0;
const usuarios_model_1 = require("./usuarios.model");
class UsuariosService {
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return usuarios_model_1.Usuario.find().sort({ createdAt: -1 });
        });
    }
    getByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return usuarios_model_1.Usuario.findOne({ email: email.toLowerCase() });
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return usuarios_model_1.Usuario.findById(id);
        });
    }
    // Sincronizar usuario desde Google OAuth
    syncFromGoogle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const email = data.email.toLowerCase();
            let usuario = yield usuarios_model_1.Usuario.findOne({ email });
            if (!usuario) {
                // Crear nuevo usuario sin permisos (pendiente de asignación)
                usuario = yield usuarios_model_1.Usuario.create({
                    email,
                    nombre: data.nombre,
                    imagen: data.imagen,
                    perfil: null,
                    permisos: [],
                    activo: true,
                });
            }
            else {
                // Actualizar nombre e imagen
                usuario.nombre = data.nombre;
                if (data.imagen)
                    usuario.imagen = data.imagen;
                yield usuario.save();
            }
            return usuario;
        });
    }
    // Asignar perfil y permisos
    asignarPerfil(email, perfil) {
        return __awaiter(this, void 0, void 0, function* () {
            const permisos = usuarios_model_1.PERMISOS_POR_PERFIL[perfil] || [];
            return usuarios_model_1.Usuario.findOneAndUpdate({ email: email.toLowerCase() }, {
                perfil,
                permisos,
            }, { new: true });
        });
    }
    // Actualizar permisos personalizados
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Si se cambia el perfil, actualizar permisos automáticamente
            if (data.perfil) {
                data.permisos = usuarios_model_1.PERMISOS_POR_PERFIL[data.perfil] || [];
            }
            return usuarios_model_1.Usuario.findByIdAndUpdate(id, data, { new: true });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return usuarios_model_1.Usuario.findByIdAndDelete(id);
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            return usuarios_model_1.Usuario.countDocuments();
        });
    }
}
exports.UsuariosService = UsuariosService;
