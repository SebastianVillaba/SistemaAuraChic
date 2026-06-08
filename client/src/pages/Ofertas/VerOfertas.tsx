import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    IconButton,
    Card,
    CardContent,
    Chip,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tabs,
    Tab,
    Divider,
    CircularProgress,
    Zoom
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import HistoryIcon from '@mui/icons-material/History';
import { ofertasService } from '../../services/ofertas.service';
import type { OfertaCab, DetalleOferta } from '../../services/ofertas.service';
import RequirePermission from '../../components/RequirePermission';

// Subcomponente para cada fila de la tabla con lógica de expansión propia
const RowOferta: React.FC<{
    oferta: OfertaCab;
    onDesactivarClick: (oferta: OfertaCab) => void;
    idUsuarioMod: number;
}> = ({ oferta, onDesactivarClick }) => {
    const [open, setOpen] = useState(false);
    const [detalles, setDetalles] = useState<DetalleOferta[]>([]);
    const [loadingDet, setLoadingDet] = useState(false);
    const [errorDet, setErrorDet] = useState('');

    const handleExpandToggle = async () => {
        const nextOpen = !open;
        setOpen(nextOpen);

        // Si se abre y no tiene detalles cargados, los cargamos
        if (nextOpen && detalles.length === 0) {
            setLoadingDet(true);
            setErrorDet('');
            try {
                const data = await ofertasService.obtenerDetalleOferta(oferta.idOferta);
                setDetalles(data || []);
            } catch (err: any) {
                console.error(err);
                setErrorDet('Error al cargar productos de la oferta');
            } finally {
                setLoadingDet(false);
            }
        }
    };

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} hover>
                <TableCell width="50px">
                    <IconButton size="small" onClick={handleExpandToggle}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {oferta.nombreOferta}
                </TableCell>
                <TableCell>
                    {new Date(oferta.fechaAlta).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </TableCell>
                <TableCell>{oferta.usuarioAlta || `Usuario #${oferta.idUsuarioAlta}`}</TableCell>
                <TableCell>
                    {oferta.activo ? (
                        <Chip
                            icon={<CheckCircleIcon style={{ color: '#2e7d32' }} />}
                            label="Activa"
                            size="small"
                            sx={{
                                bgcolor: '#e8f5e9',
                                color: '#1b5e20',
                                fontWeight: 'bold',
                                border: '1px solid #c8e6c9'
                            }}
                        />
                    ) : (
                        <Chip
                            icon={<BlockIcon style={{ color: '#d32f2f' }} />}
                            label="Inactiva"
                            size="small"
                            sx={{
                                bgcolor: '#ffebee',
                                color: '#c62828',
                                fontWeight: 'bold',
                                border: '1px solid #ffcdd2'
                            }}
                        />
                    )}
                </TableCell>
                <TableCell align="center">
                    {oferta.activo && (
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<BlockIcon />}
                            onClick={() => onDesactivarClick(oferta)}
                            sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                border: '1.5px solid',
                                '&:hover': {
                                    border: '1.5px solid',
                                }
                            }}
                        >
                            Dar de Baja
                        </Button>
                    )}
                </TableCell>
            </TableRow>
            {/* Fila de Expansión para Detalle */}
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, bgcolor: '#fbfbfb', p: 2, borderRadius: '8px', border: '1px solid #eaeeef' }}>
                            <Typography variant="subtitle2" gutterBottom component="div" fontWeight="bold" color="#2c3e50">
                                Productos Incluidos en la Oferta
                            </Typography>
                            {loadingDet ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="text.secondary">
                                        Cargando detalles de oferta...
                                    </Typography>
                                </Box>
                            ) : errorDet ? (
                                <Alert severity="error" size="small">{errorDet}</Alert>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ID Producto</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Nombre del Producto</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Precio Lista</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Porcentaje Dcto.</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Precio Descuento</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {detalles.map((det) => (
                                            <TableRow key={det.idDetOferta}>
                                                <TableCell>{det.idProducto}</TableCell>
                                                <TableCell sx={{ fontWeight: 'medium' }}>{det.nombreProducto}</TableCell>
                                                <TableCell align="right">₲{det.precioProducto?.toLocaleString()}</TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                                    {det.porcentajeDescuento}%
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                    ₲{det.precioDescuento?.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

const VerOfertas: React.FC = () => {
    // Context user
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const idUsuarioMod = currentUser?.idUsuario || 1;

    // Filters
    const [tabVal, setTabVal] = useState(0); // 0 = Todas, 1 = Activas, 2 = Inactivas

    // Data lists
    const [ofertas, setOfertas] = useState<OfertaCab[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Deactivation Confirmation Modal State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [ofertaToDesactivar, setOfertaToDesactivar] = useState<OfertaCab | null>(null);
    const [desactivando, setDesactivando] = useState(false);

    // Cargar ofertas al iniciar o al cambiar filtros
    useEffect(() => {
        cargarOfertas();
    }, [tabVal]);

    const cargarOfertas = async () => {
        setLoading(true);
        setError('');
        try {
            let activeParam: boolean | undefined = undefined;
            if (tabVal === 1) activeParam = true;
            if (tabVal === 2) activeParam = false;

            const data = await ofertasService.listarOfertas(activeParam);
            setOfertas(data || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al obtener el listado de ofertas');
        } finally {
            setLoading(false);
        }
    };

    const handleDesactivarClick = (oferta: OfertaCab) => {
        setOfertaToDesactivar(oferta);
        setConfirmOpen(true);
    };

    const handleConfirmDesactivar = async () => {
        if (!ofertaToDesactivar) return;

        setDesactivando(true);
        setError('');
        try {
            await ofertasService.desactivarOferta(ofertaToDesactivar.idOferta, idUsuarioMod);
            setSuccess(`¡Oferta "${ofertaToDesactivar.nombreOferta}" dada de baja correctamente!`);
            setConfirmOpen(false);
            setOfertaToDesactivar(null);
            // Recargar listado
            await cargarOfertas();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al dar de baja la oferta');
        } finally {
            setDesactivando(false);
        }
    };

    return (
        <RequirePermission permission="ACCESO_OFERTAS">
            <Box sx={{ p: 1, maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HistoryIcon sx={{ color: '#d81b60', fontSize: 35 }} />
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#2c3e50', letterSpacing: '-0.5px' }}>
                            Consulta de Ofertas
                        </Typography>
                    </Box>
                    <IconButton size="medium" onClick={cargarOfertas} color="primary" disabled={loading} sx={{ border: '1px solid #ddd', borderRadius: '50%' }}>
                        <RefreshIcon />
                    </IconButton>
                </Box>

                {/* Notifications */}
                {error && (
                    <Zoom in={!!error}>
                        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: '12px' }}>
                            {error}
                        </Alert>
                    </Zoom>
                )}
                {success && (
                    <Zoom in={!!success}>
                        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: '12px' }}>
                            {success}
                        </Alert>
                    </Zoom>
                )}

                {/* Main Card */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>
                    {/* Filters via Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fcfcfc' }}>
                        <Tabs
                            value={tabVal}
                            onChange={(_, newValue) => setTabVal(newValue)}
                            textColor="primary"
                            indicatorColor="primary"
                            variant="fullWidth"
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '15px',
                                    py: 2
                                }
                            }}
                        >
                            <Tab label="Todas las Ofertas" />
                            <Tab label="Ofertas Activas" />
                            <Tab label="Ofertas Inactivas (Dadas de Baja)" />
                        </Tabs>
                    </Box>

                    <CardContent sx={{ p: 0 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: 2 }}>
                                <CircularProgress />
                                <Typography color="text.secondary">Consultando ofertas en el sistema...</Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table aria-label="collapsible table" size="medium">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                            <TableCell />
                                            <TableCell sx={{ fontWeight: '800', color: '#2c3e50' }}>Campaña / Nombre</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#2c3e50' }}>Fecha Registro</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#2c3e50' }}>Creado Por</TableCell>
                                            <TableCell sx={{ fontWeight: '800', color: '#2c3e50' }}>Estado</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: '800', color: '#2c3e50' }}>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {ofertas.map((oferta) => (
                                            <RowOferta
                                                key={oferta.idOferta}
                                                oferta={oferta}
                                                onDesactivarClick={handleDesactivarClick}
                                                idUsuarioMod={idUsuarioMod}
                                            />
                                        ))}
                                        {ofertas.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                                                    <HelpOutlineIcon sx={{ color: '#ccc', fontSize: 50, mb: 1.5 }} />
                                                    <Typography color="text.secondary" variant="body1" fontWeight="bold">
                                                        No se encontraron ofertas registradas.
                                                    </Typography>
                                                    <Typography color="text.disabled" variant="body2">
                                                        Cambie de filtro o registre una nueva oferta para empezar.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Dialogo de Confirmación para dar de Baja */}
                <Dialog
                    open={confirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    aria-labelledby="confirm-dialog-title"
                    aria-describedby="confirm-dialog-description"
                    PaperProps={{
                        sx: { borderRadius: '16px', p: 1 }
                    }}
                >
                    <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                        <BlockIcon /> Confirmar Baja de Oferta
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="confirm-dialog-description" sx={{ mt: 1 }}>
                            ¿Está seguro que desea dar de baja la campaña de oferta <strong>"{ofertaToDesactivar?.nombreOferta}"</strong>?
                            <br />
                            <br />
                            Esta acción es irreversible y desaplicará de inmediato los descuentos de precio asociados a todos los productos incluidos en la misma.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                        <Button
                            onClick={() => setConfirmOpen(false)}
                            color="inherit"
                            disabled={desactivando}
                            sx={{ textTransform: 'none', fontWeight: 'bold' }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmDesactivar}
                            color="error"
                            variant="contained"
                            disabled={desactivando}
                            startIcon={desactivando ? <CircularProgress size={20} color="inherit" /> : <BlockIcon />}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 'bold', px: 3 }}
                        >
                            Confirmar Desactivación
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </RequirePermission>
    );
};

export default VerOfertas;
