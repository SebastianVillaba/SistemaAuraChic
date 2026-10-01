import { Request, Response } from 'express';
import { executeRequest, sql } from '../utils/dbHandler';
import { sendError } from '../utils/errorResponse';

const consultarTmp = async (idTerminalWeb: number) => {
  const result = await executeRequest({
    isStoredProcedure: true,
    query: 'sp_consultaTmpHistoricoCliente',
    inputs: [{ name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb }]
  });
  return result.recordset;
};


/**
 * Carga el histórico del cliente en la tabla temporal de la terminal y lo devuelve.
 * Llama a sp_agregarTmpHistoricoCliente y luego a sp_consultaTmpHistoricoCliente.
 *
 * Body: idTerminalWeb (int), idCliente (int)
 */
export const cargarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { idTerminalWeb, idCliente } = req.body;

  if (!idTerminalWeb || !idCliente) {
    res.status(400).json({ success: false, message: 'Faltan parámetros obligatorios: idTerminalWeb, idCliente' });
    return;
  }

  try {
    await executeRequest({
      isStoredProcedure: true,
      query: 'sp_agregarTmpHistoricoCliente',
      inputs: [
        { name: 'idTerminalWeb', type: sql.Int, value: idTerminalWeb },
        { name: 'idCliente', type: sql.Int, value: idCliente }
      ]
    });

    const result = await consultarTmp(idTerminalWeb);
    res.status(200).json({ success: true, result });
  } catch (error: any) {
    sendError(res, error, 'Error al cargar el historial del cliente');
  }
};

/**
 * Consulta el histórico ya cargado en la tabla temporal de la terminal.
 * Llama a sp_consultaTmpHistoricoCliente.
 *
 * Query params: idTerminalWeb (int)
 */
export const consultarHistorial = async (req: Request, res: Response): Promise<void> => {
  const { idTerminalWeb } = req.query;

  if (!idTerminalWeb) {
    res.status(400).json({ success: false, message: 'El parámetro idTerminalWeb es obligatorio' });
    return;
  }

  try {
    const result = await consultarTmp(parseInt(idTerminalWeb as string));
    res.status(200).json({ success: true, result });
  } catch (error: any) {
    sendError(res, error, 'Error al consultar el historial del cliente');
  }
};

/**
 * Consulta los productos vendidos en una venta del histórico.
 * Llama a sp_consultaDetVentaHistoricoTmp.
 *
 * Query params: idVenta (int), imp (bit: 1=impreso, 0=remito)
 */
export const consultarDetalleVenta = async (req: Request, res: Response): Promise<void> => {
  const { idVenta, imp } = req.query as { idVenta?: string; imp?: string };

  if (!idVenta || imp === undefined || imp === null) {
    res.status(400).json({ success: false, message: "Los parámetros 'idVenta' e 'imp' son obligatorios" });
    return;
  }

  try {
    const result = await executeRequest({
      isStoredProcedure: true,
      query: 'sp_consultaDetVentaHistoricoTmp',
      inputs: [
        { name: 'idVenta', type: sql.Int, value: parseInt(idVenta) },
        { name: 'imp', type: sql.Bit, value: imp === 'true' || imp === '1' }
      ]
    });

    res.status(200).json({ success: true, result: result.recordset });
  } catch (error: any) {
    sendError(res, error, 'Error al consultar el detalle de la venta');
  }
};
