import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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

// Lazy-loaded pages (large or with heavy dependencies)
const EditorPage = lazy(() => import('./pages/EditorPage'));
const IntervencionDetailPage = lazy(() => import('./pages/IntervencionDetailPage'));
const InformeFormPage = lazy(() => import('./pages/InformeFormPage'));
const SistemaDetailPage = lazy(() => import('./pages/SistemaDetailPage'));

function EditorLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Ruta publica */}
      <Route path="/login" element={<Login />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        {/* Editor — pantalla completa, fuera de AppShell */}
        <Route
          path="/modelos/:modeloId/versiones/:versionId/editor"
          element={
            <Suspense fallback={<EditorLoader />}>
              <EditorPage />
            </Suspense>
          }
        />

        {/* App normal con sidebar + header */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/fabricantes" element={<FabricantesPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClienteDetailPage />} />
          <Route
            path="/sistemas/:id"
            element={
              <Suspense fallback={<EditorLoader />}>
                <SistemaDetailPage />
              </Suspense>
            }
          />
          <Route path="/modelos" element={<ModelosPage />} />
          <Route path="/intervenciones" element={<IntervencionesPage />} />
          <Route
            path="/intervenciones/:id"
            element={
              <Suspense fallback={<EditorLoader />}>
                <IntervencionDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/informes/:id"
            element={
              <Suspense fallback={<EditorLoader />}>
                <InformeFormPage />
              </Suspense>
            }
          />
          <Route path="/catalogos" element={<CatalogosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Route>

      {/* Cualquier otra ruta redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
