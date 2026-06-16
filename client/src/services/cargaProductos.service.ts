import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_URL = `${API_BASE_URL}/carga-productos`;

export interface IDetalleCargaProducto {
    nro: number;
    nombreProducto: string;
    cantidad: number;
    costo: number;
    costoTotal: number;
    precio: number;
}

export interface IAgregarDetalleCarga {
    idTerminalWeb: number;
    idProducto: number;
    idDeposito: number;
    cantidad: number;
    costo: number;
    costoTotal: number;
    precio: number;
}

export const cargaProductosService = {
    agregarDetalle: async (data: IAgregarDetalleCarga) => {
        const response = await axios.post(`${API_URL}/detalle`, data);
        return response.data;
    },

    consultarDetalle: async (idTerminalWeb: number): Promise<IDetalleCargaProducto[]> => {
        const response = await axios.get(`${API_URL}/detalle/${idTerminalWeb}`);
        return response.data;
    },

    eliminarDetalle: async (idTerminalWeb: number, nro: number) => {
        const response = await axios.delete(`${API_URL}/detalle/${idTerminalWeb}/${nro}`);
        return response.data;
    },

    guardarCarga: async (data: { idTerminalWeb: number, idUsuarioAlta: number }) => {
        const response = await axios.post(`${API_URL}/guardar`, data);
        return response.data;
    }
};
