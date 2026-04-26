import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, CheckCircle, XCircle, Trash2, RefreshCw, Calendar,
  ArrowRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import {
  useOferta, useUpdateEstadoOferta, useRecalcularOferta,
  useGenerarIntervencion, useDeleteOferta,
} from '@/hooks/useOfertas';
import { MantenimientoComponentes } from '@/components/ofertas/MantenimientoComponentes';
import { CalendarioPlanificacion } from '@/components/ofertas/CalendarioPlanificacion';
import { ResumenOferta } from '@/components/ofertas/ResumenOferta';
import { DatosOfertaTab } from '@/components/ofertas/DatosOfertaTab';

const ESTADO_BADGE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
};

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const TIPO_BADGE: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700',
  correctiva: 'bg-orange-100 text-orange-700',
};

export default function OfertaEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const ofertaId = id ? Number(id) : 0;
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: oferta, isLoading } = useOferta(isNew ? undefined : ofertaId);
  const updateEstado = useUpdateEstadoOferta();
  const recalcular = useRecalcularOferta();
  const deleteOferta = useDeleteOferta();
  const generarIntervencion = useGenerarIntervencion();

  const [fechaDialogOpen, setFechaDialogOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activeTab, setActiveTab] = useState<'datos' | 'componentes' | 'planificacion' | 'resumen'>(
    isNew ? 'datos' : 'componentes'
  );

  // Modo creacion: pagina simplificada con solo Tab 0
  if (isNew) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ofertas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Nueva oferta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rellena los datos basicos. El resto (componentes, planificacion) se configura tras crear.
            </p>
          </div>
        </div>
        <DatosOfertaTab onCreated={(newId) => navigate(`/ofertas/${newId}`)} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!oferta) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Oferta no encontrada.
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/ofertas')}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  const handleEstado = async (estado: string) => {
    try {
      await updateEstado.mutateAsync({ id: ofertaId, estado });
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Eliminar esta oferta?')) return;
    try {
      await deleteOferta.mutateAsync(ofertaId);
      navigate('/ofertas');
    } catch {
      alert('Error al eliminar');
    }
  };

  const handleGenerarIntervencion = async () => {
    if (!fechaInicio || !fechaFin) {
      alert('Selecciona fechas de inicio y fin');
      return;
    }
    try {
      const result = await generarIntervencion.mutateAsync({
        id: ofertaId,
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: new Date(fechaFin).toISOString(),
      });
      setFechaDialogOpen(false);
      const intId = (result as any)?.data?.id;
      if (intId) navigate(`/intervenciones/${intId}`);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al generar intervencion');
    }
  };

  const readOnly = oferta.estado !== 'borrador';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ofertas')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold">{oferta.titulo}</h1>
              <Badge className={ESTADO_BADGE[oferta.estado] ?? ''}>
                {ESTADO_LABEL[oferta.estado] ?? oferta.estado}
              </Badge>
              <Badge className={TIPO_BADGE[oferta.tipo] ?? ''}>{oferta.tipo}</Badge>
              {oferta.tipoOferta === 'solo_limpieza' && (
                <Badge variant="outline" className="text-xs">Solo limpieza</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {oferta.cliente?.nombre}
              {oferta.referencia && ` · Ref. ${oferta.referencia}`}
              {' · '}Validez: {oferta.validezDias} dias
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {oferta.estado === 'borrador' && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleEstado('enviada')}>
                  <Send className="mr-1 h-4 w-4" /> Enviar
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                </Button>
              </>
            )}
            {oferta.estado === 'enviada' && (
              <>
                <Button size="sm" onClick={() => handleEstado('aprobada')}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Aprobar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEstado('rechazada')}>
                  <XCircle className="mr-1 h-4 w-4" /> Rechazar
                </Button>
              </>
            )}
            {oferta.estado === 'aprobada' && (
              <Button size="sm" onClick={() => setFechaDialogOpen(true)}>
                <Calendar className="mr-1 h-4 w-4" /> Generar intervencion
              </Button>
            )}
            {oferta.estado === 'rechazada' && (
              <Button variant="ghost" size="sm" onClick={() => handleEstado('borrador')}>
                Volver a borrador
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try { await recalcular.mutateAsync(ofertaId); } catch { alert('Error al recalcular'); }
              }}
              disabled={recalcular.isPending}
              title="Recalcular precios"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {oferta.notas && (
        <p className="text-sm text-muted-foreground border-l-2 pl-3 max-w-3xl">{oferta.notas}</p>
      )}

      {/* Tabs navigation */}
      <div className="border-b flex gap-1 flex-wrap">
        {[
          { key: 'datos', label: '0. Datos' },
          { key: 'componentes', label: '1. Componentes y niveles' },
          { key: 'planificacion', label: '2. Planificacion' },
          { key: 'resumen', label: '3. Resumen' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pb-12">
        {activeTab === 'datos' && (
          <DatosOfertaTab oferta={oferta} readOnly={readOnly} />
        )}
        {activeTab === 'componentes' && (
          <MantenimientoComponentes ofertaId={oferta.id} readOnly={readOnly} />
        )}
        {activeTab === 'planificacion' && (
          <CalendarioPlanificacion
            ofertaId={oferta.id}
            fechaInicio={oferta.fechaInicio}
            fechaFin={oferta.fechaFin}
            readOnly={readOnly}
          />
        )}
        {activeTab === 'resumen' && <ResumenOferta ofertaId={oferta.id} oferta={oferta} />}
      </div>

      {/* Fecha dialog (solo para generar intervencion) */}
      <Dialog open={fechaDialogOpen} onOpenChange={setFechaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar intervencion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduce las fechas para la intervencion. Se creara con los mismos sistemas y niveles de la oferta.
            </p>
            <div>
              <Label>Fecha inicio</Label>
              <Input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFechaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleGenerarIntervencion} disabled={generarIntervencion.isPending}>
              <ArrowRight className="mr-1 h-4 w-4" />
              {generarIntervencion.isPending ? 'Generando...' : 'Generar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
