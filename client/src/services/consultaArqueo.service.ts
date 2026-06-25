import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const consultaArqueoService = {
  /**
   * Consulta arqueos por rango de fechas
   */
  consultaArqueoFecha: async (desde: string, hasta: string): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/consulta-arqueo/fecha`, {
        params: { desde, hasta }
      });
      return response.data.result;
    } catch (error: any) {
      console.error('Error al consultar arqueos por fecha:', error);
      throw new Error(error.response?.data?.message || 'Error al consultar arqueos por fecha');
    }
  },

  /**
   * Consulta arqueos por número de caja
   */
  consultaArqueoNroCaja: async (nroCaja: number): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/consulta-arqueo/nro-caja`, {
        params: { nroCaja }
      });
      return response.data.result;
    } catch (error: any) {
      console.error('Error al consultar arqueos por nro de caja:', error);
      throw new Error(error.response?.data?.message || 'Error al consultar arqueos por número de caja');
    }
  },

  /**
   * Consulta información detallada del arqueo (cabecera y desgloses)
   */
  consultaInformacionArqueo: async (idMovimientoCaja: number): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/consulta-arqueo/informacion`, {
        params: { idMovimientoCaja }
      });
      return response.data; // { success, cabecera, gastos, monedas, tarjetaCredito, tarjetaDebito, transferencias }
    } catch (error: any) {
      console.error('Error al consultar información del arqueo:', error);
      throw new Error(error.response?.data?.message || 'Error al consultar información del arqueo');
    }
  }
};
