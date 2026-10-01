import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { sendError } from '../utils/errorResponse';

export const getDenominacionActivo = async (req: Request, res: Response) => {
    try {
        const result = await executeRequest({
            query: 'select * from denominacion where activo=1',
            isStoredProcedure: false
        });
        res.status(200).json(result.recordset);
    } catch (error) {
        sendError(res, error, 'Error al consultar denominacion activo');
    }
};  
