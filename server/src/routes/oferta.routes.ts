import express from 'express';
import {
    consultaDetOfertaTmp,
    agregarDetOfertaTmp,
    eliminarDetOfertaTmp,
    guardarOferta,
    listarOfertas,
    obtenerDetalleOferta,
    desactivarOferta
} from '../controllers/oferta.controller';

const router = express.Router();

router.get('/tmp', consultaDetOfertaTmp);
router.post('/tmp', agregarDetOfertaTmp);
router.delete('/tmp/:idDetOfertaTmp', eliminarDetOfertaTmp);
router.post('/', guardarOferta);
router.get('/', listarOfertas);
router.get('/:idOferta/detalles', obtenerDetalleOferta);
router.put('/:idOferta/desactivar', desactivarOferta);

export default router;
