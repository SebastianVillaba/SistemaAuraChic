import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';

export const agregarDetalle = async (req: Request, res: Response) => {
    try {
        const { idTerminalWeb, idProducto, idDeposito, cantidad, costo, costoTotal, precio } = req.body;

        if (!idTerminalWeb || !idProducto || !idDeposito || cantidad === undefined || costo === undefined || costoTotal === undefined || precio === undefined) {
            return res.status(400).json({ message: 'Faltan datos requeridos (idTerminalWeb, idProducto, idDeposito, cantidad, costo, costoTotal, precio)' });
        }

        await executeRequest({
            query: 'sp_agregarDetCargaProductoTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idProducto', type: sql.Int, value: idProducto },
                { name: 'idDeposito', type: sql.Int, value: idDeposito },
                { name: 'cantidad', type: sql.Int, value: cantidad },
                { name: 'costo', type: sql.Money, value: costo },
                { name: 'costoTotal', type: sql.Money, value: costoTotal },
                { name: 'precio', type: sql.Money, value: precio }
            ]
        });

        return res.status(200).json({ message: 'Detalle agregado correctamente' });
    } catch (error: any) {
        console.error('Error en agregarDetalle:', error);
        return res.status(500).json({ message: error.message || 'Error al agregar detalle' });
    }
};

export const consultarDetalle = async (req: Request, res: Response) => {
    try {
        const { idTerminalWeb } = req.params;

        if (!idTerminalWeb) {
            return res.status(400).json({ message: 'Falta idTerminalWeb' });
        }

        const result = await executeRequest({
            query: 'sp_consultaDetCargaProductoTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) }
            ]
        });

        return res.status(200).json(result.recordset);
    } catch (error: any) {
        console.error('Error en consultarDetalle:', error);
        return res.status(500).json({ message: error.message || 'Error al consultar detalles' });
    }
};

export const eliminarDetalle = async (req: Request, res: Response) => {
    try {
        const { idTerminalWeb, nro } = req.params;

        if (!idTerminalWeb || !nro) {
            return res.status(400).json({ message: 'Faltan datos requeridos (idTerminalWeb, nro)' });
        }

        // Al no existir procedimiento almacenado sp_eliminarDetCargaProductoTmp, se realiza una consulta directa.
        await executeRequest({
            query: 'DELETE FROM detCargaProductoTmp WHERE idTerminalWeb = @idTerminalWeb AND nro = @nro',
            isStoredProcedure: false,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) },
                { name: 'nro', type: sql.Numeric(18, 0), value: Number(nro) }
            ]
        });

        return res.status(200).json({ message: 'Detalle eliminado correctamente' });
    } catch (error: any) {
        console.error('Error en eliminarDetalle:', error);
        return res.status(500).json({ message: error.message || 'Error al eliminar detalle' });
    }
};

export const guardarCarga = async (req: Request, res: Response) => {
    try {
        const { idTerminalWeb, idUsuarioAlta } = req.body;

        if (!idTerminalWeb || !idUsuarioAlta) {
            return res.status(400).json({ message: 'Faltan datos requeridos (idTerminalWeb, idUsuarioAlta)' });
        }

        const result = await executeRequest({
            query: 'sp_guardarCargaProducto',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idUsuarioAlta', type: sql.Int, value: idUsuarioAlta }
            ]
        });

        return res.status(200).json({
            message: 'Carga de productos guardada correctamente',
            result: result.recordset
        });
    } catch (error: any) {
        console.error('Error en guardarCarga:', error);
        return res.status(500).json({ message: error.message || 'Error al guardar la carga' });
    }
};
