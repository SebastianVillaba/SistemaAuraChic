import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { sendError } from '../utils/errorResponse';

export const consultaSectoresActivos = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await executeRequest({
            query: 'select * from sector where activo=1',
            isStoredProcedure: false
        });
        res.status(200).json(result);
    } catch (error) {
        sendError(res, error, 'Error al consultar sectores activos');
    }
};