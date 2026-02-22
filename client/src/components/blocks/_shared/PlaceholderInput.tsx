import { useState, useRef } from 'react';
import { Braces, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  PLACEHOLDER_DEFINITIONS,
  PLACEHOLDER_CATEGORIES,
  resolveWithExamples,
  extractPlaceholders,
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
 * A preview button shows the resolved text and lists used placeholders.
 */
export function PlaceholderInput({
  value,
  onChange,
  placeholder,
  className,
}: PlaceholderInputProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const usedKeys = extractPlaceholders(value);
  const hasAny = usedKeys.length > 0;

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

        {/* Preview toggle button */}
        {hasAny && (
          <Button
            type="button"
            variant={showPreview ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8 shrink-0"
            title="Ver variables usadas"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Insert placeholder button */}
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
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
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
                      {items.map((p) => {
                        const isUsed = usedKeys.includes(p.key);
                        return (
                          <button
                            key={p.key}
                            type="button"
                            className={`w-full text-left px-3 py-1.5 transition-colors flex items-center justify-between gap-2 ${
                              isUsed
                                ? 'bg-blue-50 hover:bg-blue-100'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => insertPlaceholder(p.key)}
                          >
                            <div>
                              <div className="text-xs font-medium flex items-center gap-1.5">
                                {p.label}
                                {isUsed && (
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">{`{{${p.key}}}`}</div>
                            </div>
                            <span className="text-[10px] text-gray-300 italic shrink-0">
                              {p.example}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Preview panel */}
      {hasAny && showPreview && (
        <div className="rounded-md border border-blue-200 bg-blue-50/50 p-2 space-y-1.5">
          {/* Resolved text */}
          <div className="text-[11px] text-blue-700 font-medium">
            <span className="text-blue-400 text-[10px] mr-1">Vista previa:</span>
            {resolveWithExamples(value)}
          </div>
          {/* Used placeholders list */}
          <div className="flex flex-wrap gap-1">
            {usedKeys.map((key) => {
              const def = PLACEHOLDER_DEFINITIONS.find((p) => p.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-[10px] text-blue-700"
                  title={def ? `${def.label} → ${def.example}` : key}
                >
                  <Braces className="h-2.5 w-2.5" />
                  <span className="font-medium">{def?.label ?? key}</span>
                  <span className="text-blue-400">= {def?.example ?? '?'}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
