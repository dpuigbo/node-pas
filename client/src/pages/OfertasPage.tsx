import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, Trash2, Send, CheckCircle, XCircle, Calendar,
  RefreshCw, ArrowRight, X, Loader2, Clock, ChevronDown, ChevronRight,
} from 'lucide-react';
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
import {
  useOfertas, useOferta, useCreateOferta,
  useUpdateEstadoOferta, useRecalcularOferta,
  useGenerarIntervencion, useDeleteOferta,
} from '@/hooks/useOfertas';

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

const NIVEL_LABEL: Record<string, string> = {
  '1': 'Nivel 1',
  '2_inferior': 'Nivel 2 Inf.',
  '2_superior': 'Nivel 2 Sup.',
  '3': 'Nivel 3',
};

const TIPO_BADGE: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700',
  correctiva: 'bg-orange-100 text-orange-700',
};

const DIAS_SEMANA = [
  { value: '1', label: 'L' },
  { value: '2', label: 'M' },
  { value: '3', label: 'X' },
  { value: '4', label: 'J' },
  { value: '5', label: 'V' },
  { value: '6', label: 'S' },
  { value: '7', label: 'D' },
];

const DIAS_LABEL: Record<string, string> = {
  '1': 'Lun', '2': 'Mar', '3': 'Mie', '4': 'Jue', '5': 'Vie', '6': 'Sab', '7': 'Dom',
};

interface SistemaOferta {
  sistemaId: number;
  nivel: string;
}

export default function OfertasPage() {
  const { isAdmin } = useAuth();
  const { data: ofertas, isLoading } = useOfertas();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

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
              onClick={() => setDetailId(oferta.id)}
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

      {/* Detail dialog */}
      {detailId && (
        <OfertaDetailDialog
          ofertaId={detailId}
          open={!!detailId}
          onOpenChange={(open) => { if (!open) setDetailId(null); }}
        />
      )}
    </div>
  );
}

// ======================== Create Oferta Dialog ========================

function CrearOfertaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: clientes } = useClientes();
  const createOferta = useCreateOferta();

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [referencia, setReferencia] = useState('');
  const [tipo, setTipo] = useState<'preventiva' | 'correctiva'>('preventiva');
  const [validezDias, setValidezDias] = useState(30);
  const [notas, setNotas] = useState('');
  const [sistemas, setSistemas] = useState<SistemaOferta[]>([]);
  // Schedule fields
  const [showSchedule, setShowSchedule] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [diasTrabajo, setDiasTrabajo] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5']));

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
    setValidezDias(30);
    setNotas('');
    setSistemas([]);
    setShowSchedule(false);
    setFechaInicio('');
    setFechaFin('');
    setHoraInicio('08:00');
    setHoraFin('18:00');
    setDiasTrabajo(new Set(['1', '2', '3', '4', '5']));
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

  const updateNivel = (sistemaId: number, nivel: string) => {
    setSistemas((prev) => prev.map((s) => s.sistemaId === sistemaId ? { ...s, nivel } : s));
  };

  const getSistemaName = (sid: number) => {
    const s = (Array.isArray(clienteSistemas) ? clienteSistemas : []).find((s: any) => s.id === sid);
    return s?.nombre ?? `Sistema #${sid}`;
  };

  const toggleDia = (dia: string) => {
    setDiasTrabajo((prev) => {
      const next = new Set(prev);
      if (next.has(dia)) next.delete(dia);
      else next.add(dia);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!clienteId || !titulo || sistemas.length === 0) {
      alert('Rellena todos los campos obligatorios y selecciona al menos un sistema');
      return;
    }
    try {
      const body: any = {
        clienteId,
        titulo,
        referencia: referencia || null,
        tipo,
        validezDias,
        notas: notas || null,
        sistemas,
      };
      // Include schedule if filled
      if (showSchedule && fechaInicio && fechaFin && horaInicio && horaFin && diasTrabajo.size > 0) {
        body.fechaInicio = new Date(fechaInicio).toISOString();
        body.fechaFin = new Date(fechaFin).toISOString();
        body.horaInicioJornada = horaInicio;
        body.horaFinJornada = horaFin;
        body.diasTrabajo = Array.from(diasTrabajo).sort().join(',');
      }
      await createOferta.mutateAsync(body);
      handleClose(false);
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

          <div className="grid grid-cols-2 gap-4">
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

          {/* Sistemas */}
          <div>
            <Label>Sistemas y niveles *</Label>

            {sistemas.length > 0 && (
              <div className="space-y-2 mt-2">
                {sistemas.map((s) => (
                  <div key={s.sistemaId} className="flex items-center gap-2 rounded border p-2 bg-muted/30">
                    <span className="text-sm font-medium flex-1">{getSistemaName(s.sistemaId)}</span>
                    <Select value={s.nivel} onValueChange={(v) => updateNivel(s.sistemaId, v)}>
                      <SelectTrigger className="w-36 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nivel 1</SelectItem>
                        <SelectItem value="2_inferior">Nivel 2 Inf.</SelectItem>
                        <SelectItem value="2_superior">Nivel 2 Sup.</SelectItem>
                        <SelectItem value="3">Nivel 3</SelectItem>
                      </SelectContent>
                    </Select>
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

          {/* Schedule section (collapsible) */}
          <div className="border rounded-lg">
            <button
              type="button"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              onClick={() => setShowSchedule(!showSchedule)}
            >
              {showSchedule ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Clock className="h-4 w-4" />
              Planificacion horaria
              <span className="text-xs text-muted-foreground font-normal ml-1">(opcional - para calculo de recargos)</span>
            </button>

            {showSchedule && (
              <div className="px-3 pb-3 space-y-3 border-t pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Fecha inicio</Label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fecha fin</Label>
                    <Input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Hora inicio jornada</Label>
                    <Input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Hora fin jornada</Label>
                    <Input
                      type="time"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Dias de trabajo</Label>
                  <div className="flex gap-1 mt-1">
                    {DIAS_SEMANA.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDia(d.value)}
                        className={`w-9 h-9 rounded-md text-xs font-medium border transition-colors ${
                          diasTrabajo.has(d.value)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-input hover:bg-muted/50'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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

// ======================== Oferta Detail Dialog ========================

function OfertaDetailDialog({ ofertaId, open, onOpenChange }: {
  ofertaId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: oferta, isLoading } = useOferta(ofertaId);
  const updateEstado = useUpdateEstadoOferta();
  const recalcular = useRecalcularOferta();
  const deleteOferta = useDeleteOferta();
  const generarIntervencion = useGenerarIntervencion();

  const [fechaDialogOpen, setFechaDialogOpen] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!oferta) return null;

  const desglose = oferta.desgloseRecargo as any;
  const hasRecargos = desglose && desglose.resumen && desglose.resumen.length > 0;

  const handleEstado = async (estado: string) => {
    try {
      await updateEstado.mutateAsync({ id: ofertaId, estado });
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Eliminar esta oferta?')) return;
    try {
      await deleteOferta.mutateAsync(ofertaId);
      onOpenChange(false);
    } catch (err: any) {
      alert('Error al eliminar');
    }
  };

  const handleGenerarIntervencion = async () => {
    if (!fechaInicio || !fechaFin) {
      alert('Selecciona fechas de inicio y fin');
      return;
    }
    try {
      const result = await generarIntervencion.mutateAsync({
        id: ofertaId,
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: new Date(fechaFin).toISOString(),
      });
      setFechaDialogOpen(false);
      onOpenChange(false);
      // Navigate to the new intervention
      const intId = (result as any)?.data?.id;
      if (intId) navigate(`/intervenciones/${intId}`);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al generar intervencion');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {oferta.titulo}
              <Badge className={ESTADO_BADGE[oferta.estado] ?? ''}>
                {ESTADO_LABEL[oferta.estado] ?? oferta.estado}
              </Badge>
              <Badge className={TIPO_BADGE[oferta.tipo] ?? ''}>
                {oferta.tipo}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>{' '}
                <span className="font-medium">{oferta.cliente?.nombre}</span>
              </div>
              {oferta.referencia && (
                <div>
                  <span className="text-muted-foreground">Referencia:</span>{' '}
                  <span>{oferta.referencia}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Fecha:</span>{' '}
                <span>{new Date(oferta.fechaOferta).toLocaleDateString('es-ES')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Validez:</span>{' '}
                <span>{oferta.validezDias} dias</span>
              </div>
            </div>

            {/* Schedule info */}
            {oferta.horaInicioJornada && oferta.horaFinJornada && (
              <div className="flex flex-wrap gap-3 text-sm bg-muted/30 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {oferta.fechaInicio ? new Date(oferta.fechaInicio).toLocaleDateString('es-ES') : '?'}
                    {' - '}
                    {oferta.fechaFin ? new Date(oferta.fechaFin).toLocaleDateString('es-ES') : '?'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{oferta.horaInicioJornada} - {oferta.horaFinJornada}</span>
                </div>
                {oferta.diasTrabajo && (
                  <div className="flex items-center gap-1">
                    {oferta.diasTrabajo.split(',').map((d: string) => (
                      <span key={d} className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded font-medium">
                        {DIAS_LABEL[d] ?? d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {oferta.notas && (
              <p className="text-sm text-muted-foreground border-l-2 pl-3">{oferta.notas}</p>
            )}

            {/* Sistemas table */}
            <div>
              <h4 className="font-medium mb-2">Sistemas ({oferta.sistemas?.length ?? 0})</h4>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-3 py-2 text-left">Sistema</th>
                      <th className="px-3 py-2 text-left">Nivel</th>
                      <th className="px-3 py-2 text-right">Horas</th>
                      <th className="px-3 py-2 text-right">Coste</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(oferta.sistemas ?? []).map((os: any) => (
                      <tr key={os.sistemaId} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{os.sistema?.nombre}</td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="text-xs">
                            {NIVEL_LABEL[os.nivel] ?? os.nivel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {os.horas != null ? Number(os.horas).toFixed(1) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {os.costeConsumibles != null ? `${Number(os.costeConsumibles).toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {os.precioConsumibles != null ? `${Number(os.precioConsumibles).toFixed(2)} €` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50 font-medium">
                      <td colSpan={2} className="px-3 py-2 text-right">Totales consumibles:</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {oferta.totalHoras != null ? Number(oferta.totalHoras).toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {oferta.totalCoste != null ? `${Number(oferta.totalCoste).toFixed(2)} €` : '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {oferta.totalPrecio != null ? `${Number(oferta.totalPrecio).toFixed(2)} €` : '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Surcharge breakdown */}
            {hasRecargos && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Recargos por horario
                </h4>
                <div className="text-xs text-muted-foreground mb-2">
                  {desglose.diasTotales} dia(s) de trabajo: {desglose.diasNormales} normal(es)
                  {desglose.diasDomFestivos > 0 && `, ${desglose.diasDomFestivos} dom/festivo(s)`}
                  {desglose.diasEspeciales > 0 && `, ${desglose.diasEspeciales} especial(es)`}
                  {' | '}Tarifa base: {desglose.tarifaBase?.toFixed(2)} €/h
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-3 py-2 text-left">Franja</th>
                        <th className="px-3 py-2 text-right">Horas</th>
                        <th className="px-3 py-2 text-right">Recargo</th>
                        <th className="px-3 py-2 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {desglose.resumen.map((r: any, i: number) => (
                        <tr key={i} className={`border-b last:border-0 ${r.recargoPct === 0 ? 'text-muted-foreground' : ''}`}>
                          <td className="px-3 py-1.5">{r.tipo}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{r.horas.toFixed(1)} h</td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {r.recargoPct > 0 ? (
                              <span className="text-amber-600 font-medium">+{r.recargoPct}%</span>
                            ) : (
                              <span>0%</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {r.importe > 0 ? `${r.importe.toFixed(2)} €` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-amber-50 font-medium text-amber-800">
                        <td colSpan={3} className="px-3 py-2 text-right">Total recargos:</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {desglose.totalRecargo.toFixed(2)} €
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Grand total with surcharges */}
                {oferta.totalPrecio != null && (
                  <div className="mt-2 flex justify-end">
                    <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                      <span className="text-muted-foreground">Precio consumibles + recargos: </span>
                      <span className="font-bold font-mono">
                        {(Number(oferta.totalPrecio) + (Number(oferta.totalRecargo) || 0)).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {isAdmin && (
            <DialogFooter className="flex-wrap gap-2">
              <div className="flex gap-2 flex-1">
                {oferta.estado === 'borrador' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleEstado('enviada')}>
                      <Send className="mr-1 h-4 w-4" /> Enviar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                    </Button>
                  </>
                )}
                {oferta.estado === 'enviada' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleEstado('aprobada')} className="text-green-600">
                      <CheckCircle className="mr-1 h-4 w-4" /> Aprobar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEstado('rechazada')} className="text-red-600">
                      <XCircle className="mr-1 h-4 w-4" /> Rechazar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEstado('borrador')}>
                      Volver a borrador
                    </Button>
                  </>
                )}
                {oferta.estado === 'aprobada' && (
                  <Button size="sm" onClick={() => setFechaDialogOpen(true)}>
                    <Calendar className="mr-1 h-4 w-4" /> Generar intervencion
                  </Button>
                )}
                {oferta.estado === 'rechazada' && (
                  <Button variant="ghost" size="sm" onClick={() => handleEstado('borrador')}>
                    Volver a borrador
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try { await recalcular.mutateAsync(ofertaId); } catch { alert('Error al recalcular'); }
                }}
                disabled={recalcular.isPending}
                title="Recalcular precios"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Fecha dialog for generating intervention */}
      <Dialog open={fechaDialogOpen} onOpenChange={setFechaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generar intervencion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Introduce las fechas para la intervencion. Se creara con los mismos sistemas y niveles de la oferta.
            </p>
            <div>
              <Label>Fecha inicio</Label>
              <Input
                type="datetime-local"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input
                type="datetime-local"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFechaDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleGenerarIntervencion}
              disabled={generarIntervencion.isPending}
            >
              <ArrowRight className="mr-1 h-4 w-4" />
              {generarIntervencion.isPending ? 'Generando...' : 'Generar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
