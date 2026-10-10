import { Request, Response, NextFunction } from 'express';
import { ProveedoresService } from '../proveedores/proveedores.service';
import { FleterosService } from '../fleteros/fleteros.service';
import { CamionesService } from '../camiones/camiones.service';
import { SemirremolquesService } from '../semirremolques/semirremolques.service';
import { ChoferesService } from '../choferes/choferes.service';
import { viajesNacionalesService, viajesInternacionalesService } from '../viajes/viajes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { viajesPage } from '../viajes/viajes.page';

const proveedoresService = new ProveedoresService();
const fleterosService = new FleterosService();
const camionesService = new CamionesService();
const semirremolquesService = new SemirremolquesService();
const choferesService = new ChoferesService();
const usuariosService = new UsuariosService();

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
            usuariosService.count()
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
        const result = await viajesPage();
        res.status(200).json({
            status: 'success',
            data: result.items
        });
    };
}
