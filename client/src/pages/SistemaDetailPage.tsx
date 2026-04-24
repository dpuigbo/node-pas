import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Cpu, Bot, Cog, Trash2,
  AlertCircle, Pencil, AlertTriangle, Settings,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSistema } from '@/hooks/useSistemas';
import { useModelosCompatibles, useModelosCompatiblesCon } from '@/hooks/useModelos';
import { useCreateComponente, useCreateRobotConDU, useUpdateComponente, useDeleteComponente } from '@/hooks/useComponentes';
import { useAuth } from '@/hooks/useAuth';
import { getControllerCapabilities } from '@/lib/controller-capabilities';

const TIPO_LABELS: Record<string, string> = {
  controller: 'Controlador',
  mechanical_unit: 'Unidad mecanica',
  drive_unit: 'Drive Unit',
  external_axis: 'Eje externo',
};

const TIPO_ICON: Record<string, React.ReactNode> = {
  controller: <Cpu className="h-4 w-4 text-blue-500" />,
  mechanical_unit: <Bot className="h-4 w-4 text-green-500" />,
  drive_unit: <Cpu className="h-4 w-4 text-purple-500" />,
  external_axis: <Cog className="h-4 w-4 text-orange-500" />,
};

export default function SistemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sistemaId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: sistema, isLoading } = useSistema(sistemaId || undefined);
  const createComponente = useCreateComponente(sistemaId);
  const createRobotConDU = useCreateRobotConDU(sistemaId);
  const updateComponente = useUpdateComponente(sistemaId);
  const deleteComponente = useDeleteComponente(sistemaId);

  // Dialog state
  const [dialogMode, setDialogMode] = useState<'robot' | 'eje' | 'edit' | null>(null);
  const [editingComp, setEditingComp] = useState<any>(null);

  // Form for adding robot / eje / editing
  const [familia, setFamilia] = useState('');
  const [modeloId, setModeloId] = useState(0);
  const [modeloNombre, setModeloNombre] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [numEjes, setNumEjes] = useState('6');

  // Derive system info
  const componentes: any[] = sistema?.componentes ?? [];
  const controller = componentes.find((c: any) => c.tipo === 'controller');
  const controllerId = controller?.modeloComponenteId;
  const controllerNombre = controller?.modeloComponente?.nombre ?? '';

  const capabilities = useMemo(() => {
    if (!controllerNombre) return null;
    return getControllerCapabilities(controllerNombre);
  }, [controllerNombre]);

  // Count components by type
  const robotCount = componentes.filter((c: any) => c.tipo === 'mechanical_unit').length;
  const duCount = componentes.filter((c: any) => c.tipo === 'drive_unit').length;
  const ejeCount = componentes.filter((c: any) => c.tipo === 'external_axis').length;

  // Limits
  const canAddRobot = capabilities?.multimove && robotCount < (capabilities?.maxRobots ?? 1);
  const maxEjes = (duCount + 1) * (capabilities?.maxExternalAxesPerDU ?? 3); // +1 for implicit first DU
  const canAddEje = capabilities?.allowExternalAxes && ejeCount < maxEjes;

  // Fetch compatible models for dialogs
  const { data: robotModelos } = useModelosCompatiblesCon(
    dialogMode === 'robot' ? controllerId : undefined,
    'mechanical_unit',
  );
  const { data: ejeModelos } = useModelosCompatiblesCon(
    dialogMode === 'eje' ? controllerId : undefined,
    'external_axis',
  );

  const activeModelos = dialogMode === 'robot' ? robotModelos : dialogMode === 'eje' ? ejeModelos : [];
  const familias = useMemo(() => {
    if (!activeModelos) return [];
    const fams = new Set<string>();
    activeModelos.forEach((m: any) => { if (m.familia) fams.add(m.familia); });
    return [...fams].sort();
  }, [activeModelos]);
  const modelosInFamilia = useMemo(() => {
    if (!activeModelos || !familia) return [];
    return activeModelos.filter((m: any) => m.familia === familia);
  }, [activeModelos, familia]);

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

  const resetForm = () => {
    setFamilia('');
    setModeloId(0);
    setModeloNombre('');
    setEtiqueta('');
    setNumeroSerie('');
    setNumEjes('6');
    setEditingComp(null);
  };

  const openAddRobot = () => {
    resetForm();
    setDialogMode('robot');
  };

  const openAddEje = () => {
    resetForm();
    setDialogMode('eje');
  };

  const openEdit = (comp: any) => {
    setEditingComp(comp);
    setEtiqueta(comp.etiqueta);
    setNumeroSerie(comp.numeroSerie || '');
    setNumEjes(comp.numEjes ? String(comp.numEjes) : '');
    setDialogMode('edit');
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'edit' && editingComp) {
        await updateComponente.mutateAsync({
          id: editingComp.id,
          etiqueta,
          numeroSerie: numeroSerie || null,
          numEjes: numEjes ? Number(numEjes) : null,
        });
      } else if (dialogMode === 'robot') {
        // Robot adicional: create robot + DU automatically
        await createRobotConDU.mutateAsync({
          tipo: 'mechanical_unit',
          modeloComponenteId: modeloId,
          etiqueta,
          numeroSerie: numeroSerie || null,
          numEjes: numEjes ? Number(numEjes) : null,
        });
      } else if (dialogMode === 'eje') {
        await createComponente.mutateAsync({
          tipo: 'external_axis',
          modeloComponenteId: modeloId,
          etiqueta,
          numeroSerie: numeroSerie || null,
          orden: componentes.length,
        });
      }
      setDialogMode(null);
      resetForm();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error');
    }
  };

  const handleDelete = async (compId: number, nombre: string) => {
    if (!window.confirm(`Eliminar componente "${nombre}"?`)) return;
    await deleteComponente.mutateAsync(compId);
  };

  const canSubmit = dialogMode === 'edit'
    ? etiqueta.trim()
    : modeloId > 0 && etiqueta.trim();

  const compCols: Column<any>[] = [
    {
      key: 'tipo',
      header: '',
      className: 'w-8',
      render: (c) => TIPO_ICON[c.tipo] ?? null,
    },
    { key: 'etiqueta', header: 'Etiqueta' },
    {
      key: 'tipoLabel',
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
      ? [{
          key: 'acciones' as const,
          header: '',
          render: (c: any) => (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.etiqueta); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={sistema.nombre}
          description={[sistema.fabricante?.nombre, sistema.maquina?.nombre].filter(Boolean).join(' — ')}
        />
        <div className="ml-auto">
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate(`/sistemas/${sistemaId}/editar`)}>
              <Settings className="h-4 w-4 mr-2" /> Editar sistema
            </Button>
          )}
        </div>
      </div>

      {sistema.descripcion && (
        <p className="text-sm text-muted-foreground">{sistema.descripcion}</p>
      )}

      {/* Capacity info */}
      {capabilities && (
        <Card>
          <CardContent className="py-3 flex items-center gap-4 flex-wrap">
            {capabilities.multimove ? (
              <Badge>Multimove</Badge>
            ) : (
              <Badge variant="outline">Sistema simple</Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Robots: {robotCount}/{capabilities.maxRobots}
            </span>
            {capabilities.allowExternalAxes && (
              <span className="text-sm text-muted-foreground">
                Ejes: {ejeCount}/{maxEjes}
              </span>
            )}
            {duCount > 0 && (
              <span className="text-sm text-muted-foreground">
                Drive Units: {duCount}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {/* Componentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5" /> Componentes ({componentes.length})
          </h2>
          {isAdmin && (
            <div className="flex gap-2">
              {canAddRobot && (
                <Button size="sm" variant="outline" onClick={openAddRobot}>
                  <Bot className="h-4 w-4 mr-1" /> Robot adicional
                </Button>
              )}
              {canAddEje && (
                <Button size="sm" variant="outline" onClick={openAddEje}>
                  <Cog className="h-4 w-4 mr-1" /> Eje externo
                </Button>
              )}
            </div>
          )}
        </div>
        <DataTable
          columns={compCols}
          data={componentes}
          emptyMessage="Sin componentes."
          rowKey={(c) => c.id}
        />
      </div>

      {/* Add Robot / Add Eje / Edit Dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) { setDialogMode(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'robot' && 'Anadir robot adicional'}
              {dialogMode === 'eje' && 'Anadir eje externo'}
              {dialogMode === 'edit' && 'Editar componente'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {dialogMode === 'robot' && (
              <p className="text-sm text-muted-foreground">
                Se creara automaticamente una Drive Unit para este robot.
              </p>
            )}

            {/* Familia + Modelo (only for create) */}
            {dialogMode !== 'edit' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Familia</Label>
                    <Select
                      value={familia}
                      onValueChange={(v) => { setFamilia(v); setModeloId(0); setModeloNombre(''); }}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar familia" /></SelectTrigger>
                      <SelectContent>
                        {familias.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Select
                      value={String(modeloId || '')}
                      onValueChange={(v) => {
                        const id = Number(v);
                        setModeloId(id);
                        const m = modelosInFamilia.find((m: any) => m.id === id);
                        setModeloNombre(m?.nombre ?? '');
                        setEtiqueta(m?.nombre ?? '');
                      }}
                      disabled={!familia}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar modelo" /></SelectTrigger>
                      <SelectContent>
                        {modelosInFamilia.map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!activeModelos || activeModelos.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No hay modelos compatibles con {controllerNombre}.
                  </p>
                ) : null}
              </>
            )}

            {/* Etiqueta */}
            <div>
              <Label>Etiqueta</Label>
              <Input
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder={dialogMode === 'robot' ? 'Ej: Robot 2' : 'Ej: Posicionador 1'}
              />
            </div>

            {/* N/S */}
            <div>
              <Label>Numero de serie <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
              />
            </div>

            {/* Ejes (solo para robot) */}
            {(dialogMode === 'robot' || (dialogMode === 'edit' && editingComp?.tipo === 'mechanical_unit')) && (
              <div>
                <Label>Numero de ejes</Label>
                <Input
                  type="number"
                  value={numEjes}
                  onChange={(e) => setNumEjes(e.target.value)}
                  min={1} max={10}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogMode(null); resetForm(); }}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || createComponente.isPending || createRobotConDU.isPending || updateComponente.isPending}
            >
              {(createComponente.isPending || createRobotConDU.isPending || updateComponente.isPending)
                ? 'Guardando...'
                : dialogMode === 'edit' ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
