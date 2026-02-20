import { useRef, useEffect, useCallback, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { FormFieldProps } from '@/types/formField';

const CANVAS_W = 400;
const CANVAS_H = 180;

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Firma';
  const role = (c.role as string) || '';
  const required = !!c.required;

  const current = (value as string | null) ?? null; // base64 data URL or null
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Draw existing signature on canvas when value changes externally
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (current) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        setHasStrokes(true);
      };
      img.src = current;
    } else {
      setHasStrokes(false);
    }
  }, [current]);

  const getPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        return {
          x: (touch!.clientX - rect.left) * scaleX,
          y: (touch!.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      e.preventDefault();
      isDrawing.current = true;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1a1a1a';
    },
    [readOnly, getPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || readOnly) return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasStrokes(true);
    },
    [readOnly, getPos],
  );

  const endDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Save to parent as base64 PNG
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  }, [onChange]);

  const clearSignature = () => {
    if (readOnly) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    setHasStrokes(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {role && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({role})
            </span>
          )}
        </Label>
        {!readOnly && hasStrokes && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={clearSignature}
          >
            <Eraser className="h-3.5 w-3.5" />
            Borrar
          </Button>
        )}
      </div>

      <div
        className={`rounded border ${
          readOnly ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
        } overflow-hidden`}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={`w-full touch-none ${
            readOnly ? 'cursor-not-allowed opacity-70' : 'cursor-crosshair'
          }`}
          style={{ maxWidth: '100%', height: 'auto', aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {!readOnly && !hasStrokes && (
        <p className="text-[10px] text-muted-foreground text-center">
          Dibuja tu firma con el raton o el dedo
        </p>
      )}
    </div>
  );
}
