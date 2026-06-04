import axios from 'axios';
import type { Departamento, Distrito, Ciudad } from '../types/ubicacion.types';

// URL base del API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Servicio para manejar las ubicaciones (departamentos, distritos, ciudades)
 */
export const ubicacionService = {
  /**
   * Obtiene todos los departamentos
   */
  async obtenerDepartamentos(): Promise<Departamento[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/ubicaciones/departamentos`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      throw error;
    }
  },

  /**
   * Obtiene los distritos de un departamento específico
   * @param idDepartamento - ID del departamento
   */
  async obtenerDistritosPorDepartamento(idDepartamento: number): Promise<Distrito[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/ubicaciones/distritos`, {
        params: { idDepartamento }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener distritos:', error);
      throw error;
    }
  },

  /**
   * Obtiene las ciudades de un distrito específico
   * @param idDistrito - ID del distrito
   */
  async obtenerCiudadesPorDistrito(idDistrito: number): Promise<Ciudad[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/ubicaciones/ciudades`, {
        params: { idDistrito }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error al obtener ciudades:', error);
      throw error;
    }
  },
};
