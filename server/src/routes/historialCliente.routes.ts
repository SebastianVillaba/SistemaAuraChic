import { Router } from 'express';
import {
  cargarHistorial,
  consultarHistorial,
  consultarDetalleVenta
} from '../controllers/historialCliente.controller';

const router = Router();

// Carga el histórico del cliente en la tabla temporal y lo devuelve
// POST /api/historial-cliente  { idTerminalWeb, idCliente }
router.post('/', cargarHistorial);

// Consulta el histórico ya cargado para la terminal
// GET /api/historial-cliente?idTerminalWeb=1
router.get('/', consultarHistorial);

// Consulta los productos vendidos en una venta del histórico
// GET /api/historial-cliente/detalle?idVenta=1&imp=1
router.get('/detalle', consultarDetalleVenta);

export default router;
