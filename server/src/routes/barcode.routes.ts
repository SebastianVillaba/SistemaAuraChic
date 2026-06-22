import { Router } from 'express';
import {
  agregarAlTemp,
  consultarTemp,
  actualizarCantidadTemp,
  eliminarDelTemp,
  limpiarTemp,
  guardarCodigosGenerados
} from '../controllers/barcode.controller';

const router = Router();

router.post('/temp', agregarAlTemp);
router.get('/temp', consultarTemp);
router.put('/temp', actualizarCantidadTemp);
router.delete('/temp/:idStock', eliminarDelTemp);
router.delete('/temp', limpiarTemp);
router.post('/save-generated', guardarCodigosGenerados);

export default router;
