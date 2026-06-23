import { Router } from 'express';
import { consultaInformacionCarga, buscarCargas } from '../controllers/consultaCargaProductos.controller';

const router = Router();

router.get('/informacion', consultaInformacionCarga);
router.get('/buscar', buscarCargas);

export default router;
