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
import type { DetArqueoMonedaTmp, Moneda } from '../../types/caja.types';

interface DetArqueoMonedaProps {
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

const DetArqueoMoneda: React.FC<DetArqueoMonedaProps> = ({
    idTerminalWeb,
    onTotalChange,
    disabled = false,
}) => {
    const [items, setItems] = useState<DetArqueoMonedaTmp[]>([]);
    const [monedas, setMonedas] = useState<Moneda[]>([]);
    const [selectedMonedaId, setSelectedMonedaId] = useState<number | ''>('');
    const [montoMoneda, setMontoMoneda] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Cargar datos al montar
    useEffect(() => {
        if (idTerminalWeb) {
            cargarDetalles();
            cargarMonedas();
        }
    }, [idTerminalWeb]);

    // Notificar total en Gs.
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.total, 0);
        onTotalChange?.(total);
    }, [items, onTotalChange]);

    const cargarMonedas = async () => {
        try {
            const response = await cajaService.listarMonedas();
            if (response.success) {
                // Excluir guaraníes si es necesario, o listar todas. Generalmente guaraníes ya está en la denominación de efectivo principal.
                // Sin embargo, si quieren cargar guaraníes como moneda extra, se puede. Pero excluyamos la moneda base (GUARANIES idMoneda = 1)
                // si se prefiere, o dejemos todas. Excluyamos GUARANIES ya que se cuenta en Efectivo.
                const filtered = response.result.filter((m: Moneda) => m.idMoneda !== 1);
                setMonedas(filtered);
            }
        } catch (error) {
            console.error('Error al cargar monedas:', error);
        }
    };

    const cargarDetalles = async () => {
        setLoading(true);
        try {
            const response = await cajaService.listarDetArqueoMonedaTmp(idTerminalWeb);
            if (response.success) {
                setItems(response.result || []);
            }
        } catch (error) {
            console.error('Error al cargar detalles de moneda:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedMoneda = monedas.find(m => m.idMoneda === selectedMonedaId);
    const cotizacionActual = selectedMoneda?.cotizacion || 0;
    const totalCalculado = selectedMoneda && montoMoneda ? parseFloat(montoMoneda) * cotizacionActual : 0;

    const handleAgregar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMonedaId || !montoMoneda || parseFloat(montoMoneda) <= 0 || totalCalculado <= 0) return;

        setSaving(true);
        try {
            const response = await cajaService.agregarDetArqueoMonedaTmp(
                idTerminalWeb,
                Number(selectedMonedaId),
                parseFloat(montoMoneda),
                totalCalculado
            );
            if (response.success) {
                setSelectedMonedaId('');
                setMontoMoneda('');
                await cargarDetalles();
            }
        } catch (error: any) {
            console.error('Error al agregar detalle de moneda:', error);
            alert(error.response?.data?.message || 'Error al agregar detalle');
        } finally {
            setSaving(false);
        }
    };

    const handleEliminar = async (idMoneda: number) => {
        setSaving(true);
        try {
            const response = await cajaService.eliminarDetArqueoMonedaTmp(idTerminalWeb, idMoneda);
            if (response.success) {
                await cargarDetalles();
            }
        } catch (error: any) {
            console.error('Error al eliminar detalle de moneda:', error);
            alert(error.response?.data?.message || 'Error al eliminar detalle');
        } finally {
            setSaving(false);
        }
    };

    const totalMonedasGs = items.reduce((sum, item) => sum + item.total, 0);

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
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel id="moneda-select-label">Moneda</InputLabel>
                                <Select
                                    labelId="moneda-select-label"
                                    value={selectedMonedaId}
                                    label="Moneda"
                                    onChange={(e) => setSelectedMonedaId(e.target.value as number)}
                                >
                                    {monedas.map((m) => (
                                        <MenuItem key={m.idMoneda} value={m.idMoneda}>
                                            {m.nombre} ({m.simbolo})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="Cantidad / Físico"
                                size="small"
                                type="number"
                                required
                                value={montoMoneda}
                                onChange={(e) => setMontoMoneda(e.target.value)}
                                inputProps={{ min: 0.01, step: "any" }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Box sx={{ flexGrow: 1, px: 1, py: 0.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#fafafa', minHeight: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">Cotiz: {cotizacionActual ? formatCurrency(cotizacionActual) : '—'}</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                        Gs. {formatCurrency(totalCalculado)}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    startIcon={<AddIcon />}
                                    disabled={saving || !selectedMonedaId || !montoMoneda}
                                    sx={{ height: 40 }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Tabla de registrados */}
            <TableContainer component={Paper} sx={{ maxHeight: 250 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Moneda</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Cantidad</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Total Gs.</TableCell>
                            {!disabled && <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', width: 60 }}></TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.idMoneda} hover>
                                <TableCell>{item.nombre}</TableCell>
                                <TableCell align="right">{item.montoMoneda}</TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                        Gs. {formatCurrency(item.total)}
                                    </Typography>
                                </TableCell>
                                {!disabled && (
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleEliminar(item.idMoneda)}
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
                                <TableCell colSpan={disabled ? 3 : 4} align="center" sx={{ py: 3 }}>
                                    <Typography color="text.secondary" variant="body2">
                                        No se han registrado monedas extranjeras.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Total */}
            <Paper sx={{ p: 1.5, mt: 2, backgroundColor: '#e8f5e9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">Total Monedas Extranjeras:</Typography>
                <Typography variant="h6" fontWeight="bold" color="success.dark">
                    Gs. {formatCurrency(totalMonedasGs)}
                </Typography>
            </Paper>
        </Box>
    );
};

export default DetArqueoMoneda;
