import type { ConfigPanelProps } from '@/components/blocks/registry';

export function ConfigPanel({}: ConfigPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Este bloque fuerza un salto de pagina. Todo el contenido posterior
        aparecera en la siguiente pagina.
      </p>
    </div>
  );
}
