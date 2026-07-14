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
exports.UsuariosController = void 0;
const usuarios_service_1 = require("./usuarios.service");
const usuariosService = new usuarios_service_1.UsuariosService();
class UsuariosController {
    constructor() {
        // Obtener todos los usuarios
        this.getAll = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const usuarios = yield usuariosService.getAll();
            res.status(200).json({
                status: 'success',
                results: usuarios.length,
                data: usuarios,
            });
        });
        // Obtener usuario por ID
        this.getOne = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const usuario = yield usuariosService.getById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: usuario,
            });
        });
        // Obtener permisos por email (usado por NextAuth)
        this.getPermisosByEmail = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const email = req.params.email;
            const usuario = yield usuariosService.getByEmail(email);
            if (!usuario) {
                return res.status(200).json({
                    status: 'success',
                    data: { perfil: null, permisos: [] },
                });
            }
            res.status(200).json({
                status: 'success',
                data: {
                    perfil: usuario.perfil,
                    permisos: usuario.permisos,
                },
            });
        });
        // Sincronizar usuario desde Google OAuth
        this.sync = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email, nombre, imagen } = req.body;
            if (!email || !nombre) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email y nombre son requeridos',
                });
            }
            const usuario = yield usuariosService.syncFromGoogle({ email, nombre, imagen });
            res.status(200).json({
                status: 'success',
                data: usuario,
            });
        });
        // Asignar perfil a usuario
        this.asignarPerfil = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email, perfil } = req.body;
            if (!email || !perfil) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email y perfil son requeridos',
                });
            }
            const usuario = yield usuariosService.asignarPerfil(email, perfil);
            if (!usuario) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Usuario no encontrado',
                });
            }
            res.status(200).json({
                status: 'success',
                data: usuario,
            });
        });
        // Actualizar usuario
        this.update = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const usuario = yield usuariosService.update(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: usuario,
            });
        });
        // Eliminar usuario
        this.delete = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            yield usuariosService.delete(req.params.id);
            res.status(204).json({
                status: 'success',
                data: null,
            });
        });
    }
}
exports.UsuariosController = UsuariosController;
