import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModelos, useCreateModelo, useDeleteModelo } from '@/hooks/useModelos';
import { useFabricantes } from '@/hooks/useFabricantes';
import { useAuth } from '@/hooks/useAuth';

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
  const [form, setForm] = useState({ fabricanteId: 0, nombre: '' });

  const handleSubmit = async () => {
    const res = await createMutation.mutateAsync({
      fabricanteId: form.fabricanteId,
      tipo: tipoFilter!, // tipo is set from the URL
      nombre: form.nombre,
    });
    setFormOpen(false);
    setForm({ fabricanteId: 0, nombre: '' });
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
            <Button onClick={() => setFormOpen(true)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Nuevo modelo: {TIPO_LABELS[tipoFilter!] ?? tipoFilter}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fabricante</Label>
              <Select value={String(form.fabricanteId || '')} onValueChange={(v) => setForm({ ...form, fabricanteId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar fabricante" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(fabricantes) ? fabricantes : []).filter((f: any) => f.activo).map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder={config?.placeholder ?? 'Ej: IRC5, IRB 6700...'}
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
