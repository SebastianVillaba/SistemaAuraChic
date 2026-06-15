import React, { useState } from 'react';
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
} from '@mui/material';
import TextField from '../../components/UppercaseTextField';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import RequirePermission from "../../components/RequirePermission";
import { useTerminal } from '../../hooks/useTerminal';
import { productoService } from '../../services/producto.service';

const ConsultaStock: React.FC = () => {
  const { idTerminalWeb } = useTerminal();
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleBuscar = async () => {
    if (!busqueda.trim()) {
      setError('Por favor, ingrese un código, código de barra o nombre para buscar!!!.');
      return;
    }

    if (!idTerminalWeb) {
      setError('No se pudo determinar la terminal activa.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await productoService.consultarStockProducto(busqueda, idTerminalWeb);
      setProductos(data);
      setSearched(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al buscar el stock del producto.');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarTodos = async () => {
    if (!idTerminalWeb) {
      setError('No se pudo determinar la terminal activa.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await productoService.consultarStockProducto('', idTerminalWeb);
      setProductos(data);
      setSearched(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al consultar todos los productos.');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setBusqueda('');
    setProductos([]);
    setError('');
    setSearched(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBuscar();
    }
  };

  // Función para determinar el estilo de fondo y texto según el stock
  const getStockStyle = (stock: number) => {
    if (stock > 0) {
      return {
        backgroundColor: '#e2f0d9', // Verdoso claro
        color: '#2e7d32',          // Verde oscuro
        fontWeight: 'bold',
        padding: '6px 12px',
        borderRadius: '16px',
        display: 'inline-block',
      };
    } else if (stock === 0) {
      return {
        backgroundColor: '#fff2cc', // Amarillo claro
        color: '#856404',          // Amarillo oscuro/marrón
        fontWeight: 'bold',
        padding: '6px 12px',
        borderRadius: '16px',
        display: 'inline-block',
      };
    } else {
      return {
        backgroundColor: '#fce4d6', // Rojo claro
        color: '#c00000',          // Rojo oscuro
        fontWeight: 'bold',
        padding: '6px 12px',
        borderRadius: '16px',
        display: 'inline-block',
      };
    }
  };

  return (
    <RequirePermission permission="VER_STOCK">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1.5 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#1a365d' }}>
            Consulta de Stock
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          {/* Barra de Búsqueda */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Buscar Producto (Código, Código de Barra o Nombre)"
                placeholder="Escriba aquí para buscar y presione Enter..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={7} sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleBuscar}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                Buscar
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleBuscarTodos}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1,
                  backgroundColor: '#475569',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#334155',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                Consultar Todos
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleLimpiar}
                disabled={loading}
                startIcon={<CloseIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  minWidth: '100px',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                    borderColor: '#94a3b8',
                  }
                }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Tabla de Detalle */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress size={40} />
            </Box>
          ) : productos.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Producto / Mercadería</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Depósito</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#334155' }}>Stock Actual</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productos.map((prod: any) => (
                    <TableRow
                      key={prod.idStock}
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f1f5f9',
                        },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{prod.codigo}</TableCell>
                      <TableCell>{prod.nombreMercaderia}</TableCell>
                      <TableCell>{prod.nombreDeposito}</TableCell>
                      <TableCell align="right">
                        <Box sx={getStockStyle(Number(prod.stockActual))}>
                          {prod.stockActual}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            searched && (
              <Box sx={{ textAlign: 'center', py: 5, color: '#64748b' }}>
                <Typography variant="body1">
                  No se encontraron productos en stock para el criterio "{busqueda}".
                </Typography>
              </Box>
            )
          )}
        </Paper>
      </Box>
    </RequirePermission>
  );
};

export default ConsultaStock;