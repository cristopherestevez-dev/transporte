import { Router } from 'express';
import {
    cobranzasNacionalesController,
    cobranzasInternacionalesController,
    pagosNacionalesController,
    pagosInternacionalesController
} from './facturacion.controller';
import { asyncHandler } from '../../shared/asyncHandler';

const router = Router();

// Cobranzas Nacionales
router.get('/cobranzas/nacionales', asyncHandler(cobranzasNacionalesController.getAll));
router.get('/cobranzas/nacionales/:id', asyncHandler(cobranzasNacionalesController.getOne));
router.post('/cobranzas/nacionales', asyncHandler(cobranzasNacionalesController.create));
router.patch('/cobranzas/nacionales/:id', asyncHandler(cobranzasNacionalesController.update));
router.delete('/cobranzas/nacionales/:id', asyncHandler(cobranzasNacionalesController.delete));

// Cobranzas Internacionales
router.get('/cobranzas/internacionales', asyncHandler(cobranzasInternacionalesController.getAll));
router.get('/cobranzas/internacionales/:id', asyncHandler(cobranzasInternacionalesController.getOne));
router.post('/cobranzas/internacionales', asyncHandler(cobranzasInternacionalesController.create));
router.patch('/cobranzas/internacionales/:id', asyncHandler(cobranzasInternacionalesController.update));
router.delete('/cobranzas/internacionales/:id', asyncHandler(cobranzasInternacionalesController.delete));

// Pagos Nacionales
router.get('/pagos/nacionales', asyncHandler(pagosNacionalesController.getAll));
router.get('/pagos/nacionales/:id', asyncHandler(pagosNacionalesController.getOne));
router.post('/pagos/nacionales', asyncHandler(pagosNacionalesController.create));
router.patch('/pagos/nacionales/:id', asyncHandler(pagosNacionalesController.update));
router.delete('/pagos/nacionales/:id', asyncHandler(pagosNacionalesController.delete));

// Pagos Internacionales
router.get('/pagos/internacionales', asyncHandler(pagosInternacionalesController.getAll));
router.get('/pagos/internacionales/:id', asyncHandler(pagosInternacionalesController.getOne));
router.post('/pagos/internacionales', asyncHandler(pagosInternacionalesController.create));
router.patch('/pagos/internacionales/:id', asyncHandler(pagosInternacionalesController.update));
router.delete('/pagos/internacionales/:id', asyncHandler(pagosInternacionalesController.delete));

export const facturacionRoutes = router;
