import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress,
  TextField,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { consultaCargaProductosService } from '../services/consultaCargaProductos.service';

interface SearchCargaProductoModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCarga: (idCargaProducto: number) => void;
}

interface CargaResultado {
  idCargaProducto: number;
  responsableCarga: string;
  fechaCarga: string;
  activo: boolean;
  motivoAnula: string | null;
  fechaAnula: string | null;
}

const SearchCargaProductoModal: React.FC<SearchCargaProductoModalProps> = ({
  open,
  onClose,
  onSelectCarga,
}) => {
  const [idCarga, setIdCarga] = useState('');
  const [fechaDesde, setFechaDesde] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 días atrás
  );
  const [fechaHasta, setFechaHasta] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [cargas, setCargas] = useState<CargaResultado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuscar = async () => {
    setIsLoading(true);
    setError('');
    try {
      let response;
      if (idCarga.trim()) {
        const parsedId = parseInt(idCarga, 10);
        if (isNaN(parsedId)) {
          throw new Error('El ID de carga debe ser un número válido.');
        }
        response = await consultaCargaProductosService.buscarCargas({ idCargaProducto: parsedId });
      } else {
        response = await consultaCargaProductosService.buscarCargas({
          desde: fechaDesde,
          hasta: fechaHasta,
        });
      }

      if (response.success) {
        setCargas(response.result);
        if (response.result.length === 0) {
          setError('No se encontraron cargas de productos con los criterios ingresados.');
        }
      } else {
        throw new Error('Error al buscar cargas.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al buscar las cargas de productos.');
      setCargas([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar por defecto al abrir
  useEffect(() => {
    if (open) {
      setIdCarga('');
      setError('');
      handleBuscar();
    }
  }, [open]);

  const handleRowClick = (carga: CargaResultado) => {
    onSelectCarga(carga.idCargaProducto);
    onClose();
  };

  const getEstadoLabel = (carga: CargaResultado) => {
    return carga.activo && !carga.motivoAnula ? 'ACTIVO' : 'ANULADO';
  };

  const getEstadoColor = (carga: CargaResultado) => {
    return carga.activo && !carga.motivoAnula ? 'success' : 'error';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '400px',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Buscar Carga de Producto
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Filtros */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="ID Carga"
            size="small"
            value={idCarga}
            onChange={(e) => {
              setIdCarga(e.target.value);
              // Si escribe en ID, deshabilita las fechas visualmente (opcional)
            }}
            placeholder="Ej: 136"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setIdCarga(''); // Limpiar ID si se usan fechas
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            disabled={!!idCarga.trim()}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setIdCarga(''); // Limpiar ID si se usan fechas
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
            disabled={!!idCarga.trim()}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleBuscar}
            disabled={isLoading}
            sx={{ px: 3, height: 40 }}
          >
            Buscar
          </Button>
        </Stack>

        {/* Mensaje de error / advertencia */}
        {error && <Alert severity="info">{error}</Alert>}

        {/* Tabla de resultados */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflow: 'auto', maxHeight: '350px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Cargado Por</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>Fecha de Carga</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', textAlign: 'center' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cargas.map((carga) => (
                  <TableRow
                    key={carga.idCargaProducto}
                    hover
                    onClick={() => handleRowClick(carga)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{carga.idCargaProducto}</TableCell>
                    <TableCell>{carga.responsableCarga}</TableCell>
                    <TableCell>{new Date(carga.fechaCarga).toLocaleString('es-PY')}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getEstadoLabel(carga)}
                        color={getEstadoColor(carga)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {cargas.length === 0 && !error && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        Haga clic en Buscar para cargar los registros.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchCargaProductoModal;
