import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import UppercaseTextField from './UppercaseTextField';
import { anulacionService } from '../services/anulacion.service';
import useTerminal from '../hooks/useTerminal';
import BlockIcon from '@mui/icons-material/Block';
import axios from 'axios';

interface AnulacionModalProps {
  open: boolean;
  onClose: () => void;
  idVenta: number;
  tipoVenta: string;
  onSuccess: () => void;
}

const AnulacionModal: React.FC<AnulacionModalProps> = ({
  open,
  onClose,
  idVenta,
  tipoVenta,
  onSuccess,
}) => {
  const { idTerminalWeb, idSucursal } = useTerminal();

  const [reason, setReason] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const reasonInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening modal
  useEffect(() => {
    if (open) {
      setReason('');
      setUsername('');
      setPassword('');
      setError('');
      setLoading(false);
      setTimeout(() => {
        if (reasonInputRef.current) {
          reasonInputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleAnular = async () => {
    // Validar campos locales primero
    if (!reason.trim()) {
      setError('Por favor, explique el motivo de la anulación.');
      return;
    }
    if (!username.trim()) {
      setError('Por favor, ingrese el usuario autorizador.');
      return;
    }
    if (!password) {
      setError('Por favor, ingrese la contraseña del autorizador.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Validar usuario y contraseña (misma validación que el login)
      const loginResponse = await axios.post('/api/auth/login', {
        username: username.trim(),
        password: password,
      });

      if (!loginResponse.data.success || !loginResponse.data.user) {
        throw new Error(loginResponse.data.message || 'Usuario o contraseña incorrectos.');
      }

      const idUsuario = loginResponse.data.user.idUsuario;

      // 2. Validar permiso de anulación (sp_permisoAnular)
      // Pasamos el idUsuario obtenido y el tipo 'FACT'
      const tienePermiso = await anulacionService.verificarPermisoAnular(idUsuario, 'FACT');

      if (!tienePermiso) {
        // "el validarAnulacion si es que el usuario no está validado para anular eso devuelve un 0 y debe avisar el sistema que el usuario no esta validado"
        setError('El usuario ingresado no está validado para realizar anulaciones.');
        setLoading(false);
        return;
      }

      // 3. Determinar tipo de anulación (1 = Factura impresa, 2 = Remito/CVE)
      // Si el nombre de tipo de venta tiene remito, CVE o similar, enviamos 2
      const tipoAnulacion = tipoVenta?.toUpperCase().includes('REMITO') || tipoVenta?.toUpperCase().includes('CVE') ? 2 : 1;

      if (!idTerminalWeb || !idSucursal) {
        throw new Error('La terminal o sucursal no están configuradas correctamente.');
      }

      // 4. Proceder con la anulación
      await anulacionService.anularFacturacion({
        idVenta,
        idTerminalWeb,
        idSucursal,
        idUsuarioAlta: idUsuario,
        explica: reason.trim(),
        tipo: tipoAnulacion,
      });

      // 5. Éxito
      onSuccess();
    } catch (err: any) {
      console.error('Error durante el flujo de anulación:', err);
      const errMsg = err.response?.data?.message || err.message || 'Ocurrió un error al procesar la solicitud.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 8,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              p: 1.5,
              backgroundColor: '#ffebee',
              borderRadius: '50%',
              color: 'error.main',
              display: 'flex',
            }}
          >
            <BlockIcon fontSize="large" />
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
            Confirmar Anulación
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta acción revertirá la facturación seleccionada (Venta ID: {idVenta}).
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Motivo de la anulación (TextBox multiline arriba) */}
          <TextField
            fullWidth
            label="Motivo de la anulación"
            multiline
            rows={3}
            placeholder="Explique la razón de la anulación..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            inputRef={reasonInputRef}
            required
            variant="outlined"
          />

          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>
            Credenciales
          </Typography>

          {/* Usuario del autorizador */}
          <UppercaseTextField
            fullWidth
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            variant="outlined"
            placeholder="SUPERVISOR"
            autoComplete="off"
          />

          {/* Contraseña del autorizador */}
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAnular();
              }
            }}
            disabled={loading}
            required
            variant="outlined"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          onClick={handleAnular}
          variant="contained"
          color="error"
          size="large"
          fullWidth
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 'bold', textTransform: 'none', borderRadius: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar y Anular'}
        </Button>
        <Button
          onClick={onClose}
          variant="text"
          color="inherit"
          fullWidth
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnulacionModal;
