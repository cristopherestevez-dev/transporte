import { Router } from 'express';
import { AuthRequest, requirePermission } from '../../shared/middleware/authMiddleware';
import { AppError } from '../../shared/errors/AppError';
import { companyScope, listRules, writeRule, NotificationRule, notificationOptions } from './notifications.rules';
import { NotificationDelivery, cancelUnavailableDeliveries } from './notifications.delivery';

const router = Router();
router.use(requirePermission('configuracion'));
router.use((req: AuthRequest, res, next) => {
    if (req.user?.role !== 'operador_seguridad' || !req.user.empresaId) return next(new AppError('Seleccioná Seguridad de empresa para administrar notificaciones', 403));
    next();
});
router.get('/', async (req, res, next) => {
    try { res.json({ status: 'success', data: { rules: await listRules(), events: notificationOptions, mobilePending: await NotificationDelivery.countDocuments({ empresaId: companyScope(), status: 'pending' }) } }); }
    catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
    try { res.status(201).json({ status: 'success', data: await writeRule(undefined, req.body) }); }
    catch (error) { next(error); }
});
router.put('/:id', async (req, res, next) => {
    try {
        const rule = await writeRule(req.params.id, req.body);
        await cancelUnavailableDeliveries(rule!.type);
        res.json({ status: 'success', data: rule });
    }
    catch (error) { next(error); }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const rule = await NotificationRule.findOneAndUpdate({ _id: req.params.id, empresaId: companyScope() }, { $set: { active: false } });
        if (!rule) throw new AppError('Regla no encontrada', 404);
        await cancelUnavailableDeliveries(rule.type);
        res.status(204).send();
    } catch (error) { next(error); }
});
export default router;
