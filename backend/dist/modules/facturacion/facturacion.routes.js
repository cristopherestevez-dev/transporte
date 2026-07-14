"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facturacionRoutes = void 0;
const express_1 = require("express");
const facturacion_controller_1 = require("./facturacion.controller");
const asyncHandler_1 = require("../../shared/asyncHandler");
const router = (0, express_1.Router)();
// Cobranzas Nacionales
router.get('/cobranzas/nacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasNacionalesController.getAll));
router.get('/cobranzas/nacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasNacionalesController.getOne));
router.post('/cobranzas/nacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasNacionalesController.create));
router.patch('/cobranzas/nacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasNacionalesController.update));
router.delete('/cobranzas/nacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasNacionalesController.delete));
// Cobranzas Internacionales
router.get('/cobranzas/internacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasInternacionalesController.getAll));
router.get('/cobranzas/internacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasInternacionalesController.getOne));
router.post('/cobranzas/internacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasInternacionalesController.create));
router.patch('/cobranzas/internacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasInternacionalesController.update));
router.delete('/cobranzas/internacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.cobranzasInternacionalesController.delete));
// Pagos Nacionales
router.get('/pagos/nacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosNacionalesController.getAll));
router.get('/pagos/nacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosNacionalesController.getOne));
router.post('/pagos/nacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosNacionalesController.create));
router.patch('/pagos/nacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosNacionalesController.update));
router.delete('/pagos/nacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosNacionalesController.delete));
// Pagos Internacionales
router.get('/pagos/internacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosInternacionalesController.getAll));
router.get('/pagos/internacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosInternacionalesController.getOne));
router.post('/pagos/internacionales', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosInternacionalesController.create));
router.patch('/pagos/internacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosInternacionalesController.update));
router.delete('/pagos/internacionales/:id', (0, asyncHandler_1.asyncHandler)(facturacion_controller_1.pagosInternacionalesController.delete));
exports.facturacionRoutes = router;
