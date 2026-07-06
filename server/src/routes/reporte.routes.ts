import express from 'express';
import { 
  reporteFacturaVenta, 
  reporteTicketVenta, 
  reporteTicketPedidoDia, 
  reporteCierreCaja, 
  reporteTicketRemision, 
  reportePedidoDelivery, 
  reporteVentaProductoDia,
  reporteVentaResumidoFecha,
  reporteVentasVendedorFecha
} from '../controllers/reporte.controller';

const router = express.Router();

// Ruta para obtener el reporte de una factura
router.get('/factura', reporteFacturaVenta);

// Ruta para obtener el reporte de un ticket
router.get('/ticket', reporteTicketVenta);
router.get('/ticket-pedido', reporteTicketPedidoDia);
router.get('/cierre-caja', reporteCierreCaja);
router.get('/ticket-remision', reporteTicketRemision);

// Ruta para el reporte de pedido por delivery
router.get('/pedido-delivery', reportePedidoDelivery);

// Rutas para reportes de ventas
router.get('/venta-producto-dia', reporteVentaProductoDia);
router.get('/ventas-resumido', reporteVentaResumidoFecha);
router.get('/ventas-vendedor', reporteVentasVendedorFecha);

export default router;
