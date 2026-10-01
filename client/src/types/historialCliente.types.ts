// Fila devuelta por sp_consultaTmpHistoricoCliente
export interface HistorialVenta {
  nro: number;
  idVenta: number;
  imp: boolean; // true = factura impresa, false = remito
  fecha: string;
  factura: string;
  nombreCliente: string;
  ruc: string;
  nombreTipo: string | null;
  nombreVendedor: string | null;
  totalVenta: number | null;
  totalDescuento: number | null;
  activo: number; // 0 = anulada
}

// Fila devuelta por sp_consultaDetVentaHistoricoTmp
export interface DetalleVentaHistorial {
  nro: number;
  nombreMercaderia: string;
  cantidad: number;
  precioUnitario: number;
  precioDescuento: number | null;
  subtotal: number;
}
