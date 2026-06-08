import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface DetalleOfertaTmp {
    idDetOfertaTmp: number;
    idTerminalWeb: number;
    nro: number;
    idProducto: number;
    nombre: string;
    precioProducto: number;
    porcentajeDescuento: number;
    precioDescuento: number;
}

export interface OfertaCab {
    idOferta: number;
    nombreOferta: string;
    activo: boolean;
    fechaAlta: string;
    idUsuarioAlta: number;
    usuarioAlta?: string;
    fechaMod?: string;
    idUsuarioMod?: number;
    usuarioMod?: string;
}

export interface DetalleOferta {
    idDetOferta: number;
    idOferta: number;
    idProducto: number;
    nombreProducto: string;
    precioProducto: number;
    porcentajeDescuento: number;
    precioDescuento: number;
}

export const ofertasService = {
    consultaDetOfertaTmp: async (idTerminalWeb: number): Promise<DetalleOfertaTmp[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/ofertas/tmp`, {
                params: { idTerminalWeb }
            });
            return response.data.result;
        } catch (error: any) {
            console.error('Error al consultar detalle temporal de oferta:', error);
            throw new Error(error.response?.data?.message || 'Error al consultar detalle temporal');
        }
    },

    agregarDetOfertaTmp: async (data: {
        idTerminalWeb: number;
        idProducto: number;
        precioDescuento: number;
        porcentajeDescuento: number;
        precioProducto: number;
    }): Promise<any> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/ofertas/tmp`, data);
            return response.data;
        } catch (error: any) {
            console.error('Error al agregar producto a la oferta temporal:', error);
            throw new Error(error.response?.data?.message || 'Error al agregar producto a la oferta temporal');
        }
    },

    eliminarDetOfertaTmp: async (idDetOfertaTmp: number, idTerminalWeb: number): Promise<any> => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/ofertas/tmp/${idDetOfertaTmp}`, {
                params: { idTerminalWeb }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error al eliminar producto de la oferta temporal:', error);
            throw new Error(error.response?.data?.message || 'Error al eliminar producto de la oferta temporal');
        }
    },

    guardarOferta: async (data: {
        idUsuarioAlta: number;
        idTerminalWeb: number;
        nombreOferta: string;
    }): Promise<any> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/ofertas`, data);
            return response.data;
        } catch (error: any) {
            console.error('Error al guardar la oferta:', error);
            throw new Error(error.response?.data?.message || 'Error al guardar la oferta');
        }
    },

    listarOfertas: async (activo?: boolean): Promise<OfertaCab[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/ofertas`, {
                params: { activo }
            });
            return response.data.result;
        } catch (error: any) {
            console.error('Error al listar ofertas:', error);
            throw new Error(error.response?.data?.message || 'Error al listar ofertas');
        }
    },

    obtenerDetalleOferta: async (idOferta: number): Promise<DetalleOferta[]> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/ofertas/${idOferta}/detalles`);
            return response.data.result;
        } catch (error: any) {
            console.error('Error al obtener detalles de la oferta:', error);
            throw new Error(error.response?.data?.message || 'Error al obtener detalles de la oferta');
        }
    },

    desactivarOferta: async (idOferta: number, idUsuarioMod: number): Promise<any> => {
        try {
            const response = await axios.put(`${API_BASE_URL}/ofertas/${idOferta}/desactivar`, {
                idUsuarioMod
            });
            return response.data;
        } catch (error: any) {
            console.error('Error al desactivar la oferta:', error);
            throw new Error(error.response?.data?.message || 'Error al desactivar la oferta');
        }
    }
};
