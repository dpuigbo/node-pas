import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  usePuntosControl, useEquivalencias, useConsumiblesCatalogo,
  useCreateConsumibleCatalogo, useUpdateConsumibleCatalogo, useDeleteConsumibleCatalogo,
} from '@/hooks/useLookups';
import { useAuth } from '@/hooks/useAuth';

const SELECT_CLASS = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

// ===== Catalogo Consumibles v2 =====
const CONSUMIBLE_TIPO_LABELS: Record<string, string> = {
  aceite: 'Aceite',
  grasa: 'Grasa',
  bateria: 'Bateria',
  filtro: 'Filtro',
  ventilador: 'Ventilador',
  rodamiento: 'Rodamiento',
  sello: 'Sello',
  cable: 'Cable',
  ball_screw: 'Ball Screw',
  tope_mecanico: 'Tope mecanico',
  tarjeta: 'Tarjeta',
  desiccant: 'Desiccant',
  otro: 'Otro',
};

const UNIDADES = ['L', 'ml', 'kg', 'g', 'ud', 'pcs'] as const;

const emptyForm = () => ({
  tipo: 'aceite' as string,
  subtipo: '',
  nombre: '',
  codigoAbb: '',
  fabricante: '',
  unidad: '',
  equivalencias: '',
  fabricanteRobot: '',
  refOriginal: '',
  refProveedor: '',
  coste: '',
  precio: '',
  notas: '',
});

function ConsumiblesCatalogoSection({ isAdmin }: { isAdmin: boolean }) {
  const [tipo, setTipo] = useState<string>('');
  const [q, setQ] = useState('');
  const { data: items, isLoading } = useConsumiblesCatalogo({
    tipo: tipo || undefined,
    q: q || undefined,
  });
  const createMut = useCreateConsumibleCatalogo();
  const updateMut = useUpdateConsumibleCatalogo();
  const deleteMut = useDeleteConsumibleCatalogo();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<any>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      tipo: item.tipo,
      subtipo: item.subtipo ?? '',
      nombre: item.nombre,
      codigoAbb: item.codigoAbb ?? '',
      fabricante: item.fabricante ?? '',
      unidad: item.unidad ?? '',
      equivalencias: item.equivalencias ?? '',
      fabricanteRobot: item.fabricanteRobot ?? '',
      refOriginal: item.refOriginal ?? '',
      refProveedor: item.refProveedor ?? '',
      coste: item.coste != null ? String(item.coste) : '',
      precio: item.precio != null ? String(item.precio) : '',
      notas: item.notas ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const data: any = {
      tipo: form.tipo,
      subtipo: form.subtipo || null,
      nombre: form.nombre,
      codigoAbb: form.codigoAbb || null,
      fabricante: form.fabricante || null,
      unidad: form.unidad || null,
      equivalencias: form.equivalencias || null,
      fabricanteRobot: form.fabricanteRobot || null,
      refOriginal: form.refOriginal || null,
      refProveedor: form.refProveedor || null,
      coste: form.coste ? Number(form.coste) : null,
      precio: form.precio ? Number(form.precio) : null,
      notas: form.notas || null,
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...data });
      } else {
        await createMut.mutateAsync(data);
      }
      setFormOpen(false);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al guardar');
    }
  };

  const cols: Column<any>[] = [
    {
      key: 'tipo',
      header: 'Tipo',
      render: (c) => (
        <div className="flex flex-col gap-0.5">
          <Badge variant="secondary" className="w-fit">{CONSUMIBLE_TIPO_LABELS[c.tipo] ?? c.tipo}</Badge>
          {c.subtipo && <span className="text-[10px] text-muted-foreground">{c.subtipo}</span>}
        </div>
      ),
    },
    { key: 'nombre', header: 'Nombre' },
    {
      key: 'codigoAbb',
      header: 'Codigo ABB',
      render: (c) => c.codigoAbb
        ? <span className="font-mono text-xs">{c.codigoAbb}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'fabricante',
      header: 'Fabricante',
      render: (c) => c.fabricante || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'unidad',
      header: 'Unid.',
      render: (c) => c.unidad || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'precio',
      header: 'Coste / Precio',
      render: (c) => (
        <div className="flex flex-col gap-0.5 text-xs">
          {c.coste != null && <span>Coste: {c.coste} €</span>}
          {c.precio != null && <span>Precio: {c.precio} €</span>}
          {c.coste == null && c.precio == null && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'apariciones',
      header: 'Usos',
      render: (c) => c.apariciones > 0
        ? <Badge variant="outline" className="text-[10px]">{c.apariciones}</Badge>
        : <span className="text-muted-foreground text-xs">0</span>,
    },
    ...(isAdmin ? [{
      key: 'acciones' as const,
      header: '',
      className: 'w-24',
      render: (c: any) => (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
            onClick={(e) => { e.stopPropagation(); setDeleting(c); setDeleteOpen(true); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold">Catalogo de Consumibles</h2>
          <p className="text-sm text-muted-foreground">
            Aceites, grasas, baterias, filtros y demas consumibles del catalogo (catalogo unificado)
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar nombre o codigo..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-56"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={SELECT_CLASS + ' w-44'}
          >
            <option value="">Todos los tipos</option>
            {Object.entries(CONSUMIBLE_TIPO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
          )}
        </div>
      </div>
      <DataTable
        columns={cols}
        data={items || []}
        isLoading={isLoading}
        emptyMessage="Sin consumibles"
        rowKey={(c) => c.id}
      />

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar consumible' : 'Nuevo consumible'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={SELECT_CLASS}>
                {Object.entries(CONSUMIBLE_TIPO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Subtipo <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input value={form.subtipo} onChange={(e) => setForm({ ...form, subtipo: e.target.value })} placeholder="engranaje, harmonic, smb_litio..." />
            </div>
            <div className="col-span-2">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Kyodo Yushi TMO 150" />
            </div>
            <div>
              <Label>Codigo ABB</Label>
              <Input value={form.codigoAbb} onChange={(e) => setForm({ ...form, codigoAbb: e.target.value })} placeholder="3HAB 9999-1" />
            </div>
            <div>
              <Label>Fabricante</Label>
              <Input value={form.fabricante} onChange={(e) => setForm({ ...form, fabricante: e.target.value })} placeholder="Mobil, Shell, ABB..." />
            </div>
            <div>
              <Label>Unidad</Label>
              <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} className={SELECT_CLASS}>
                <option value="">—</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <Label>Fab. robot compatible <span className="text-muted-foreground font-normal">(CSV)</span></Label>
              <Input value={form.fabricanteRobot} onChange={(e) => setForm({ ...form, fabricanteRobot: e.target.value })} placeholder="ABB,KUKA" />
            </div>
            <div>
              <Label>Coste (€)</Label>
              <Input type="number" step="0.01" value={form.coste} onChange={(e) => setForm({ ...form, coste: e.target.value })} />
            </div>
            <div>
              <Label>Precio (€)</Label>
              <Input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
            </div>
            <div>
              <Label>Ref. original</Label>
              <Input value={form.refOriginal} onChange={(e) => setForm({ ...form, refOriginal: e.target.value })} />
            </div>
            <div>
              <Label>Ref. proveedor</Label>
              <Input value={form.refProveedor} onChange={(e) => setForm({ ...form, refProveedor: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Equivalencias</Label>
              <Input value={form.equivalencias} onChange={(e) => setForm({ ...form, equivalencias: e.target.value })} placeholder="= Shell Tivela S150, = Castrol Optigear..." />
            </div>
            <div className="col-span-2">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.nombre.trim() || createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) ? 'Guardando...' : (editing ? 'Guardar' : 'Crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar consumible"
        description={`Se desactivara "${deleting?.nombre}".`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={async () => { await deleteMut.mutateAsync(deleting.id); setDeleteOpen(false); }}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}

// ===== Equivalencias entre Familias =====
const TIPO_EQUIV_LABELS: Record<string, string> = {
  lubricacion: 'Lubricacion',
  mantenimiento: 'Mantenimiento',
  hardware: 'Hardware',
  completa: 'Completa',
};

function EquivalenciasSection() {
  const [tipo, setTipo] = useState<string>('');
  const { data: equivalencias, isLoading } = useEquivalencias(tipo ? { tipo } : undefined);

  const cols: Column<any>[] = [
    {
      key: 'familia',
      header: 'Familia',
      render: (e) => <Badge variant="secondary">{e.familia?.codigo ?? '—'}</Badge>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (e) => <Badge variant="outline">{TIPO_EQUIV_LABELS[e.tipoEquivalencia] ?? e.tipoEquivalencia}</Badge>,
    },
    { key: 'descripcion', header: 'Descripcion' },
    {
      key: 'fuenteDoc',
      header: 'Fuente',
      render: (e) => e.fuenteDoc
        ? <span className="text-xs font-mono text-muted-foreground">{e.fuenteDoc}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'notas',
      header: 'Notas',
      render: (e) => e.notas
        ? <span className="text-xs line-clamp-2" title={e.notas}>{e.notas}</span>
        : <span className="text-muted-foreground">—</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Equivalencias entre Familias</h2>
          <p className="text-sm text-muted-foreground">
            Reglas que indican cuando una familia/variante hereda mantenimiento o lubricacion
          </p>
        </div>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className={SELECT_CLASS + ' w-48'}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_EQUIV_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <DataTable
        columns={cols}
        data={equivalencias || []}
        isLoading={isLoading}
        emptyMessage="Sin equivalencias"
        rowKey={(e) => e.id}
      />
    </div>
  );
}

// ===== Puntos de Control =====
const CATEGORIA_LABELS: Record<string, string> = {
  manipulador: 'Manipulador',
  controladora: 'Controladora',
  drive_module: 'Drive Module',
  cabling: 'Cableado',
  eje_externo: 'Eje externo',
  seguridad: 'Seguridad',
};

function PuntosControlSection() {
  const [categoria, setCategoria] = useState<string>('');
  const { data: puntos, isLoading } = usePuntosControl(categoria || undefined);

  const cols: Column<any>[] = [
    {
      key: 'categoria',
      header: 'Categoria',
      render: (p) => <Badge variant="secondary">{CATEGORIA_LABELS[p.categoria] ?? p.categoria}</Badge>,
    },
    { key: 'componente', header: 'Componente' },
    { key: 'descripcionAccion', header: 'Accion' },
    {
      key: 'intervaloTexto',
      header: 'Intervalo',
      render: (p) => p.intervaloTexto || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'generacionAplica',
      header: 'Generacion',
      render: (p) => p.generacionAplica || <span className="text-muted-foreground">—</span>,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Puntos de Control Genericos</h2>
          <p className="text-sm text-muted-foreground">
            Verificaciones transversales aplicables a varios componentes
          </p>
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className={SELECT_CLASS + ' w-48'}
        >
          <option value="">Todas las categorias</option>
          {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <DataTable
        columns={cols}
        data={puntos || []}
        isLoading={isLoading}
        emptyMessage="Sin puntos de control"
        rowKey={(p) => p.id}
      />
    </div>
  );
}

export default function CatalogosPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-8">
      <PageHeader title="Catalogos" description="Consumibles, equivalencias y puntos de control" />
      <ConsumiblesCatalogoSection isAdmin={isAdmin} />
      <EquivalenciasSection />
      <PuntosControlSection />
    </div>
  );
}
