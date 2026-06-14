import express from 'express';
import { buscarInfoPersona, buscarPersona, buscarClientePorRuc, agregarClienteRapido, insertarPersona, consultaCliente, modificarPersona, obtenerGruposCliente } from '../controllers/persona.controller';

const router = express.Router();

// La ruta base ya es '/persona' desde index.ts
// Entonces '/' aquí se traduce a '/api/persona'
router.post('/', insertarPersona);
router.put('/', modificarPersona);
router.get('/consulta', buscarPersona);
router.get('/consultaCliente', consultaCliente);
router.get('/info', buscarInfoPersona);
router.get('/buscarCliente', buscarClientePorRuc);
router.get('/gruposCliente', obtenerGruposCliente);
router.post('/agregarClienteRapido', agregarClienteRapido);

export default router;