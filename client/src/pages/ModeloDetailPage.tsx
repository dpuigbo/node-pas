import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, FileText, Play, Pause,
  AlertCircle, Loader2, Pencil, Save, X, Link2,
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
  useModelos, useCompatibilidad, useUpdateCompatibilidad,
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

  const [createOpen, setCreateOpen] = useState(false);
  const [createNotas, setCreateNotas] = useState('');
  const [activateTarget, setActivateTarget] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Niveles editing
  const [editingNiveles, setEditingNiveles] = useState(false);
  const [nivelesForm, setNivelesForm] = useState<string[]>([]);

  const startEditNiveles = () => {
    const current = modelo?.niveles ? modelo.niveles.split(',').filter(Boolean) : [];
    // Ensure fixed levels are always included
    const fijos = modelo ? getNivelesFijos(modelo.tipo) : [];
    const merged = [...new Set([...fijos, ...current])];
    setNivelesForm(merged);
    setEditingNiveles(true);
  };

  const toggleNivel = (nivel: string) => {
    // Don't allow toggling off fixed levels
    const fijos = modelo ? getNivelesFijos(modelo.tipo) : [];
    if (fijos.includes(nivel)) return;
    setNivelesForm((prev) => {
      const has = prev.includes(nivel);
      return has ? prev.filter((n) => n !== nivel) : [...prev, nivel];
    });
  };

  const handleSaveNiveles = async () => {
    const nivelesStr = nivelesForm.length > 0 ? nivelesForm.join(',') : null;
    await updateModelo.mutateAsync({ id: modeloId, niveles: nivelesStr });
    setEditingNiveles(false);
  };

  // Compatibilidad editing
  const [editingCompat, setEditingCompat] = useState(false);
  const [compatForm, setCompatForm] = useState<number[]>([]);
  const { data: compatList } = useCompatibilidad(modeloId || undefined);
  const updateCompat = useUpdateCompatibilidad(modeloId);

  // Load candidate models for the compatibility editor
  // For controllers: load non-controllers of the same fabricante
  // For non-controllers: load controllers of the same fabricante
  const candidateTipo = modelo?.tipo === 'controller' ? undefined : 'controller';
  const { data: candidateModelos } = useModelos(
    modelo?.fabricante?.id
      ? { fabricanteId: modelo.fabricante.id, ...(candidateTipo ? { tipo: candidateTipo } : {}) }
      : undefined,
  );
  // If controller, filter out other controllers from candidates
  const candidates: any[] = modelo?.tipo === 'controller'
    ? (Array.isArray(candidateModelos) ? candidateModelos : []).filter((m: any) => m.tipo !== 'controller')
    : (Array.isArray(candidateModelos) ? candidateModelos : []);

  const startEditCompat = () => {
    const currentIds = (compatList as any[] || []).map((c: any) => c.id);
    setCompatForm(currentIds);
    setEditingCompat(true);
  };

  const toggleCompat = (id: number) => {
    setCompatForm((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSaveCompat = async () => {
    await updateCompat.mutateAsync(compatForm);
    setEditingCompat(false);
  };

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

  const handleCreateVersion = async () => {
    const res = await createVersion.mutateAsync({
      schema: { blocks: [], pageConfig: undefined },
      notas: createNotas || null,
    });
    setCreateOpen(false);
    setCreateNotas('');
    // Navigate directly to the editor with the new version
    const newVersion = res?.data ?? res;
    if (newVersion?.id) {
      navigate(`/modelos/${modeloId}/versiones/${newVersion.id}/editor`);
    }
  };

  const handleActivate = async () => {
    if (!activateTarget) return;
    const newEstado = activateTarget.estado === 'activo' ? 'obsoleto' : 'activo';
    await activateVersion.mutateAsync({ id: activateTarget.id, estado: newEstado });
    setConfirmOpen(false);
    setActivateTarget(null);
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
          {/* Open in editor */}
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

          {/* Activate / Deactivate */}
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
            [modelo.fabricante?.nombre, TIPO_LABELS[modelo.tipo] ?? modelo.tipo]
              .filter(Boolean)
              .join(' — ')
          }
        />
      </div>

      {modelo.notas && (
        <p className="text-sm text-muted-foreground">{modelo.notas}</p>
      )}

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

      {/* Compatibilidad controlador */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {modelo.tipo === 'controller' ? 'Componentes compatibles' : 'Controladores compatibles'}
            </CardTitle>
            {isAdmin && !editingCompat && (
              <Button variant="outline" size="sm" onClick={startEditCompat}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
            {editingCompat && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveCompat} disabled={updateCompat.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {updateCompat.isPending ? 'Guardando...' : 'Guardar'}
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
                {modelo.tipo === 'controller'
                  ? 'Selecciona los componentes compatibles con este controlador.'
                  : 'Selecciona los controladores compatibles con este componente.'}
              </p>
              {modelo.tipo === 'controller' ? (
                // Group candidates by tipo for controllers
                (['mechanical_unit', 'drive_unit', 'external_axis'] as const).map((tipo) => {
                  const ofType = candidates.filter((c) => c.tipo === tipo);
                  if (ofType.length === 0) return null;
                  return (
                    <div key={tipo} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mt-2">
                        {TIPO_LABELS[tipo] ?? tipo}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ofType.map((m: any) => {
                          const selected = compatForm.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                selected
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-input text-muted-foreground hover:bg-muted'
                              }`}
                              onClick={() => toggleCompat(m.id)}
                            >
                              {m.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-wrap gap-2">
                  {candidates.map((m: any) => {
                    const selected = compatForm.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-input text-muted-foreground hover:bg-muted'
                        }`}
                        onClick={() => toggleCompat(m.id)}
                      >
                        {m.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
              {candidates.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No hay modelos candidatos del mismo fabricante.
                </p>
              )}
            </div>
          ) : (
            <div>
              {modelo.tipo === 'controller' ? (
                // Show compatible components grouped by tipo
                (() => {
                  const list = (compatList as any[]) ?? [];
                  if (list.length === 0) {
                    return <span className="text-sm text-muted-foreground">Sin compatibilidad configurada</span>;
                  }
                  return (
                    <div className="space-y-2">
                      {(['mechanical_unit', 'drive_unit', 'external_axis'] as const).map((tipo) => {
                        const ofType = list.filter((c: any) => c.tipo === tipo);
                        if (ofType.length === 0) return null;
                        return (
                          <div key={tipo}>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {TIPO_LABELS[tipo] ?? tipo}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {ofType.map((c: any) => (
                                <Badge key={c.id} variant="secondary">{c.nombre}</Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(compatList as any[] ?? []).length > 0 ? (
                    (compatList as any[]).map((c: any) => (
                      <Badge key={c.id} variant="secondary">{c.nombre}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin compatibilidad configurada</span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versions */}
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
