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
import {
  useFabricantes, useCreateFabricante, useUpdateFabricante, useDeleteFabricante,
} from '@/hooks/useFabricantes';
import { useAuth } from '@/hooks/useAuth';

export default function FabricantesPage() {
  const { isAdmin } = useAuth();
  const { data: fabricantes, isLoading } = useFabricantes();
  const createMutation = useCreateFabricante();
  const updateMutation = useUpdateFabricante();
  const deleteMutation = useDeleteFabricante();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [nombre, setNombre] = useState('');

  const openCreate = () => {
    setEditing(null);
    setNombre('');
    setFormOpen(true);
  };

  const openEdit = (fab: any) => {
    setEditing(fab);
    setNombre(fab.nombre);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, nombre });
    } else {
      await createMutation.mutateAsync({ nombre });
    }
    setFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleting) {
      await deleteMutation.mutateAsync(deleting.id);
      setDeleteOpen(false);
      setDeleting(null);
    }
  };

  const columns: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    {
      key: '_count',
      header: 'Modelos',
      render: (fab) => <Badge variant="secondary">{fab._count?.modelos ?? 0}</Badge>,
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (fab) => (
        <Badge variant={fab.activo ? 'success' : 'outline'}>
          {fab.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (fab: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(fab); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleting(fab); setDeleteOpen(true); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fabricantes"
        description="Gestiona los fabricantes de robots"
        actions={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nuevo fabricante
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={fabricantes || []}
        isLoading={isLoading}
        emptyMessage="No hay fabricantes"
        onRowClick={(fab) => navigate(`/fabricantes/${fab.id}`)}
        rowKey={(fab) => fab.id}
      />

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar fabricante' : 'Nuevo fabricante'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: ABB, KUKA, FANUC..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!nombre.trim()}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Desactivar fabricante"
        description={`Se desactivara "${deleting?.nombre}". No se eliminara de la base de datos.`}
        confirmLabel="Desactivar"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
