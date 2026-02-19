import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
import { useIntervenciones, useCreateIntervencion } from '@/hooks/useIntervenciones';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';

const ESTADO_COLORS: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'outline'> = {
  borrador: 'secondary',
  en_curso: 'warning',
  completada: 'success',
  facturada: 'default',
};

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  en_curso: 'En curso',
  completada: 'Completada',
  facturada: 'Facturada',
};

export default function IntervencionesPage() {
  const { isAdmin } = useAuth();
  const { data: intervenciones, isLoading } = useIntervenciones();
  const { data: clientes } = useClientes();
  const createMutation = useCreateIntervencion();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ clienteId: 0, tipo: 'preventiva', titulo: '' });

  const handleSubmit = async () => {
    await createMutation.mutateAsync(form);
    setFormOpen(false);
    setForm({ clienteId: 0, tipo: 'preventiva', titulo: '' });
  };

  const columns: Column<any>[] = [
    { key: 'titulo', header: 'Titulo' },
    { key: 'cliente', header: 'Cliente', render: (i) => i.cliente?.nombre },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (i) => (
        <Badge variant={i.tipo === 'preventiva' ? 'default' : 'warning'}>
          {i.tipo === 'preventiva' ? 'Preventiva' : 'Correctiva'}
        </Badge>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (i) => <Badge variant={ESTADO_COLORS[i.estado]}>{ESTADO_LABELS[i.estado]}</Badge>,
    },
    {
      key: 'sistemas',
      header: 'Sistemas',
      render: (i) => <Badge variant="outline">{i.sistemas?.length ?? 0}</Badge>,
    },
    {
      key: 'informes',
      header: 'Informes',
      render: (i) => <Badge variant="outline">{i._count?.informes ?? 0}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (i) => new Date(i.createdAt).toLocaleDateString('es-ES'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intervenciones"
        description="Intervenciones preventivas y correctivas"
        actions={
          isAdmin && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva intervencion
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={intervenciones || []}
        isLoading={isLoading}
        emptyMessage="No hay intervenciones"
        onRowClick={(i) => navigate(`/intervenciones/${i.id}`)}
        rowKey={(i) => i.id}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva intervencion</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select value={String(form.clienteId || '')} onValueChange={(v) => setForm({ ...form, clienteId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes?.filter((c: any) => c.activo).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="correctiva">Correctiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Titulo</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Descripcion breve de la intervencion" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.titulo.trim() || !form.clienteId}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
