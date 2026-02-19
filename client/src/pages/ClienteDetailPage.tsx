import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Building2, Cog } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useCliente, usePlantas, useCreatePlanta, useMaquinas, useCreateMaquina } from '@/hooks/useClientes';
import { useSistemas } from '@/hooks/useSistemas';
import { useAuth } from '@/hooks/useAuth';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: cliente, isLoading } = useCliente(clienteId);
  const { data: plantas } = usePlantas(clienteId);
  const { data: maquinas } = useMaquinas(clienteId);
  const { data: sistemas } = useSistemas({ clienteId });

  const createPlanta = useCreatePlanta(clienteId);
  const createMaquina = useCreateMaquina(clienteId);

  const [plantaOpen, setPlantaOpen] = useState(false);
  const [maquinaOpen, setMaquinaOpen] = useState(false);
  const [plantaForm, setPlantaForm] = useState({ nombre: '', direccion: '' });
  const [maquinaForm, setMaquinaForm] = useState({ plantaId: 0, nombre: '', descripcion: '' });

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (!cliente) return <div className="p-6">Cliente no encontrado</div>;

  const handleCreatePlanta = async () => {
    await createPlanta.mutateAsync({ nombre: plantaForm.nombre, direccion: plantaForm.direccion || null });
    setPlantaOpen(false);
    setPlantaForm({ nombre: '', direccion: '' });
  };

  const handleCreateMaquina = async () => {
    await createMaquina.mutateAsync({
      plantaId: maquinaForm.plantaId,
      nombre: maquinaForm.nombre,
      descripcion: maquinaForm.descripcion || null,
    });
    setMaquinaOpen(false);
    setMaquinaForm({ plantaId: 0, nombre: '', descripcion: '' });
  };

  const plantaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'direccion', header: 'Direccion', render: (p) => p.direccion || '-' },
    { key: 'maquinas', header: 'Maquinas', render: (p) => <Badge variant="secondary">{p._count?.maquinas ?? 0}</Badge> },
  ];

  const sistemaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'fabricante', header: 'Fabricante', render: (s) => s.fabricante?.nombre },
    { key: 'planta', header: 'Planta', render: (s) => s.planta?.nombre },
    { key: 'componentes', header: 'Componentes', render: (s) => <Badge variant="secondary">{s._count?.componentes ?? 0}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={cliente.nombre} description={cliente.sede || 'Sin sede'} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plantas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantas?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maquinas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maquinas?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sistemas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sistemas?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Plantas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" /> Plantas</h2>
          {isAdmin && <Button size="sm" onClick={() => setPlantaOpen(true)}><Plus className="h-4 w-4" /> Planta</Button>}
        </div>
        <DataTable columns={plantaCols} data={plantas || []} emptyMessage="Sin plantas" rowKey={(p) => p.id} />
      </div>

      {/* Sistemas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Cog className="h-5 w-5" /> Sistemas</h2>
        </div>
        <DataTable
          columns={sistemaCols}
          data={sistemas || []}
          emptyMessage="Sin sistemas"
          onRowClick={(s) => navigate(`/sistemas/${s.id}`)}
          rowKey={(s) => s.id}
        />
      </div>

      {/* Create Planta Dialog */}
      <Dialog open={plantaOpen} onOpenChange={setPlantaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva planta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={plantaForm.nombre} onChange={(e) => setPlantaForm({ ...plantaForm, nombre: e.target.value })} /></div>
            <div><Label>Direccion</Label><Input value={plantaForm.direccion} onChange={(e) => setPlantaForm({ ...plantaForm, direccion: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlantaOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlanta} disabled={!plantaForm.nombre.trim()}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Maquina Dialog */}
      <Dialog open={maquinaOpen} onOpenChange={setMaquinaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva maquina</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Planta</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={maquinaForm.plantaId}
                onChange={(e) => setMaquinaForm({ ...maquinaForm, plantaId: Number(e.target.value) })}
              >
                <option value={0}>Seleccionar planta...</option>
                {plantas?.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div><Label>Nombre</Label><Input value={maquinaForm.nombre} onChange={(e) => setMaquinaForm({ ...maquinaForm, nombre: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaquinaOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateMaquina} disabled={!maquinaForm.nombre.trim() || !maquinaForm.plantaId}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
