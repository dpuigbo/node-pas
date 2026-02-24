import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useFabricantes } from '@/hooks/useFabricantes';

interface Props {
  /** CSV string: "ABB,KUKA" */
  value: string;
  onChange: (csv: string) => void;
}

export function FabricanteRobotSelect({ value, onChange }: Props) {
  const { data: fabricantes } = useFabricantes();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? value.split(',').filter(Boolean) : [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (nombre: string) => {
    const next = selected.includes(nombre)
      ? selected.filter((n) => n !== nombre)
      : [...selected, nombre];
    onChange(next.join(','));
  };

  const remove = (nombre: string) => {
    onChange(selected.filter((n) => n !== nombre).join(','));
  };

  const activos = (Array.isArray(fabricantes) ? fabricantes : []).filter((f: any) => f.activo);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-9 w-full items-center gap-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {selected.length === 0 && (
            <span className="text-muted-foreground">Seleccionar fabricantes...</span>
          )}
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium"
            >
              {s}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); remove(s); }}
              />
            </span>
          ))}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {activos.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Sin fabricantes en el sistema
            </div>
          )}
          {activos.map((f: any) => (
            <label
              key={f.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={selected.includes(f.nombre)}
                onChange={() => toggle(f.nombre)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {f.nombre}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
