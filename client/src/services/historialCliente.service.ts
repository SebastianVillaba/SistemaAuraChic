import axios from 'axios';
import type { HistorialVenta, DetalleVentaHistorial } from '../types/historialCliente.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const historialClienteService = {
  /**
   * Carga el histórico del cliente en la tabla temporal de la terminal y lo devuelve
   */
  cargarHistorial: async (idTerminalWeb: number, idCliente: number): Promise<HistorialVenta[]> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/historial-cliente`, { idTerminalWeb, idCliente });
      return response.data.result;
    } catch (error: any) {
      console.error('Error al cargar el historial del cliente:', error);
      throw new Error(error.response?.data?.message || 'Error al cargar el historial del cliente');
    }
  },

  /**
   * Consulta el histórico ya cargado para la terminal
   */
  consultarHistorial: async (idTerminalWeb: number): Promise<HistorialVenta[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/historial-cliente`, { params: { idTerminalWeb } });
      return response.data.result;
    } catch (error: any) {
      console.error('Error al consultar el historial del cliente:', error);
      throw new Error(error.response?.data?.message || 'Error al consultar el historial del cliente');
    }
  },

  /**
   * Consulta los productos vendidos en una venta del histórico
   */
  consultarDetalle: async (idVenta: number, imp: boolean): Promise<DetalleVentaHistorial[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/historial-cliente/detalle`, {
        params: { idVenta, imp: imp ? 1 : 0 }
      });
      return response.data.result;
    } catch (error: any) {
      console.error('Error al consultar el detalle de la venta:', error);
      throw new Error(error.response?.data?.message || 'Error al consultar el detalle de la venta');
    }
  }
};
