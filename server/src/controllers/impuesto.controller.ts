import { Request, Response } from "express";
import { executeRequest, sql } from "../utils/dbHandler";
import { sendError } from '../utils/errorResponse';

export const consultaImpuesto = async (req: Request, res: Response): Promise<void> => {
    try {

        const result = await executeRequest({
            query: 'select idImpuesto,nombreImpuesto from impuesto',
            isStoredProcedure: false
        });

        res.status(200).json({
            success: true,
            result: result.recordset
        });
    } catch (error: any) {
        sendError(res, error, 'Error al obtener información del impuesto');
    }
};