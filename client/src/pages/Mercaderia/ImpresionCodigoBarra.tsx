import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Button,
  Divider,
  IconButton,
  Checkbox,
  FormControlLabel,
  Card,
  Tooltip,
} from '@mui/material';
import TextField from '../../components/UppercaseTextField';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import RequirePermission from "../../components/RequirePermission";
import { useTerminal } from '../../hooks/useTerminal';
import { productoService } from '../../services/producto.service';
import { barcodeService } from '../../services/barcode.service';
import type { BarcodeTmpItem } from '../../services/barcode.service';
import jsPDF from 'jspdf';

// EAN-13 Encoding Tables
const L_CODE = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011"
];

const G_CODE = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111"
];

const R_CODE = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100"
];

const PARITY_TABLE = [
  "LLLLLL", // 0
  "LLGLGG", // 1
  "LLGGLG", // 2
  "LLGGGL", // 3
  "LGLLGG", // 4
  "LGGLLG", // 5
  "LGGGLL", // 6
  "LGLGLG", // 7
  "LGLGGL", // 8
  "LGGLGL"  // 9
];

// Helper to encode 13 digit string into a 95-bit binary string
const encodeEan13 = (code: string): string => {
  let cleanCode = code.replace(/\D/g, '');
  if (cleanCode.length !== 13) {
    cleanCode = cleanCode.padEnd(13, '0').slice(0, 13);
  }
  const first = parseInt(cleanCode[0], 10);
  const parity = PARITY_TABLE[first];
  
  let binary = "101"; // Left guard
  
  // Left 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(cleanCode[i + 1], 10);
    const type = parity[i];
    binary += type === 'L' ? L_CODE[digit] : G_CODE[digit];
  }
  
  binary += "01010"; // Center guard
  
  // Right 6 digits
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(cleanCode[i + 7], 10);
    binary += R_CODE[digit];
  }
  
  binary += "101"; // Right guard
  
  return binary;
};

// SVG Preview component for barcodes
const LiveBarcodePreview: React.FC<{ code: string }> = ({ code }) => {
  const binary = encodeEan13(code);
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', my: 0.5 }}>
      <svg width="100%" height="45" viewBox="0 0 95 45" preserveAspectRatio="none">
        {binary.split('').map((bit, idx) => {
          if (bit === '0') return null;
          const isGuard = idx < 3 || (idx >= 45 && idx < 50) || idx >= 92;
          const height = isGuard ? 45 : 37;
          return (
            <rect
              key={idx}
              x={idx}
              y={0}
              width={1}
              height={height}
              fill="#000000"
            />
          );
        })}
      </svg>
      {/* Human readable numbers */}
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', px: 1, fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', mt: 0.2 }}>
        <span>{code[0]}</span>
        <span>{code.slice(1, 7)}</span>
        <span>{code.slice(7, 13)}</span>
      </Box>
    </Box>
  );
};

const ImpresionCodigoBarra: React.FC = () => {
  const { idTerminalWeb } = useTerminal();

  // Search Stocks States
  const [busqueda, setBusqueda] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQty, setSearchQty] = useState<{ [key: number]: number }>({});
  const [searched, setSearched] = useState(false);

  // Queue States
  const [queue, setQueue] = useState<BarcodeTmpItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Continuous Roll Layout Settings
  const [indWidth, setIndWidth] = useState(50);
  const [indHeight, setIndHeight] = useState(25);

  // Label content toggles
  const [printNombre, setPrintNombre] = useState(true);
  const [printPrecio, setPrintPrecio] = useState(true);
  const [printDeposito, setPrintDeposito] = useState(false);
  const [printCodigo, setPrintCodigo] = useState(true);

  // Fetch queue on mount and when idTerminalWeb changes
  useEffect(() => {
    if (idTerminalWeb) {
      cargarCola();
    }
  }, [idTerminalWeb]);

  const cargarCola = async () => {
    if (!idTerminalWeb) return;
    setLoadingQueue(true);
    try {
      const items = await barcodeService.consultarTemp(idTerminalWeb);
      setQueue(items);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la cola de impresión.');
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleBuscar = async () => {
    if (!busqueda.trim()) {
      setError('Por favor, ingrese un criterio para buscar.');
      return;
    }
    if (!idTerminalWeb) {
      setError('No se detecta terminal activa.');
      return;
    }
    setLoadingSearch(true);
    setError('');
    try {
      const data = await productoService.consultarStockProducto(busqueda, idTerminalWeb);
      setSearchResults(data);
      setSearched(true);
      // Initialize quantities to 1
      const qtys: { [key: number]: number } = {};
      data.forEach((p: any) => {
        qtys[p.idStock] = 1;
      });
      setSearchQty(qtys);
    } catch (err: any) {
      setError(err.message || 'Error al buscar productos.');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  const handleQtyChange = (idStock: number, value: number) => {
    if (value < 1) value = 1;
    setSearchQty({ ...searchQty, [idStock]: value });
  };

  const handleAgregarCola = async (item: any) => {
    if (!idTerminalWeb) return;
    
    // VALIDATION: Check if the product has a barcode generated
    if (!item.codigoBarra || item.codigoBarra.trim() === '') {
      setError(
        `El producto "${item.nombreMercaderia}" no tiene un código de barra asignado en la base de datos. ` +
        `Por favor, vaya primero a "Generación de Códigos" para crearlo y guardarlo.`
      );
      return;
    }

    const qty = searchQty[item.idStock] || 1;
    setError('');
    setSuccessMsg('');
    try {
      await barcodeService.agregarAlTemp(idTerminalWeb, item.idStock, qty);
      setSuccessMsg(`Agregado a la cola: ${item.nombreMercaderia} x${qty}`);
      cargarCola();
    } catch (err: any) {
      setError(err.message || 'Error al agregar a la cola.');
    }
  };

  const handleUpdateQueueQty = async (idStock: number, newQty: number) => {
    if (!idTerminalWeb || newQty < 1) return;
    try {
      await barcodeService.actualizarCantidadTemp(idTerminalWeb, idStock, newQty);
      cargarCola();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar cantidad.');
    }
  };

  const handleEliminarItem = async (idStock: number) => {
    if (!idTerminalWeb) return;
    try {
      await barcodeService.eliminarDelTemp(idTerminalWeb, idStock);
      cargarCola();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar ítem.');
    }
  };

  const handleVaciarCola = async () => {
    if (!idTerminalWeb) return;
    if (!window.confirm('¿Está seguro de que desea vaciar la cola de impresión?')) return;
    try {
      await barcodeService.limpiarTemp(idTerminalWeb);
      setQueue([]);
    } catch (err: any) {
      setError(err.message || 'Error al vaciar la cola.');
    }
  };

  // Drawing EAN-13 Vector Barcode helper on jsPDF
  const drawBarcodeOnPdf = (
    doc: jsPDF,
    code: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const binary = encodeEan13(code);
    const moduleWidth = width / 95;
    
    doc.setFillColor(0, 0, 0); // Black color
    
    for (let i = 0; i < binary.length; i++) {
      if (binary[i] === '1') {
        const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
        const barHeight = isGuard ? height : height * 0.82;
        doc.rect(x + (i * moduleWidth), y, moduleWidth, barHeight, 'F');
      }
    }

    if (printCodigo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(0, 0, 0);
      
      const textY = y + height + 2;
      // First character (left of guard)
      doc.text(code[0], x - 2, y + height * 0.8);
      // Left group (digits 2-7)
      doc.text(code.slice(1, 7), x + 4 * moduleWidth, textY);
      // Right group (digits 8-13)
      doc.text(code.slice(7, 13), x + 50 * moduleWidth, textY);
    }
  };

  // Draws one single label content in its bounding box
  const drawLabelContent = (
    doc: jsPDF,
    item: BarcodeTmpItem,
    lx: number,
    ly: number,
    lw: number,
    lh: number
  ) => {
    // Top border padding
    let currentY = ly + 3.5;

    // 1. Print Product Name
    if (printNombre) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      const cleanName = item.mercaderia.length > 28 ? item.mercaderia.substring(0, 25) + "..." : item.mercaderia;
      doc.text(cleanName, lx + (lw / 2), currentY, { align: 'center' });
      currentY += 3.5;
    }

    // 2. Print Price
    if (printPrecio) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const priceText = `${Number(item.precio || 0).toLocaleString('es-PY')}`;
      doc.text(priceText, lx + (lw / 2), currentY, { align: 'center' });
      currentY += 1.5; // space before barcode
    }

    // 3. Print Deposit Info if checked
    if (printDeposito) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(item.nombreDeposito || '', lx + (lw / 2), currentY, { align: 'center' });
      currentY += 2;
    }

    // 4. Print Barcode
    const bcWidth = lw * 0.76;
    const bcHeight = lh * 0.38;
    const bcX = lx + (lw - bcWidth) / 2;
    
    // Draw EAN-13 (use generated EAN-13 code stored in item)
    drawBarcodeOnPdf(doc, item.codigoBarraEan13, bcX, currentY, bcWidth, bcHeight);
  };

  const handleImprimir = () => {
    if (queue.length === 0) {
      setError('La cola de impresión está vacía.');
      return;
    }

    // Create PDF with custom page size [width, height] in mm
    const doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: [indWidth, indHeight]
    });

    let isFirstPage = true;

    queue.forEach((item) => {
      for (let i = 0; i < item.cantidad; i++) {
        if (!isFirstPage) {
          doc.addPage([indWidth, indHeight], 'l');
        }
        isFirstPage = false;
        // Draw label inside [0, 0, indWidth, indHeight]
        drawLabelContent(doc, item, 0, 0, indWidth, indHeight);
      }
    });

    // Output PDF
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  };

  // Select mock preview item
  const getPreviewItem = (): BarcodeTmpItem => {
    if (queue.length > 0) return queue[0];
    if (searchResults.length > 0) {
      const match = searchResults[0];
      return {
        idTerminalWeb: idTerminalWeb || 0,
        idCodigoBarra: 0,
        idCompra: 0,
        nro: 1,
        idStock: match.idStock,
        codigo: match.codigo,
        mercaderia: match.nombreMercaderia,
        nombreDeposito: match.nombreDeposito,
        lote: '',
        vencimiento: null,
        cantidad: 1,
        bonificacion: 0,
        imprimir: 1,
        idProducto: match.idProducto,
        idDeposito: match.idDeposito,
        precio: match.precio || 150000,
        codigoBarraBase: match.codigoBarra ? match.codigoBarra.slice(0, 12) : '010000000045',
        codigoBarraEan13: match.codigoBarra || '0100000000458',
        codigoBarraEan: ''
      };
    }
    // Default placeholder
    return {
      idTerminalWeb: 0,
      idCodigoBarra: 0,
      idCompra: 0,
      nro: 1,
      idStock: 0,
      codigo: 12345,
      mercaderia: 'PRODUCTO DE MUESTRA',
      nombreDeposito: 'DEPOSITO PRINCIPAL',
      lote: '',
      vencimiento: null,
      cantidad: 1,
      bonificacion: 0,
      imprimir: 1,
      idProducto: 45,
      idDeposito: 1,
      precio: 150000,
      codigoBarraBase: '010000000045',
      codigoBarraEan13: '0100000000458',
      codigoBarraEan: ''
    };
  };

  const previewItem = getPreviewItem();

  return (
    <RequirePermission permission="VER_STOCK">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1a365d' }}>
            Impresión de Códigos de Barra
          </Typography>
        </Box>

        {/* Message Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ mb: 3, borderRadius: 2 }}>
            {successMsg}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* LEFT COLUMN: Product Search & Queue */}
          <Grid item xs={12} lg={7}>
            <Grid container spacing={3}>
              
              {/* Search Stocks */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d', mb: 2 }}>
                    Buscar Productos en Stock
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={7}>
                      <TextField
                        fullWidth
                        label="Producto (Código, Barra o Nombre)"
                        placeholder="Buscar por código o nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyPress={handleKeyPress}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleBuscar}
                        disabled={loadingSearch}
                        startIcon={loadingSearch ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Buscar
                      </Button>
                      {searchResults.length > 0 && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchResults([]);
                            setBusqueda('');
                            setSearched(false);
                          }}
                          startIcon={<CloseIcon />}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Limpiar
                        </Button>
                      )}
                    </Grid>
                  </Grid>

                  {searchResults.length > 0 ? (
                    <TableContainer component={Box} sx={{ mt: 3, maxHeight: '250px', overflowY: 'auto' }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Barra Asignada</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '100px' }}>Cant.</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acción</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {searchResults.map((prod: any) => (
                            <TableRow key={prod.idStock} hover>
                              <TableCell>{prod.codigo}</TableCell>
                              <TableCell>{prod.nombreMercaderia}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: prod.codigoBarra ? '#1e3a8a' : '#c00000' }}>
                                {prod.codigoBarra || 'SIN CÓDIGO'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: Number(prod.stockActual) > 0 ? 'green' : 'red' }}>
                                {prod.stockActual}
                              </TableCell>
                              <TableCell align="center">
                                <input
                                  type="number"
                                  min="1"
                                  value={searchQty[prod.idStock] || 1}
                                  onChange={(e) => handleQtyChange(prod.idStock, parseInt(e.target.value, 10))}
                                  style={{
                                    width: '60px',
                                    textAlign: 'center',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    padding: '3px'
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={() => handleAgregarCola(prod)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    searched && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                        No se encontraron productos.
                      </Typography>
                    )
                  )}
                </Paper>
              </Grid>

              {/* Printing Queue */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d' }}>
                      Cola de Impresión ({queue.length})
                    </Typography>
                    {queue.length > 0 && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleVaciarCola}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Vaciar Cola
                      </Button>
                    )}
                  </Box>

                  {loadingQueue ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : queue.length > 0 ? (
                    <TableContainer component={Box} sx={{ maxHeight: '350px', overflowY: 'auto' }}>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Código</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Depósito</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Cód. Barras</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Precio</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '130px' }}>Cant. Etiquetas</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quitar</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {queue.map((item) => (
                            <TableRow key={item.idStock} hover>
                              <TableCell>{item.codigo}</TableCell>
                              <TableCell>{item.mercaderia}</TableCell>
                              <TableCell>{item.nombreDeposito}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace' }}>{item.codigoBarraEan13}</TableCell>
                              <TableCell align="right">{Number(item.precio || 0).toLocaleString()}</TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUpdateQueueQty(item.idStock, item.cantidad - 1)}
                                    disabled={item.cantidad <= 1}
                                  >
                                    -
                                  </IconButton>
                                  <Typography sx={{ fontWeight: 'bold', width: '30px', textAlign: 'center' }}>
                                    {item.cantidad}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUpdateQueueQty(item.idStock, item.cantidad + 1)}
                                  >
                                    +
                                  </IconButton>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleEliminarItem(item.idStock)}
                                >
                                  <DeleteIcon size="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                      <Typography variant="body2">
                        No hay productos en la cola de impresión. Busque productos arriba y agréguelos.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

            </Grid>
          </Grid>

          {/* RIGHT COLUMN: Settings, Live Preview & Print */}
          <Grid item xs={12} lg={5}>
            <Grid container spacing={3}>
              
              {/* Printing Page Settings */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Configuración de Rollo (Etiquetas)
                  </Typography>

                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                    * Ajuste las dimensiones en milímetros de acuerdo al tamaño de etiqueta de su impresora.
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        label="Ancho etiqueta (mm)"
                        value={indWidth}
                        onChange={(e) => setIndWidth(Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        type="number"
                        fullWidth
                        size="small"
                        label="Alto etiqueta (mm)"
                        value={indHeight}
                        onChange={(e) => setIndHeight(Number(e.target.value))}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Content Toggles */}
                  <Typography variant="body2" fontWeight="bold" color="textSecondary" sx={{ mb: 1 }}>
                    Elementos a Incluir en la Etiqueta:
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={<Checkbox checked={printNombre} onChange={(e) => setPrintNombre(e.target.checked)} />}
                        label={<Typography variant="body2">Nombre Producto</Typography>}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={<Checkbox checked={printPrecio} onChange={(e) => setPrintPrecio(e.target.checked)} />}
                        label={<Typography variant="body2">Precio Venta</Typography>}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={<Checkbox checked={printDeposito} onChange={(e) => setPrintDeposito(e.target.checked)} />}
                        label={<Typography variant="body2">Depósito</Typography>}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <FormControlLabel
                        control={<Checkbox checked={printCodigo} onChange={(e) => setPrintCodigo(e.target.checked)} />}
                        label={<Typography variant="body2">Texto de Código</Typography>}
                      />
                    </Grid>
                  </Grid>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={queue.length === 0}
                    onClick={handleImprimir}
                    startIcon={<PrintIcon />}
                    sx={{
                      mt: 3,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(26, 54, 93, 0.2)',
                      }
                    }}
                  >
                    Generar PDF e Imprimir
                  </Button>
                </Paper>
              </Grid>

              {/* Label Preview */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a365d', mb: 2 }}>
                    Vista Previa de Impresión
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        width: `${indWidth * 5}px`,
                        height: `${indHeight * 5}px`,
                        maxWidth: '100%',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 1.5,
                        boxSizing: 'border-box',
                        border: '1px dashed #cbd5e1',
                        borderRadius: 1,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Name Preview */}
                      {printNombre ? (
                        <Typography
                          variant="body2"
                          align="center"
                          sx={{
                            fontWeight: 'bold',
                            fontSize: '10px',
                            lineHeight: 1.1,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            color: '#0f172a'
                          }}
                        >
                          {previewItem.mercaderia}
                        </Typography>
                      ) : <Box />}

                      {/* Content Middle */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                        {printPrecio && (
                          <Typography
                            variant="body2"
                            align="center"
                            sx={{
                              fontWeight: 'extrabold',
                              fontSize: '13px',
                              color: '#1e3a8a',
                              my: 0.1
                            }}
                          >
                            {Number(previewItem.precio || 0).toLocaleString('es-PY')}
                          </Typography>
                        )}
                        {printDeposito && (
                          <Typography
                            variant="caption"
                            align="center"
                            sx={{
                              fontSize: '7px',
                              color: '#64748b'
                            }}
                          >
                            {previewItem.nombreDeposito}
                          </Typography>
                        )}
                      </Box>

                      {/* Barcode SVG Preview */}
                      <LiveBarcodePreview code={previewItem.codigoBarraEan13} />
                    </Card>
                  </Box>
                  <Typography variant="caption" align="center" display="block" color="textSecondary" sx={{ mt: 2 }}>
                    * El tamaño en pantalla es aproximado. El PDF generado respetará las dimensiones exactas configuradas.
                  </Typography>
                </Paper>
              </Grid>

            </Grid>
          </Grid>
        </Grid>
      </Box>
    </RequirePermission>
  );
};

export default ImpresionCodigoBarra;
