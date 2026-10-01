import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { sendError } from '../utils/errorResponse';

export const agregarDetalle = async (req: Request, res: Response) => {
    try {
        const { idTerminalWeb, idProducto, cantidad, costo } = req.body;

        if (!idTerminalWeb || !idProducto || !cantidad || costo === undefined) {
            return res.status(400).json({ message: 'Faltan datos requeridos (idTerminalWeb, idProducto, cantidad, costo)' });
        }

        await executeRequest({
            query: 'sp_agregarDetStockInicialTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idProducto', type: sql.Int, value: idProducto },
                { name: 'cantidad', type: sql.Numeric(10, 4), value: cantidad },
                { name: 'costo', type: sql.Money, value: costo }
            ]
        });

        return res.status(200).json({ message: 'Item agregado correctamente' });
    } catch (error: any) {
        sendError(res, error, 'Error al agregar item');
    }
};

export const eliminarDetalle = async (req: Request, res: Response) => {
    try {
        const { idTerminalWeb, idDetStockInicialTmp } = req.params;

        if (!idTerminalWeb || !idDetStockInicialTmp) {
            return res.status(400).json({ message: 'Faltan datos (idTerminalWeb, idDetStockInicialTmp)' });
        }

        await executeRequest({
            query: 'sp_eliminarDetStockInicialTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) },
                { name: 'idDetStockInicialTmp', type: sql.Int, value: Number(idDetStockInicialTmp) }
            ]
        });

        return res.status(200).json({ message: 'Item eliminado correctamente' });
    } catch (error: any) {
        sendError(res, error, 'Error al eliminar item');
    }
};

export const consultarDetalle = async (req: Request, res: Response) => {
    try {
        const { idTerminalWeb } = req.params;

        if (!idTerminalWeb) {
            return res.status(400).json({ message: 'Falta idTerminalWeb' });
        }

        const result = await executeRequest({
            query: 'sp_consultaDetStockInicialTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) }
            ]
        });

        return res.status(200).json(result.recordset);
    } catch (error: any) {
        sendError(res, error, 'Error al consultar detalle');
    }
};

export const guardarStockInicial = async (req: Request, res: Response) => {
    try {
        const { idUsuario, idTerminalWeb, idDeposito } = req.body;

        if (!idUsuario || !idTerminalWeb || !idDeposito) {
            return res.status(400).json({ message: 'Faltan datos (idUsuario, idTerminalWeb, idDeposito)' });
        }

        const result = await executeRequest({
            query: 'sp_guardarStockInicial',
            isStoredProcedure: true,
            inputs: [
                { name: 'idUsuario', type: sql.Int, value: idUsuario },
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idDeposito', type: sql.Int, value: idDeposito }
            ]
        });

        return res.status(200).json({
            message: 'Stock Inicial guardado correctamente',
            idGenerado: result.recordset[0]?.idGenerado
        });
    } catch (error: any) {
        sendError(res, error, 'Error al guardar stock inicial');
    }
};
