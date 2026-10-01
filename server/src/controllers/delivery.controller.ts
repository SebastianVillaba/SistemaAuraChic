import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { sendError } from '../utils/errorResponse';

export const getDeliveryActivo = async (req: Request, res: Response) => {
    try {
        const result = await executeRequest({
            query: 'sp_consultaDeliveryActivo',
            isStoredProcedure: true,
            inputs: [ { name: 'idTerminalWeb', type: sql.Int, value: 1 } ]
        });
        res.status(200).json(result.recordset);
    } catch (error) {
        sendError(res, error, 'Error al consultar delivery activo');
    }
};
