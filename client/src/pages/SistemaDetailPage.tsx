import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Cpu, Trash2, AlertCircle, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSistema } from '@/hooks/useSistemas';
import { useModelos } from '@/hooks/useModelos';
import { useCreateComponente, useUpdateComponente, useDeleteComponente } from '@/hooks/useComponentes';
import { useAuth } from '@/hooks/useAuth';

const TIPO_LABELS: Record<string, string> = {
  controller: 'Controlador',
  mechanical_unit: 'Unidad mecanica',
  drive_unit: 'Unidad de accionamiento',
  external_axis: 'Eje externo',
};

export default function SistemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sistemaId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: sistema, isLoading } = useSistema(sistemaId || undefined);
  const createComponente = useCreateComponente(sistemaId);
  const updateComponente = useUpdateComponente(sistemaId);
  const deleteComponente = useDeleteComponente(sistemaId);

  const [compOpen, setCompOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<any>(null);
  const [compForm, setCompForm] = useState({
    tipo: '' as string,
    modeloComponenteId: 0,
    etiqueta: '',
    numeroSerie: '',
    numEjes: '',
  });

  // Modelos filtered by fabricante of this sistema + selected tipo
  const { data: modelos } = useModelos(
    sistema?.fabricanteId
      ? { fabricanteId: sistema.fabricanteId, tipo: compForm.tipo || undefined }
      : undefined,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!sistema) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Sistema no encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  const componentes: any[] = sistema.componentes ?? [];

  const resetForm = () => {
    setCompForm({ tipo: '', modeloComponenteId: 0, etiqueta: '', numeroSerie: '', numEjes: '' });
    setEditingComp(null);
  };

  const openCreate = () => {
    resetForm();
    setCompOpen(true);
  };

  const openEdit = (comp: any) => {
    setEditingComp(comp);
    setCompForm({
      tipo: comp.tipo,
      modeloComponenteId: comp.modeloComponenteId,
      etiqueta: comp.etiqueta,
      numeroSerie: comp.numeroSerie || '',
      numEjes: comp.numEjes ? String(comp.numEjes) : '',
    });
    setCompOpen(true);
  };

  const handleSubmitComp = async () => {
    if (editingComp) {
      await updateComponente.mutateAsync({
        id: editingComp.id,
        etiqueta: compForm.etiqueta,
        numeroSerie: compForm.numeroSerie || null,
        numEjes: compForm.numEjes ? Number(compForm.numEjes) : null,
      });
    } else {
      await createComponente.mutateAsync({
        tipo: compForm.tipo,
        modeloComponenteId: compForm.modeloComponenteId,
        etiqueta: compForm.etiqueta,
        numeroSerie: compForm.numeroSerie || null,
        numEjes: compForm.numEjes ? Number(compForm.numEjes) : null,
        orden: componentes.length,
      });
    }
    setCompOpen(false);
    resetForm();
  };

  const handleDeleteComp = async (compId: number, nombre: string) => {
    if (!window.confirm(`Eliminar componente "${nombre}"?`)) return;
    await deleteComponente.mutateAsync(compId);
  };

  const compCols: Column<any>[] = [
    { key: 'etiqueta', header: 'Etiqueta' },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (c) => (
        <Badge variant="secondary">{TIPO_LABELS[c.tipo] ?? c.tipo}</Badge>
      ),
    },
    {
      key: 'modelo',
      header: 'Modelo',
      render: (c) => c.modeloComponente?.nombre ?? '-',
    },
    { key: 'numeroSerie', header: 'N/S', render: (c) => c.numeroSerie || '-' },
    {
      key: 'numEjes',
      header: 'Ejes',
      render: (c) => c.numEjes ?? '-',
    },
    ...(isAdmin
      ? [
          {
            key: 'acciones' as const,
            header: '',
            render: (c: any) => (
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(c);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteComp(c.id, c.etiqueta);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const canSubmitComp = editingComp
    ? compForm.etiqueta.trim()
    : compForm.tipo && compForm.modeloComponenteId && compForm.etiqueta.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={sistema.nombre}
          description={[sistema.fabricante?.nombre, sistema.planta?.nombre, sistema.maquina?.nombre].filter(Boolean).join(' — ')}
        />
      </div>

      {sistema.descripcion && (
        <p className="text-sm text-muted-foreground">{sistema.descripcion}</p>
      )}

      {/* Componentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5" /> Componentes ({componentes.length})
          </h2>
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Componente
            </Button>
          )}
        </div>
        <DataTable
          columns={compCols}
          data={componentes}
          emptyMessage="Sin componentes. Anade controladores, unidades mecanicas, etc."
          rowKey={(c) => c.id}
        />
      </div>

      {/* Create/Edit Componente Dialog */}
      <Dialog open={compOpen} onOpenChange={(open) => { setCompOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingComp ? 'Editar componente' : 'Nuevo componente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Tipo (solo en creacion) */}
            {!editingComp && (
              <div>
                <Label>Tipo de componente</Label>
                <Select
                  value={compForm.tipo}
                  onValueChange={(v) => setCompForm({ ...compForm, tipo: v, modeloComponenteId: 0 })}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="controller">Controlador</SelectItem>
                    <SelectItem value="mechanical_unit">Unidad mecanica</SelectItem>
                    <SelectItem value="drive_unit">Unidad de accionamiento</SelectItem>
                    <SelectItem value="external_axis">Eje externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Modelo (solo en creacion) */}
            {!editingComp && (
              <div>
                <Label>Modelo</Label>
                {!compForm.tipo ? (
                  <p className="text-xs text-muted-foreground mt-1">Selecciona un tipo primero.</p>
                ) : (
                  <Select
                    value={String(compForm.modeloComponenteId || '')}
                    onValueChange={(v) => setCompForm({ ...compForm, modeloComponenteId: Number(v) })}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar modelo..." /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(modelos) ? modelos : []).map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {compForm.tipo && (modelos as any[] | undefined)?.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No hay modelos de este tipo para el fabricante {sistema.fabricante?.nombre}. Crea uno en Catalogos.
                  </p>
                )}
              </div>
            )}

            {/* Etiqueta */}
            <div>
              <Label>Etiqueta</Label>
              <Input
                value={compForm.etiqueta}
                onChange={(e) => setCompForm({ ...compForm, etiqueta: e.target.value })}
                placeholder="Ej: IRC5 Principal, MU Robot 1..."
              />
            </div>

            {/* N/S */}
            <div>
              <Label>Numero de serie (opcional)</Label>
              <Input
                value={compForm.numeroSerie}
                onChange={(e) => setCompForm({ ...compForm, numeroSerie: e.target.value })}
                placeholder="S/N..."
              />
            </div>

            {/* Ejes (solo para mechanical_unit) */}
            {compForm.tipo === 'mechanical_unit' && (
              <div>
                <Label>Numero de ejes</Label>
                <Input
                  type="number"
                  value={compForm.numEjes}
                  onChange={(e) => setCompForm({ ...compForm, numEjes: e.target.value })}
                  placeholder="6"
                  min={1}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCompOpen(false); resetForm(); }}>Cancelar</Button>
            <Button
              onClick={handleSubmitComp}
              disabled={!canSubmitComp || createComponente.isPending || updateComponente.isPending}
            >
              {(createComponente.isPending || updateComponente.isPending)
                ? (editingComp ? 'Guardando...' : 'Creando...')
                : (editingComp ? 'Guardar' : 'Crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
