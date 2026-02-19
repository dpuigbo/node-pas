import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
};

export default function ModelosPage() {
  const { isAdmin } = useAuth();
  const { data: modelos, isLoading } = useModelos();
  const { data: fabricantes } = useFabricantes();
  const createMutation = useCreateModelo();
  const deleteMutation = useDeleteModelo();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);
  const [form, setForm] = useState({ fabricanteId: 0, tipo: '', nombre: '' });

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      fabricanteId: form.fabricanteId,
      tipo: form.tipo,
      nombre: form.nombre,
    });
    setFormOpen(false);
    setForm({ fabricanteId: 0, tipo: '', nombre: '' });
  };

  const columns: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'fabricante', header: 'Fabricante', render: (m) => m.fabricante?.nombre },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (m) => <Badge variant="secondary">{TIPO_LABELS[m.tipo] || m.tipo}</Badge>,
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
        title="Modelos de Componente"
        description="Controladores, unidades mecanicas y de accionamiento"
        actions={
          isAdmin && (
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
        emptyMessage="No hay modelos"
        onRowClick={(m) => navigate(`/modelos/${m.id}`)}
        rowKey={(m) => m.id}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo modelo de componente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fabricante</Label>
              <Select value={String(form.fabricanteId || '')} onValueChange={(v) => setForm({ ...form, fabricanteId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar fabricante" /></SelectTrigger>
                <SelectContent>
                  {fabricantes?.filter((f: any) => f.activo).map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="controller">Controlador</SelectItem>
                  <SelectItem value="mechanical_unit">Unidad Mecanica</SelectItem>
                  <SelectItem value="drive_unit">Unidad de Accionamiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: IRC5, IRBT 7600..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.nombre.trim() || !form.fabricanteId || !form.tipo}>Crear</Button>
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
