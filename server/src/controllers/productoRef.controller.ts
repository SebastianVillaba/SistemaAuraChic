import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';

/**
 * Carga las referencias de un producto existente en la tabla temporal.
 */
export const cargarReferenciasTmp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idTerminalWeb, idProductoRef } = req.body;

        if (!idTerminalWeb || !idProductoRef) {
            res.status(400).json({ success: false, message: 'Faltan datos obligatorios (idTerminalWeb, idProductoRef)' });
            return;
        }

        await executeRequest({
            query: 'sp_cargarProductoRefTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) },
                { name: 'idProductoRef', type: sql.Int, value: Number(idProductoRef) }
            ]
        });

        res.status(200).json({ success: true, message: 'Referencias cargadas en la tabla temporal correctamente' });
    } catch (error: any) {
        console.error('Error en cargarReferenciasTmp:', error);
        res.status(500).json({ success: false, message: 'Error al cargar referencias en la temporal', error: error.message });
    }
};

/**
 * Consulta el detalle temporal de productos referenciados para una terminal.
 */
export const obtenerDetallesTmp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idTerminalWeb } = req.query;

        if (!idTerminalWeb) {
            res.status(400).json({ success: false, message: 'El parámetro idTerminalWeb es obligatorio' });
            return;
        }

        const result = await executeRequest({
            query: 'sp_consultaDetProductoRefTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) }
            ]
        });

        res.status(200).json({
            success: true,
            result: result.recordset
        });
    } catch (error: any) {
        console.error('Error en obtenerDetallesTmp:', error);
        res.status(500).json({ success: false, message: 'Error al consultar detalles de la temporal', error: error.message });
    }
};

/**
 * Agrega un producto referenciado al detalle temporal.
 */
export const agregarDetalleTmp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idTerminalWeb, idProducto, cantidad } = req.body;

        if (!idTerminalWeb || !idProducto || cantidad === undefined || Number(cantidad) <= 0) {
            res.status(400).json({ success: false, message: 'Todos los campos son obligatorios y cantidad debe ser mayor a 0' });
            return;
        }

        await executeRequest({
            query: 'sp_agregarDetProductoRefTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) },
                { name: 'idProducto', type: sql.Int, value: Number(idProducto) },
                { name: 'cantidad', type: sql.Int, value: Number(cantidad) }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Producto agregado a referencias temporales'
        });
    } catch (error: any) {
        console.error('Error en agregarDetalleTmp:', error);
        res.status(500).json({ success: false, message: 'Error al agregar producto a la temporal', error: error.message });
    }
};

/**
 * Elimina un producto individual del detalle temporal por nro.
 */
export const eliminarDetalleTmp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nro } = req.params;
        const { idTerminalWeb } = req.query;

        if (!nro || !idTerminalWeb) {
            res.status(400).json({ success: false, message: 'El nro y idTerminalWeb son obligatorios' });
            return;
        }

        await executeRequest({
            query: 'DELETE FROM dbo.detProductoRefTmp WHERE idTerminalWeb = @idTerminalWeb AND nro = @nro',
            isStoredProcedure: false,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) },
                { name: 'nro', type: sql.Int, value: Number(nro) }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Producto eliminado de referencias temporales'
        });
    } catch (error: any) {
        console.error('Error en eliminarDetalleTmp:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto de la temporal', error: error.message });
    }
};

/**
 * Guarda las referencias temporales a la tabla persistida.
 */
export const guardarReferencias = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idUsuarioAlta, idTerminalWeb, idProductoRef } = req.body;

        if (!idUsuarioAlta || !idTerminalWeb || !idProductoRef) {
            res.status(400).json({ success: false, message: 'Faltan datos requeridos (idUsuarioAlta, idTerminalWeb, idProductoRef)' });
            return;
        }

        const result = await executeRequest({
            query: 'sp_guardarProductoRef',
            isStoredProcedure: true,
            inputs: [
                { name: 'idUsuarioAlta', type: sql.Int, value: Number(idUsuarioAlta) },
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) },
                { name: 'idProductoRef', type: sql.Int, value: Number(idProductoRef) }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Productos referenciados guardados correctamente',
            result: result.recordset
        });
    } catch (error: any) {
        console.error('Error en guardarReferencias:', error);
        if (error.number >= 50000) {
            res.status(400).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Error al guardar referencias en la base de datos', error: error.message });
        }
    }
};

/**
 * Limpia la tabla temporal de productos referenciados para una terminal.
 */
export const limpiarTemporal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idTerminalWeb } = req.body;

        if (!idTerminalWeb) {
            res.status(400).json({ success: false, message: 'El campo idTerminalWeb es obligatorio' });
            return;
        }

        await executeRequest({
            query: 'DELETE FROM dbo.detProductoRefTmp WHERE idTerminalWeb = @idTerminalWeb',
            isStoredProcedure: false,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: Number(idTerminalWeb) }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Temporal de productos referenciados limpiada correctamente'
        });
    } catch (error: any) {
        console.error('Error en limpiarTemporal:', error);
        res.status(500).json({ success: false, message: 'Error al limpiar temporal', error: error.message });
    }
};
