import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_URL = `${API_BASE_URL}/consulta-carga-productos`;

export interface CargaCabecera {
  idCargaProducto: number;
  responsableCarga: string;
  fechaCarga: string;
  responsableAnula: string | null;
  explica: string | null;
  fechaAnula: string | null;
}

export interface CargaDetalle {
  Nro: string | number;
  idProducto: number;
  codigo: number;
  nombreProducto: string;
  costo: number;
  cantidad: number;
  subtotal: number;
}

export interface CargaNavigation {
  idMin: number | null;
  idMax: number | null;
  idPrev: number | null;
  idNext: number | null;
}

export interface CargaInfoResponse {
  success: boolean;
  cabecera: CargaCabecera | null;
  detalle: CargaDetalle[];
  navigation: CargaNavigation;
}

export interface CargaBuscarResponse {
  success: boolean;
  result: {
    idCargaProducto: number;
    responsableCarga: string;
    fechaCarga: string;
    activo: boolean;
    motivoAnula: string | null;
    fechaAnula: string | null;
  }[];
}

export const consultaCargaProductosService = {
  consultaInformacionCarga: async (idCargaProducto?: number): Promise<CargaInfoResponse> => {
    const params = idCargaProducto ? { idCargaProducto } : {};
    const response = await axios.get<CargaInfoResponse>(`${API_URL}/informacion`, { params });
    return response.data;
  },

  buscarCargas: async (params: { desde?: string; hasta?: string; idCargaProducto?: number }): Promise<CargaBuscarResponse> => {
    const response = await axios.get<CargaBuscarResponse>(`${API_URL}/buscar`, { params });
    return response.data;
  }
};
