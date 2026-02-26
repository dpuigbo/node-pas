import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Link2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModelos, useCreateModelo, useDeleteModelo } from '@/hooks/useModelos';
import { useFabricantes } from '@/hooks/useFabricantes';
import { useAuth } from '@/hooks/useAuth';
import { getNivelesForTipo, getNivelesFijos, tieneNivelesEditables } from '@/lib/niveles';

const TIPO_LABELS: Record<string, string> = {
  controller: 'Controlador',
  mechanical_unit: 'Unidad Mecanica',
  drive_unit: 'Unidad de Accionamiento',
  external_axis: 'Eje Externo',
};

const PAGE_CONFIG: Record<string, { title: string; description: string; placeholder: string }> = {
  controller: {
    title: 'Controladoras',
    description: 'Modelos de controladora (IRC5, OmniCore, etc.)',
    placeholder: 'Ej: IRC5, OmniCore E10...',
  },
  mechanical_unit: {
    title: 'Robots (Unidades Mecanicas)',
    description: 'Modelos de robot / unidad mecanica (IRB 6700, IRB 4600, etc.)',
    placeholder: 'Ej: IRB 6700, IRB 4600...',
  },
  drive_unit: {
    title: 'Drive Units',
    description: 'Modelos de unidad de accionamiento',
    placeholder: 'Ej: Drive Module DM500...',
  },
  external_axis: {
    title: 'Ejes Externos',
    description: 'Modelos de ejes externos (posicionadores, tracks, etc.)',
    placeholder: 'Ej: IRBT 4004, IRBP A...',
  },
};

export default function ModelosPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read tipo filter from URL query
  const tipoFilter = searchParams.get('tipo') || undefined;
  const config = tipoFilter ? PAGE_CONFIG[tipoFilter] : undefined;

  const { data: modelos, isLoading } = useModelos(tipoFilter ? { tipo: tipoFilter } : undefined);
  const { data: fabricantes } = useFabricantes();
  const createMutation = useCreateModelo();
  const deleteMutation = useDeleteModelo();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [form, setForm] = useState({
    fabricanteId: 0,
    nombre: '',
    notas: '',
    niveles: [] as string[],
    controladorIds: [] as number[],
  });

  // When dialog opens, initialize niveles with fixed levels for current tipo
  const openCreateDialog = () => {
    const fijos = tipoFilter ? getNivelesFijos(tipoFilter) : [];
    setForm({ fabricanteId: 0, nombre: '', notas: '', niveles: fijos, controladorIds: [] });
    setFormOpen(true);
  };

  // Fetch controllers for selected fabricante (for non-controller types)
  const { data: controladorasCreate } = useModelos(
    form.fabricanteId && tipoFilter && tipoFilter !== 'controller'
      ? { fabricanteId: form.fabricanteId, tipo: 'controller' }
      : undefined,
  );

  const toggleFormNivel = (nivel: string) => {
    const fijos = tipoFilter ? getNivelesFijos(tipoFilter) : [];
    if (fijos.includes(nivel)) return;
    setForm((prev) => {
      const has = prev.niveles.includes(nivel);
      return { ...prev, niveles: has ? prev.niveles.filter((n) => n !== nivel) : [...prev.niveles, nivel] };
    });
  };

  const toggleFormControlador = (id: number) => {
    setForm((prev) => {
      const has = prev.controladorIds.includes(id);
      return { ...prev, controladorIds: has ? prev.controladorIds.filter((c) => c !== id) : [...prev.controladorIds, id] };
    });
  };

  const handleSubmit = async () => {
    const nivelesStr = form.niveles.length > 0 ? form.niveles.join(',') : null;
    const res = await createMutation.mutateAsync({
      fabricanteId: form.fabricanteId,
      tipo: tipoFilter!, // tipo is set from the URL
      nombre: form.nombre,
      notas: form.notas || null,
      niveles: nivelesStr,
      controladorIds: form.controladorIds,
    });
    setFormOpen(false);
    // Navigate to the new modelo's detail page
    const newModelo = res?.data ?? res;
    if (newModelo?.id) {
      navigate(`/modelos/${newModelo.id}`);
    }
  };

  // Show tipo column only when not filtered
  const columns: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'fabricante', header: 'Fabricante', render: (m) => m.fabricante?.nombre },
    ...(!tipoFilter ? [{
      key: 'tipo',
      header: 'Tipo',
      render: (m: any) => <Badge variant="secondary">{TIPO_LABELS[m.tipo] || m.tipo}</Badge>,
    }] : []),
    {
      key: 'controladora',
      header: 'Controladoras',
      render: (m) => {
        if (m.tipo === 'controller') {
          // Controller: show associated components (via junction)
          const items = (m.componentesCompatibles ?? []).map((c: any) => c.componente);
          if (items.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {items.map((c: any) => (
                <Badge key={c.id} variant="secondary" className="text-[10px] py-0">
                  {c.nombre}
                </Badge>
              ))}
            </div>
          );
        } else {
          // Non-controller: show linked controllers (via junction)
          const controllers = (m.controladoresCompatibles ?? []).map((c: any) => c.controlador);
          if (controllers.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {controllers.map((c: any) => (
                <Badge key={c.id} variant="secondary" className="text-[10px] py-0 gap-0.5">
                  <Link2 className="h-2.5 w-2.5" />
                  {c.nombre}
                </Badge>
              ))}
            </div>
          );
        }
      },
    },
    {
      key: 'versiones',
      header: 'Versiones',
      render: (m) => <Badge variant="outline">{m._count?.versiones ?? 0}</Badge>,
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (m: any) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleting(m); setDeleteOpen(true); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={config?.title ?? 'Modelos de Componente'}
        description={config?.description ?? 'Todos los modelos del catalogo'}
        actions={
          isAdmin && tipoFilter && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" /> Nuevo modelo
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={modelos || []}
        isLoading={isLoading}
        emptyMessage={tipoFilter ? `No hay modelos de ${TIPO_LABELS[tipoFilter]?.toLowerCase() ?? tipoFilter}. Crea uno nuevo.` : 'No hay modelos'}
        onRowClick={(m) => navigate(`/modelos/${m.id}`)}
        rowKey={(m) => m.id}
      />

      {/* Create Dialog — tipo auto-set from URL */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Nuevo modelo: {TIPO_LABELS[tipoFilter!] ?? tipoFilter}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Fabricante */}
            <div>
              <Label>Fabricante</Label>
              <Select
                value={String(form.fabricanteId || '')}
                onValueChange={(v) => setForm({ ...form, fabricanteId: Number(v), controladorIds: [] })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar fabricante" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(fabricantes) ? fabricantes : []).filter((f: any) => f.activo).map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre */}
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder={config?.placeholder ?? 'Ej: IRC5, IRB 6700...'}
              />
            </div>

            {/* Controladoras asociadas (solo non-controllers) */}
            {tipoFilter && tipoFilter !== 'controller' && (
              <div>
                <Label>Controladoras asociadas</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecciona las controladoras compatibles con este modelo.
                </p>
                <div className="flex flex-wrap gap-2">
                  {!form.fabricanteId ? (
                    <span className="text-xs text-muted-foreground">Selecciona fabricante primero</span>
                  ) : (Array.isArray(controladorasCreate) ? controladorasCreate : []).length === 0 ? (
                    <span className="text-xs text-muted-foreground">No hay controladoras para este fabricante</span>
                  ) : (
                    (Array.isArray(controladorasCreate) ? controladorasCreate : []).map((c: any) => {
                      const selected = form.controladorIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input text-muted-foreground hover:bg-muted'
                          }`}
                          onClick={() => toggleFormControlador(c.id)}
                        >
                          {c.nombre}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Niveles de mantenimiento */}
            {tipoFilter && tieneNivelesEditables(tipoFilter) && (
              <div>
                <Label>Niveles de mantenimiento</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Los niveles obligatorios vienen preseleccionados.
                </p>
                <div className="flex flex-wrap gap-2">
                  {getNivelesForTipo(tipoFilter).map((niv) => {
                    const selected = form.niveles.includes(niv.value);
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
                        onClick={() => toggleFormNivel(niv.value)}
                      >
                        {niv.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <Label>Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Observaciones sobre este modelo..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.nombre.trim() || !form.fabricanteId || createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar modelo"
        description={`Se eliminara "${deleting?.nombre}" y todas sus versiones de template.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => { await deleteMutation.mutateAsync(deleting.id); setDeleteOpen(false); }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
