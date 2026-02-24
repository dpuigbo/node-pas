import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
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
import { useSistemas } from '@/hooks/useSistemas';
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

interface FormState {
  clienteId: number;
  tipo: string;
  titulo: string;
  sistemaIds: number[];
}

const EMPTY_FORM: FormState = { clienteId: 0, tipo: 'preventiva', titulo: '', sistemaIds: [] };

export default function IntervencionesPage() {
  const { isAdmin } = useAuth();
  const { data: intervenciones, isLoading } = useIntervenciones();
  const { data: clientes } = useClientes();
  const createMutation = useCreateIntervencion();
  const navigate = useNavigate();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });

  // Sistemas filtered by selected client
  const { data: sistemas } = useSistemas(
    form.clienteId ? { clienteId: form.clienteId } : undefined,
  );

  // Available sistemas (not yet selected)
  const availableSistemas = useMemo(() => {
    if (!Array.isArray(sistemas)) return [];
    return sistemas.filter((s: any) => !form.sistemaIds.includes(s.id));
  }, [sistemas, form.sistemaIds]);

  const handleClienteChange = (clienteId: number) => {
    setForm({ ...form, clienteId, sistemaIds: [] }); // Reset sistemas on client change
  };

  const addSistema = (sistemaId: number) => {
    setForm({ ...form, sistemaIds: [...form.sistemaIds, sistemaId] });
  };

  const removeSistema = (sistemaId: number) => {
    setForm({ ...form, sistemaIds: form.sistemaIds.filter((id) => id !== sistemaId) });
  };

  const handleSubmit = async () => {
    await createMutation.mutateAsync(form);
    setFormOpen(false);
    setForm({ ...EMPTY_FORM });
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

  // Helper to get sistema name by ID
  const getSistemaName = (id: number) => {
    const s = (Array.isArray(sistemas) ? sistemas : []).find((s: any) => s.id === id);
    return s?.nombre ?? `Sistema #${id}`;
  };

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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva intervencion</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Cliente */}
            <div>
              <Label>Cliente</Label>
              <Select
                value={String(form.clienteId || '')}
                onValueChange={(v) => handleClienteChange(Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(clientes) ? clientes : []).filter((c: any) => c.activo).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
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

            {/* Titulo */}
            <div>
              <Label>Titulo</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Descripcion breve de la intervencion"
              />
            </div>

            {/* Sistemas */}
            <div>
              <Label>Sistemas</Label>
              {!form.clienteId ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecciona un cliente primero para ver sus sistemas.
                </p>
              ) : (
                <div className="space-y-2 mt-1">
                  {/* Selected sistemas chips */}
                  {form.sistemaIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.sistemaIds.map((sid) => (
                        <Badge key={sid} variant="secondary" className="gap-1 pr-1">
                          {getSistemaName(sid)}
                          <button
                            type="button"
                            onClick={() => removeSistema(sid)}
                            className="ml-0.5 rounded-full hover:bg-gray-300/50 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add sistema selector */}
                  {availableSistemas.length > 0 ? (
                    <Select
                      value=""
                      onValueChange={(v) => addSistema(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Anadir sistema..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSistemas.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.nombre}
                            {s.fabricante?.nombre && (
                              <span className="text-muted-foreground ml-1">
                                ({s.fabricante.nombre})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : form.sistemaIds.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Todos los sistemas del cliente han sido asignados.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Este cliente no tiene sistemas registrados.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.titulo.trim() || !form.clienteId || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
