import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import SidebarLayout from './components/SideBar/SidebarLayout';
import { Container, CircularProgress, Box } from '@mui/material';
import AuthLayout from './Layout/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded page components
const ABM = lazy(() => import('./pages/ABM'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Facturacion = lazy(() => import('./pages/Facturacion'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const PersonasABM = lazy(() => import('./pages/ABM/PersonasABM'));
const ProductosABM = lazy(() => import('./pages/ABM/ProductosABM'));
const Pedidos = lazy(() => import('./pages/Pedidos'));
const Precobranza = lazy(() => import('./pages/Cobranzas/Precobranza'));
const Cobranza = lazy(() => import('./pages/Cobranzas/Cobranza'));
const Compras = lazy(() => import('./pages/Compras/Compras'));
const Remisiones = lazy(() => import('./pages/Remisiones'));
const RecepcionesPendientes = lazy(() => import('./pages/RecepcionesPendientes'));
const GenerarPedidoInterno = lazy(() => import('./pages/PedidoInterno/GenerarPedidoInterno'));
const ConsultaPedidoInterno = lazy(() => import('./pages/PedidoInterno/ConsultaPedidoInterno'));
const PlanillaPacientes = lazy(() => import('./pages/Sanatorio/PlanillaPacientes'));
const PlanillaFuncionarios = lazy(() => import('./pages/Sanatorio/PlanillaFuncionarios'));
const Ajustes = lazy(() => import('./pages/Mercaderia/Ajustes'));
const Auditoria = lazy(() => import('./pages/Auditoria/Auditoria'));
const Roles = lazy(() => import('./pages/Administracion/Roles'));
const UsuariosABM = lazy(() => import('./pages/Administracion/UsuariosABM'));
const TerminalesABM = lazy(() => import('./pages/Administracion/TerminalesABM'));
const StockInicial = lazy(() => import('./pages/Mercaderia/StockInicial'));
const CargaProductos = lazy(() => import('./pages/Mercaderia/CargaProductos'));
const ArqueoCaja = lazy(() => import('./pages/Caja/ArqueoCaja'));
const ConsultaVentas = lazy(() => import('./pages/Consultas/ConsultaVentas'));
const ConsultaCargaProductos = lazy(() => import('./pages/Consultas/ConsultaCargaProductos'));
const Reportes = lazy(() => import('./pages/Reportes/Reportes'));
const CrearOferta = lazy(() => import('./pages/Ofertas/CrearOferta'));
const VerOfertas = lazy(() => import('./pages/Ofertas/VerOfertas'));
const ConsultaStock = lazy(() => import('./pages/Mercaderia/ConsultaStock'));
const ImpresionCodigoBarra = lazy(() => import('./pages/Mercaderia/ImpresionCodigoBarra'));
const GeneracionCodigoBarra = lazy(() => import('./pages/Mercaderia/GeneracionCodigoBarra'));


// Placeholder components for sub-routes
const ClientesABM = () => <Container><h3>Submenú Clientes (ABM)</h3></Container>;
const FacturacionClientes = () => <Container><h3>Submenú Facturación (Clientes)</h3></Container>;

// Loader component for suspense fallback
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
  </Box>
);

const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Ruta de login */}
        <Route path="/login" element={<AuthLayout />}>
          <Route index element={<LoginPage />} />
        </Route>

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SidebarLayout>
                <Outlet />
              </SidebarLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<h2>Bienvenido al Sistema</h2>} />
          <Route path="abm" element={<ABM />}>
            <Route path="personas" element={<PersonasABM />} />
            <Route path="productos" element={<ProductosABM />} />
            <Route path="clientes" element={<ClientesABM />} />
          </Route>
          <Route path="clientes" element={<Clientes />}>
            <Route path="facturacion-clientes" element={<FacturacionClientes />} />
          </Route>
          <Route path="facturacion" element={<Facturacion />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="cobranzas">
            <Route path="precobranza" element={<Precobranza />} />
            <Route path="cobranza" element={<Cobranza />} />
          </Route>
          <Route path="caja">
            <Route path="arqueo" element={<ArqueoCaja />} />
          </Route>
          <Route path="compras" element={<Compras />} />
          <Route path="remisiones" element={<Remisiones />} />
          <Route path="recepciones-pendientes" element={<RecepcionesPendientes />} />
          <Route path="pedido-interno">
            <Route path="generar" element={<GenerarPedidoInterno />} />
            <Route path="consulta" element={<ConsultaPedidoInterno />} />
          </Route>
          <Route path="mercaderia">
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="stock-inicial" element={<StockInicial />} />
            <Route path="carga-productos" element={<CargaProductos />} />
            <Route path="consulta-stock" element={<ConsultaStock />} />
            <Route path="generacion-codigo-barra" element={<GeneracionCodigoBarra />} />
            <Route path="impresion-codigo-barra" element={<ImpresionCodigoBarra />} />
          </Route>
          <Route path="sanatorio">
            <Route path="pacientes" element={<PlanillaPacientes />} />
            <Route path="funcionarios" element={<PlanillaFuncionarios />} />
          </Route>
          <Route path="oferta">
            <Route path="crear" element={<CrearOferta />} />
            <Route path="ver" element={<VerOfertas />} />
          </Route>
          <Route path="auditoria" element={<Auditoria />} />
          <Route path="consultas">
            <Route path="ventas" element={<ConsultaVentas />} />
            <Route path="carga-productos" element={<ConsultaCargaProductos />} />
          </Route>
          <Route path="reportes" element={<Reportes />} />
          <Route path="administracion">
            <Route path="roles" element={<Roles />} />
            <Route path="usuarios" element={<UsuariosABM />} />
            <Route path="terminales" element={<TerminalesABM />} />
          </Route>
        </Route>

        {/* Redirección por defecto al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;