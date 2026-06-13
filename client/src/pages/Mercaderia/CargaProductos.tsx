import React, { useState, useRef, useEffect } from 'react';
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
    Tooltip,
    CircularProgress,
} from '@mui/material';
import TextField from '../../components/UppercaseTextField';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SearchProductModal from '../../components/SearchProductModal';
import { useCargaProductos } from '../../hooks/useCargaProductos';
import RequirePermission from '../../components/RequirePermission';
import { useTerminal } from '../../hooks/useTerminal';
import { productoService } from '../../services/producto.service';

const CargaProductos: React.FC = () => {
    const { idTerminalWeb } = useTerminal();

    // Hook personalizado
    const {
        items,
        error,
        setError,
        success,
        setSuccess,
        loading,
        agregarDetalle,
        eliminarDetalle,
        guardarCarga
    } = useCargaProductos();

    // Estados Locales de UI
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [productoSearchTerm, setProductoSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [cantidad, setCantidad] = useState('');
    const [costo, setCosto] = useState('');
    const [precio, setPrecio] = useState('');

    const [selectedProductImg, setSelectedProductImg] = useState<string | null>(null);
    const [loadingImg, setLoadingImg] = useState<boolean>(false);
    
    // Fila seleccionada en la tabla inferior
    const [selectedRowNro, setSelectedRowNro] = useState<number | null>(null);

    // Referencias para el flujo de focos
    const buscadorRef = useRef<HTMLInputElement>(null);
    const cantidadRef = useRef<HTMLInputElement>(null);
    const costoRef = useRef<HTMLInputElement>(null);
    const precioRef = useRef<HTMLInputElement>(null);
    const agregarBtnRef = useRef<HTMLButtonElement>(null);

    // Cálculos automáticos
    const totalCalculado = Number(cantidad || 0) * Number(costo || 0);
    const margenCalculado = Number(costo || 0) > 0 
        ? ((Number(precio || 0) - Number(costo || 0)) / Number(costo || 0)) * 100 
        : 0;

    // Calcular el total general cargado
    const totalGeneralCargado = items.reduce((acc, item) => acc + (item.costoTotal || 0), 0);

    const handleProductSelect = async (product: any) => {
        setSelectedProduct(product);
        setProductoSearchTerm('');
        setSearchModalOpen(false);

        setSelectedProductImg(null);
        if (product.imagenUrl) {
            setSelectedProductImg(product.imagenUrl);
        } else if (product.idProducto) {
            setLoadingImg(true);
            try {
                const info = await productoService.obtenerInfoProducto(product.idProducto);
                if (info && info.length > 0) {
                    setSelectedProductImg(info[0].imagenUrl || '');
                } else {
                    setSelectedProductImg('');
                }
            } catch (err) {
                console.error('Error al obtener la imagen para la vista previa:', err);
                setSelectedProductImg('');
            } finally {
                setLoadingImg(false);
            }
        }
        
        // Cargar costo y precio sugerido si el producto lo tiene
        setPrecio(product.precio !== undefined && product.precio !== null ? String(product.precio) : '');
        
        // Flujo de focos 1: Al seleccionar, mover a Cantidad
        setTimeout(() => {
            cantidadRef.current?.focus();
        }, 100);
    };

    const handleAgregar = async () => {
        if (!selectedProduct) {
            setError('Debe seleccionar un producto');
            return;
        }
        if (!cantidad || Number(cantidad) <= 0) {
            setError('La cantidad debe ser mayor a 0');
            cantidadRef.current?.focus();
            return;
        }
        if (!costo || Number(costo) < 0) {
            setError('El costo no puede ser negativo');
            costoRef.current?.focus();
            return;
        }
        if (!precio || Number(precio) < 0) {
            setError('El precio no puede ser negativo');
            precioRef.current?.focus();
            return;
        }

        const ok = await agregarDetalle(
            selectedProduct,
            Number(cantidad),
            Number(costo),
            totalCalculado,
            Number(precio)
        );

        if (ok) {
            // Limpieza del formulario
            setCantidad('');
            setCosto('');
            setPrecio('');
            setSelectedProduct(null);
            setProductoSearchTerm('');
            setSelectedProductImg(null);
            
            // Flujo de focos 5: Al agregar, volver al buscador de productos
            setTimeout(() => {
                buscadorRef.current?.focus();
            }, 100);
        }
    };

    const handleKeyDownBuscador = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setSearchModalOpen(true);
        }
    };

    const handleEliminarItem = async () => {
        if (selectedRowNro === null) {
            setError('Debe seleccionar un ítem de la grilla inferior para eliminar');
            return;
        }
        await eliminarDetalle(selectedRowNro);
        setSelectedRowNro(null);
    };

    const handleGuardarCargaGlobal = async () => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const idUsuario = user ? user.idUsuario : 1;

        const ok = await guardarCarga(idUsuario);
        if (ok) {
            setSelectedRowNro(null);
        }
    };

    // Al pulsar Enter en el botón agregar, ejecuta agregar y focusea buscador
    const handleAgregarBtnKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAgregar();
        }
    };

    return (
        <RequirePermission permission="ACCESO_CARGA_PRODUCTOS">
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                    Carga de Productos
                </Typography>

                {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

                {/* Contenedor Gris Principal que agrupa el Wireframe */}
                <Paper sx={{ p: 2, bgcolor: '#f4f6f8', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    
                    {/* PANEL SUPERIOR: Formulario de Entrada (Inputs) */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                            ENTRADA DE PRODUCTOS
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            {/* Producto */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    fullWidth
                                    label="Producto (Enter para buscar)"
                                    value={productoSearchTerm}
                                    inputRef={buscadorRef}
                                    onChange={(e) => {
                                        setProductoSearchTerm(e.target.value);
                                        if (selectedProduct && e.target.value !== (selectedProduct.nombreMercaderia || selectedProduct.nombreProducto)) {
                                            setSelectedProduct(null);
                                        }
                                    }}
                                    onKeyPress={handleKeyDownBuscador}
                                    size="small"
                                    InputProps={{
                                        endAdornment: (
                                            <IconButton size="small" onClick={() => setSearchModalOpen(true)}>
                                                <SearchIcon />
                                            </IconButton>
                                        )
                                    }}
                                    sx={{ bgcolor: 'white' }}
                                />
                            </Grid>

                            {/* Cantidad */}
                            <Grid size={{ xs: 12, md: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Cant."
                                    type="number"
                                    value={cantidad}
                                    inputRef={cantidadRef}
                                    onChange={(e) => setCantidad(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            costoRef.current?.focus();
                                        }
                                    }}
                                    size="small"
                                    sx={{ bgcolor: 'white' }}
                                />
                            </Grid>

                            {/* Costo */}
                            <Grid size={{ xs: 12, md: 1.5 }}>
                                <TextField
                                    fullWidth
                                    label="Costo Unit."
                                    type="number"
                                    value={costo}
                                    inputRef={costoRef}
                                    onChange={(e) => {
                                        setCosto(e.target.value);
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            precioRef.current?.focus();
                                        }
                                    }}
                                    size="small"
                                    sx={{ bgcolor: 'white' }}
                                />
                            </Grid>

                            {/* Total (Read-only) */}
                            <Grid size={{ xs: 12, md: 1.5 }}>
                                <TextField
                                    fullWidth
                                    label="Total Costo"
                                    value={totalCalculado > 0 ? totalCalculado.toLocaleString() : '0'}
                                    disabled
                                    size="small"
                                    sx={{ bgcolor: '#ebebeb' }}
                                />
                            </Grid>

                            {/* Precio */}
                            <Grid size={{ xs: 12, md: 1.5 }}>
                                <TextField
                                    fullWidth
                                    label="Precio Venta"
                                    type="number"
                                    value={precio}
                                    inputRef={precioRef}
                                    onChange={(e) => setPrecio(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            agregarBtnRef.current?.focus();
                                        }
                                    }}
                                    size="small"
                                    sx={{ bgcolor: 'white' }}
                                />
                            </Grid>

                            {/* Margen (Read-only) */}
                            <Grid size={{ xs: 12, md: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Margen (%)"
                                    value={margenCalculado !== 0 && isFinite(margenCalculado) ? `${margenCalculado.toFixed(1)}%` : '0%'}
                                    disabled
                                    size="small"
                                    sx={{ bgcolor: '#ebebeb' }}
                                />
                            </Grid>

                            {/* Botón "+ Agregar" */}
                            <Grid size={{ xs: 12, md: 1 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={handleAgregar}
                                    onKeyDown={handleAgregarBtnKeyDown}
                                    ref={agregarBtnRef}
                                    disabled={loading || !selectedProduct}
                                    sx={{ height: '40px', fontWeight: 'bold' }}
                                >
                                    <AddIcon />
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* PANEL CENTRAL: Información de Referencia (Read-Only) */}
                    <Box sx={{ mb: 3 }}>
                        <Paper 
                            sx={{ 
                                p: 2, 
                                bgcolor: '#e0e4e8', 
                                borderLeft: '5px solid #1976d2',
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: 2
                            }}
                        >
                            {/* Información del Producto Seleccionado */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>
                                        MERCADERÍA
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#111' }}>
                                        {selectedProduct ? (selectedProduct.nombreMercaderia || selectedProduct.nombreProducto) : 'NINGUNO SELECCIONADO'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>
                                        ID PROD. / CÓDIGO
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#333' }}>
                                        {selectedProduct ? `${selectedProduct.idProducto} / ${selectedProduct.codigo}` : '—'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>
                                        PRECIO ACT. / ÚLT. COSTO
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: '#444' }}>
                                        {selectedProduct 
                                            ? `${(selectedProduct.precio || 0).toLocaleString()} / ${(selectedProduct.costo || 0).toLocaleString()}` 
                                            : '—'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Botones de Acción Global */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Eliminar ítem seleccionado de la grilla">
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleEliminarItem}
                                        disabled={selectedRowNro === null || loading}
                                        startIcon={<DeleteIcon />}
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        Eliminar
                                    </Button>
                                </Tooltip>

                                <Tooltip title="Guardar y Persistir Carga completa en BD">
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleGuardarCargaGlobal}
                                        disabled={items.length === 0 || loading}
                                        startIcon={<SaveIcon />}
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        Guardar
                                    </Button>
                                </Tooltip>
                            </Box>
                        </Paper>
                    </Box>

                    {/* PANEL INFERIOR: Tabla de Datos y Totales */}
                    <Box>
                        <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 10 }}>
                                <Box>
                                    <TableContainer component={Paper} sx={{ minHeight: '300px', mb: 2, border: '1px solid #e0e0e0' }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Nro</TableCell>
                                                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Producto</TableCell>
                                                    <TableCell align="right" sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Cantidad</TableCell>
                                                    <TableCell align="right" sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Costo Unit.</TableCell>
                                                    <TableCell align="right" sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Total Costo</TableCell>
                                                    <TableCell align="right" sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Precio Venta</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {items.map((item) => (
                                                    <TableRow
                                                        key={item.nro}
                                                        onClick={() => setSelectedRowNro(item.nro)}
                                                        selected={selectedRowNro === item.nro}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: '#f1f5f9' },
                                                            '&.Mui-selected, &.Mui-selected:hover': {
                                                                bgcolor: '#dbeafe !important',
                                                            }
                                                        }}
                                                    >
                                                        <TableCell>{item.nro}</TableCell>
                                                        <TableCell sx={{ fontWeight: 'medium' }}>{item.nombreProducto}</TableCell>
                                                        <TableCell align="right">{Number(item.cantidad).toLocaleString()}</TableCell>
                                                        <TableCell align="right">₲{Number(item.costo).toLocaleString()}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>₲{Number(item.costoTotal).toLocaleString()}</TableCell>
                                                        <TableCell align="right">₲{Number(item.precio).toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {items.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                                                            No hay productos cargados actualmente.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 2 }}>
                                <Box>
                                    <Box sx={{
                                        width: '200px',
                                        flexShrink: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 1,
                                        backgroundColor: '#fafafa',
                                        borderRadius: 2,
                                        border: '1px solid #e0e0e0',
                                        minheight: '120px',
                                        maxHeight: '300px'
                                    }}>
                                        {loadingImg ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={24} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Cargando...
                                                </Typography>
                                            </Box>
                                        ) : selectedProductImg ? (
                                            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <img
                                                    src={productoService.obtenerUrlImagen(selectedProductImg)}
                                                    alt="Vista previa"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '200px',
                                                        objectFit: 'contain',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'white',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5, textAlign: 'center' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {selectedProduct ? 'Sin imagen' : 'Sin producto'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                        {/* Pie de página con Total Cargado en Amarillo */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: 1 }}>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1.5,
                                    p: 1.5, 
                                    bgcolor: '#fff9c4', // Fondo amarillo
                                    border: '2px solid #fbc02d', 
                                    borderRadius: 1,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#574300' }}>
                                    TOTAL:
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: '900', color: '#d32f2f' }}>
                                    {totalGeneralCargado.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                </Paper>

                {/* Modal de Búsqueda de Productos */}
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

export default CargaProductos;
