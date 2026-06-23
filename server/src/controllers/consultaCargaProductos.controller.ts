import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';

/**
 * Consulta información detallada de una carga de producto (cabecera + detalle).
 * Ejecuta sp_consultaInformacionCargaProducto.
 * Retorna además los IDs límites y adyacentes para la navegación.
 * 
 * Query params: idCargaProducto (opcional, si no se pasa, busca la última)
 */
export const consultaInformacionCarga = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCargaProducto } = req.query as { idCargaProducto?: string };
    let activeId: number;

    if (!idCargaProducto) {
      // Obtener el ID de carga de producto más reciente
      const maxResult = await executeRequest({
        query: 'SELECT MAX(idCargaProducto) AS maxId FROM cabCargaProducto'
      });
      const maxId = maxResult.recordset[0]?.maxId;

      if (!maxId) {
        res.status(200).json({
          success: true,
          cabecera: null,
          detalle: [],
          navigation: { idMin: null, idMax: null, idPrev: null, idNext: null }
        });
        return;
      }
      activeId = maxId;
    } else {
      activeId = parseInt(idCargaProducto, 10);
      if (isNaN(activeId)) {
        res.status(400).json({
          success: false,
          message: "El parámetro 'idCargaProducto' debe ser un número válido"
        });
        return;
      }
    }

    // Ejecutar SP de consulta
    const result = await executeRequest({
      query: 'sp_consultaInformacionCargaProducto',
      isStoredProcedure: true,
      inputs: [
        { name: 'idCargaProducto', type: sql.Int, value: activeId }
      ]
    });

    const recordsets = result.recordsets as any[];
    const cabecera = recordsets[0]?.length > 0 ? recordsets[0][0] : null;
    const detalle = recordsets[1] || [];

    // Obtener información de navegación en una sola consulta
    const navResult = await executeRequest({
      query: `
        SELECT 
          (SELECT MIN(idCargaProducto) FROM cabCargaProducto) AS idMin,
          (SELECT MAX(idCargaProducto) FROM cabCargaProducto) AS idMax,
          (SELECT MAX(idCargaProducto) FROM cabCargaProducto WHERE idCargaProducto < @currentId) AS idPrev,
          (SELECT MIN(idCargaProducto) FROM cabCargaProducto WHERE idCargaProducto > @currentId) AS idNext
      `,
      inputs: [
        { name: 'currentId', type: sql.Int, value: activeId }
      ]
    });

    const navigation = navResult.recordset[0] || { idMin: null, idMax: null, idPrev: null, idNext: null };

    res.status(200).json({
      success: true,
      cabecera,
      detalle,
      navigation
    });

  } catch (error: any) {
    console.error('Error al consultar información de carga de producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al consultar la información de la carga de producto',
      error: error.message
    });
  }
};

/**
 * Busca cargas de productos por rango de fechas o por ID específico.
 * 
 * Query params: desde (date), hasta (date), idCargaProducto (opcional)
 */
export const buscarCargas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { desde, hasta, idCargaProducto } = req.query as { desde?: string; hasta?: string; idCargaProducto?: string };

    if (idCargaProducto) {
      const parsedId = parseInt(idCargaProducto, 10);
      if (isNaN(parsedId)) {
        res.status(400).json({
          success: false,
          message: "El 'idCargaProducto' provisto no es válido"
        });
        return;
      }

      const result = await executeRequest({
        query: `
          SELECT 
            cabC.idCargaProducto, 
            u.nombre as responsableCarga, 
            cabC.fechaAlta as fechaCarga, 
            cabC.activo,
            ca.explica as motivoAnula,
            ca.fechaAlta as fechaAnula
          FROM cabCargaProducto cabC 
          INNER JOIN v_usuarioT u ON u.idUsuario = cabC.idUsuarioAlta 
          left join cabAnulado ca on ca.idMovimiento=cabC.idCargaProducto and ca.tipo='CARGA'
          WHERE cabC.idCargaProducto = @idCargaProducto
        `,
        inputs: [
          { name: 'idCargaProducto', type: sql.Int, value: parsedId }
        ]
      });

      res.status(200).json({
        success: true,
        result: result.recordset
      });
      return;
    }

    if (!desde || !hasta) {
      res.status(400).json({
        success: false,
        message: "Los parámetros 'desde' y 'hasta' son requeridos cuando no se especifica 'idCargaProducto'"
      });
      return;
    }

    const result = await executeRequest({
      query: `
        SELECT TOP 100 
          cabC.idCargaProducto, 
          u.nombre as responsableCarga, 
          cabC.fechaAlta as fechaCarga, 
          cabC.activo,
          ca.explica as motivoAnula,
          ca.fechaAlta as fechaAnula
        FROM cabCargaProducto cabC 
        INNER JOIN v_usuarioT u ON u.idUsuario = cabC.idUsuarioAlta 
        left join cabAnulado ca on ca.idMovimiento=cabC.idCargaProducto and ca.tipo='CARGA'
        WHERE cabC.fechaAlta BETWEEN @desde AND @hasta
        ORDER BY cabC.idCargaProducto DESC
      `,
      inputs: [
        { name: 'desde', type: sql.VarChar(50), value: `${desde} 00:00:00` },
        { name: 'hasta', type: sql.VarChar(50), value: `${hasta} 23:59:59` }
      ]
    });

    res.status(200).json({
      success: true,
      result: result.recordset
    });

  } catch (error: any) {
    console.error('Error al buscar cargas de productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar cargas de productos',
      error: error.message
    });
  }
};
