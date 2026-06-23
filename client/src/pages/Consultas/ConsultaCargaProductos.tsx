import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PrintIcon from '@mui/icons-material/Print';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { consultaCargaProductosService } from '../../services/consultaCargaProductos.service';
import type { CargaCabecera, CargaDetalle, CargaNavigation } from '../../services/consultaCargaProductos.service';
import SearchCargaProductoModal from '../../components/SearchCargaProductoModal';
import { useTerminal } from '../../hooks/useTerminal';

const ConsultaCargaProductos: React.FC = () => {
  // Estado de la terminal (para la sucursal)
  const { nombreSucursal } = useTerminal() as any;

  // Estados de datos
  const [cabecera, setCabecera] = useState<CargaCabecera | null>(null);
  const [detalles, setDetalles] = useState<CargaDetalle[]>([]);
  const [navigation, setNavigation] = useState<CargaNavigation>({
    idMin: null,
    idMax: null,
    idPrev: null,
    idNext: null,
  });

  // Estados de control
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Cargar información de la carga de producto
  const cargarCarga = async (idCargaProducto?: number) => {
    setIsLoading(true);
    setError('');
    setInfoMsg('');
    try {
      const response = await consultaCargaProductosService.consultaInformacionCarga(idCargaProducto);
      if (response.success) {
        setCabecera(response.cabecera);
        setDetalles(response.detalle);
        setNavigation(response.navigation);
        if (!response.cabecera) {
          setError('No se encontraron registros de Carga de Productos.');
        }
      } else {
        throw new Error('Error al cargar la información.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al obtener la información de la carga de producto.');
      setCabecera(null);
      setDetalles([]);
      setNavigation({ idMin: null, idMax: null, idPrev: null, idNext: null });
    } finally {
      setIsLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    cargarCarga();
  }, []);

  // Formato de moneda
  const formatMoneda = (val: number) => {
    return val.toLocaleString('es-PY', {  currency: 'PYG', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Suma total
  const totalCarga = detalles.reduce((sum, d) => sum + d.subtotal, 0);

  // Manejo de Impresión (Visual por el momento)
  const handleImprimir = () => {
    setInfoMsg('Todavía no tiene un reporte creado, por ahora esta opción es solo visual.');
    setTimeout(() => setInfoMsg(''), 4000);
  };

  // Comprobar si está anulado
  const isAnulado = cabecera ? (!!cabecera.responsableAnula || !!cabecera.explica || !!cabecera.fechaAnula) : false;

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      
      {/* Título de la consulta */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Consulta de Carga de Producto {cabecera && `#${cabecera.idCargaProducto}`}
        </Typography>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
      {infoMsg && <Alert severity="info" onClose={() => setInfoMsg('')}>{infoMsg}</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
          
          {/* Cabecera / Cargado por */}
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Cargado por:</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {cabecera?.responsableCarga || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {cabecera?.fechaCarga ? new Date(cabecera.fechaCarga).toLocaleString('es-PY') : '—'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Panel de Anulación (Solo si está anulado) */}
          {isAnulado && cabecera && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: '#f44336', backgroundColor: '#ffebee' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#d32f2f' }}>
                <WarningAmberIcon />
                <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                  Anulado
                </Typography>
              </Box>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Anulado por:</Typography>
                  <Typography variant="body2" fontWeight={600}>{cabecera.responsableAnula || '—'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {cabecera.fechaAnula ? new Date(cabecera.fechaAnula).toLocaleString('es-PY') : '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Motivo:</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{cabecera.explica || '—'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Tabla de Detalle */}
          <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TableContainer sx={{ flex: 1, maxHeight: '100%' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>Nro</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd', textAlign: 'right' }}>Costo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd', textAlign: 'right' }}>Cant.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#e3f2fd', textAlign: 'right' }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.map((d) => (
                    <TableRow key={d.Nro} hover>
                      <TableCell>{d.Nro}</TableCell>
                      <TableCell>{d.codigo}</TableCell>
                      <TableCell>{d.nombreProducto}</TableCell>
                      <TableCell align="right">{formatMoneda(d.costo)}</TableCell>
                      <TableCell align="right">{d.cantidad}</TableCell>
                      <TableCell align="right">{formatMoneda(d.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                  {detalles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography color="text.disabled">No hay datos para esta carga.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Carga (Al final abajo del detalle) */}
            {detalles.length > 0 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                <Typography variant="h6" fontWeight={700}>
                  Total Carga: {formatMoneda(totalCarga)}
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Controles: Sucursal, Buscar, Imprimir */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Empresa Contable:</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ backgroundColor: '#eeeeee', px: 1.5, py: 0.5, borderRadius: 1 }}>
                [ {nombreSucursal || 'Sucursal Central'} ]
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => setIsSearchOpen(true)}
              >
                Buscar
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handleImprimir}
              >
                Imprimir
              </Button>
            </Stack>
          </Box>

          {/* Botones de navegación (Mínimo, Atrás, Adelante, Máximo) */}
          <Box sx={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid #eee', pt: 1.5 }}>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Mínimo ID">
                <span>
                  <IconButton
                    disabled={!navigation.idMin || cabecera?.idCargaProducto === navigation.idMin}
                    onClick={() => navigation.idMin && cargarCarga(navigation.idMin)}
                  >
                    <FirstPageIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Atrás (1 ID)">
                <span>
                  <IconButton
                    disabled={!navigation.idPrev}
                    onClick={() => navigation.idPrev && cargarCarga(navigation.idPrev)}
                  >
                    <NavigateBeforeIcon />
                  </IconButton>
                </span>
              </Tooltip>

              {cabecera && (
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    Carga {cabecera.idCargaProducto}
                  </Typography>
                </Box>
              )}

              <Tooltip title="Adelante (1 ID)">
                <span>
                  <IconButton
                    disabled={!navigation.idNext}
                    onClick={() => navigation.idNext && cargarCarga(navigation.idNext)}
                  >
                    <NavigateNextIcon />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Máximo ID">
                <span>
                  <IconButton
                    disabled={!navigation.idMax || cabecera?.idCargaProducto === navigation.idMax}
                    onClick={() => navigation.idMax && cargarCarga(navigation.idMax)}
                  >
                    <LastPageIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Box>

        </Box>
      )}

      {/* Modal de Búsqueda */}
      <SearchCargaProductoModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCarga={(id) => cargarCarga(id)}
      />

    </Box>
  );
};

export default ConsultaCargaProductos;
