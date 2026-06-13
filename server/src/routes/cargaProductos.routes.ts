import { Router } from 'express';
import { agregarDetalle, consultarDetalle, eliminarDetalle, guardarCarga } from '../controllers/cargaProductos.controller';

const router = Router();

router.post('/detalle', agregarDetalle);
router.get('/detalle/:idTerminalWeb', consultarDetalle);
router.delete('/detalle/:idTerminalWeb/:nro', eliminarDetalle);
router.post('/guardar', guardarCarga);

export default router;
