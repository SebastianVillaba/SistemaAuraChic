import { Request, Response } from "express";
import { executeRequest, sql } from "../utils/dbHandler";
import { sendError } from '../utils/errorResponse';
import { ConsultarAuditoriaRequest } from "../types/auditoria.type";

/**
 * Controller para consultar la auditoría.
 */
export const consultarAuditoria = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombreTabla, fechaDesde, fechaHasta } = req.query as unknown as ConsultarAuditoriaRequest;

        const inputs = [
            { name: 'nombreTabla', type: sql.VarChar(50), value: nombreTabla || null },
            { name: 'fechaDesde', type: sql.DateTime, value: fechaDesde || null },
            { name: 'fechaHasta', type: sql.DateTime, value: fechaHasta || null }
        ];

        const result = await executeRequest({
            query: 'sp_consultarAuditoria',
            inputs: inputs as any,
            isStoredProcedure: true
        });

        res.status(200).json({
            success: true,
            result: result.recordset
        });
    } catch (error: any) {
        sendError(res, error, 'Error al consultar la auditoría');
    }
};
