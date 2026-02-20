import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Item {
  key: string;
  label: string;
}

interface ItemsEditorProps {
  items: Item[];
  onChange: (items: Item[]) => void;
}

export function ItemsEditor({ items, onChange }: ItemsEditorProps) {
  const addItem = () => {
    const idx = items.length + 1;
    onChange([...items, { key: `item_${idx}`, label: `Item ${idx}` }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Item, val: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: val } : item,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Items</Label>

      {items.length === 0 && (
        <p className="text-[10px] text-muted-foreground">Sin items definidos</p>
      )}

      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={item.key}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-z0-9_]/g, '').toLowerCase();
              updateItem(i, 'key', val);
            }}
            placeholder="clave"
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={item.label}
            onChange={(e) => updateItem(i, 'label', e.target.value)}
            placeholder="Etiqueta"
            className="h-7 text-xs flex-1"
          />
          <button
            onClick={() => removeItem(i)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addItem}>
        <Plus className="h-3 w-3 mr-1" />
        Anadir item
      </Button>
    </div>
  );
}
