import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, X, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useClientes } from '@/hooks/useClientes';
import { useSistemas } from '@/hooks/useSistemas';
import { useOfertas, useCreateOferta } from '@/hooks/useOfertas';

const ESTADO_BADGE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
};

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const TIPO_BADGE: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700',
  correctiva: 'bg-orange-100 text-orange-700',
};

interface SistemaOferta {
  sistemaId: number;
  nivel: string;
}

export default function OfertasPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: ofertas, isLoading } = useOfertas();

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ofertas"
        description="Gestiona ofertas de mantenimiento para clientes"
        actions={
          isAdmin ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nueva oferta
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!Array.isArray(ofertas) || ofertas.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <FileText className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-muted-foreground">No hay ofertas registradas</p>
        </div>
      )}

      {Array.isArray(ofertas) && ofertas.length > 0 && (
        <div className="space-y-3">
          {ofertas.map((oferta: any) => (
            <div
              key={oferta.id}
              onClick={() => navigate(`/ofertas/${oferta.id}`)}
              className="flex items-center justify-between rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{oferta.titulo}</span>
                  {oferta.referencia && (
                    <span className="text-xs text-muted-foreground">({oferta.referencia})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{oferta.cliente?.nombre}</span>
                  <span>-</span>
                  <span>{oferta.sistemas?.length ?? 0} sistema(s)</span>
                  <span>-</span>
                  <span>{new Date(oferta.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={TIPO_BADGE[oferta.tipo] ?? ''}>
                  {oferta.tipo}
                </Badge>
                <Badge className={ESTADO_BADGE[oferta.estado] ?? 'bg-gray-100 text-gray-700'}>
                  {ESTADO_LABEL[oferta.estado] ?? oferta.estado}
                </Badge>
                {oferta.totalPrecio && (
                  <span className="text-sm font-mono font-medium">
                    {Number(oferta.totalPrecio).toFixed(2)} €
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {isAdmin && (
        <CrearOfertaDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </div>
  );
}

// ======================== Create Oferta Dialog ========================

function CrearOfertaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { data: clientes } = useClientes();
  const createOferta = useCreateOferta();

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [referencia, setReferencia] = useState('');
  const [tipo, setTipo] = useState<'preventiva' | 'correctiva'>('preventiva');
  const [tipoOferta, setTipoOferta] = useState<'mantenimiento' | 'solo_limpieza'>('mantenimiento');
  const [validezDias, setValidezDias] = useState(30);
  const [notas, setNotas] = useState('');
  const [sistemas, setSistemas] = useState<SistemaOferta[]>([]);

  const { data: clienteSistemas } = useSistemas(clienteId ? { clienteId } : undefined);

  const availableSistemas = useMemo(() => {
    if (!Array.isArray(clienteSistemas)) return [];
    const selectedIds = new Set(sistemas.map((s) => s.sistemaId));
    return clienteSistemas.filter((s: any) => !selectedIds.has(s.id));
  }, [clienteSistemas, sistemas]);

  const reset = () => {
    setClienteId(null);
    setTitulo('');
    setReferencia('');
    setTipo('preventiva');
    setTipoOferta('mantenimiento');
    setValidezDias(30);
    setNotas('');
    setSistemas([]);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const addSistema = (sistemaId: number) => {
    setSistemas((prev) => [...prev, { sistemaId, nivel: '1' }]);
  };

  const removeSistema = (sistemaId: number) => {
    setSistemas((prev) => prev.filter((s) => s.sistemaId !== sistemaId));
  };

  const getSistemaName = (sid: number) => {
    const s = (Array.isArray(clienteSistemas) ? clienteSistemas : []).find((s: any) => s.id === sid);
    return s?.nombre ?? `Sistema #${sid}`;
  };

  const handleSubmit = async () => {
    if (!clienteId || !titulo || sistemas.length === 0) {
      alert('Rellena todos los campos obligatorios y selecciona al menos un sistema');
      return;
    }
    try {
      const result = await createOferta.mutateAsync({
        clienteId,
        titulo,
        referencia: referencia || null,
        tipo,
        tipoOferta,
        validezDias,
        notas: notas || null,
        sistemas,
      });
      handleClose(false);
      // Redirigir al editor de la oferta recien creada
      const newId = (result as any)?.data?.id;
      if (newId) navigate(`/ofertas/${newId}`);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al crear oferta');
    }
  };

  const activos = (Array.isArray(clientes) ? clientes : []).filter((c: any) => c.activo);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva oferta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <Label>Cliente *</Label>
            <Select
              value={clienteId ? String(clienteId) : ''}
              onValueChange={(v) => { setClienteId(Number(v)); setSistemas([]); }}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
              <SelectContent>
                {(activos as any[]).map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Titulo *</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Mantenimiento preventivo N1..." />
            </div>
            <div>
              <Label>Referencia</Label>
              <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="OF-2026-001" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="correctiva">Correctiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modalidad *</Label>
              <Select value={tipoOferta} onValueChange={(v: any) => setTipoOferta(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="solo_limpieza">Solo limpieza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Validez (dias)</Label>
              <Input type="number" min={1} value={validezDias} onChange={(e) => setValidezDias(Number(e.target.value) || 30)} />
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <textarea
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px]"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* Sistemas (sin niveles - se ajustan en el editor) */}
          <div>
            <Label>Sistemas *</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Selecciona los sistemas a incluir. Los niveles y opciones por componente se ajustan en el editor.
            </p>

            {sistemas.length > 0 && (
              <div className="space-y-2 mt-2">
                {sistemas.map((s) => (
                  <div key={s.sistemaId} className="flex items-center gap-2 rounded border p-2 bg-muted/30">
                    <span className="text-sm font-medium flex-1">{getSistemaName(s.sistemaId)}</span>
                    <button type="button" onClick={() => removeSistema(s.sistemaId)} className="text-destructive hover:text-destructive/80 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {clienteId && availableSistemas.length > 0 && (
              <Select value="" onValueChange={(v) => addSistema(Number(v))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Anadir sistema..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSistemas.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                      {s.fabricante?.nombre && <span className="text-muted-foreground ml-1">({s.fabricante.nombre})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!clienteId && (
              <p className="text-xs text-muted-foreground mt-2">Selecciona un cliente primero</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createOferta.isPending}>
            {createOferta.isPending ? 'Creando...' : 'Crear oferta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

