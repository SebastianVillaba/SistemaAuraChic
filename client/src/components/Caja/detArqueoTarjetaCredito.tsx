import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { cajaService } from '../../services/caja.service';
import type { DetArqueoTarjetaCreditoTmp, TarjetaDebito } from '../../types/caja.types';

interface DetArqueoTarjetaCreditoProps {
    idTerminalWeb: number;
    onTotalChange?: (total: number) => void;
    disabled?: boolean;
}

export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PY', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const DetArqueoTarjetaCredito: React.FC<DetArqueoTarjetaCreditoProps> = ({
    idTerminalWeb,
    onTotalChange,
    disabled = false,
}) => {
    const [items, setItems] = useState<DetArqueoTarjetaCreditoTmp[]>([]);
    const [tarjetas, setTarjetas] = useState<TarjetaDebito[]>([]);
    const [selectedTarjeta, setSelectedTarjeta] = useState<number | ''>('');
    const [monto, setMonto] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Cargar datos al montar
    useEffect(() => {
        if (idTerminalWeb) {
            cargarDetalles();
            cargarTarjetas();
        }
    }, [idTerminalWeb]);

    // Notificar total
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.monto, 0);
        onTotalChange?.(total);
    }, [items, onTotalChange]);

    const cargarTarjetas = async () => {
        try {
            const response = await cajaService.listarTarjetas();
            if (response.success) {
                setTarjetas(response.result);
            }
        } catch (error) {
            console.error('Error al cargar tarjetas:', error);
        }
    };

    const cargarDetalles = async () => {
        setLoading(true);
        try {
            const response = await cajaService.listarDetArqueoTarjetaCreditoTmp(idTerminalWeb);
            if (response.success) {
                setItems(response.result || []);
            }
        } catch (error) {
            console.error('Error al cargar detalles de tarjeta de crédito:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAgregar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTarjeta || !monto || parseFloat(monto) <= 0) return;

        setSaving(true);
        try {
            const response = await cajaService.agregarDetArqueoTarjetaCreditoTmp(
                idTerminalWeb,
                Number(selectedTarjeta),
                parseFloat(monto)
            );
            if (response.success) {
                setSelectedTarjeta('');
                setMonto('');
                await cargarDetalles();
            }
        } catch (error: any) {
            console.error('Error al agregar detalle de tarjeta de crédito:', error);
            alert(error.response?.data?.message || 'Error al agregar detalle');
        } finally {
            setSaving(false);
        }
    };

    const handleEliminar = async (idTarjetaDebito: number) => {
        setSaving(true);
        try {
            const response = await cajaService.eliminarDetArqueoTarjetaCreditoTmp(idTerminalWeb, idTarjetaDebito);
            if (response.success) {
                await cargarDetalles();
            }
        } catch (error: any) {
            console.error('Error al eliminar detalle de tarjeta de crédito:', error);
            alert(error.response?.data?.message || 'Error al eliminar detalle');
        } finally {
            setSaving(false);
        }
    };

    const totalTarjetaCredito = items.reduce((sum, item) => sum + item.monto, 0);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Formulario de entrada */}
            {!disabled && (
                <Box component="form" onSubmit={handleAgregar} sx={{ mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel id="tarjeta-credito-select-label">Tarjeta</InputLabel>
                                <Select
                                    labelId="tarjeta-credito-select-label"
                                    value={selectedTarjeta}
                                    label="Tarjeta"
                                    onChange={(e) => setSelectedTarjeta(e.target.value as number)}
                                >
                                    {tarjetas.map((t) => (
                                        <MenuItem key={t.idTarjetaDebito} value={t.idTarjetaDebito}>
                                            {t.nombreTarjetaDebito}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Monto (Gs.)"
                                size="small"
                                type="number"
                                required
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                type="submit"
                                startIcon={<AddIcon />}
                                disabled={saving || !selectedTarjeta || !monto}
                            >
                                Registrar
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Tabla de registrados */}
            <TableContainer component={Paper} sx={{ maxHeight: 250 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Tarjeta</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Monto</TableCell>
                            {!disabled && <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', width: 60 }}></TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.idTarjetaDebito} hover>
                                <TableCell>{item.nombreTarjetaDebito}</TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                                        Gs. {formatCurrency(item.monto)}
                                    </Typography>
                                </TableCell>
                                {!disabled && (
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleEliminar(item.idTarjetaDebito)}
                                            disabled={saving}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={disabled ? 2 : 3} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary" variant="body2">
                                        No se han registrado tarjetas de crédito.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Total */}
            <Paper sx={{ p: 1.5, mt: 2, backgroundColor: '#e3f2fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">Total Crédito:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.dark">
                    Gs. {formatCurrency(totalTarjetaCredito)}
                </Typography>
            </Paper>
        </Box>
    );
};

export default DetArqueoTarjetaCredito;
