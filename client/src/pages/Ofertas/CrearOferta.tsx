import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Button,
    Typography,
    Grid,
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
    CardHeader,
    Tooltip,
    InputAdornment,
    Divider,
    Zoom,
    CircularProgress
} from '@mui/material';
import TextField from '../../components/UppercaseTextField';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InfoIcon from '@mui/icons-material/Info';
import PercentIcon from '@mui/icons-material/Percent';
import { useTerminal } from '../../hooks/useTerminal';
import { ofertasService } from '../../services/ofertas.service';
import type { DetalleOfertaTmp } from '../../services/ofertas.service';
import SearchProductModal from '../../components/SearchProductModal';
import type { ProductoResultado } from '../../components/SearchProductModal';
import RequirePermission from '../../components/RequirePermission';

const CrearOferta: React.FC = () => {
    const { idTerminalWeb } = useTerminal();

    // Context user
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const idUsuarioAlta = currentUser?.idUsuario || 1;

    // Header State
    const [nombreOferta, setNombreOferta] = useState('');

    // Detail State
    const [selectedProduct, setSelectedProduct] = useState<ProductoResultado | null>(null);
    const [productoSearchTerm, setProductoSearchTerm] = useState('');
    const [precioProducto, setPrecioProducto] = useState<number>(0);
    const [porcentajeDescuento, setPorcentajeDescuento] = useState<string>('');
    const [precioDescuento, setPrecioDescuento] = useState<string>('');

    // Table State
    const [items, setItems] = useState<DetalleOfertaTmp[]>([]);

    // UI State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [addingItem, setAddingItem] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);

    // Cargar detalles temporales al iniciar o al cambiar de terminal
    useEffect(() => {
        if (idTerminalWeb) {
            cargarDetalles();
        }
    }, [idTerminalWeb]);

    const cargarDetalles = async () => {
        if (!idTerminalWeb) return;
        setLoading(true);
        try {
            const data = await ofertasService.consultaDetOfertaTmp(idTerminalWeb);
            setItems(data || []);
            setError('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al cargar detalles de la oferta temporal');
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (product: ProductoResultado) => {
        setSelectedProduct(product);
        setProductoSearchTerm(product.nombreMercaderia);
        setPrecioProducto(product.precio || 0);
        setPorcentajeDescuento('');
        setPrecioDescuento('');
        setSearchModalOpen(false);
        setError('');
    };

    // Al cambiar el porcentaje, calculamos el precio de descuento
    const handlePorcentajeChange = (value: string) => {
        setPorcentajeDescuento(value);
        if (value === '') {
            setPrecioDescuento('');
            return;
        }

        const pct = parseFloat(value);
        if (isNaN(pct) || pct < 0 || pct > 100) {
            setPrecioDescuento('');
            return;
        }

        const calculatedPrice = precioProducto * (1 - pct / 100);
        setPrecioDescuento(Math.round(calculatedPrice).toString());
    };

    // Al cambiar el precio de descuento, calculamos el porcentaje
    const handlePrecioDescuentoChange = (value: string) => {
        setPrecioDescuento(value);
        if (value === '' || precioProducto === 0) {
            setPorcentajeDescuento('');
            return;
        }

        const price = parseFloat(value);
        if (isNaN(price) || price < 0 || price > precioProducto) {
            setPorcentajeDescuento('');
            return;
        }

        const calculatedPct = ((precioProducto - price) / precioProducto) * 100;
        // Redondear a 2 decimales
        setPorcentajeDescuento((Math.round(calculatedPct * 100) / 100).toString());
    };

    const handleAgregar = async () => {
        if (!idTerminalWeb) {
            setError('Terminal no configurada o no validada');
            return;
        }
        if (!selectedProduct) {
            setError('Debe seleccionar un producto');
            return;
        }
        if (precioDescuento === '' || porcentajeDescuento === '') {
            setError('Debe ingresar un porcentaje o precio de descuento válido');
            return;
        }

        const descPct = parseFloat(porcentajeDescuento);
        const descPrice = parseFloat(precioDescuento);

        if (isNaN(descPct) || descPct < 0 || descPct > 100) {
            setError('El porcentaje de descuento debe estar entre 0% y 100%');
            return;
        }
        if (isNaN(descPrice) || descPrice < 0) {
            setError('El precio con descuento debe ser mayor o igual a 0');
            return;
        }

        setAddingItem(true);
        setError('');
        try {
            await ofertasService.agregarDetOfertaTmp({
                idTerminalWeb,
                idProducto: selectedProduct.idProducto,
                precioProducto: precioProducto,
                porcentajeDescuento: descPct,
                precioDescuento: descPrice
            });
            
            // Recargar detalles y limpiar campos de inserción
            await cargarDetalles();
            setSelectedProduct(null);
            setProductoSearchTerm('');
            setPrecioProducto(0);
            setPorcentajeDescuento('');
            setPrecioDescuento('');
            setSuccess('Producto agregado a la lista temporal');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al agregar el producto');
        } finally {
            setAddingItem(false);
        }
    };

    const handleEliminarItem = async (idDetOfertaTmp: number) => {
        if (!idTerminalWeb) return;
        try {
            await ofertasService.eliminarDetOfertaTmp(idDetOfertaTmp, idTerminalWeb);
            await cargarDetalles();
            setSuccess('Producto removido de la oferta temporal');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al eliminar el producto');
        }
    };

    const handleGuardarOferta = async () => {
        if (!idTerminalWeb) return;
        if (!nombreOferta.trim()) {
            setError('El nombre de la oferta es obligatorio');
            return;
        }
        if (items.length === 0) {
            setError('Debe agregar al menos un producto a la oferta');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await ofertasService.guardarOferta({
                idUsuarioAlta,
                idTerminalWeb,
                nombreOferta: nombreOferta.trim().toUpperCase()
            });

            setSuccess('¡Oferta guardada e impactada con éxito!');
            setNombreOferta('');
            setItems([]);
            // Esperar un momento y limpiar mensaje
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            setError(err.message || 'Error al guardar la oferta');
        } finally {
            setLoading(false);
        }
    };

    const handleNuevo = () => {
        setNombreOferta('');
        setSelectedProduct(null);
        setProductoSearchTerm('');
        setPrecioProducto(0);
        setPorcentajeDescuento('');
        setPrecioDescuento('');
        setError('');
        setSuccess('');
    };

    return (
        <RequirePermission permission="ACCESO_OFERTAS">
            <Box sx={{ p: 1, maxWidth: '100%', margin: '0 auto' }}>
                {/* Header Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LocalOfferIcon sx={{ color: '#d81b60', fontSize: 35 }} />
                        <Typography variant="h4" fontWeight="800" sx={{ color: '#2c3e50', letterSpacing: '-0.5px' }}>
                            Crear Nueva Oferta
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleNuevo}
                        sx={{ borderRadius: '20px', textTransform: 'none', px: 3 }}
                    >
                        Limpiar Formulario
                    </Button>
                </Box>

                {/* Notifications */}
                {error && (
                    <Zoom in={!!error}>
                        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: '12px', fontWeight: 'medium' }}>
                            {error}
                        </Alert>
                    </Zoom>
                )}
                {success && (
                    <Zoom in={!!success}>
                        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: '12px', fontWeight: 'medium' }}>
                            {success}
                        </Alert>
                    </Zoom>
                )}

                <Grid container spacing={3}>
                    {/* Left Panel: Header and Product Addition Form */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>
                            <Box sx={{ background: 'linear-gradient(135deg, #d81b60 0%, #880e4f 100%)', p: 2.5, color: '#fff' }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Datos de la Oferta
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Defina el nombre de la campaña y cargue los productos a incluir.
                                </Typography>
                            </Box>
                            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                {/* Nombre de la Oferta */}
                                <TextField
                                    fullWidth
                                    label="Nombre de la Oferta / Campaña"
                                    value={nombreOferta}
                                    onChange={(e) => setNombreOferta(e.target.value)}
                                    placeholder="Ej: BLACK FRIDAY, OFERTA DIA DE LA MADRE"
                                    variant="outlined"
                                    required
                                    size="small"
                                />

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                                    Agregar Producto a la Lista
                                </Typography>

                                {/* Selector de Producto */}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        label="Producto"
                                        placeholder="Haga clic en la lupa para buscar..."
                                        value={productoSearchTerm}
                                        readOnly
                                        size="small"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => setSearchModalOpen(true)}
                                                        edge="end"
                                                        size="small"
                                                    >
                                                        <SearchIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Box>

                                {/* Información del producto seleccionado */}
                                {selectedProduct && (
                                    <Zoom in={!!selectedProduct}>
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fbfbfb', borderRadius: '12px', border: '1px solid #e1e8ed' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="bold" color="#2c3e50">
                                                    {selectedProduct.nombreMercaderia}
                                                </Typography>
                                                <Tooltip title={`Código del producto: ${selectedProduct.codigo}`}>
                                                    <InfoIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                                </Tooltip>
                                            </Box>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Precio Normal:</Typography>
                                                    <Typography variant="body2" fontWeight="bold">₲{selectedProduct.price?.toLocaleString() || selectedProduct.precio?.toLocaleString()}</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="caption" color="text.secondary">Stock disponible:</Typography>
                                                    <Typography variant="body2" fontWeight="bold" color={selectedProduct.stock > 0 ? 'success.main' : 'error.main'}>
                                                        {selectedProduct.stock} uds
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Zoom>
                                )}

                                {/* Campos de Descuento */}
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Descuento (%)"
                                            type="number"
                                            value={porcentajeDescuento}
                                            onChange={(e) => handlePorcentajeChange(e.target.value)}
                                            disabled={!selectedProduct}
                                            size="small"
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <PercentIcon fontSize="small" />
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Precio Oferta (₲)"
                                            type="number"
                                            value={precioDescuento}
                                            onChange={(e) => handlePrecioDescuentoChange(e.target.value)}
                                            disabled={!selectedProduct}
                                            size="small"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="end">
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', marginRight: '4px' }}>₲</span>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAgregar}
                                    disabled={!selectedProduct || addingItem || precioDescuento === ''}
                                    startIcon={addingItem ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                                    sx={{
                                        mt: 1,
                                        borderRadius: '10px',
                                        textTransform: 'none',
                                        py: 1,
                                        background: ' #d81b60'
                                    }}
                                >
                                    Agregar a Detalle
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Panel: Table of Temporary Details */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: 2.5, borderBottom: '1px solid #eef2f3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" color="#2c3e50">
                                        Detalle de Productos Cargados
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={cargarDetalles} color="primary" disabled={loading}>
                                    <RefreshIcon />
                                </IconButton>
                            </Box>
                            
                            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <TableContainer component={Box} sx={{ maxHeight: '450px' }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Nro</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Producto</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Precio Original</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Dcto %</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Precio Oferta</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#fcfcfc' }}>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow key={item.idDetOfertaTmp || index} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell sx={{ fontWeight: 'medium' }}>{item.nombre}</TableCell>
                                                        <TableCell align="right">₲{item.precioProducto?.toLocaleString()}</TableCell>
                                                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                                            {item.porcentajeDescuento}%
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                            ₲{item.precioDescuento?.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Tooltip title="Eliminar de la oferta">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleEliminarItem(item.idDetOfertaTmp)}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {items.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                            <LocalOfferIcon sx={{ color: '#ccc', fontSize: 40, mb: 1, display: 'block', margin: '0 auto' }} />
                                                            <Typography color="text.secondary" variant="body2">
                                                                No hay productos cargados en esta oferta
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>

                            <Divider />

                            {/* Guardar Oferta Action */}
                            <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', bgcolor: '#fcfcfc' }}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="large"
                                    disabled={loading || items.length === 0 || !nombreOferta.trim()}
                                    onClick={handleGuardarOferta}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                    sx={{
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                        px: 4,
                                        py: 1.2,
                                        fontWeight: 'bold',
                                        background: ' #d81b60'
                                    }}
                                >
                                    Guardar y Activar Oferta
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>

                {/* Modal de búsqueda de producto */}
                <SearchProductModal
                    open={searchModalOpen}
                    onClose={() => setSearchModalOpen(false)}
                    onSelectProduct={handleProductSelect}
                    idTerminalWeb={idTerminalWeb || 0}
                    busqueda={productoSearchTerm}
                    useComprasSearch={true}
                />
            </Box>
        </RequirePermission>
    );
};

export default CrearOferta;
