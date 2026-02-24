import { useState, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Cog, AlertCircle, X, Settings2, Eye, ShoppingCart, Trash2, RefreshCw } from 'lucide-react';
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
import {
  usePedidoCompra,
  useGenerarPedidoCompra,
  useUpdateEstadoPedido,
  useDeletePedidoCompra,
} from '@/hooks/usePedidoCompra';

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

const ESTADO_PEDIDO_BADGE: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  pedido: 'bg-blue-100 text-blue-700',
  recibido: 'bg-green-100 text-green-700',
};

const ESTADO_PEDIDO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  pedido: 'Pedido',
  recibido: 'Recibido',
};

const NIVEL_LABEL: Record<string, string> = {
  '1': 'N1',
  '2_inferior': 'N2 Inf.',
  '2_superior': 'N2 Sup.',
  '3': 'N3',
};

const TIPO_COMP_LABEL: Record<string, string> = {
  controller: 'Controladora',
  mechanical_unit: 'Manipulador',
  drive_unit: 'Drive Unit',
  external_axis: 'Eje Externo',
};

interface LineaPedido {
  tipo: string;
  itemId: number;
  nombre: string;
  cantidad: number;
  unidad: string | null;
  coste: number | null;
  precio: number | null;
  sistemaId: number;
  sistemaNombre: string;
  componenteTipo: string;
  modeloNombre: string;
  nivel: string;
}

interface AggregatedLine {
  tipo: string;
  itemId: number;
  nombre: string;
  unidad: string | null;
  totalCantidad: number;
  costeUnitario: number | null;
  precioUnitario: number | null;
  totalCoste: number | null;
  totalPrecio: number | null;
  detalles: { sistemaNombre: string; componenteTipo: string; modeloNombre: string; nivel: string; cantidad: number }[];
}

function aggregateLineas(lineas: LineaPedido[]): AggregatedLine[] {
  const map = new Map<string, AggregatedLine>();
  for (const l of lineas) {
    const key = `${l.tipo}-${l.itemId}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalCantidad += l.cantidad;
      if (l.coste != null) existing.totalCoste = (existing.totalCoste ?? 0) + l.coste * l.cantidad;
      if (l.precio != null) existing.totalPrecio = (existing.totalPrecio ?? 0) + l.precio * l.cantidad;
      existing.detalles.push({
        sistemaNombre: l.sistemaNombre,
        componenteTipo: l.componenteTipo,
        modeloNombre: l.modeloNombre,
        nivel: l.nivel,
        cantidad: l.cantidad,
      });
    } else {
      map.set(key, {
        tipo: l.tipo,
        itemId: l.itemId,
        nombre: l.nombre,
        unidad: l.unidad,
        totalCantidad: l.cantidad,
        costeUnitario: l.coste,
        precioUnitario: l.precio,
        totalCoste: l.coste != null ? l.coste * l.cantidad : null,
        totalPrecio: l.precio != null ? l.precio * l.cantidad : null,
        detalles: [{
          sistemaNombre: l.sistemaNombre,
          componenteTipo: l.componenteTipo,
          modeloNombre: l.modeloNombre,
          nivel: l.nivel,
          cantidad: l.cantidad,
        }],
      });
    }
  }
  return Array.from(map.values());
}

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

  // Pedido de compra hooks
  const { data: pedido, isLoading: pedidoLoading, isError: pedidoNotFound } = usePedidoCompra(intervencionId || undefined);
  const generarPedido = useGenerarPedidoCompra();
  const updateEstadoPedido = useUpdateEstadoPedido();
  const deletePedido = useDeletePedidoCompra();

  const [sistemasDialogOpen, setSistemasDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const handleGenerarPedido = async () => {
    try {
      await generarPedido.mutateAsync(intervencionId);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Error al generar pedido';
      alert(msg);
    }
  };

  const handleDeletePedido = async () => {
    if (!pedido) return;
    if (!confirm('Eliminar el pedido de compra?')) return;
    try {
      await deletePedido.mutateAsync(pedido.id);
    } catch (err: any) {
      alert('Error al eliminar pedido');
    }
  };

  const handleCambiarEstadoPedido = async (estado: string) => {
    if (!pedido) return;
    try {
      await updateEstadoPedido.mutateAsync({ id: pedido.id, estado });
    } catch (err: any) {
      alert('Error al cambiar estado');
    }
  };

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Aggregate pedido lineas
  const lineas: LineaPedido[] = pedido?.lineas ?? [];
  const aggregated = aggregateLineas(lineas);

  const hasPedido = pedido && !pedidoNotFound;

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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {is.sistema?.nombre}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {NIVEL_LABEL[is.nivel] ?? is.nivel}
                    </Badge>
                  </div>
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

      {/* Pedido de Compra */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Pedido de compra
            {hasPedido && (
              <Badge className={ESTADO_PEDIDO_BADGE[pedido.estado] ?? 'bg-gray-100 text-gray-700'}>
                {ESTADO_PEDIDO_LABEL[pedido.estado] ?? pedido.estado}
              </Badge>
            )}
          </h2>
          <div className="flex gap-2">
            {isAdmin && !hasPedido && sistemas.length > 0 && (
              <Button
                onClick={handleGenerarPedido}
                disabled={generarPedido.isPending}
                size="sm"
              >
                <ShoppingCart className="mr-1 h-4 w-4" />
                {generarPedido.isPending ? 'Generando...' : 'Generar pedido'}
              </Button>
            )}
            {isAdmin && hasPedido && (
              <>
                {pedido.estado === 'pendiente' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCambiarEstadoPedido('pedido')}
                    disabled={updateEstadoPedido.isPending}
                  >
                    Marcar como pedido
                  </Button>
                )}
                {pedido.estado === 'pedido' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCambiarEstadoPedido('recibido')}
                    disabled={updateEstadoPedido.isPending}
                  >
                    Marcar como recibido
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Regenerar el pedido de compra? Se perderan los cambios manuales.')) return;
                    try {
                      await deletePedido.mutateAsync(pedido.id);
                      await generarPedido.mutateAsync(intervencionId);
                    } catch (err: any) {
                      alert('Error al regenerar pedido');
                    }
                  }}
                  disabled={deletePedido.isPending || generarPedido.isPending}
                  title="Regenerar pedido"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeletePedido}
                  disabled={deletePedido.isPending}
                  className="text-destructive hover:text-destructive"
                  title="Eliminar pedido"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {pedidoLoading && !pedidoNotFound && (
          <p className="text-sm text-muted-foreground">Cargando pedido...</p>
        )}

        {!hasPedido && !pedidoLoading && (
          <p className="text-sm text-muted-foreground">
            {sistemas.length === 0
              ? 'Asigna sistemas primero para poder generar el pedido.'
              : isAdmin
                ? 'Pulsa "Generar pedido" para crear la hoja de pedido de compra basada en los consumibles por nivel.'
                : 'No se ha generado un pedido de compra para esta intervencion.'}
          </p>
        )}

        {hasPedido && aggregated.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No se encontraron consumibles configurados para los sistemas y niveles de esta intervencion.
          </p>
        )}

        {hasPedido && aggregated.length > 0 && (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left w-8"></th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-left">Unidad</th>
                  <th className="px-3 py-2 text-right">Coste ud.</th>
                  <th className="px-3 py-2 text-right">Coste total</th>
                  <th className="px-3 py-2 text-right">Precio ud.</th>
                  <th className="px-3 py-2 text-right">Precio total</th>
                </tr>
              </thead>
              <tbody>
                {aggregated.map((agg) => {
                  const key = `${agg.tipo}-${agg.itemId}`;
                  const isExpanded = expandedRows.has(key);
                  return (
                    <Fragment key={key}>
                      <tr
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => toggleRow(key)}
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {agg.detalles.length > 1 ? (isExpanded ? '▼' : '▶') : ''}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {agg.tipo === 'aceite' ? 'Aceite' : agg.tipo === 'bateria' ? 'Bateria' : 'Consumible'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 font-medium">{agg.nombre}</td>
                        <td className="px-3 py-2 text-right font-mono">{agg.totalCantidad}</td>
                        <td className="px-3 py-2 text-muted-foreground">{agg.unidad ?? '-'}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {agg.costeUnitario != null ? `${agg.costeUnitario.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {agg.totalCoste != null ? `${agg.totalCoste.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {agg.precioUnitario != null ? `${agg.precioUnitario.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {agg.totalPrecio != null ? `${agg.totalPrecio.toFixed(2)} €` : '-'}
                        </td>
                      </tr>
                      {isExpanded && agg.detalles.map((det, idx) => (
                        <tr key={`${key}-${idx}`} className="bg-muted/20 border-b last:border-0">
                          <td className="px-3 py-1.5"></td>
                          <td colSpan={2} className="px-3 py-1.5 text-xs text-muted-foreground">
                            {det.sistemaNombre} — {TIPO_COMP_LABEL[det.componenteTipo] ?? det.componenteTipo} ({det.modeloNombre}) — {NIVEL_LABEL[det.nivel] ?? det.nivel}
                          </td>
                          <td className="px-3 py-1.5 text-right text-xs font-mono">{det.cantidad}</td>
                          <td colSpan={5}></td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50 font-medium">
                  <td colSpan={6} className="px-3 py-2 text-right">Totales:</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {pedido.totalCoste != null ? `${Number(pedido.totalCoste).toFixed(2)} €` : '-'}
                  </td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2 text-right font-mono">
                    {pedido.totalPrecio != null ? `${Number(pedido.totalPrecio).toFixed(2)} €` : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
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
    if (!Array.isArray(sistemas)) return [];
    return sistemas.filter((s: any) => !selectedIds.includes(s.id));
  }, [sistemas, selectedIds]);

  const addSistema = (sid: number) => {
    setSelectedIds((prev) => [...prev, sid]);
  };

  const removeSistema = (sid: number) => {
    setSelectedIds((prev) => prev.filter((id) => id !== sid));
  };

  const getSistemaName = (sid: number) => {
    const s = (Array.isArray(sistemas) ? sistemas : []).find((s: any) => s.id === sid);
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
