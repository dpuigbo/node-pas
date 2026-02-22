import { useState, useRef } from 'react';
import { Braces } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  PLACEHOLDER_DEFINITIONS,
  PLACEHOLDER_CATEGORIES,
  resolveWithExamples,
  hasPlaceholders,
} from '@/lib/placeholders';

interface PlaceholderInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * An input field with a placeholder insertion button.
 * Shows a popover to insert dynamic variables like {{componente.etiqueta}}.
 * Below the input, a small preview shows the resolved text with example values.
 */
export function PlaceholderInput({
  value,
  onChange,
  placeholder,
  className,
}: PlaceholderInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertPlaceholder = (key: string) => {
    const token = `{{${key}}}`;
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const next = value.slice(0, start) + token + value.slice(end);
      onChange(next);
      // Restore cursor position after token
      setTimeout(() => {
        const pos = start + token.length;
        input.setSelectionRange(pos, pos);
        input.focus();
      }, 0);
    } else {
      onChange(value + token);
    }
    setShowMenu(false);
  };

  const showPreview = hasPlaceholders(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-8 flex-1 ${className ?? ''}`}
        />
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            title="Insertar variable dinamica"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Braces className="h-3.5 w-3.5" />
          </Button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              {/* Popover */}
              <div className="absolute right-0 top-full mt-1 z-50 w-72 max-h-64 overflow-y-auto rounded-md border bg-white shadow-lg">
                {PLACEHOLDER_CATEGORIES.map((cat) => {
                  const items = PLACEHOLDER_DEFINITIONS.filter(
                    (p) => p.category === cat.id,
                  );
                  if (items.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b">
                        {cat.label}
                      </div>
                      {items.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          className="w-full text-left px-3 py-1.5 hover:bg-blue-50 transition-colors flex items-center justify-between gap-2"
                          onClick={() => insertPlaceholder(p.key)}
                        >
                          <div>
                            <div className="text-xs font-medium">{p.label}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{`{{${p.key}}}`}</div>
                          </div>
                          <span className="text-[10px] text-gray-300 italic shrink-0">
                            {p.example}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview with example values */}
      {showPreview && (
        <div className="flex items-center gap-1 text-[10px] text-blue-500">
          <Braces className="h-3 w-3 shrink-0" />
          <span className="truncate italic">
            Vista previa: {resolveWithExamples(value)}
          </span>
        </div>
      )}
    </div>
  );
}
