import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { sendError } from '../utils/errorResponse';

export const getCobranzasPendientes = async (req: Request, res: Response) => {
    const { idCliente } = req.query;

    try {
        const result = await executeRequest({
            query: 'sp_consultaCobranzaPendiente',
            isStoredProcedure: true,
            inputs: [
                { name: 'idCliente', type: sql.Int, value: Number(idCliente) }
            ]
        });
        res.status(200).json(result.recordset);
    } catch (error) {
        sendError(res, error, 'Error al consultar cobranzas pendientes');
    }
};

export const agregarDetPrecobranzaTmp = async (req: Request, res: Response) => {
    const { idTerminalWeb, idPedido } = req.body;

    try {
        await executeRequest({
            query: 'sp_agregarDetPrecobranzaTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idPedido', type: sql.Int, value: idPedido }
            ]
        });
        res.status(200).json({ message: 'Detalle de precobranza agregado correctamente.' });
    } catch (error) {
        sendError(res, error, 'Error al agregar detalle de precobranza temporal');
    }
};

export const consultarDetPrecobranzaTmp = async (req: Request, res: Response) => {
    const { idTerminalWeb } = req.query;

    try {
        const result = await executeRequest({
            query: 'sp_consultaDetCobranzaTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) }
            ]
        });
        res.status(200).json(result.recordset);
    } catch (error) {
        sendError(res, error, 'Error al consultar detalle de precobranza temporal');
    }
};

export const eliminarDetPrecobranzaTmp = async (req: Request, res: Response) => {
    const { idTerminalWeb, idDetPrecobranzaTmp } = req.query;

    try {
        await executeRequest({
            query: 'sp_eliminarDetPrecobranzaTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) },
                { name: 'idDetPrecobranzaTmp', type: sql.Int, value: Number(idDetPrecobranzaTmp) }
            ]
        });
        res.status(200).json({ message: 'Detalle de precobranza eliminado correctamente.' });
    } catch (error) {
        sendError(res, error, 'Error al eliminar detalle de precobranza temporal');
    }
};

export const guardarPrecobranza = async (req: Request, res: Response) => {
    const { idUsuarioAlta, idTerminalWeb, idDelivery, idCliente } = req.body;

    try {
        const result = await executeRequest({
            query: 'sp_guardarPrecobranza',
            isStoredProcedure: true,
            inputs: [
                { name: 'idUsuarioAlta', type: sql.Int, value: idUsuarioAlta },
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idDelivery', type: sql.Int, value: idDelivery },
                { name: 'idCliente', type: sql.Int, value: idCliente }
            ]
        });
        res.status(200).json({ message: 'Precobranza guardada correctamente.', idPrecobranza: result.recordset[0].idPrecobranza });
    } catch (error) {
        sendError(res, error, 'Error al guardar precobranza');
    }
};
