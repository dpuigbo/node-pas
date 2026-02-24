import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Cog, AlertCircle, X, Settings2, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntervencion, useUpdateIntervencion } from '@/hooks/useIntervenciones';
import { useCrearInformes } from '@/hooks/useInformes';
import { useSistemas } from '@/hooks/useSistemas';
import { useAuth } from '@/hooks/useAuth';

const ESTADO_INFORME_BADGE: Record<string, string> = {
  inactivo: 'bg-gray-100 text-gray-700',
  activo: 'bg-blue-100 text-blue-700',
  finalizado: 'bg-green-100 text-green-700',
};

const ESTADO_INFORME_LABEL: Record<string, string> = {
  inactivo: 'Inactivo',
  activo: 'Activo',
  finalizado: 'Finalizado',
};

const TIPO_BADGE: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700',
  correctiva: 'bg-orange-100 text-orange-700',
};

export default function IntervencionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const intervencionId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: intervencion, isLoading } = useIntervencion(
    intervencionId || undefined,
  );
  const crearInformes = useCrearInformes(intervencionId);
  const updateIntervencion = useUpdateIntervencion();

  const [sistemasDialogOpen, setSistemasDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!intervencion) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Intervencion no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/intervenciones')}>
          Volver a intervenciones
        </Button>
      </div>
    );
  }

  const informes: any[] = intervencion.informes ?? [];
  const sistemas: any[] = intervencion.sistemas ?? [];
  const yaCreados = informes.length > 0 && informes.length >= sistemas.length;

  const handleCrearInformes = async () => {
    try {
      await crearInformes.mutateAsync();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ?? 'Error al crear informes';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/intervenciones')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={intervencion.titulo}
          description={`${intervencion.cliente?.nombre ?? 'Sin cliente'}`}
          actions={
            <div className="flex items-center gap-2">
              <Badge
                className={
                  TIPO_BADGE[intervencion.tipo as string] ??
                  'bg-gray-100 text-gray-700'
                }
              >
                {intervencion.tipo}
              </Badge>
              <Badge variant="outline">{intervencion.estado}</Badge>
            </div>
          }
        />
      </div>

      {/* Info */}
      {intervencion.notas && (
        <p className="text-sm text-muted-foreground">{intervencion.notas}</p>
      )}

      {/* Sistemas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cog className="h-5 w-5" /> Sistemas ({sistemas.length})
          </h2>
          {isAdmin && informes.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSistemasDialogOpen(true)}
              className="gap-1"
            >
              <Settings2 className="h-4 w-4" />
              Gestionar sistemas
            </Button>
          )}
        </div>
        {sistemas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay sistemas asignados a esta intervencion.
            {isAdmin && ' Pulsa "Gestionar sistemas" para asignarlos.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sistemas.map((is: any) => (
              <Card key={is.sistemaId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {is.sistema?.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {is.sistema?.fabricante?.nombre ?? ''} —{' '}
                    {is.sistema?.componentes?.length ?? 0} componentes
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Informes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Informes ({informes.length})
          </h2>
          {isAdmin && !yaCreados && sistemas.length > 0 && (
            <Button
              onClick={handleCrearInformes}
              disabled={crearInformes.isPending}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              {crearInformes.isPending ? 'Creando...' : 'Crear Informes'}
            </Button>
          )}
        </div>

        {informes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {sistemas.length === 0
              ? 'Asigna sistemas a la intervencion primero.'
              : isAdmin
                ? 'Pulsa "Crear Informes" para generar los informes de cada sistema.'
                : 'Todavia no se han generado informes.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {informes.map((informe: any) => (
              <Card
                key={informe.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/informes/${informe.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium truncate">
                      {informe.sistema?.nombre ?? `Sistema #${informe.sistemaId}`}
                    </CardTitle>
                    <Badge
                      className={
                        ESTADO_INFORME_BADGE[informe.estado as string] ??
                        'bg-gray-100 text-gray-700'
                      }
                    >
                      {ESTADO_INFORME_LABEL[informe.estado as string] ??
                        informe.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Clic para abrir y rellenar
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/informes/${informe.id}/preview`);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog: Gestionar Sistemas */}
      {isAdmin && (
        <GestionarSistemasDialog
          open={sistemasDialogOpen}
          onOpenChange={setSistemasDialogOpen}
          intervencion={intervencion}
          currentSistemaIds={sistemas.map((s: any) => s.sistemaId)}
          onSave={async (sistemaIds: number[]) => {
            await updateIntervencion.mutateAsync({
              id: intervencionId,
              sistemaIds,
            });
            setSistemasDialogOpen(false);
          }}
          isSaving={updateIntervencion.isPending}
        />
      )}
    </div>
  );
}

// ======================== Dialog para gestionar sistemas ========================

interface GestionarSistemasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervencion: any;
  currentSistemaIds: number[];
  onSave: (sistemaIds: number[]) => Promise<void>;
  isSaving: boolean;
}

function GestionarSistemasDialog({
  open,
  onOpenChange,
  intervencion,
  currentSistemaIds,
  onSave,
  isSaving,
}: GestionarSistemasDialogProps) {
  const clienteId = intervencion.clienteId;
  const { data: sistemas } = useSistemas(clienteId ? { clienteId } : undefined);

  const [selectedIds, setSelectedIds] = useState<number[]>(currentSistemaIds);

  // Reset when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setSelectedIds(currentSistemaIds);
    onOpenChange(isOpen);
  };

  const availableSistemas = useMemo(() => {
    if (!sistemas) return [];
    return (sistemas as any[]).filter((s: any) => !selectedIds.includes(s.id));
  }, [sistemas, selectedIds]);

  const addSistema = (sid: number) => {
    setSelectedIds((prev) => [...prev, sid]);
  };

  const removeSistema = (sid: number) => {
    setSelectedIds((prev) => prev.filter((id) => id !== sid));
  };

  const getSistemaName = (sid: number) => {
    const s = (sistemas as any[])?.find((s: any) => s.id === sid);
    return s?.nombre ?? `Sistema #${sid}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gestionar sistemas</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Selecciona los sistemas del cliente que participan en esta intervencion.
          </p>

          {/* Selected */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((sid) => (
                <Badge key={sid} variant="secondary" className="gap-1 pr-1">
                  {getSistemaName(sid)}
                  <button
                    type="button"
                    onClick={() => removeSistema(sid)}
                    className="ml-0.5 rounded-full hover:bg-gray-300/50 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add selector */}
          {availableSistemas.length > 0 ? (
            <Select value="" onValueChange={(v) => addSistema(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Anadir sistema..." />
              </SelectTrigger>
              <SelectContent>
                {availableSistemas.map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre}
                    {s.fabricante?.nombre && (
                      <span className="text-muted-foreground ml-1">
                        ({s.fabricante.nombre})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : selectedIds.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Todos los sistemas del cliente han sido asignados.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Este cliente no tiene sistemas registrados.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(selectedIds)} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
