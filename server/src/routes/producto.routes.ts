import express from 'express';
import multer from 'multer'
import path from 'path';

import { insertarProducto, buscarProductos, obtenerInfoProducto, obtenerTiposProducto, consultarPrecioProducto, modificarProducto, obtenerPrecioDescuento, insertarTipoProducto, consultarStockProducto } from '../controllers/producto.controller';

const router = express.Router();

// Configuración de almacenamiento local para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Renombrar archivo para evitar duplicados: ej. 1718293821-producto.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Endpoint separado para la carga exclusiva de la imagen física
router.post('/upload-image', upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
  }
  // Retornamos la ruta relativa para guardarla luego en el formulario del producto
  const imagenUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, imagenUrl });
});

router.post('/', insertarProducto);
router.put('/', modificarProducto);
router.get('/consulta', buscarProductos);
router.get('/info', obtenerInfoProducto);
router.get('/tipoProducto', obtenerTiposProducto);
router.post('/tipoProducto', insertarTipoProducto);
router.get('/precio', consultarPrecioProducto);
router.get('/precioDescuento', obtenerPrecioDescuento);
router.get('/stock', consultarStockProducto);

export default router;