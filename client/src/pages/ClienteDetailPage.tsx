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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCliente, usePlantas, useCreatePlanta, useMaquinas, useCreateMaquina } from '@/hooks/useClientes';
import { useSistemas, useCreateSistema } from '@/hooks/useSistemas';
import { useFabricantes } from '@/hooks/useFabricantes';
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
  const { data: fabricantes } = useFabricantes();

  const createPlanta = useCreatePlanta(clienteId);
  const createMaquina = useCreateMaquina(clienteId);
  const createSistema = useCreateSistema();

  const [plantaOpen, setPlantaOpen] = useState(false);
  const [maquinaOpen, setMaquinaOpen] = useState(false);
  const [sistemaOpen, setSistemaOpen] = useState(false);
  const [plantaForm, setPlantaForm] = useState({ nombre: '', direccion: '' });
  const [maquinaForm, setMaquinaForm] = useState({ plantaId: 0, nombre: '', descripcion: '' });
  const [sistemaForm, setSistemaForm] = useState({
    plantaId: 0,
    maquinaId: 0,
    fabricanteId: 0,
    nombre: '',
    descripcion: '',
  });

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

  const handleCreateSistema = async () => {
    await createSistema.mutateAsync({
      clienteId,
      plantaId: sistemaForm.plantaId,
      maquinaId: sistemaForm.maquinaId,
      fabricanteId: sistemaForm.fabricanteId,
      nombre: sistemaForm.nombre,
      descripcion: sistemaForm.descripcion || null,
    });
    setSistemaOpen(false);
    setSistemaForm({ plantaId: 0, maquinaId: 0, fabricanteId: 0, nombre: '', descripcion: '' });
  };

  // Maquinas filtered by selected planta in sistema form
  const maquinasForPlanta = (maquinas as any[] | undefined)?.filter(
    (m: any) => m.plantaId === sistemaForm.plantaId,
  ) ?? [];

  const plantaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'direccion', header: 'Direccion', render: (p) => p.direccion || '-' },
    { key: 'maquinas', header: 'Maquinas', render: (p) => <Badge variant="secondary">{p._count?.maquinas ?? 0}</Badge> },
  ];

  const maquinaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'planta', header: 'Planta', render: (m) => m.planta?.nombre ?? '-' },
    { key: 'descripcion', header: 'Descripcion', render: (m) => m.descripcion || '-' },
  ];

  const sistemaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'fabricante', header: 'Fabricante', render: (s) => s.fabricante?.nombre },
    { key: 'planta', header: 'Planta', render: (s) => s.planta?.nombre },
    { key: 'componentes', header: 'Componentes', render: (s) => <Badge variant="secondary">{s._count?.componentes ?? 0}</Badge> },
  ];

  const canCreateSistema =
    sistemaForm.nombre.trim() &&
    sistemaForm.plantaId &&
    sistemaForm.maquinaId &&
    sistemaForm.fabricanteId;

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

      {/* Maquinas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Cog className="h-5 w-5" /> Maquinas</h2>
          {isAdmin && (plantas?.length ?? 0) > 0 && (
            <Button size="sm" onClick={() => setMaquinaOpen(true)}><Plus className="h-4 w-4" /> Maquina</Button>
          )}
        </div>
        <DataTable columns={maquinaCols} data={maquinas || []} emptyMessage="Sin maquinas. Crea una planta primero." rowKey={(m) => m.id} />
      </div>

      {/* Sistemas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Cog className="h-5 w-5" /> Sistemas</h2>
          {isAdmin && (maquinas?.length ?? 0) > 0 && (
            <Button size="sm" onClick={() => setSistemaOpen(true)}><Plus className="h-4 w-4" /> Sistema</Button>
          )}
        </div>
        <DataTable
          columns={sistemaCols}
          data={sistemas || []}
          emptyMessage="Sin sistemas. Crea plantas y maquinas primero."
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
              <Select
                value={String(maquinaForm.plantaId || '')}
                onValueChange={(v) => setMaquinaForm({ ...maquinaForm, plantaId: Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar planta..." /></SelectTrigger>
                <SelectContent>
                  {plantas?.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nombre</Label><Input value={maquinaForm.nombre} onChange={(e) => setMaquinaForm({ ...maquinaForm, nombre: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaquinaOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateMaquina} disabled={!maquinaForm.nombre.trim() || !maquinaForm.plantaId}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sistema Dialog */}
      <Dialog open={sistemaOpen} onOpenChange={setSistemaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo sistema</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Planta */}
            <div>
              <Label>Planta</Label>
              <Select
                value={String(sistemaForm.plantaId || '')}
                onValueChange={(v) => setSistemaForm({ ...sistemaForm, plantaId: Number(v), maquinaId: 0 })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar planta..." /></SelectTrigger>
                <SelectContent>
                  {plantas?.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Maquina (filtrada por planta) */}
            <div>
              <Label>Maquina</Label>
              {!sistemaForm.plantaId ? (
                <p className="text-xs text-muted-foreground mt-1">Selecciona una planta primero.</p>
              ) : maquinasForPlanta.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">No hay maquinas en esta planta.</p>
              ) : (
                <Select
                  value={String(sistemaForm.maquinaId || '')}
                  onValueChange={(v) => setSistemaForm({ ...sistemaForm, maquinaId: Number(v) })}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar maquina..." /></SelectTrigger>
                  <SelectContent>
                    {maquinasForPlanta.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Fabricante */}
            <div>
              <Label>Fabricante</Label>
              <Select
                value={String(sistemaForm.fabricanteId || '')}
                onValueChange={(v) => setSistemaForm({ ...sistemaForm, fabricanteId: Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar fabricante..." /></SelectTrigger>
                <SelectContent>
                  {(fabricantes as any[] | undefined)?.map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre */}
            <div>
              <Label>Nombre del sistema</Label>
              <Input
                value={sistemaForm.nombre}
                onChange={(e) => setSistemaForm({ ...sistemaForm, nombre: e.target.value })}
                placeholder="Ej: Robot IRB 6700 - Linea 1"
              />
            </div>

            {/* Descripcion */}
            <div>
              <Label>Descripcion (opcional)</Label>
              <Input
                value={sistemaForm.descripcion}
                onChange={(e) => setSistemaForm({ ...sistemaForm, descripcion: e.target.value })}
                placeholder="Notas adicionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSistemaOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSistema} disabled={!canCreateSistema || createSistema.isPending}>
              {createSistema.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
