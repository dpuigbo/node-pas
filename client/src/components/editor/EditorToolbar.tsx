import { ArrowLeft, Save, Settings, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEditorStore } from '@/stores/useEditorStore';

interface EditorToolbarProps {
  modeloNombre: string;
  versionNumero: number;
  estado: string;
  isSaving: boolean;
  onSave: () => void;
  onOpenPageConfig: () => void;
}

export function EditorToolbar({
  modeloNombre,
  versionNumero,
  estado,
  isSaving,
  onSave,
  onOpenPageConfig,
}: EditorToolbarProps) {
  const navigate = useNavigate();
  const isDirty = useEditorStore((s) => s.isDirty);

  const estadoBadge: Record<string, { label: string; className: string }> = {
    borrador: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-800' },
    activo: { label: 'Activo', className: 'bg-green-100 text-green-800' },
    obsoleto: { label: 'Obsoleto', className: 'bg-gray-100 text-gray-600' },
  };

  const badge = estadoBadge[estado] || estadoBadge.borrador;

  return (
    <div className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Left: Back + Name */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/modelos`)}
          title="Volver a modelos"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{modeloNombre}</span>
          <span className="text-muted-foreground">v{versionNumero}</span>
          <Badge className={badge.className}>{badge.label}</Badge>
          {isDirty && (
            <span className="text-xs text-amber-600 font-medium">Sin guardar</span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpenPageConfig}>
          <Settings className="h-4 w-4 mr-1" />
          Pagina
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Guardar
        </Button>
      </div>
    </div>
  );
}
