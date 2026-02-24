import { lazy, Suspense, type ComponentType } from 'react';
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
import ConsumiblesNivelPage from './pages/ConsumiblesNivelPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import OfertasPage from './pages/OfertasPage';
import PlantillasPage from './pages/PlantillasPage';

/**
 * Lazy import with auto-reload on chunk load failure.
 * When a new deploy changes chunk hashes, old references break.
 * This catches the error and does a single page reload to get fresh assets.
 */
function lazyRetry(factory: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(() =>
    factory().catch(() => {
      // Avoid infinite reload loops — only reload once per session
      const key = 'chunk-reload-' + window.location.pathname;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      // Return empty component if already tried reloading
      return { default: () => null } as { default: ComponentType<any> };
    }),
  );
}

// Lazy-loaded pages (large or with heavy dependencies)
const EditorPage = lazyRetry(() => import('./pages/EditorPage'));
const ModeloDetailPage = lazyRetry(() => import('./pages/ModeloDetailPage'));
const IntervencionDetailPage = lazyRetry(() => import('./pages/IntervencionDetailPage'));
const InformeFormPage = lazyRetry(() => import('./pages/InformeFormPage'));
const SistemaDetailPage = lazyRetry(() => import('./pages/SistemaDetailPage'));
const DocumentTemplateEditorPage = lazyRetry(() => import('./pages/DocumentTemplateEditorPage'));
const InformePreviewPage = lazyRetry(() => import('./pages/InformePreviewPage'));

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

        {/* Document template editor — pantalla completa, fuera de AppShell */}
        <Route
          path="/document-templates/:id/editor"
          element={
            <Suspense fallback={<EditorLoader />}>
              <DocumentTemplateEditorPage />
            </Suspense>
          }
        />

        {/* Report preview — pantalla completa, fuera de AppShell */}
        <Route
          path="/informes/:id/preview"
          element={
            <Suspense fallback={<EditorLoader />}>
              <InformePreviewPage />
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
          <Route
            path="/modelos/:modeloId"
            element={
              <Suspense fallback={<EditorLoader />}>
                <ModeloDetailPage />
              </Suspense>
            }
          />
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
          <Route path="/ofertas" element={<OfertasPage />} />
          <Route path="/catalogos" element={<CatalogosPage />} />
          <Route path="/consumibles-nivel" element={<ConsumiblesNivelPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/configuracion/plantillas" element={<PlantillasPage />} />
        </Route>
      </Route>

      {/* Cualquier otra ruta redirige al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
