import { useState } from 'react';
import { Loader2, Wrench, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useOperacionesCorrectivas,
  useCreateOperacionCorrectiva,
  useUpdateOperacionCorrectiva,
  useDeleteOperacionCorrectiva,
  type OperacionCorrectiva,
} from '@/hooks/useOfertas';

interface Props {
  ofertaId: number;
  readOnly?: boolean;
}

export function OperacionesCorrectivas({ ofertaId, readOnly = false }: Props) {
  const { data, isLoading } = useOperacionesCorrectivas(ofertaId);
  const createOp = useCreateOperacionCorrectiva(ofertaId);
  const deleteOp = useDeleteOperacionCorrectiva(ofertaId);

  const [draft, setDraft] = useState<Record<number, { operacion: string; horas: string }>>({});

  const getDraft = (sid: number) => draft[sid] ?? { operacion: '', horas: '' };
  const setSistemaDraft = (sid: number, patch: Partial<{ operacion: string; horas: string }>) =>
    setDraft((prev) => ({ ...prev, [sid]: { ...getDraft(sid), ...patch } }));

  const handleAdd = async (sid: number) => {
    const d = getDraft(sid);
    if (!d.operacion.trim()) return;
    await createOp.mutateAsync({
      sistemaId: sid,
      operacion: d.operacion.trim(),
      horasEstimadas: d.horas.trim() ? Number(d.horas) : null,
    });
    setSistemaDraft(sid, { operacion: '', horas: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando operaciones...
      </div>
    );
  }

  if (!data || data.sistemas.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No hay sistemas en esta oferta. Anade sistemas en la pestana Datos.
      </div>
    );
  }

  const totalHoras = data.sistemas.reduce(
    (acc, s) => acc + s.operaciones.reduce((a, o) => a + (o.horasEstimadas ?? 0), 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4" />
        <h4 className="font-medium">Operaciones de reparacion por sistema</h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Introduce las operaciones correctivas a realizar y sus horas estimadas. (El catalogo de
        operaciones por manual se anadira mas adelante; de momento se introducen a mano.)
      </p>

      {data.sistemas.map((s) => {
        const d = getDraft(s.sistemaId);
        const horasSistema = s.operaciones.reduce((a, o) => a + (o.horasEstimadas ?? 0), 0);
        return (
          <div key={s.sistemaId} className="rounded-lg border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 text-sm font-medium flex items-center justify-between">
              <span>{s.sistemaNombre}</span>
              {horasSistema > 0 && (
                <span className="text-xs text-muted-foreground font-mono">{horasSistema.toFixed(1)} h</span>
              )}
            </div>
            <div className="divide-y">
              {s.operaciones.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground italic">
                  Sin operaciones. Anade la primera abajo.
                </div>
              )}
              {s.operaciones.map((op) => (
                <OperacionRow
                  key={op.id}
                  ofertaId={ofertaId}
                  op={op}
                  readOnly={readOnly}
                  onDelete={() => deleteOp.mutate(op.id)}
                />
              ))}
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/10">
                <Input
                  value={d.operacion}
                  onChange={(e) => setSistemaDraft(s.sistemaId, { operacion: e.target.value })}
                  placeholder="Operacion (p.ej. Sustitucion de reductora eje 2)"
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(s.sistemaId); }}
                />
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={d.horas}
                  onChange={(e) => setSistemaDraft(s.sistemaId, { horas: e.target.value })}
                  placeholder="h"
                  className="w-20 h-8 text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(s.sistemaId); }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdd(s.sistemaId)}
                  disabled={!d.operacion.trim() || createOp.isPending}
                >
                  <Plus className="h-4 w-4" /> Anadir
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-end gap-2 text-sm pt-2 border-t">
        <span className="text-muted-foreground">Horas estimadas totales:</span>
        <span className="font-mono font-medium">{totalHoras.toFixed(1)} h</span>
      </div>
    </div>
  );
}

function OperacionRow({
  ofertaId, op, readOnly, onDelete,
}: {
  ofertaId: number;
  op: OperacionCorrectiva;
  readOnly: boolean;
  onDelete: () => void;
}) {
  const updateOp = useUpdateOperacionCorrectiva(ofertaId);
  const [texto, setTexto] = useState(op.operacion);
  const [horas, setHoras] = useState(op.horasEstimadas != null ? String(op.horasEstimadas) : '');

  const saveTexto = () => {
    const v = texto.trim();
    if (v && v !== op.operacion) updateOp.mutate({ opId: op.id, operacion: v });
  };
  const saveHoras = () => {
    const v = horas.trim() ? Number(horas) : null;
    if (v !== op.horasEstimadas) updateOp.mutate({ opId: op.id, horasEstimadas: v });
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {readOnly ? (
        <span className="flex-1 text-sm">{op.operacion}</span>
      ) : (
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={saveTexto}
          className="flex-1 h-8 text-sm border-transparent hover:border-input focus:border-input"
        />
      )}
      {readOnly ? (
        <span className="w-20 text-right text-sm font-mono">
          {op.horasEstimadas != null ? `${op.horasEstimadas} h` : '-'}
        </span>
      ) : (
        <Input
          type="number"
          step="0.5"
          min={0}
          value={horas}
          onChange={(e) => setHoras(e.target.value)}
          onBlur={saveHoras}
          placeholder="h"
          className="w-20 h-8 text-sm"
        />
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={onDelete}
          className="text-destructive hover:text-destructive/80 p-1"
          title="Eliminar operacion"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
