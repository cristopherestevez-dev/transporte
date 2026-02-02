import { Request, Response, NextFunction } from 'express';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { FleterosService } from '../fleteros/fleteros.service';
import { CamionesService } from '../camiones/camiones.service';
import { SemirremolquesService } from '../semirremolques/semirremolques.service';
import { ChoferesService } from '../choferes/choferes.service';
import { viajesNacionalesService, viajesInternacionalesService } from '../viajes/viajes.service';
import { UsersService } from '../users/users.service';

const proveedoresService = new ProveedoresService();
const fleterosService = new FleterosService();
const camionesService = new CamionesService();
const semirremolquesService = new SemirremolquesService();
const choferesService = new ChoferesService();
const usersService = new UsersService();

export class DashboardController {
    getStats = async (req: Request, res: Response, next: NextFunction) => {
        const [
            proveedores,
            fleteros,
            camiones,
            semirremolques,
            choferes,
            viajesNacionales,
            viajesInternacionales,
            users
        ] = await Promise.all([
            proveedoresService.count(),
            fleterosService.count(),
            camionesService.count(),
            semirremolquesService.count(),
            choferesService.count(),
            viajesNacionalesService.count(),
            viajesInternacionalesService.count(),
            usersService.countUsers()
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                proveedores,
                fleteros,
                camiones,
                semirremolques,
                choferes,
                viajes: viajesNacionales + viajesInternacionales,
                viajesNacionales,
                viajesInternacionales,
                users
            }
        });
    };

    getRecentTrips = async (req: Request, res: Response, next: NextFunction) => {
        const [nacionales, internacionales] = await Promise.all([
            viajesNacionalesService.getAll(),
            viajesInternacionalesService.getAll()
        ]);

        const allTrips = [
            ...nacionales.map(v => ({ ...v.toObject(), type: 'nacional' })),
            ...internacionales.map(v => ({ ...v.toObject(), type: 'internacional' }))
        ]
            .sort((a, b) => new Date(b.fecha_salida || 0).getTime() - new Date(a.fecha_salida || 0).getTime())
            .slice(0, 5);

        res.status(200).json({
            status: 'success',
            data: allTrips
        });
    };
}
