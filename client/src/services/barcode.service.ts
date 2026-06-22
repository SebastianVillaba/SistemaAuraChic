import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface BarcodeTmpItem {
  idTerminalWeb: number;
  idCodigoBarra: number;
  idCompra: number | null;
  nro: number;
  idStock: number;
  codigo: number;
  mercaderia: string;
  nombreDeposito: string;
  lote: string;
  vencimiento: string | null;
  cantidad: number;
  bonificacion: number;
  imprimir: number;
  idProducto: number;
  idDeposito: number;
  precio: number;
  codigoBarraBase: string;
  codigoBarraEan13: string;
  codigoBarraEan: string;
}

export const barcodeService = {
  /**
   * Agrega un producto a la cola de impresión temporal.
   */
  agregarAlTemp: async (idTerminalWeb: number, idStock: number, cantidad: number): Promise<any> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcode/temp`, {
        idTerminalWeb,
        idStock,
        cantidad
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al agregar a la cola de códigos de barra:', error);
      throw new Error(error.response?.data?.message || 'Error al agregar a la cola de impresión');
    }
  },

  /**
   * Consulta los códigos de barra agregados a la cola temporal de esta terminal.
   */
  consultarTemp: async (idTerminalWeb: number): Promise<BarcodeTmpItem[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/barcode/temp`, {
        params: { idTerminalWeb }
      });
      return response.data.result || [];
    } catch (error: any) {
      console.error('Error al consultar cola de códigos de barra:', error);
      throw new Error(error.response?.data?.message || 'Error al consultar la cola de impresión');
    }
  },

  /**
   * Actualiza la cantidad de copias a imprimir para un producto en la cola.
   */
  actualizarCantidadTemp: async (idTerminalWeb: number, idStock: number, cantidad: number): Promise<any> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/barcode/temp`, {
        idTerminalWeb,
        idStock,
        cantidad
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar cantidad de código de barra:', error);
      throw new Error(error.response?.data?.message || 'Error al actualizar cantidad');
    }
  },

  /**
   * Elimina un producto de la cola de impresión.
   */
  eliminarDelTemp: async (idTerminalWeb: number, idStock: number): Promise<any> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/barcode/temp/${idStock}`, {
        params: { idTerminalWeb }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al eliminar código de barra de la cola:', error);
      throw new Error(error.response?.data?.message || 'Error al eliminar de la cola de impresión');
    }
  },

  /**
   * Vacía toda la cola de impresión de la terminal.
   */
  limpiarTemp: async (idTerminalWeb: number): Promise<any> => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/barcode/temp`, {
        params: { idTerminalWeb }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al vaciar la cola de códigos de barra:', error);
      throw new Error(error.response?.data?.message || 'Error al vaciar la cola de impresión');
    }
  },

  /**
   * Guarda los códigos de barra generados en masa para los productos correspondientes.
   */
  guardarCodigosGenerados: async (items: Array<{ idProducto: number, codigoBarra: string }>, idUsuarioMod: number): Promise<any> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcode/save-generated`, {
        items,
        idUsuarioMod
      });
      return response.data;
    } catch (error: any) {
      console.error('Error al guardar códigos generados:', error);
      throw new Error(error.response?.data?.message || 'Error al guardar los códigos generados');
    }
  }
};
