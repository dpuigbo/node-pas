import { Routes, Route } from 'react-router-dom';
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
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="fabricantes" element={<FabricantesPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="clientes/:id" element={<ClienteDetailPage />} />
        <Route path="modelos" element={<ModelosPage />} />
        <Route path="intervenciones" element={<IntervencionesPage />} />
        <Route path="catalogos" element={<CatalogosPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>
    </Routes>
  );
}
