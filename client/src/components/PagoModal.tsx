import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField as MuiTextField,
} from '@mui/material';
import { ventaService } from '../services/venta.service';

interface PagoModalProps {
  open: boolean;
  totalVenta: number;
  onClose: () => void;
  onConfirm: (idVendedor: number | null) => void;
}

const PagoModal: React.FC<PagoModalProps> = ({
  open,
  totalVenta,
  onClose,
  onConfirm,
}) => {
  const [montoCliente, setMontoCliente] = useState<string>('');
  const [vuelto, setVuelto] = useState<number>(0);
  const [vendedores, setVendedores] = useState<{ idVendedor: number; nombre: string }[]>([]);
  const [selectedVendedorId, setSelectedVendedorId] = useState<number | ''>('');
  const [loadingVendedores, setLoadingVendedores] = useState<boolean>(false);

  const guardarButtonRef = useRef<HTMLButtonElement>(null);
  const montoInputRef = useRef<HTMLInputElement>(null);
  const vendedorSelectRef = useRef<HTMLSelectElement>(null);

  // Helper to format string with dots as thousands separator
  const formatThousands = (valStr: string): string => {
    const clean = valStr.replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Helper to parse formatted string to number
  const parseMonto = (valStr: string): number => {
    const clean = valStr.replace(/\./g, '');
    return parseFloat(clean) || 0;
  };

  // Calcular el vuelto cuando cambia el monto del cliente
  useEffect(() => {
    const monto = parseMonto(montoCliente);
    const vueltoCalculado = monto - totalVenta;
    setVuelto(vueltoCalculado >= 0 ? vueltoCalculado : 0);
  }, [montoCliente, totalVenta]);

  // Cargar vendedores y resetear estados al abrir el modal
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        setLoadingVendedores(true);
        const res = await ventaService.obtenerVendedores();
        if (res.success && res.data) {
          setVendedores(res.data);
        }
      } catch (error) {
        console.error('Error al cargar vendedores:', error);
      } finally {
        setLoadingVendedores(false);
      }
    };

    if (open) {
      setMontoCliente('');
      setVuelto(0);
      setSelectedVendedorId('');
      fetchVendedores();

      // Foco automático en el textbox de monto del cliente
      setTimeout(() => {
        if (montoInputRef.current) {
          montoInputRef.current.focus();
        }
      }, 150);
    }
  }, [open]);

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    const formatted = formatThousands(rawVal);
    setMontoCliente(formatted);
  };

  const handleConfirm = () => {
    if (selectedVendedorId !== '') {
      onConfirm(Number(selectedVendedorId));
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          Finalizar Venta
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {/* Monto del Cliente */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Monto del Cliente:
            </Typography>
            <MuiTextField
              fullWidth
              value={montoCliente}
              onChange={handleMontoChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (vendedorSelectRef.current) {
                    vendedorSelectRef.current.focus();
                  }
                }
              }}
              placeholder="0"
              inputProps={{
                ref: montoInputRef
              }}
              InputProps={{
                sx: {
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }
              }}
              helperText="Ingrese el monto recibido del cliente (se formatearán los miles automáticamente)"
            />
          </Box>

          {/* Total de la Venta */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Total de la Venta:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: '#e3f2fd',
                textAlign: 'right'
              }}
            >
              <Typography variant="h4" fontWeight="bold" color="primary">
                {formatCurrency(totalVenta)}
              </Typography>
            </Paper>
          </Box>

          {/* Vuelto */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Vuelto:
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: '#fff9c4',
                textAlign: 'right'
              }}
            >
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {formatCurrency(vuelto)}
              </Typography>
            </Paper>
          </Box>

          {/* Vendedor Combobox */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Vendedor:
            </Typography>
            <FormControl fullWidth required error={selectedVendedorId === ''}>
              <InputLabel id="vendedor-select-label">Seleccione un Vendedor</InputLabel>
              <Select
                labelId="vendedor-select-label"
                id="vendedor-select"
                value={selectedVendedorId}
                label="Seleccione un Vendedor"
                onChange={(e) => setSelectedVendedorId(e.target.value as number)}
                inputRef={vendedorSelectRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedVendedorId !== '') {
                      handleConfirm();
                    }
                  }
                }}
                disabled={loadingVendedores}
              >
                {vendedores.map((v) => (
                  <MenuItem key={v.idVendedor} value={v.idVendedor}>
                    {v.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          ref={guardarButtonRef}
          onClick={handleConfirm}
          variant="contained"
          color="success"
          size="large"
          fullWidth
          disabled={selectedVendedorId === '' || loadingVendedores}
          sx={{ py: 1.5 }}
        >
          {loadingVendedores ? 'Cargando Vendedores...' : 'Aceptar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagoModal;
