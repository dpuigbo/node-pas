import { useEditorStore } from '@/stores/useEditorStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PageConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PageConfigDialog({ open, onOpenChange }: PageConfigDialogProps) {
  const pageConfig = useEditorStore((s) => s.pageConfig);
  const updatePageConfig = useEditorStore((s) => s.updatePageConfig);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuracion de pagina</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Orientation */}
          <div className="space-y-2">
            <Label>Orientacion</Label>
            <div className="flex gap-2">
              <button
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  pageConfig.orientation === 'portrait'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => updatePageConfig({ orientation: 'portrait' })}
              >
                Vertical
              </button>
              <button
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  pageConfig.orientation === 'landscape'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
                onClick={() => updatePageConfig({ orientation: 'landscape' })}
              >
                Horizontal
              </button>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-2">
            <Label>Margenes (mm)</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <div key={side} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 capitalize">
                    {side === 'top' ? 'Arriba' : side === 'right' ? 'Derecha' : side === 'bottom' ? 'Abajo' : 'Izquierda'}
                  </span>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={pageConfig.margins[side]}
                    onChange={(e) =>
                      updatePageConfig({
                        margins: {
                          ...pageConfig.margins,
                          [side]: Math.max(5, Math.min(50, Number(e.target.value) || 5)),
                        },
                      })
                    }
                    className="h-8 w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div className="space-y-2">
            <Label>Tamano de fuente base (px)</Label>
            <Input
              type="number"
              min={8}
              max={14}
              value={pageConfig.fontSize}
              onChange={(e) =>
                updatePageConfig({
                  fontSize: Math.max(8, Math.min(14, Number(e.target.value) || 10)),
                })
              }
              className="h-8"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
