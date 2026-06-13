import { useState, useCallback, useEffect } from 'react';
import { cargaProductosService } from '../services/cargaProductos.service';
import type { IDetalleCargaProducto } from '../services/cargaProductos.service';
import { useTerminal } from './useTerminal';

export const useCargaProductos = () => {
    const { idTerminalWeb, idDepositoCompra } = useTerminal();

    // Data State
    const [items, setItems] = useState<IDetalleCargaProducto[]>([]);
    
    // UI State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const cargarDetalles = useCallback(async () => {
        if (!idTerminalWeb) return;
        try {
            const data = await cargaProductosService.consultarDetalle(idTerminalWeb);
            setItems(data || []);
        } catch (err: any) {
            console.error('Error al cargar items de carga temporal:', err);
            setError('Error al cargar items temporales');
        }
    }, [idTerminalWeb]);

    useEffect(() => {
        cargarDetalles();
    }, [cargarDetalles]);

    const agregarDetalle = async (producto: any, cantidad: number, costo: number, costoTotal: number, precio: number) => {
        if (!idTerminalWeb) {
            setError('No hay una terminal web activa/validada');
            return false;
        }
        if (!idDepositoCompra) {
            setError('La terminal no tiene configurado un depósito de compras');
            return false;
        }

        setLoading(true);
        setError('');
        try {
            await cargaProductosService.agregarDetalle({
                idTerminalWeb,
                idProducto: producto.idProducto,
                idDeposito: idDepositoCompra,
                cantidad,
                costo,
                costoTotal,
                precio
            });
            await cargarDetalles();
            setSuccess('Producto agregado temporalmente');
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Error al agregar producto');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const eliminarDetalle = async (nro: number) => {
        if (!idTerminalWeb) return;
        setLoading(true);
        setError('');
        try {
            await cargaProductosService.eliminarDetalle(idTerminalWeb, nro);
            await cargarDetalles();
            setSuccess('Producto eliminado de la lista temporal');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Error al eliminar producto');
        } finally {
            setLoading(false);
        }
    };

    const guardarCarga = async (idUsuarioAlta: number) => {
        if (!idTerminalWeb) return;
        if (items.length === 0) {
            setError('No hay items para guardar');
            return false;
        }

        setLoading(true);
        setError('');
        try {
            await cargaProductosService.guardarCarga({
                idTerminalWeb,
                idUsuarioAlta
            });
            setSuccess('Carga de productos guardada y procesada exitosamente');
            setItems([]); // Limpiar grilla
            return true;
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Error al procesar la carga');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        items,
        error,
        setError,
        success,
        setSuccess,
        loading,
        agregarDetalle,
        eliminarDetalle,
        guardarCarga
    };
};
