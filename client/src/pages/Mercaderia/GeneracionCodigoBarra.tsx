import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import TextField from '../../components/UppercaseTextField';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SearchProductModal from '../../components/SearchProductModal';
import RequirePermission from '../../components/RequirePermission';
import { useTerminal } from '../../hooks/useTerminal';
import { barcodeService } from '../../services/barcode.service';

interface ProductItem {
  nro: number;
  idProducto: number;
  codigo: number;
  nombreProducto: string;
  codigoBarraActual: string;
  codigoBarraNuevo: string;
}

// EAN-13 Checksum calculation
const calculateEan13Checksum = (base: string): number => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i], 10);
    sum += (i % 2 === 0) ? digit * 1 : digit * 3;
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
};

// Generates EAN-13 barcode: Deposito (2 digits, prefixed with 2 if < 10) + '00000' + Producto (5 digits) + Checksum
const generateEan13 = (idDeposito: number, idProducto: number): string => {
  const depStr = idDeposito < 10 
    ? '2' + String(idDeposito) 
    : String(idDeposito).slice(-2);
  const prodStr = String(idProducto).padStart(5, '0').slice(-5);
  const base = depStr + '00000' + prodStr;
  const checksum = calculateEan13Checksum(base);
  return base + checksum;
};

const GeneracionCodigoBarra: React.FC = () => {
  const { idTerminalWeb, idDepositoVenta } = useTerminal();

  // State Management
  const [items, setItems] = useState<ProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedRowNro, setSelectedRowNro] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const buscadorRef = useRef<HTMLInputElement>(null);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setProductoSearchTerm('');
    setSearchModalOpen(false);

    // Check if product is already in the list
    if (items.some(item => item.idProducto === product.idProducto)) {
      setError(`El producto "${product.nombreProducto || product.nombreMercaderia}" ya está en la grilla.`);
      return;
    }

    // Determine deposit ID to use
    const activeDeposit = idDepositoVenta || 1;

    // Generate new EAN-13
    const newBarcode = generateEan13(activeDeposit, product.idProducto);

    // Add to list
    const newNro = items.length > 0 ? Math.max(...items.map(i => i.nro)) + 1 : 1;
    const newItem: ProductItem = {
      nro: newNro,
      idProducto: product.idProducto,
      codigo: product.codigo || 0,
      nombreProducto: product.nombreProducto || product.nombreMercaderia,
      codigoBarraActual: product.codigoBarra || '',
      codigoBarraNuevo: newBarcode
    };

    setItems([...items, newItem]);
    setError('');
    setSuccess('');

    // Focus back to search field
    setTimeout(() => {
      buscadorRef.current?.focus();
    }, 100);
  };

  const handleKeyDownBuscador = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setSearchModalOpen(true);
    }
  };

  const handleEliminarItem = () => {
    if (selectedRowNro === null) {
      setError('Debe seleccionar un ítem de la grilla para eliminar');
      return;
    }
    const updated = items.filter(item => item.nro !== selectedRowNro);
    // Reindex Nros
    const reindexed = updated.map((item, idx) => ({ ...item, nro: idx + 1 }));
    setItems(reindexed);
    setSelectedRowNro(null);
    setError('');
  };

  const handleGuardar = async () => {
    if (items.length === 0) {
      setError('No hay productos cargados en la grilla.');
      return;
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const idUsuarioMod = user ? user.idUsuario : 1;

    // Check if any product already has a barcode
    const hasExistingBarcodes = items.some(item => item.codigoBarraActual.trim() !== '');

    let overwrite = false;
    if (hasExistingBarcodes) {
      const confirmSave = window.confirm(
        'Se detectaron productos con códigos de barra existentes.\n\n' +
        '¿Desea SOBRESCRIBIR los códigos de barra existentes?\n' +
        'Presione ACEPTAR para sobrescribir todos los códigos.\n' +
        'Presione CANCELAR para guardar solamente los códigos nuevos (sin alterar los que ya tienen).'
      );
      overwrite = confirmSave;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Build update payload
      const payload = items
        .filter(item => {
          // If overwrite is true, update all. If false, update only those that are empty
          return overwrite || item.codigoBarraActual.trim() === '';
        })
        .map(item => ({
          idProducto: item.idProducto,
          codigoBarra: item.codigoBarraNuevo
        }));

      if (payload.length === 0) {
        setSuccess('No había códigos nuevos para guardar (se omitieron los existentes).');
        setItems([]);
        setSelectedProduct(null);
        return;
      }

      await barcodeService.guardarCodigosGenerados(payload, idUsuarioMod);

      setSuccess(`Se guardaron y asignaron correctamente los códigos de barra para ${payload.length} producto(s).`);
      setItems([]);
      setSelectedProduct(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar los códigos de barra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequirePermission permission="ACCESO_CARGA_PRODUCTOS">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a365d' }}>
          Generación de Códigos de Barra
        </Typography>

        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

        {/* Gray Main Container Panel */}
        <Paper sx={{ p: 2, bgcolor: '#f4f6f8', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          
          {/* TOP PANEL: Input Search */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
              SELECCIÓN DE PRODUCTOS
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Buscar Producto (Enter para buscar)"
                  value={productoSearchTerm}
                  inputRef={buscadorRef}
                  onChange={(e) => {
                    setProductoSearchTerm(e.target.value);
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
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary" display="block">
                  * Los códigos EAN-13 se generarán usando el depósito de ventas activo de la terminal: 
                  <strong> Depósito #{idDepositoVenta || 1}</strong>
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* CENTRAL PANEL: Reference info & action buttons */}
          <Box sx={{ mb: 3 }}>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: '#e0e4e8', 
                borderLeft: '5px solid #1a365d',
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: 2
              }}
            >
              {/* Selected Product info */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>
                    PRODUCTO SELECCIONADO
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#111' }}>
                    {selectedProduct ? (selectedProduct.nombreProducto || selectedProduct.nombreMercaderia) : 'NINGUNO'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>
                    ID / CÓDIGO
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#333' }}>
                    {selectedProduct ? `${selectedProduct.idProducto} / ${selectedProduct.codigo || '—'}` : '—'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 'bold' }}>
                    BARRA ACTUAL
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#444' }}>
                    {selectedProduct ? (selectedProduct.codigoBarra || 'SIN CÓDIGO') : '—'}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Quitar ítem seleccionado de la grilla">
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleEliminarItem}
                    disabled={selectedRowNro === null || loading}
                    startIcon={<DeleteIcon />}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Quitar
                  </Button>
                </Tooltip>

                <Tooltip title="Asignar y Guardar códigos de barra generados en BD">
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleGuardar}
                    disabled={items.length === 0 || loading}
                    startIcon={<SaveIcon />}
                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Guardar Cambios
                  </Button>
                </Tooltip>
              </Box>
            </Paper>
          </Box>

          {/* LOWER PANEL: Grid Table */}
          <Box>
            <TableContainer component={Paper} sx={{ minHeight: '300px', border: '1px solid #e0e0e0' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Nro</TableCell>
                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>ID Producto</TableCell>
                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Código</TableCell>
                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Producto / Mercadería</TableCell>
                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold' }}>Código de Barra Actual</TableCell>
                    <TableCell sx={{ bgcolor: '#eef2f6', fontWeight: 'bold', color: '#1a365d' }}>Código de Barra a Generar (EAN-13)</TableCell>
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
                      <TableCell>{item.idProducto}</TableCell>
                      <TableCell>{item.codigo}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>{item.nombreProducto}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: item.codigoBarraActual ? 'inherit' : 'text.disabled' }}>
                        {item.codigoBarraActual || 'SIN CÓDIGO'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#1e3a8a' }}>
                        {item.codigoBarraNuevo}
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                        No hay productos agregados para generación. Busque un producto arriba y presione Enter para agregarlo a la preparación.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

        </Paper>

        {/* Product Search Modal */}
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

export default GeneracionCodigoBarra;
