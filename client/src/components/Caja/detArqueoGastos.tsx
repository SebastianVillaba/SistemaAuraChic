import React, { useState, useEffect, useRef } from 'react';
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
    InputAdornment,
} from '@mui/material';
import TextField from '../UppercaseTextField';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { cajaService } from '../../services/caja.service';
import type { GastoCajaTmpItem } from '../../types/caja.types';

interface DetArqueoGastosProps {
    idTerminalWeb: number;
    idMovimientoCaja: number | null;
    onTotalChange?: (total: number) => void;
    disabled?: boolean;
}

interface GastoLocal extends GastoCajaTmpItem {
    isNew?: boolean;
    isEditing?: boolean;
}

interface EditingGasto {
    idGastoCajaTmp: number;
    concepto: string;
    montoGasto: string;
    factura: string;
}

// cajaAbierta
//                                             ? 'rgba(251, 209, 209, 1)'
//                                             : 'rgba(180, 180, 180, 0.4)'

const DetArqueoGastos: React.FC<DetArqueoGastosProps> = ({
    idTerminalWeb,
    idMovimientoCaja,
    onTotalChange,
    disabled = false,
}) => {
    const [gastos, setGastos] = useState<GastoLocal[]>([]);
    const [saving, setSaving] = useState(false);
    const [totalGastos, setTotalGastos] = useState(0);

    // Estado para nueva fila
    const [nuevaFila, setNuevaFila] = useState<{ concepto: string; montoGasto: string; factura: string } | null>(null);
    const [shouldFocusFactura, setShouldFocusFactura] = useState(false);

    // Estado para edición
    const [editingGasto, setEditingGasto] = useState<EditingGasto | null>(null);

    // Refs para navegación de teclado
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const facturaInputRef = useRef<HTMLInputElement>(null);
    const montoInputRef = useRef<HTMLInputElement>(null);
    const conceptoInputRef = useRef<HTMLInputElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    const editFacturaInputRef = useRef<HTMLInputElement>(null);
    const editMontoInputRef = useRef<HTMLInputElement>(null);
    const editConceptoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        handleListarGastosTmp();
    }, []);

    // Notificar cambio de total
    useEffect(() => {
        const total = gastos.reduce((acc, gasto) => acc + gasto.montoGasto, 0);
        onTotalChange?.(total);
    }, [gastos, onTotalChange]);

    // Enfocar el campo de factura solo cuando se crea una nueva fila
    useEffect(() => {
        if (shouldFocusFactura) {
            setTimeout(() => {
                facturaInputRef.current?.focus();
            }, 100);
            setShouldFocusFactura(false);
        }
    }, [shouldFocusFactura]);

    // Enfocar el campo de factura cuando se está editando
    useEffect(() => {
        if (editingGasto) {
            setTimeout(() => {
                editFacturaInputRef.current?.focus();
                editFacturaInputRef.current?.select();
            }, 100);
        }
    }, [editingGasto?.idGastoCajaTmp]);

    const handleAgregarFila = () => {
        if (!idMovimientoCaja) {
            alert('Debe abrir una caja primero para agregar gastos');
            return;
        }
        // Cancelar edición si hay una activa
        setEditingGasto(null);
        setNuevaFila({ concepto: '', montoGasto: '', factura: '' });
        setShouldFocusFactura(true);
    };

    const handleGuardarNuevaFila = async () => {
        if (!nuevaFila || !idMovimientoCaja) return;

        const facturaNumerica = parseInt(nuevaFila.factura, 10);
        const montoNumerico = parseFloat(nuevaFila.montoGasto);

        if (isNaN(facturaNumerica) || facturaNumerica <= 0) {
            alert('El número de factura debe ser un número válido mayor a 0');
            facturaInputRef.current?.focus();
            return;
        }
        if (nuevaFila.factura.trim().length > 7) {
            alert('El número de factura no puede tener más de 7 dígitos');
            facturaInputRef.current?.focus();
            return;
        }
        if (isNaN(montoNumerico) || montoNumerico <= 0) {
            alert('El monto debe ser mayor a 0');
            montoInputRef.current?.focus();
            return;
        }
        if (!nuevaFila.concepto.trim()) {
            alert('El concepto es obligatorio');
            conceptoInputRef.current?.focus();
            return;
        }

        setSaving(true);
        try {
            await cajaService.agregarGastoCaja(
                idTerminalWeb,
                idMovimientoCaja,
                nuevaFila.concepto.trim(),
                montoNumerico,
                facturaNumerica
            );

            // Recargar lista desde el servidor
            await handleListarGastosTmp();
            setNuevaFila(null);

            // Volver al botón de agregar gasto para crear un ciclo
            setTimeout(() => {
                addButtonRef.current?.focus();
            }, 100);
        } catch (error: any) {
            console.error('Error al agregar gasto:', error);
            alert(error.response?.data?.message || 'Error al agregar gasto');
        } finally {
            setSaving(false);
        }
    };

    const handleEditar = (gasto: GastoLocal) => {
        // Cancelar nueva fila si hay una activa
        setNuevaFila(null);
        setEditingGasto({
            idGastoCajaTmp: gasto.idGastoCajaTmp,
            concepto: gasto.concepto,
            montoGasto: gasto.montoGasto.toString(),
            factura: gasto.factura !== undefined && gasto.factura !== null ? gasto.factura.toString() : '',
        });
    };

    const handleGuardarEdicion = async () => {
        if (!editingGasto || !idMovimientoCaja) return;

        const facturaNumerica = parseInt(editingGasto.factura, 10);
        const montoNumerico = parseFloat(editingGasto.montoGasto);

        if (isNaN(facturaNumerica) || facturaNumerica <= 0) {
            alert('El número de factura debe ser un número válido mayor a 0');
            editFacturaInputRef.current?.focus();
            return;
        }
        if (editingGasto.factura.trim().length > 7) {
            alert('El número de factura no puede tener más de 7 dígitos');
            editFacturaInputRef.current?.focus();
            return;
        }
        if (isNaN(montoNumerico) || montoNumerico <= 0) {
            alert('El monto debe ser mayor a 0');
            editMontoInputRef.current?.focus();
            return;
        }
        if (!editingGasto.concepto.trim()) {
            alert('El concepto es obligatorio');
            editConceptoInputRef.current?.focus();
            return;
        }

        setSaving(true);
        try {
            // Usar el mismo endpoint pero con idGastoCajaTmp para editar
            await cajaService.agregarGastoCaja(
                idTerminalWeb,
                idMovimientoCaja,
                editingGasto.concepto.trim(),
                montoNumerico,
                facturaNumerica,
                editingGasto.idGastoCajaTmp // Pasar el ID para editar
            );

            // Recargar lista desde el servidor
            await handleListarGastosTmp();
            setEditingGasto(null);

            // Volver al botón de agregar
            setTimeout(() => {
                addButtonRef.current?.focus();
            }, 100);
        } catch (error: any) {
            console.error('Error al editar gasto:', error);
            alert(error.response?.data?.message || 'Error al editar gasto');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelarEdicion = () => {
        setEditingGasto(null);
    };

    const handleEditFacturaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            editMontoInputRef.current?.focus();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelarEdicion();
        }
    };

    const handleEditMontoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            editConceptoInputRef.current?.focus();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelarEdicion();
        }
    };

    const handleEditConceptoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleGuardarEdicion();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelarEdicion();
        }
    };

    const handleFacturaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            montoInputRef.current?.focus();
        }
    };

    const handleMontoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            conceptoInputRef.current?.focus();
        }
    };

    const handleConceptoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleGuardarNuevaFila();
        }
    };

    const handleCancelarNuevaFila = () => {
        setNuevaFila(null);
        setTimeout(() => {
            addButtonRef.current?.focus();
        }, 100);
    };

    const handleEliminar = async (index: number) => {
        const gasto = gastos[index];
        setSaving(true);
        try {
            await cajaService.eliminarGastoCajaTmp(gasto.idGastoCajaTmp, idTerminalWeb);
            await handleListarGastosTmp();
        } catch (error: any) {
            console.error('Error al eliminar gasto:', error);
            alert(error.response?.data?.message || 'Error al eliminar gasto');
        } finally {
            setSaving(false);
        }
    };

    const handleListarGastosTmp = async () => {
        try {
            const response = await cajaService.listarGastoCajaTmp(idTerminalWeb);

            console.log(response);


            if (response.success) {
                setGastos(response.detalle);
                setTotalGastos(response.totalGasto[0].totalGasto);
            }
        } catch (error: any) {
            console.error('Error al listar gastos:', error);
            // No mostrar alert aquí para evitar spam en errores de carga inicial
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-PY', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <Box sx={{
            position: 'relative',
            ...(disabled && {
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(180, 180, 180, 0.4)',
                    borderRadius: 1,
                    zIndex: 1,
                    pointerEvents: 'none',
                }
            })
        }}>
            {/* Botón para agregar gasto */}
            <Button
                ref={addButtonRef}
                variant="contained"
                color="error"
                startIcon={<AddIcon />}
                onClick={handleAgregarFila}
                disabled={saving || nuevaFila !== null || !idMovimientoCaja || disabled}
                sx={{ mb: 2 }}
            >
                Agregar Gasto
            </Button>

            {!idMovimientoCaja && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Debe abrir una caja para poder agregar gastos
                </Typography>
            )}

            {/* Tabla de gastos */}
            <TableContainer component={Paper} sx={{ maxHeight: 350 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#ffebee', width: 60 }}>
                                Nro
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#ffebee', width: 120 }}>
                                Factura
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#ffebee', width: 150 }}>
                                Monto
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#ffebee' }}>
                                Concepto
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: '#ffebee', width: 100 }}>

                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {gastos.map((gasto, index) => {
                            const isEditing = editingGasto?.idGastoCajaTmp === gasto.idGastoCajaTmp;

                            if (isEditing) {
                                // Fila en modo edición
                                return (
                                    <TableRow key={gasto.idGastoCajaTmp} sx={{ backgroundColor: '#e3f2fd' }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {index + 1}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="text"
                                                value={editingGasto.factura}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || /^\d{0,7}$/.test(value)) {
                                                        setEditingGasto({ ...editingGasto, factura: value });
                                                    }
                                                }}
                                                onKeyDown={handleEditFacturaKeyDown}
                                                inputRef={editFacturaInputRef}
                                                placeholder="Factura"
                                                sx={{ width: '100%' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="text"
                                                value={editingGasto.montoGasto}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                        setEditingGasto({ ...editingGasto, montoGasto: value });
                                                    }
                                                }}
                                                onKeyDown={handleEditMontoKeyDown}
                                                inputRef={editMontoInputRef}
                                                placeholder="0"
                                                
                                                sx={{ width: '100%' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                value={editingGasto.concepto}
                                                onChange={(e) => setEditingGasto({ ...editingGasto, concepto: e.target.value })}
                                                onKeyDown={handleEditConceptoKeyDown}
                                                inputRef={editConceptoInputRef}
                                                placeholder="Concepto del gasto..."
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={handleGuardarEdicion}
                                                    disabled={saving}
                                                >
                                                    <SaveIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="default"
                                                    onClick={handleCancelarEdicion}
                                                    disabled={saving}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            // Fila normal (no edición)
                            return (
                                <TableRow key={gasto.idGastoCajaTmp} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {index + 1}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {gasto.factura || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body1" fontWeight="bold" color="error.main">
                                            {formatCurrency(gasto.montoGasto)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {gasto.concepto}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEditar(gasto)}
                                                disabled={saving || nuevaFila !== null || editingGasto !== null}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleEliminar(index)}
                                                disabled={saving}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* Fila para agregar nuevo gasto */}
                        {nuevaFila && (
                            <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {gastos.length + 1}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        type="text"
                                        variant='standard'
                                        value={nuevaFila.factura}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d{0,7}$/.test(value)) {
                                                setNuevaFila({ ...nuevaFila, factura: value });
                                            }
                                        }}
                                        onKeyDown={handleFacturaKeyDown}
                                        inputRef={facturaInputRef}
                                        placeholder="Factura"
                                        sx={{ width: '100%' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        type="text"
                                        variant='standard'
                                        value={nuevaFila.montoGasto}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                setNuevaFila({ ...nuevaFila, montoGasto: value });
                                            }
                                        }}
                                        onKeyDown={handleMontoKeyDown}
                                        inputRef={montoInputRef}
                                        placeholder="0"
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        size="small"
                                        variant='standard'
                                        value={nuevaFila.concepto}
                                        onChange={(e) => setNuevaFila({ ...nuevaFila, concepto: e.target.value })}
                                        onKeyDown={handleConceptoKeyDown}
                                        inputRef={conceptoInputRef}
                                        placeholder="Concepto del gasto..."
                                        fullWidth
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                            ref={saveButtonRef}
                                            size="small"
                                            color="success"
                                            onClick={handleGuardarNuevaFila}
                                            disabled={saving}
                                        >
                                            <SaveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="default"
                                            onClick={handleCancelarNuevaFila}
                                            disabled={saving}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}

                        {gastos.length === 0 && !nuevaFila && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No hay gastos registrados. Click en "Agregar Gasto" para comenzar.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Total */}
            <Paper sx={{ p: 1.5, mt: 2, backgroundColor: '#e3f2fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">Total Gastos:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.dark">
                    Gs. {formatCurrency(totalGastos)}
                </Typography>
            </Paper>
        </Box>
    );
};

export default DetArqueoGastos;
