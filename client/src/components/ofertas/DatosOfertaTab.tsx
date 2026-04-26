import { useState, useMemo, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientes } from '@/hooks/useClientes';
import { useSistemas } from '@/hooks/useSistemas';
import { useCreateOferta, useUpdateOferta } from '@/hooks/useOfertas';

interface SistemaItem {
  sistemaId: number;
  nivel: string;
}

interface Props {
  oferta?: any;                   // undefined → modo creacion
  onCreated?: (id: number) => void;
  readOnly?: boolean;
}

export function DatosOfertaTab({ oferta, onCreated, readOnly }: Props) {
  const isEdit = !!oferta;
  const { data: clientes } = useClientes();
  const create = useCreateOferta();
  const update = useUpdateOferta();

  const [clienteId, setClienteId] = useState<number | null>(oferta?.clienteId ?? null);
  const [titulo, setTitulo] = useState<string>(oferta?.titulo ?? '');
  const [referencia, setReferencia] = useState<string>(oferta?.referencia ?? '');
  const [tipo, setTipo] = useState<'preventiva' | 'correctiva'>(oferta?.tipo ?? 'preventiva');
  const [tipoOferta, setTipoOferta] = useState<'mantenimiento' | 'solo_limpieza'>(oferta?.tipoOferta ?? 'mantenimiento');
  const [validezDias, setValidezDias] = useState<number>(oferta?.validezDias ?? 30);
  const [notas, setNotas] = useState<string>(oferta?.notas ?? '');
  const [sistemas, setSistemas] = useState<SistemaItem[]>(
    (oferta?.sistemas ?? []).map((s: any) => ({ sistemaId: s.sistemaId, nivel: s.nivel }))
  );

  // Re-sincronizar cuando cambia la oferta (cuando llegan los datos por fetch)
  useEffect(() => {
    if (oferta) {
      setClienteId(oferta.clienteId);
      setTitulo(oferta.titulo ?? '');
      setReferencia(oferta.referencia ?? '');
      setTipo(oferta.tipo);
      setTipoOferta(oferta.tipoOferta ?? 'mantenimiento');
      setValidezDias(oferta.validezDias);
      setNotas(oferta.notas ?? '');
      setSistemas((oferta.sistemas ?? []).map((s: any) => ({ sistemaId: s.sistemaId, nivel: s.nivel })));
    }
  }, [oferta?.id]);

  const { data: clienteSistemas } = useSistemas(clienteId ? { clienteId } : undefined);

  const availableSistemas = useMemo(() => {
    if (!Array.isArray(clienteSistemas)) return [];
    const selectedIds = new Set(sistemas.map((s) => s.sistemaId));
    return clienteSistemas.filter((s: any) => !selectedIds.has(s.id));
  }, [clienteSistemas, sistemas]);

  const addSistema = (sistemaId: number) => {
    setSistemas((prev) => [...prev, { sistemaId, nivel: 'N1' }]);
  };
  const removeSistema = (sistemaId: number) => {
    setSistemas((prev) => prev.filter((s) => s.sistemaId !== sistemaId));
  };

  const getSistemaName = (sid: number) => {
    const s = (Array.isArray(clienteSistemas) ? clienteSistemas : []).find((x: any) => x.id === sid);
    return s?.nombre ?? `Sistema #${sid}`;
  };

  const handleSubmit = async () => {
    if (!clienteId) {
      alert('Selecciona un cliente');
      return;
    }
    if (!titulo.trim()) {
      alert('Introduce un titulo');
      return;
    }
    const body = {
      clienteId,
      titulo: titulo.trim(),
      referencia: referencia.trim() || null,
      tipo,
      tipoOferta,
      validezDias,
      notas: notas.trim() || null,
      sistemas,
    };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: oferta.id, ...body });
      } else {
        const result = await create.mutateAsync(body);
        const newId = (result as any)?.data?.id;
        if (newId && onCreated) onCreated(newId);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al guardar');
    }
  };

  const activos = (Array.isArray(clientes) ? clientes : []).filter((c: any) => c.activo);
  const isPending = isEdit ? update.isPending : create.isPending;
  const canSubmit = !!clienteId && titulo.trim().length > 0;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <Label>Cliente *</Label>
        <Select
          value={clienteId ? String(clienteId) : ''}
          onValueChange={(v) => {
            const newId = Number(v);
            setClienteId(newId);
            // Si cambias de cliente, los sistemas elegidos pueden no aplicar
            if (newId !== clienteId) setSistemas([]);
          }}
          disabled={readOnly}
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
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Mantenimiento preventivo N1..."
            disabled={readOnly}
          />
        </div>
        <div>
          <Label>Referencia</Label>
          <Input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="OF-2026-001"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Tipo *</Label>
          <Select value={tipo} onValueChange={(v: any) => setTipo(v)} disabled={readOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="preventiva">Preventiva</SelectItem>
              <SelectItem value="correctiva">Correctiva</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Modalidad *</Label>
          <Select value={tipoOferta} onValueChange={(v: any) => setTipoOferta(v)} disabled={readOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="solo_limpieza">Solo limpieza</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Validez (dias)</Label>
          <Input
            type="number"
            min={1}
            value={validezDias}
            onChange={(e) => setValidezDias(Number(e.target.value) || 30)}
            disabled={readOnly}
          />
        </div>
      </div>

      <div>
        <Label>Notas</Label>
        <textarea
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-[60px] disabled:opacity-50"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          disabled={readOnly}
        />
      </div>

      <div>
        <Label>Sistemas</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Selecciona los sistemas a incluir. Los niveles y opciones por componente se ajustan en la pestaña Componentes.
        </p>

        {sistemas.length > 0 && (
          <div className="space-y-2">
            {sistemas.map((s) => (
              <div key={s.sistemaId} className="flex items-center gap-2 rounded border p-2 bg-muted/30">
                <span className="text-sm font-medium flex-1">{getSistemaName(s.sistemaId)}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeSistema(s.sistemaId)}
                    className="text-destructive hover:text-destructive/80 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!readOnly && clienteId && availableSistemas.length > 0 && (
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

      {!readOnly && (
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending ? (
              <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Guardando...</>
            ) : isEdit ? (
              'Guardar cambios'
            ) : (
              'Crear oferta'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
