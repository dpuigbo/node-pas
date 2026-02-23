import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useAceites, useCreateAceite, useUpdateAceite, useDeleteAceite,
  useConsumibles, useCreateConsumible, useUpdateConsumible, useDeleteConsumible,
} from '@/hooks/useCatalogos';
import { useAuth } from '@/hooks/useAuth';

// ===== Aceites table (with unidad) =====

function AceitesTable({ items, isLoading, isAdmin, onCreate, onUpdate, onDelete }: any) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', fabricante: '', unidad: '', coste: '', precio: '' });

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: '', fabricante: '', unidad: '', coste: '', precio: '' });
    setFormOpen(true);
  };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      fabricante: item.fabricante || '',
      unidad: item.unidad || '',
      coste: item.coste ? String(item.coste) : '',
      precio: item.precio ? String(item.precio) : '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      nombre: form.nombre,
      fabricante: form.fabricante || null,
      unidad: form.unidad || null,
      coste: form.coste ? Number(form.coste) : null,
      precio: form.precio ? Number(form.precio) : null,
    };
    if (editing) await onUpdate({ id: editing.id, ...body });
    else await onCreate(body);
    setFormOpen(false);
  };

  const columns: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'fabricante', header: 'Fabricante', render: (i) => i.fabricante || '-' },
    { key: 'unidad', header: 'Unidad', render: (i) => i.unidad || '-' },
    { key: 'coste', header: 'Coste', render: (i) => i.coste ? `${Number(i.coste).toFixed(2)}` : '-' },
    { key: 'precio', header: 'Precio', render: (i) => i.precio ? `${Number(i.precio).toFixed(2)}` : '-' },
    { key: 'activo', header: 'Estado', render: (i) => <Badge variant={i.activo ? 'success' : 'outline'}>{i.activo ? 'Activo' : 'Inactivo'}</Badge> },
    ...(isAdmin ? [{
      key: 'actions', header: '', className: 'w-24',
      render: (item: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Aceites y grasas</h2>
        {isAdmin && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo</Button>}
      </div>
      <DataTable columns={columns} data={items || []} isLoading={isLoading} emptyMessage="Sin aceites" rowKey={(i) => i.id} />
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nuevo'} aceite</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fabricante</Label><Input value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })} /></div>
              <div><Label>Unidad de medida</Label><Input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} placeholder="litros, kg, ml..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Coste</Label><Input type="number" step="0.01" value={form.coste} onChange={(e) => setForm({ ...form, coste: e.target.value })} /></div>
              <div><Label>Precio</Label><Input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.nombre.trim()}>{editing ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Consumibles table (unchanged) =====

function ConsumiblesTable({ items, isLoading, isAdmin, onCreate, onUpdate, onDelete }: any) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', fabricante: '', coste: '', precio: '' });

  const openCreate = () => { setEditing(null); setForm({ nombre: '', fabricante: '', coste: '', precio: '' }); setFormOpen(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ nombre: item.nombre, fabricante: item.fabricante || '', coste: item.coste ? String(item.coste) : '', precio: item.precio ? String(item.precio) : '' });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const body = {
      nombre: form.nombre,
      fabricante: form.fabricante || null,
      coste: form.coste ? Number(form.coste) : null,
      precio: form.precio ? Number(form.precio) : null,
    };
    if (editing) await onUpdate({ id: editing.id, ...body });
    else await onCreate(body);
    setFormOpen(false);
  };

  const columns: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'fabricante', header: 'Fabricante', render: (i) => i.fabricante || '-' },
    { key: 'coste', header: 'Coste', render: (i) => i.coste ? `${Number(i.coste).toFixed(2)}` : '-' },
    { key: 'precio', header: 'Precio', render: (i) => i.precio ? `${Number(i.precio).toFixed(2)}` : '-' },
    { key: 'activo', header: 'Estado', render: (i) => <Badge variant={i.activo ? 'success' : 'outline'}>{i.activo ? 'Activo' : 'Inactivo'}</Badge> },
    ...(isAdmin ? [{
      key: 'actions', header: '', className: 'w-24',
      render: (item: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Consumibles</h2>
        {isAdmin && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Nuevo</Button>}
      </div>
      <DataTable columns={columns} data={items || []} isLoading={isLoading} emptyMessage="Sin consumibles" rowKey={(i) => i.id} />
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nuevo'} consumible</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label>Fabricante</Label><Input value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Coste</Label><Input type="number" step="0.01" value={form.coste} onChange={(e) => setForm({ ...form, coste: e.target.value })} /></div>
              <div><Label>Precio</Label><Input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.nombre.trim()}>{editing ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== Page =====

export default function CatalogosPage() {
  const { isAdmin } = useAuth();
  const { data: aceites, isLoading: loadingAceites } = useAceites();
  const { data: consumibles, isLoading: loadingConsumibles } = useConsumibles();
  const createAceite = useCreateAceite();
  const updateAceite = useUpdateAceite();
  const deleteAceite = useDeleteAceite();
  const createConsumible = useCreateConsumible();
  const updateConsumible = useUpdateConsumible();
  const deleteConsumible = useDeleteConsumible();

  return (
    <div className="space-y-8">
      <PageHeader title="Catalogos" description="Aceites, grasas y consumibles" />
      <AceitesTable
        items={aceites}
        isLoading={loadingAceites}
        isAdmin={isAdmin}
        onCreate={(d: any) => createAceite.mutateAsync(d)}
        onUpdate={(d: any) => updateAceite.mutateAsync(d)}
        onDelete={(id: number) => deleteAceite.mutateAsync(id)}
      />
      <ConsumiblesTable
        items={consumibles}
        isLoading={loadingConsumibles}
        isAdmin={isAdmin}
        onCreate={(d: any) => createConsumible.mutateAsync(d)}
        onUpdate={(d: any) => updateConsumible.mutateAsync(d)}
        onDelete={(id: number) => deleteConsumible.mutateAsync(id)}
      />
    </div>
  );
}
