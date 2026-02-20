import { useRef } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { FormFieldProps } from '@/types/formField';

interface StoredImage {
  name: string;
  data: string; // base64 data URL
}

export function FormField({ block, value, onChange, readOnly }: FormFieldProps) {
  const c = block.config;
  const label = (c.label as string) || 'Imagen';
  const maxFiles = (c.maxFiles as number) || 1;
  const maxSizeMB = (c.maxSizeMB as number) || 5;
  const required = !!c.required;

  const images = (value as StoredImage[]) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || readOnly) return;

    const remaining = maxFiles - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    for (const file of toProcess) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`"${file.name}" supera el limite de ${maxSizeMB} MB.`);
        continue;
      }
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" no es una imagen valida.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const newImg: StoredImage = {
          name: file.name,
          data: reader.result as string,
        };
        // Use functional update pattern via current value
        onChange([...images, newImg]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    if (readOnly) return;
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative group rounded border overflow-hidden"
              style={{ width: 120, height: 90 }}
            >
              <img
                src={img.data}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {!readOnly && images.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-gray-300 bg-gray-50 p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <span className="text-xs text-gray-500">
            Arrastra imagenes o haz clic para seleccionar
          </span>
          <span className="text-[10px] text-gray-400">
            Max {maxSizeMB} MB por archivo
            {maxFiles > 1 && ` · ${images.length}/${maxFiles} archivos`}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={maxFiles > 1}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {readOnly && images.length === 0 && (
        <div className="flex items-center justify-center gap-2 rounded border border-dashed border-gray-200 p-6">
          <ImageIcon className="h-6 w-6 text-gray-300" />
          <span className="text-xs text-gray-400">Sin imagenes</span>
        </div>
      )}
    </div>
  );
}
