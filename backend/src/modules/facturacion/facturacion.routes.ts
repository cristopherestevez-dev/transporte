import { paginationMiddleware } from '../../shared/pagination';
import { Router } from 'express';
import {
    cobranzasNacionalesController,
    cobranzasInternacionalesController,
    pagosNacionalesController,
    pagosInternacionalesController
} from './facturacion.controller';
import { asyncHandler } from '../../shared/asyncHandler';

import { validateBody } from '../../shared/middleware/validationMiddleware';
import { CreateFacturacionSchema, UpdateFacturacionSchema } from './facturacion.dto';

const router = Router();

// Cobranzas Nacionales
router.get('/cobranzas/nacionales', paginationMiddleware, asyncHandler(cobranzasNacionalesController.getAll));
router.get('/cobranzas/nacionales/:id', asyncHandler(cobranzasNacionalesController.getOne));
router.post('/cobranzas/nacionales', validateBody(CreateFacturacionSchema), asyncHandler(cobranzasNacionalesController.create));
router.patch('/cobranzas/nacionales/:id', validateBody(UpdateFacturacionSchema), asyncHandler(cobranzasNacionalesController.update));
router.delete('/cobranzas/nacionales/:id', asyncHandler(cobranzasNacionalesController.delete));

// Cobranzas Internacionales
router.get('/cobranzas/internacionales', paginationMiddleware, asyncHandler(cobranzasInternacionalesController.getAll));
router.get('/cobranzas/internacionales/:id', asyncHandler(cobranzasInternacionalesController.getOne));
router.post('/cobranzas/internacionales', validateBody(CreateFacturacionSchema), asyncHandler(cobranzasInternacionalesController.create));
router.patch('/cobranzas/internacionales/:id', validateBody(UpdateFacturacionSchema), asyncHandler(cobranzasInternacionalesController.update));
router.delete('/cobranzas/internacionales/:id', asyncHandler(cobranzasInternacionalesController.delete));

// Pagos Nacionales
router.get('/pagos/nacionales', paginationMiddleware, asyncHandler(pagosNacionalesController.getAll));
router.get('/pagos/nacionales/:id', asyncHandler(pagosNacionalesController.getOne));
router.post('/pagos/nacionales', validateBody(CreateFacturacionSchema), asyncHandler(pagosNacionalesController.create));
router.patch('/pagos/nacionales/:id', validateBody(UpdateFacturacionSchema), asyncHandler(pagosNacionalesController.update));
router.delete('/pagos/nacionales/:id', asyncHandler(pagosNacionalesController.delete));

// Pagos Internacionales
router.get('/pagos/internacionales', paginationMiddleware, asyncHandler(pagosInternacionalesController.getAll));
router.get('/pagos/internacionales/:id', asyncHandler(pagosInternacionalesController.getOne));
router.post('/pagos/internacionales', validateBody(CreateFacturacionSchema), asyncHandler(pagosInternacionalesController.create));
router.patch('/pagos/internacionales/:id', validateBody(UpdateFacturacionSchema), asyncHandler(pagosInternacionalesController.update));
router.delete('/pagos/internacionales/:id', asyncHandler(pagosInternacionalesController.delete));

export const facturacionRoutes = router;
