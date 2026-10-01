import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import RequirePermission from '../../components/RequirePermission';
import SearchClienteModal from '../../components/SearchClienteModal';
import { useTerminal } from '../../hooks/useTerminal';
import { historialClienteService } from '../../services/historialCliente.service';
import type { HistorialVenta, DetalleVentaHistorial } from '../../types/historialCliente.types';

interface ClienteSeleccionado {
  idCliente: number;
  nombreCliente: string;
  ruc: string;
  dv: string;
}

type FiltroTipo = 'todos' | 'factura' | 'remito';

// ── Helpers ─────────────────────────────────
const formatMoneda = (v: number | null | undefined) => `${(v ?? 0).toLocaleString('es-PY')}`;
// La fecha llega como ISO (columna date); se toma la parte yyyy-mm-dd para evitar corrimientos de zona horaria
const fechaISO = (f: string) => (f ? String(f).substring(0, 10) : '');
const formatFecha = (f: string) => {
  const [y, m, d] = fechaISO(f).split('-');
  return y ? `${d}/${m}/${y}` : '';
};

const sectionLabel = (text: string) => (
  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
    {text}
  </Typography>
);

const ResumenCard: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <Paper variant="outlined" sx={{ p: 1.5, flex: 1, minWidth: 160 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={700}>{value}</Typography>
    {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
  </Paper>
);

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
const HistorialCliente: React.FC = () => {
  const { idTerminalWeb } = useTerminal();

  const [openClienteModal, setOpenClienteModal] = useState(false);
  const [cliente, setCliente] = useState<ClienteSeleccionado | null>(null);

  // ── Resultados ─────────────────────────────
  const [ventas, setVentas] = useState<HistorialVenta[]>([]);
  const [selectedVenta, setSelectedVenta] = useState<HistorialVenta | null>(null);
  const [detalles, setDetalles] = useState<DetalleVentaHistorial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
  const [error, setError] = useState('');

  // ── Filtro local ───────────────────────────
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<FiltroTipo>('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // ── Handlers ───────────────────────────────
  const handleClienteSelected = async (c: ClienteSeleccionado) => {
    setOpenClienteModal(false);
    setCliente(c);
    setVentas([]);
    setSelectedVenta(null);
    setDetalles([]);
    setError('');

    if (!idTerminalWeb) {
      setError('La terminal no está validada.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await historialClienteService.cargarHistorial(idTerminalWeb, c.idCliente);
      setVentas(result || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el historial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVenta = async (venta: HistorialVenta) => {
    setSelectedVenta(venta);
    setDetalles([]);
    setIsLoadingDetalle(true);
    try {
      const result = await historialClienteService.consultarDetalle(venta.idVenta, venta.imp);
      setDetalles(result || []);
    } catch (err: any) {
      setError(err.message || 'Error al consultar el detalle');
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  const limpiarFiltros = () => {
    setTexto('');
    setTipo('todos');
    setFechaDesde('');
    setFechaHasta('');
  };

  // ── Filtrado y resumen ─────────────────────
  const ventasFiltradas = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return ventas.filter((v) => {
      if (tipo === 'factura' && !v.imp) return false;
      if (tipo === 'remito' && v.imp) return false;
      const f = fechaISO(v.fecha);
      if (fechaDesde && f < fechaDesde) return false;
      if (fechaHasta && f > fechaHasta) return false;
      if (t) {
        const campos = [v.factura, v.nombreVendedor, v.nombreTipo, String(v.nro)];
        if (!campos.some((c) => (c ?? '').toLowerCase().includes(t))) return false;
      }
      return true;
    });
  }, [ventas, texto, tipo, fechaDesde, fechaHasta]);

  const resumen = useMemo(() => {
    const activas = ventasFiltradas.filter((v) => v.activo !== 0);
    const total = activas.reduce((s, v) => s + (v.totalVenta ?? 0), 0);
    const ultima = activas.reduce<string>((max, v) => (fechaISO(v.fecha) > max ? fechaISO(v.fecha) : max), '');
    return {
      cantidad: activas.length,
      facturas: activas.filter((v) => v.imp).length,
      remitos: activas.filter((v) => !v.imp).length,
      anuladas: ventasFiltradas.length - activas.length,
      total,
      promedio: activas.length ? Math.round(total / activas.length) : 0,
      ultima,
    };
  }, [ventasFiltradas]);

  const totalDetalle = detalles.reduce((s, d) => s + (d.subtotal ?? 0), 0);

  return (
    <RequirePermission permission="ACCESO_HISTORIAL_CLIENTE">
      <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>

        {/* ── Título ────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonSearchIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Historial de Cliente
          </Typography>
        </Box>

        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

        {/* ── Cliente + filtros ─────────────────── */}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setOpenClienteModal(true)}
              disabled={isLoading}
              sx={{ height: 40, flexShrink: 0 }}
            >
              Buscar cliente
            </Button>
            <Box sx={{ flex: 1 }}>
              {cliente ? (
                <>
                  <Typography fontWeight={600}>{cliente.nombreCliente}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    RUC: {cliente.dv ? `${cliente.ruc}-${cliente.dv}` : cliente.ruc}
                  </Typography>
                </>
              ) : (
                <Typography color="text.disabled">Seleccione un cliente para ver su historial</Typography>
              )}
            </Box>
          </Stack>

          {ventas.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {sectionLabel('Filtrar resultados')}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
                <TextField
                  label="Buscar (factura, vendedor, tipo)"
                  size="small"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  sx={{ minWidth: 240 }}
                />
                <TextField
                  select
                  label="Comprobante"
                  size="small"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as FiltroTipo)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="factura">Factura</MenuItem>
                  <MenuItem value="remito">Remito</MenuItem>
                </TextField>
                <TextField
                  label="Fecha desde"
                  type="date"
                  size="small"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 155 }}
                />
                <TextField
                  label="Fecha hasta"
                  type="date"
                  size="small"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 155 }}
                />
                <Button variant="text" onClick={limpiarFiltros} sx={{ height: 40 }}>
                  Limpiar
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>

        {/* ── Resumen ──────────────────────────── */}
        {ventas.length > 0 && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
            <ResumenCard
              label="Ventas"
              value={String(resumen.cantidad)}
              hint={`${resumen.facturas} factura(s) · ${resumen.remitos} remito(s)${resumen.anuladas ? ` · ${resumen.anuladas} anulada(s)` : ''}`}
            />
            <ResumenCard label="Total comprado" value={formatMoneda(resumen.total)} />
            <ResumenCard label="Ticket promedio" value={formatMoneda(resumen.promedio)} />
            <ResumenCard label="Última compra" value={resumen.ultima ? formatFecha(resumen.ultima) : '-'} />
          </Stack>
        )}

        {/* ── Grid maestro ─────────────────────── */}
        <Paper sx={{ flex: 1, minHeight: 180, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, pb: 0.5 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ventas
              {ventas.length > 0 && (
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'primary.main' }}>
                  ({ventasFiltradas.length} de {ventas.length})
                </Typography>
              )}
            </Typography>
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nro</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Comprobante</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo venta</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vendedor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Descuento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventasFiltradas.map((venta) => {
                  const anulada = venta.activo === 0;
                  const selected = selectedVenta?.idVenta === venta.idVenta && selectedVenta?.imp === venta.imp;
                  return (
                    <TableRow
                      key={`${venta.imp ? 'F' : 'R'}-${venta.idVenta}`}
                      hover
                      selected={selected}
                      onClick={() => handleSelectVenta(venta)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: anulada ? 'rgba(244,67,54,0.05)' : undefined,
                        '& td': anulada ? { color: 'text.disabled' } : undefined,
                        '&.Mui-selected': { backgroundColor: 'action.selected' },
                      }}
                    >
                      <TableCell>{venta.nro}</TableCell>
                      <TableCell>{formatFecha(venta.fecha)}</TableCell>
                      <TableCell>{venta.imp ? venta.factura : 'Remito'}</TableCell>
                      <TableCell>{venta.nombreTipo ?? '-'}</TableCell>
                      <TableCell>{venta.nombreVendedor ?? '-'}</TableCell>
                      <TableCell align="right">{formatMoneda(venta.totalDescuento)}</TableCell>
                      <TableCell align="right">{formatMoneda(venta.totalVenta)}</TableCell>
                      <TableCell align="center">
                        {anulada
                          ? <Chip label="Anulada" color="error" size="small" variant="outlined" />
                          : <Chip label={venta.imp ? 'Factura' : 'Remito'} color={venta.imp ? 'primary' : 'default'} size="small" variant="outlined" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {ventasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Typography color="text.disabled">
                        {isLoading
                          ? 'Cargando historial...'
                          : !cliente
                            ? 'Seleccione un cliente para ver su historial'
                            : ventas.length === 0
                              ? 'El cliente no tiene ventas registradas'
                              : 'Ninguna venta coincide con los filtros'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ── Panel detalle ────────────────────── */}
        <Paper sx={{ flex: 1, minHeight: 180, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Detalle de la venta
            </Typography>
            {selectedVenta && (
              <Typography variant="body2" color="primary.main">
                {selectedVenta.imp ? `Factura ${selectedVenta.factura}` : 'Remito'} · {formatFecha(selectedVenta.fecha)}
              </Typography>
            )}
          </Box>
          <TableContainer sx={{ flex: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nro</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mercadería</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Cantidad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Precio unit.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Precio desc.</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingDetalle ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : detalles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.disabled">
                        {selectedVenta ? 'La venta no tiene productos' : 'Seleccione una venta para ver el detalle'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {detalles.map((d) => (
                      <TableRow key={d.nro}>
                        <TableCell>{d.nro}</TableCell>
                        <TableCell>{d.nombreMercaderia}</TableCell>
                        <TableCell align="right">{d.cantidad}</TableCell>
                        <TableCell align="right">{formatMoneda(d.precioUnitario)}</TableCell>
                        <TableCell align="right">{formatMoneda(d.precioDescuento)}</TableCell>
                        <TableCell align="right">{formatMoneda(d.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5} align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoneda(totalDetalle)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <SearchClienteModal
          open={openClienteModal}
          onClose={() => setOpenClienteModal(false)}
          onClienteSelected={handleClienteSelected}
        />
      </Box>
    </RequirePermission>
  );
};

export default HistorialCliente;
