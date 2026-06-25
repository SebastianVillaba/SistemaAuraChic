import { Router } from 'express';
import {
  consultaArqueoFecha,
  consultaArqueoNroCaja,
  consultaInformacionArqueo
} from '../controllers/consultaArqueo.controller';

const router = Router();

// Consulta arqueos por rango de fechas
// GET /api/consulta-arqueo/fecha?desde=2026-01-01&hasta=2026-06-25
router.get('/fecha', consultaArqueoFecha);

// Consulta arqueos por número de caja
// GET /api/consulta-arqueo/nro-caja?nroCaja=1
router.get('/nro-caja', consultaArqueoNroCaja);

// Consulta información detallada de un arqueo (cabecera + desgloses de gastos, tarjetas, etc.)
// GET /api/consulta-arqueo/informacion?idMovimientoCaja=1
router.get('/informacion', consultaInformacionArqueo);

export default router;
