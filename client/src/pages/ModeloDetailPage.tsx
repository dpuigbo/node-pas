import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, FileText, Play, Pause,
  AlertCircle, Loader2, Pencil, Save, X,
  Droplets, Wrench, Link2, Cpu, Bot, Cog, Ban, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useModelo, useUpdateModelo, useVersiones, useCreateVersion, useActivateVersion,
  useModelos, useUpdateCompatibilidad, useLubricacion, useMantenimiento,
  useModeloCompatibilidad,
} from '@/hooks/useModelos';
import { useAuth } from '@/hooks/useAuth';
import { getNivelesForTipo, getNivelesFijos, tieneNivelesEditables, NIVEL_SHORT } from '@/lib/niveles';

const TIPO_LABELS: Record<string, string> = {
  controller: 'Controlador',
  mechanical_unit: 'Unidad Mecanica',
  drive_unit: 'Unidad de Accionamiento',
  external_axis: 'Eje Externo',
};

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  borrador: 'secondary',
  activo: 'default',
  obsoleto: 'outline',
};

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  activo: 'Activo',
  obsoleto: 'Obsoleto',
};

type TabKey = 'info' | 'lubricacion' | 'mantenimiento' | 'compatibilidad' | 'templates';

function formatIntervalo(item: any): string {
  const parts: string[] = [];
  if (item.intervaloHoras) parts.push(`${item.intervaloHoras} h`);
  if (item.intervaloMeses) parts.push(`${item.intervaloMeses} meses`);
  if (parts.length === 0) {
    if (item.intervaloCondicion === 'condicion') return 'Según condición';
    if (item.intervaloCondicion === 'alerta_baja') return 'Alerta baja';
    if (item.intervaloTextoLegacy) return item.intervaloTextoLegacy;
    return '—';
  }
  return parts.join(' / ');
}

function formatFoundry(item: any): string | null {
  const parts: string[] = [];
  if (item.intervaloFoundryHoras) parts.push(`${item.intervaloFoundryHoras} h`);
  if (item.intervaloFoundryMeses) parts.push(`${item.intervaloFoundryMeses} meses`);
  return parts.length > 0 ? parts.join(' / ') : null;
}

export default function ModeloDetailPage() {
  const { modeloId: mId } = useParams<{ modeloId: string }>();
  const modeloId = Number(mId);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: modelo, isLoading: loadingModelo } = useModelo(modeloId || undefined);
  const { data: versiones, isLoading: loadingVersiones } = useVersiones(modeloId || undefined);
  const createVersion = useCreateVersion(modeloId);
  const activateVersion = useActivateVersion(modeloId);
  const updateModelo = useUpdateModelo();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  // Lubricación & Mantenimiento data
  const { data: lubricacionData, isLoading: loadingLub } = useLubricacion(
    activeTab === 'lubricacion' ? modeloId : undefined,
  );
  const { data: mantenimientoData, isLoading: loadingMant } = useMantenimiento(
    activeTab === 'mantenimiento' ? modeloId : undefined,
  );
  const { data: compatibilidadData, isLoading: loadingCompat } = useModeloCompatibilidad(
    activeTab === 'compatibilidad' ? modeloId : undefined,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [createNotas, setCreateNotas] = useState('');
  const [activateTarget, setActivateTarget] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Niveles editing
  const [editingNiveles, setEditingNiveles] = useState(false);
  const [nivelesForm, setNivelesForm] = useState<string[]>([]);

  const startEditNiveles = () => {
    const current = modelo?.niveles ? modelo.niveles.split(',').filter(Boolean) : [];
    const fijos = modelo ? getNivelesFijos(modelo.tipo) : [];
    const merged = [...new Set([...fijos, ...current])];
    setNivelesForm(merged);
    setEditingNiveles(true);
  };

  const toggleNivel = (nivel: string) => {
    const fijos = modelo ? getNivelesFijos(modelo.tipo) : [];
    if (fijos.includes(nivel)) return;
    setNivelesForm((prev) => {
      const has = prev.includes(nivel);
      return has ? prev.filter((n) => n !== nivel) : [...prev, nivel];
    });
  };

  const handleSaveNiveles = async () => {
    try {
      const nivelesStr = nivelesForm.length > 0 ? nivelesForm.join(',') : null;
      await updateModelo.mutateAsync({ id: modeloId, niveles: nivelesStr });
      setEditingNiveles(false);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al guardar niveles');
    }
  };

  // Compatibilidad M:N (for non-controllers only)
  const { data: controladoras } = useModelos(
    modelo?.fabricante?.id && modelo?.tipo !== 'controller'
      ? { fabricanteId: modelo.fabricante.id, tipo: 'controller' }
      : undefined,
  );
  const updateCompatibilidad = useUpdateCompatibilidad();

  const [editingCompat, setEditingCompat] = useState(false);
  const [compatForm, setCompatForm] = useState<number[]>([]);

  const startEditCompat = () => {
    const current = (modelo?.controladoresCompatibles ?? []).map((c: any) => c.controlador.id);
    setCompatForm(current);
    setEditingCompat(true);
  };

  const toggleCompat = (id: number) => {
    setCompatForm((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleSaveCompat = async () => {
    try {
      await updateCompatibilidad.mutateAsync({ id: modeloId, controladorIds: compatForm });
      setEditingCompat(false);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al guardar compatibilidad');
    }
  };

  // Group lubricacion by varianteTrm
  const lubricacionGrouped = useMemo(() => {
    if (!lubricacionData?.records) return [];
    if (lubricacionData.source === 'v2') {
      // v2: group by modelo (all same modelo, just list by eje)
      return [{ variante: modelo?.nombre ?? '', items: lubricacionData.records }];
    }
    // legacy: group by varianteTrm
    const groups = new Map<string, any[]>();
    for (const item of lubricacionData.records) {
      const key = item.varianteTrm ?? '';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return [...groups.entries()].map(([variante, items]) => ({ variante, items }));
  }, [lubricacionData, modelo]);

  if (loadingModelo) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!modelo) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Modelo no encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const versionList: any[] = versiones ?? [];
  const currentNiveles = modelo.niveles ? modelo.niveles.split(',').filter(Boolean) : [];
  const isNonController = modelo.tipo !== 'controller';

  const handleCreateVersion = async () => {
    try {
      const res = await createVersion.mutateAsync({
        schema: { blocks: [], pageConfig: undefined },
        notas: createNotas || null,
      });
      setCreateOpen(false);
      setCreateNotas('');
      const newVersion = res?.data ?? res;
      if (newVersion?.id) {
        navigate(`/modelos/${modeloId}/versiones/${newVersion.id}/editor`);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al crear version');
    }
  };

  const handleActivate = async () => {
    try {
      if (!activateTarget) return;
      const newEstado = activateTarget.estado === 'activo' ? 'obsoleto' : 'activo';
      await activateVersion.mutateAsync({ id: activateTarget.id, estado: newEstado });
      setConfirmOpen(false);
      setActivateTarget(null);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al cambiar estado');
    }
  };

  const versionCols: Column<any>[] = [
    {
      key: 'version',
      header: 'Version',
      render: (v) => <span className="font-mono font-medium">v{v.version}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v) => (
        <Badge variant={ESTADO_VARIANT[v.estado] ?? 'outline'}>
          {ESTADO_LABELS[v.estado] ?? v.estado}
        </Badge>
      ),
    },
    {
      key: 'bloques',
      header: 'Bloques',
      render: (v) => {
        const blocks = v.schema?.blocks ?? [];
        return <Badge variant="outline">{blocks.length}</Badge>;
      },
    },
    {
      key: 'notas',
      header: 'Notas',
      render: (v) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {v.notas || '-'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Actualizado',
      render: (v) => {
        const d = new Date(v.updatedAt);
        return <span className="text-sm text-muted-foreground">{d.toLocaleDateString('es-ES')}</span>;
      },
    },
    {
      key: 'acciones',
      header: '',
      render: (v: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Editar template"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/modelos/${modeloId}/versiones/${v.id}/editor`);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {isAdmin && v.estado !== 'activo' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-green-600 hover:text-green-700"
              title="Activar version"
              onClick={(e) => {
                e.stopPropagation();
                setActivateTarget(v);
                setConfirmOpen(true);
              }}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          {isAdmin && v.estado === 'activo' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-orange-500 hover:text-orange-600"
              title="Marcar como obsoleto"
              onClick={(e) => {
                e.stopPropagation();
                setActivateTarget(v);
                setConfirmOpen(true);
              }}
            >
              <Pause className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Tabs config
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Info', icon: null },
    ...(isNonController ? [
      { key: 'lubricacion' as TabKey, label: 'Lubricacion', icon: <Droplets className="h-3.5 w-3.5" /> },
    ] : []),
    { key: 'mantenimiento', label: modelo.tipo === 'controller' ? 'Mant. Cabinet' : modelo.tipo === 'drive_unit' ? 'Mant. Drive' : 'Mant. Preventivo', icon: <Wrench className="h-3.5 w-3.5" /> },
    { key: 'compatibilidad', label: 'Compatibilidad', icon: <Link2 className="h-3.5 w-3.5" /> },
    { key: 'templates', label: `Templates (${versionList.length})`, icon: <FileText className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={modelo.nombre}
          description={
            [modelo.fabricante?.nombre, TIPO_LABELS[modelo.tipo] ?? modelo.tipo, modelo.familia]
              .filter(Boolean)
              .join(' — ')
          }
        />
      </div>

      {modelo.notas && (
        <p className="text-sm text-muted-foreground">{modelo.notas}</p>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB: INFO ===== */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* Niveles de mantenimiento */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Niveles de mantenimiento</CardTitle>
                {isAdmin && !editingNiveles && tieneNivelesEditables(modelo.tipo) && (
                  <Button variant="outline" size="sm" onClick={startEditNiveles}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                )}
                {editingNiveles && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNiveles} disabled={updateModelo.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {updateModelo.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingNiveles(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNiveles ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Selecciona los niveles de mantenimiento aplicables a este modelo.
                    Los niveles obligatorios no se pueden deseleccionar.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getNivelesForTipo(modelo.tipo).map((niv) => {
                      const selected = nivelesForm.includes(niv.value);
                      const isFixed = niv.fixed;
                      return (
                        <button
                          key={niv.value}
                          type="button"
                          disabled={isFixed}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            selected
                              ? isFixed
                                ? 'bg-primary/70 text-primary-foreground border-primary cursor-not-allowed'
                                : 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input text-muted-foreground hover:bg-muted'
                          }`}
                          onClick={() => toggleNivel(niv.value)}
                        >
                          {niv.label}
                        </button>
                      );
                    })}
                  </div>
                  {nivelesForm.length === 0 && (
                    <p className="text-xs text-orange-500">
                      Sin niveles seleccionados. Este modelo no aparecera en ofertas.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {currentNiveles.length > 0 ? (
                    currentNiveles.map((n: string) => (
                      <Badge key={n} variant="secondary">
                        {NIVEL_SHORT[n] ?? n}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin niveles configurados</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controladoras asociadas (only for non-controllers) */}
          {isNonController && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Controladoras asociadas</CardTitle>
                  {isAdmin && !editingCompat && (
                    <Button variant="outline" size="sm" onClick={startEditCompat}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  )}
                  {editingCompat && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveCompat} disabled={updateCompatibilidad.isPending}>
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {updateCompatibilidad.isPending ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingCompat(false)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingCompat ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Selecciona las controladoras compatibles con este modelo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(controladoras) ? controladoras : []).map((c: any) => {
                        const selected = compatForm.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-input text-muted-foreground hover:bg-muted'
                            }`}
                            onClick={() => toggleCompat(c.id)}
                          >
                            {c.nombre}
                          </button>
                        );
                      })}
                    </div>
                    {compatForm.length === 0 && (
                      <p className="text-xs text-orange-500">
                        Sin controladoras seleccionadas. Este componente no aparecera como compatible.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(modelo.controladoresCompatibles ?? []).length > 0 ? (
                      (modelo.controladoresCompatibles ?? []).map((c: any) => (
                        <Badge key={c.controlador.id} variant="secondary">{c.controlador.nombre}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin controladoras asociadas</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== TAB: LUBRICACIÓN ===== */}
      {activeTab === 'lubricacion' && (
        <div className="space-y-4">
          {loadingLub ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : lubricacionGrouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Droplets className="h-8 w-8" />
              <p>No hay datos de lubricacion para la familia {modelo.familia ?? modelo.nombre}</p>
            </div>
          ) : (
            lubricacionGrouped.map((group) => (
              <Card key={group.variante}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {group.variante}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium w-20">Eje</th>
                        <th className="px-4 py-2 text-left font-medium">Lubricante</th>
                        <th className="px-4 py-2 text-left font-medium w-32">Cantidad</th>
                        <th className="px-4 py-2 text-left font-medium w-36">WebConfig</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item: any) => {
                        // Prioridad: consumible_catalogo > aceite legacy > texto
                        const consumible = item.consumible;
                        const lubricante = consumible?.nombre ?? item.aceite?.nombre ?? item.tipoLubricanteLegacy ?? item.tipoLubricante ?? 'N/A';
                        const cantidad = item.cantidadValor != null
                          ? `${item.cantidadValor} ${item.cantidadUnidad ?? ''}`.trim()
                          : item.cantidadTextoLegacy ?? item.cantidad ?? 'N/A';
                        return (
                          <tr key={item.id} className="border-b last:border-b-0">
                            <td className="px-4 py-2 font-mono font-medium">{item.eje}</td>
                            <td className="px-4 py-2">
                              {lubricante === 'N/A' ? (
                                <span className="text-muted-foreground">N/A</span>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <span>{lubricante}</span>
                                  {consumible?.codigoAbb && (
                                    <span className="text-[10px] font-mono text-muted-foreground">{consumible.codigoAbb}</span>
                                  )}
                                  {consumible?.fabricante && !consumible?.codigoAbb && (
                                    <span className="text-[10px] text-muted-foreground">{consumible.fabricante}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {cantidad === 'N/A' ? (
                                <span className="text-muted-foreground">N/A</span>
                              ) : (
                                cantidad
                              )}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground font-mono text-xs">
                              {item.webConfig || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ===== TAB: MANTENIMIENTO PREVENTIVO ===== */}
      {activeTab === 'mantenimiento' && (
        <div className="space-y-4">
          {loadingMant ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !mantenimientoData?.records || mantenimientoData.records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Wrench className="h-8 w-8" />
              <p>No hay actividades de mantenimiento para {modelo.nombre}</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {mantenimientoData.source === 'cabinet' && `Actividades de cabinet — ${modelo.nombre}`}
                  {mantenimientoData.source === 'drive_module' && `Actividades de drive module — ${modelo.nombre}`}
                  {(mantenimientoData.source === 'v2' || mantenimientoData.source === 'legacy') && `Actividades de mantenimiento — ${modelo.familia ?? modelo.nombre}`}
                  {mantenimientoData.records[0]?.documento && (
                    <span className="ml-2 text-muted-foreground font-normal">
                      Doc: {mantenimientoData.records[0].documento}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium w-36">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium">Componente</th>
                      <th className="px-4 py-2 text-left font-medium">Intervalo</th>
                      <th className="px-4 py-2 text-left font-medium w-48">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mantenimientoData.records.map((item: any) => {
                      const isLegacy = mantenimientoData.source === 'legacy';
                      const tipoLabel = item.tipoActividad?.nombre ?? item.tipoActividad ?? '—';
                      const intervalo = isLegacy
                        ? item.intervaloEstandar || '—'
                        : formatIntervalo(item);
                      const foundry = isLegacy
                        ? item.intervaloFoundry
                        : formatFoundry(item);
                      return (
                        <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20">
                          <td className="px-4 py-2">
                            <Badge variant="outline" className="text-[10px]">
                              {tipoLabel}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">{item.componente}</td>
                          <td className="px-4 py-2">
                            <span>{intervalo}</span>
                            {foundry && (
                              <span className="block text-xs text-muted-foreground mt-0.5">
                                Foundry: {foundry}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px]">
                            {item.notas ? (
                              <span className="line-clamp-2" title={item.notas}>{item.notas}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===== TAB: COMPATIBILIDAD ===== */}
      {activeTab === 'compatibilidad' && (
        <div className="space-y-4">
          {loadingCompat ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !compatibilidadData ? (
            <div className="text-center text-muted-foreground py-8">
              No hay datos de compatibilidad disponibles.
            </div>
          ) : compatibilidadData.tipo === 'external_axis' ? (
            <>
              {/* Whitelist familias robot permitidas */}
              {compatibilidadData.familiasPermitidas && compatibilidadData.familiasPermitidas.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Familias robot permitidas ({compatibilidadData.familiasPermitidas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      Este eje externo solo es compatible con robots de las siguientes familias.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {compatibilidadData.familiasPermitidas.map(f => (
                        <Badge key={f.id} variant="secondary" className="gap-1">
                          <Bot className="h-3 w-3" /> {f.codigo}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blacklist familias robot excluidas */}
              {compatibilidadData.familiasExcluidas && compatibilidadData.familiasExcluidas.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive" />
                      Familias robot excluidas ({compatibilidadData.familiasExcluidas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      Compatible con cualquier robot ABB EXCEPTO estas familias.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {compatibilidadData.familiasExcluidas.map(f => (
                        <Badge key={f.id} variant="destructive" className="gap-1">
                          <Bot className="h-3 w-3" /> {f.codigo}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Whitelist controladores requeridos */}
              {compatibilidadData.controladoresRequeridos && compatibilidadData.controladoresRequeridos.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      Controladores requeridos ({compatibilidadData.controladoresRequeridos.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      Este eje requiere obligatoriamente uno de estos controladores.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {compatibilidadData.controladoresRequeridos.map(c => (
                        <Badge key={c.id} variant="default" className="gap-1">
                          <Cpu className="h-3 w-3" /> {c.nombre}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(!compatibilidadData.familiasPermitidas?.length &&
                !compatibilidadData.familiasExcluidas?.length &&
                !compatibilidadData.controladoresRequeridos?.length) && (
                <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  Este eje externo no tiene reglas de compatibilidad especificas.
                  Es compatible con cualquier combinacion robot+controlador
                  segun la tabla de <code>compatibilidad_controlador</code>.
                </div>
              )}
            </>
          ) : (compatibilidadData.tipo === 'mechanical_unit' || compatibilidadData.tipo === 'drive_unit') ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  Controladores compatibles ({compatibilidadData.controladoresCompatibles?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {compatibilidadData.controladoresCompatibles && compatibilidadData.controladoresCompatibles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {compatibilidadData.controladoresCompatibles.map(c => (
                      <Badge key={c.id} variant="secondary" className="gap-1">
                        <Cpu className="h-3 w-3" /> {c.nombre}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin controladores asociados.</p>
                )}
              </CardContent>
            </Card>
          ) : compatibilidadData.tipo === 'controller' ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-green-500" />
                    Robots compatibles ({compatibilidadData.robotsCompatibles?.length ?? 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {compatibilidadData.robotsCompatibles && compatibilidadData.robotsCompatibles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {compatibilidadData.robotsCompatibles.slice(0, 50).map(r => (
                        <Badge key={r.id} variant="secondary" className="gap-1">
                          <Bot className="h-3 w-3" /> {r.nombre}
                        </Badge>
                      ))}
                      {compatibilidadData.robotsCompatibles.length > 50 && (
                        <Badge variant="outline">+{compatibilidadData.robotsCompatibles.length - 50} más</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin robots asociados.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cog className="h-4 w-4 text-orange-500" />
                    Ejes externos compatibles ({compatibilidadData.ejesCompatibles?.length ?? 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {compatibilidadData.ejesCompatibles && compatibilidadData.ejesCompatibles.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {compatibilidadData.ejesCompatibles.slice(0, 50).map(e => (
                        <Badge key={e.id} variant="secondary" className="gap-1">
                          <Cog className="h-3 w-3" /> {e.nombre}
                        </Badge>
                      ))}
                      {compatibilidadData.ejesCompatibles.length > 50 && (
                        <Badge variant="outline">+{compatibilidadData.ejesCompatibles.length - 50} más</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin ejes asociados.</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* ===== TAB: TEMPLATES ===== */}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" /> Versiones de Template ({versionList.length})
            </h2>
            {isAdmin && (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Nueva version
              </Button>
            )}
          </div>

          {loadingVersiones ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable
              columns={versionCols}
              data={versionList}
              emptyMessage="Sin versiones. Crea una nueva version para empezar a disenar el template."
              onRowClick={(v) => navigate(`/modelos/${modeloId}/versiones/${v.id}/editor`)}
              rowKey={(v) => v.id}
            />
          )}
        </div>
      )}

      {/* Create Version Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva version de template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se creara una nueva version en estado <Badge variant="secondary">Borrador</Badge> con un template vacio.
              Podras editarla en el editor visual.
            </p>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={createNotas}
                onChange={(e) => setCreateNotas(e.target.value)}
                placeholder="Ej: Version inicial, correccion de campos..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateVersion} disabled={createVersion.isPending}>
              {createVersion.isPending ? 'Creando...' : 'Crear y abrir editor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={activateTarget?.estado === 'activo' ? 'Marcar como obsoleto' : 'Activar version'}
        description={
          activateTarget?.estado === 'activo'
            ? `La version v${activateTarget?.version} dejara de usarse para nuevos informes.`
            : `La version v${activateTarget?.version} sera la plantilla activa para nuevos informes. Cualquier otra version activa pasara a obsoleta.`
        }
        confirmLabel={activateTarget?.estado === 'activo' ? 'Desactivar' : 'Activar'}
        variant={activateTarget?.estado === 'activo' ? 'destructive' : 'default'}
        onConfirm={handleActivate}
        isLoading={activateVersion.isPending}
      />
    </div>
  );
}
