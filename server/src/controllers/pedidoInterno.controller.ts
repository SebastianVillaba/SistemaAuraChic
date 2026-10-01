import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { sendError } from '../utils/errorResponse';

interface IAgregarDetallePedidoInternoDTO {
    idTerminalWeb: number;
    idProducto: number;
    cantidadSolicitada: number;
}

interface IGuardarPedidoInternoDTO {
    idUsuario: number;
    idTerminalWeb: number;
    idSucursalProveedor: number;
    fechaNecesaria: string;
    observacion: string;
}

export const agregarDetPedidoInternoTmp = async (req: Request,res: Response) => {
    const {
        idTerminalWeb,
        idProducto,
        cantidadSolicitada
    }: IAgregarDetallePedidoInternoDTO = req.body;

    try {
        await executeRequest({
            query: 'sp_agregarDetPedidoInternoTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idProducto', type: sql.Int, value: idProducto },
                { name: 'cantidadSolicitada', type: sql.Numeric(10, 4), value: cantidadSolicitada }
            ]
        });
        res.status(200).json({ message: 'Detalle de pedido interno agregado correctamente.' });
    } catch (error: any) {
        sendError(res, error, 'Error al agregar detalle');
    }
}

export const eliminarDetPedidoInternoTmp = async (req: Request,res: Response) => {
    const { 
        idTerminalWeb,
        idDetPedidoInternoTmp
    } = req.body;
    try {
        await executeRequest({
            query: 'sp_eliminarDetPedidoInternoTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idDetPedidoInternoTmp', type: sql.Int, value: idDetPedidoInternoTmp }
            ]
        });
        res.status(200).json({ message: 'Detalle de pedido interno eliminado correctamente.' });
    } catch (error: any) {
        sendError(res, error, 'Error al eliminar detalle');
    }
}

export const guardarPedidoInterno = async (req: Request, res: Response) => {
    const {
        idUsuario,
        idTerminalWeb,
        idSucursalProveedor,
        fechaNecesaria,
        observacion
    }: IGuardarPedidoInternoDTO = req.body;
    try {
        const result = await executeRequest({
            query: 'sp_guardarPedidoInterno',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idSucursalProveedor', type: sql.Int, value: idSucursalProveedor },
                { name: 'fechaNecesaria', type: sql.VarChar, value: fechaNecesaria },
                { name: 'idUsuario', type: sql.Int, value: idUsuario },
                { name: 'observacion', type: sql.VarChar, value: observacion }
            ]
        });
        res.status(200).json({ message: 'Pedido interno guardado correctamente.', data: result.recordset });
    } catch (error: any) {
        sendError(res, error, 'Error al guardar pedido interno');
    }
}

export const consultaPedidosInternosRecibidos = async (req: Request, res: Response) => {
    try {
        const result = await executeRequest({
            query: 'sp_consultaPedidosInternosRecibidos',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: req.query.idTerminalWeb }
            ]
        })
        res.status(200).json(result.recordset);
    } catch (error: any) {
        sendError(res, error, 'Error al consultar pedidos internos pendientes');
    }
}

export const consultaDetPedidoInternoTmp = async (req: Request, res: Response) => {
    try {
        const result = await executeRequest({
            query: 'sp_consultaDetPedidoInternoTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: req.query.idTerminalWeb }
            ]
        })
        res.status(200).json(result.recordset);
    } catch (error: any) {
        sendError(res, error, 'Error al consultar detalles de pedido interno temporal');
    }
}

export const consultaDetPedidoInternoEntrante = async (req: Request, res: Response) => {
    try {
        const result = await executeRequest({
            query: 'sp_consultaDetPedidosInternosEntrantes',
            isStoredProcedure: true,
            inputs: [
                { name: 'idPedidoInterno', type: sql.Int, value: req.query.idPedidoInterno }
            ]
        })
        res.status(200).json(result.recordset);
    } catch (error: any) {
        sendError(res, error, 'Error al consultar detalles de pedido interno entrante');
    }
}


export const consultaSucursales = async (req: Request, res: Response) => {
    try {
        const result = await executeRequest({
            query: `select * from [dbo].[funSucursalesActivos] (2)`,
            isStoredProcedure: false
        })
        res.status(200).json(result.recordset);
    } catch (error: any) {
        sendError(res, error, 'Error al consultar sucursales');
    }
}