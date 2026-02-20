import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import FabricantesPage from './pages/FabricantesPage';
import ClientesPage from './pages/ClientesPage';
import ClienteDetailPage from './pages/ClienteDetailPage';
import ModelosPage from './pages/ModelosPage';
import IntervencionesPage from './pages/IntervencionesPage';
import CatalogosPage from './pages/CatalogosPage';
import ConfiguracionPage from './pages/ConfiguracionPage';

export default function App() {
  return (
    <Routes>
      {/* Ruta publica */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas — rutas explicitas, sin catch-all */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fabricantes" element={<FabricantesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClienteDetailPage />} />
          <Route path="/modelos" element={<ModelosPage />} />
          <Route path="/intervenciones" element={<IntervencionesPage />} />
          <Route path="/catalogos" element={<CatalogosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Route>

      {/* Cualquier otra ruta redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
