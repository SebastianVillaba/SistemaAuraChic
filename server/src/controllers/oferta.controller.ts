import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { logger } from '../utils/logger';

/**
 * Consulta el detalle temporal de oferta para una terminal web
 */
export const consultaDetOfertaTmp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idTerminalWeb } = req.query;
        if (!idTerminalWeb) {
            res.status(400).json({ success: false, message: 'El parámetro idTerminalWeb es obligatorio' });
            return;
        }

        const result = await executeRequest({
            query: 'sp_consultaDetOfertaTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: parseInt(idTerminalWeb as string) }
            ]
        });

        res.status(200).json({
            success: true,
            result: result.recordset
        });
    } catch (error: any) {
        logger.error('Error al consultar detalle temporal de oferta:', error);
        res.status(500).json({ success: false, message: 'Error al consultar detalle temporal de oferta', error: error.message });
    }
};

/**
 * Agrega un producto al detalle temporal de ofertas
 */
export const agregarDetOfertaTmp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idTerminalWeb, idProducto, precioDescuento, porcentajeDescuento, precioProducto } = req.body;

        if (!idTerminalWeb || !idProducto || precioDescuento === undefined || porcentajeDescuento === undefined || !precioProducto) {
            res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
            return;
        }

        await executeRequest({
            query: 'sp_agregarDetOfertaTmp',
            isStoredProcedure: true,
            inputs: [
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'idProducto', type: sql.Int, value: idProducto },
                { name: 'precioDescuento', type: sql.Money, value: precioDescuento },
                { name: 'porcentajeDescuento', type: sql.Decimal(5, 2), value: porcentajeDescuento },
                { name: 'precioProducto', type: sql.Money, value: precioProducto }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Producto agregado a la oferta temporal'
        });
    } catch (error: any) {
        logger.error('Error al agregar detalle temporal de oferta:', error);
        // Si es un error arrojado por RAISERROR del SP (como precio menor al costo)
        if (error.number >= 50000) {
            res.status(400).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Error al agregar detalle temporal de oferta', error: error.message });
        }
    }
};

/**
 * Elimina un producto individual del detalle temporal
 */
export const eliminarDetOfertaTmp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idDetOfertaTmp } = req.params;
        const { idTerminalWeb } = req.query;

        if (!idDetOfertaTmp || !idTerminalWeb) {
            res.status(400).json({ success: false, message: 'El idDetOfertaTmp y idTerminalWeb son obligatorios' });
            return;
        }

        await executeRequest({
            query: 'DELETE FROM dbo.detOfertaTmp WHERE idDetOfertaTmp = @idDetOfertaTmp AND idTerminalWeb = @idTerminalWeb',
            isStoredProcedure: false,
            inputs: [
                { name: 'idDetOfertaTmp', type: sql.Int, value: parseInt(idDetOfertaTmp) },
                { name: 'idTerminalWeb', type: sql.Int, value: parseInt(idTerminalWeb as string) }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Producto eliminado de la oferta temporal'
        });
    } catch (error: any) {
        logger.error('Error al eliminar producto de la oferta temporal:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar de la oferta temporal', error: error.message });
    }
};

/**
 * Guarda/impacta la oferta de forma definitiva
 */
export const guardarOferta = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idUsuarioAlta, idTerminalWeb, nombreOferta } = req.body;

        if (!idUsuarioAlta || !idTerminalWeb || !nombreOferta) {
            res.status(400).json({ success: false, message: 'Todos los campos cabecera son obligatorios' });
            return;
        }

        await executeRequest({
            query: 'sp_guardarOferta',
            isStoredProcedure: true,
            inputs: [
                { name: 'idUsuarioAlta', type: sql.Int, value: idUsuarioAlta },
                { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
                { name: 'nombreOferta', type: sql.VarChar(100), value: nombreOferta }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Oferta guardada exitosamente'
        });
    } catch (error: any) {
        logger.error('Error al guardar la oferta:', error);
        if (error.number >= 50000) {
            res.status(400).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Error al guardar la oferta', error: error.message });
        }
    }
};

/**
 * Consulta listado de ofertas guardadas
 */
export const listarOfertas = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activo } = req.query;
        let query = `
            SELECT 
                co.idOferta,
                co.nombreOferta,
                co.activo,
                co.fechaAlta,
                co.idUsuarioAlta,
                ua.username as usuarioAlta,
                co.fechaMod,
                co.idUsuarioMod,
                um.username as usuarioMod
            FROM cabOferta co
            LEFT JOIN usuario ua ON co.idUsuarioAlta = ua.idUsuario
            LEFT JOIN usuario um ON co.idUsuarioMod = um.idUsuario
        `;

        const inputs: any[] = [];
        if (activo !== undefined && activo !== '') {
            query += ` WHERE co.activo = @activo`;
            inputs.push({ name: 'activo', type: sql.Bit, value: activo === 'true' || activo === '1' });
        }

        query += ` ORDER BY co.fechaAlta DESC`;

        const result = await executeRequest({
            query,
            isStoredProcedure: false,
            inputs
        });

        res.status(200).json({
            success: true,
            result: result.recordset
        });
    } catch (error: any) {
        logger.error('Error al listar ofertas:', error);
        res.status(500).json({ success: false, message: 'Error al listar ofertas', error: error.message });
    }
};

/**
 * Consulta los detalles de una oferta específica
 */
export const obtenerDetalleOferta = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idOferta } = req.params;
        if (!idOferta) {
            res.status(400).json({ success: false, message: 'El ID de la oferta es requerido' });
            return;
        }

        const result = await executeRequest({
            query: `
                SELECT 
                    do.idDetOferta,
                    do.idOferta,
                    do.idProducto,
                    p.nombre as nombreProducto,
                    do.precioProducto,
                    do.porcentajeDescuento,
                    do.precioDescuento
                FROM detOferta do
                INNER JOIN producto p ON do.idProducto = p.idProducto
                WHERE do.idOferta = @idOferta
            `,
            isStoredProcedure: false,
            inputs: [
                { name: 'idOferta', type: sql.Int, value: parseInt(idOferta) }
            ]
        });

        res.status(200).json({
            success: true,
            result: result.recordset
        });
    } catch (error: any) {
        logger.error('Error al obtener detalles de la oferta:', error);
        res.status(500).json({ success: false, message: 'Error al obtener detalles de la oferta', error: error.message });
    }
};

/**
 * Desactiva una oferta
 */
export const desactivarOferta = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idOferta } = req.params;
        const { idUsuarioMod } = req.body;

        if (!idOferta || !idUsuarioMod) {
            res.status(400).json({ success: false, message: 'El idOferta e idUsuarioMod son requeridos' });
            return;
        }

        await executeRequest({
            query: `
                UPDATE cabOferta 
                SET activo = 0, idUsuarioMod = @idUsuarioMod, fechaMod = GETDATE() 
                WHERE idOferta = @idOferta
            `,
            isStoredProcedure: false,
            inputs: [
                { name: 'idOferta', type: sql.Int, value: parseInt(idOferta) },
                { name: 'idUsuarioMod', type: sql.Int, value: idUsuarioMod }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Oferta desactivada exitosamente'
        });
    } catch (error: any) {
        logger.error('Error al desactivar la oferta:', error);
        res.status(500).json({ success: false, message: 'Error al desactivar la oferta', error: error.message });
    }
};
