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
  useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente,
} from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';

const EMPTY_FORM = {
  nombre: '', sede: '', direccion: '', ciudad: '',
  codigoPostal: '', provincia: '', telefono: '', email: '', personaContacto: '',
  tarifaHoraTrabajo: '', tarifaHoraViaje: '', dietas: '', gestionAccesos: '',
  horasTrayecto: '', diasViaje: '', km: '', peajes: '', precioHotel: '', precioKm: '',
};

export default function ClientesPage() {
  const { isAdmin } = useAuth();
  const { data: clientes, isLoading } = useClientes();
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEdit = (cli: any) => {
    setEditing(cli);
    setForm({
      nombre: cli.nombre, sede: cli.sede || '',
      direccion: cli.direccion || '', ciudad: cli.ciudad || '',
      codigoPostal: cli.codigoPostal || '', provincia: cli.provincia || '',
      telefono: cli.telefono || '', email: cli.email || '',
      personaContacto: cli.personaContacto || '',
      tarifaHoraTrabajo: cli.tarifaHoraTrabajo != null ? String(cli.tarifaHoraTrabajo) : '',
      tarifaHoraViaje: cli.tarifaHoraViaje != null ? String(cli.tarifaHoraViaje) : '',
      dietas: cli.dietas != null ? String(cli.dietas) : '',
      gestionAccesos: cli.gestionAccesos != null ? String(cli.gestionAccesos) : '',
      horasTrayecto: cli.horasTrayecto != null ? String(cli.horasTrayecto) : '',
      diasViaje: cli.diasViaje != null ? String(cli.diasViaje) : '',
      km: cli.km != null ? String(cli.km) : '',
      peajes: cli.peajes != null ? String(cli.peajes) : '',
      precioHotel: cli.precioHotel != null ? String(cli.precioHotel) : '',
      precioKm: cli.precioKm != null ? String(cli.precioKm) : '',
    });
    setFormOpen(true);
  };

  const toNum = (v: string) => v.trim() ? Number(v) : null;

  const handleSubmit = async () => {
    const body = {
      nombre: form.nombre,
      sede: form.sede || null,
      direccion: form.direccion || null,
      ciudad: form.ciudad || null,
      codigoPostal: form.codigoPostal || null,
      provincia: form.provincia || null,
      telefono: form.telefono || null,
      email: form.email || null,
      personaContacto: form.personaContacto || null,
      tarifaHoraTrabajo: toNum(form.tarifaHoraTrabajo),
      tarifaHoraViaje: toNum(form.tarifaHoraViaje),
      dietas: toNum(form.dietas),
      gestionAccesos: toNum(form.gestionAccesos),
      horasTrayecto: toNum(form.horasTrayecto),
      diasViaje: toNum(form.diasViaje),
      km: toNum(form.km),
      peajes: toNum(form.peajes),
      precioHotel: toNum(form.precioHotel),
      precioKm: toNum(form.precioKm),
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...body });
    } else {
      await createMutation.mutateAsync(body);
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
    { key: 'sede', header: 'Sede', render: (cli) => cli.sede || '-' },
    {
      key: 'plantas',
      header: 'Plantas',
      render: (cli) => <Badge variant="secondary">{cli._count?.plantas ?? 0}</Badge>,
    },
    {
      key: 'sistemas',
      header: 'Sistemas',
      render: (cli) => <Badge variant="secondary">{cli._count?.sistemas ?? 0}</Badge>,
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (cli) => (
        <Badge variant={cli.activo ? 'success' : 'outline'}>
          {cli.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    ...(isAdmin ? [{
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (cli: any) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(cli); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleting(cli); setDeleteOpen(true); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes y sus instalaciones"
        actions={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nuevo cliente
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={clientes || []}
        isLoading={isLoading}
        emptyMessage="No hay clientes"
        onRowClick={(cli) => navigate(`/clientes/${cli.id}`)}
        rowKey={(cli) => cli.id}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Datos basicos */}
            <div>
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del cliente" />
            </div>
            <div>
              <Label>Sede</Label>
              <Input value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })} placeholder="Ciudad o direccion" />
            </div>
            <div>
              <Label>Persona de contacto</Label>
              <Input value={form.personaContacto} onChange={(e) => setForm({ ...form, personaContacto: e.target.value })} placeholder="Nombre contacto" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefono</Label>
                <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+34 XXX XX XX XX" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@cliente.com" />
              </div>
            </div>
            <div>
              <Label>Direccion</Label>
              <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Calle, numero..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Ciudad</Label>
                <Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} placeholder="Ciudad" />
              </div>
              <div>
                <Label>CP</Label>
                <Input value={form.codigoPostal} onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })} placeholder="08001" />
              </div>
              <div>
                <Label>Provincia</Label>
                <Input value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} placeholder="Provincia" />
              </div>
            </div>

            {/* Separator */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Tarifas</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>€/hora trabajo</Label>
                  <Input type="number" step="0.01" value={form.tarifaHoraTrabajo} onChange={(e) => setForm({ ...form, tarifaHoraTrabajo: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <Label>€/hora desplazamiento</Label>
                  <Input type="number" step="0.01" value={form.tarifaHoraViaje} onChange={(e) => setForm({ ...form, tarifaHoraViaje: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <Label>€ dieta</Label>
                  <Input type="number" step="0.01" value={form.dietas} onChange={(e) => setForm({ ...form, dietas: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <Label>€ gestion accesos</Label>
                  <Input type="number" step="0.01" value={form.gestionAccesos} onChange={(e) => setForm({ ...form, gestionAccesos: e.target.value })} placeholder="0.00" />
                </div>
              </div>
            </div>

            {/* Logistica */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Logistica viaje</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Horas trayecto</Label>
                  <Input type="number" step="0.1" value={form.horasTrayecto} onChange={(e) => setForm({ ...form, horasTrayecto: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Dias viaje</Label>
                  <Input type="number" step="0.1" value={form.diasViaje} onChange={(e) => setForm({ ...form, diasViaje: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Kilometros</Label>
                  <Input type="number" step="1" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Peajes (€)</Label>
                  <Input type="number" step="0.01" value={form.peajes} onChange={(e) => setForm({ ...form, peajes: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <Label>Precio hotel (€)</Label>
                  <Input type="number" step="0.01" value={form.precioHotel} onChange={(e) => setForm({ ...form, precioHotel: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <Label>Precio/km (€)</Label>
                  <Input type="number" step="0.01" value={form.precioKm} onChange={(e) => setForm({ ...form, precioKm: e.target.value })} placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.nombre.trim()}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Desactivar cliente"
        description={`Se desactivara "${deleting?.nombre}". No se eliminara de la base de datos.`}
        confirmLabel="Desactivar"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
