import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Bot } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfiguracion, useUpdateConfiguracion } from '@/hooks/useCatalogos';
import { useAuth } from '@/hooks/useAuth';

const CONFIG_KEYS = [
  { clave: 'empresa_nombre', label: 'Nombre de la empresa', type: 'text' },
  { clave: 'empresa_cif', label: 'CIF', type: 'text' },
  { clave: 'empresa_direccion', label: 'Direccion', type: 'text' },
  { clave: 'empresa_telefono', label: 'Telefono', type: 'text' },
  { clave: 'empresa_email', label: 'Email', type: 'text' },
  { clave: 'empresa_web', label: 'Web', type: 'text' },
  { clave: 'informe_pie_pagina', label: 'Pie de pagina en informes', type: 'textarea' },
];

// All config keys including the logo (for saving)
const ALL_KEYS = [...CONFIG_KEYS.map((k) => k.clave), 'empresa_logo'];

export default function ConfiguracionPage() {
  const { isAdmin } = useAuth();
  const { data: config, isLoading } = useConfiguracion();
  const updateMutation = useUpdateConfiguracion();

  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) {
      setValues(config);
      setDirty(false);
    }
  }, [config]);

  const handleChange = (clave: string, valor: string) => {
    setValues((prev) => ({ ...prev, [clave]: valor }));
    setDirty(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) return;

    // Validate size (max 500KB for config storage)
    if (file.size > 500 * 1024) {
      alert('El logo no puede superar los 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleChange('empresa_logo', base64);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    handleChange('empresa_logo', '');
  };

  const handleSave = async () => {
    const items = ALL_KEYS.map((clave) => ({
      clave,
      valor: values[clave] || '',
    }));
    await updateMutation.mutateAsync(items);
    setDirty(false);
  };

  if (isLoading) return <div className="p-6">Cargando...</div>;

  const logoData = values.empresa_logo || '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracion General"
        description="Datos de la empresa y configuracion general"
        actions={
          isAdmin && dirty && (
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" /> Guardar
            </Button>
          )
        }
      />

      {/* Logo card */}
      <Card>
        <CardHeader>
          <CardTitle>Logo de la empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Este logo se usara en las cabeceras y portadas de los informes.
          </p>
          <div className="flex items-center gap-6">
            {/* Logo preview */}
            <div className="shrink-0 flex items-center justify-center w-40 h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 overflow-hidden">
              {logoData ? (
                <img
                  src={logoData}
                  alt="Logo empresa"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                  <Bot className="h-8 w-8" />
                  <span className="text-xs">Sin logo</span>
                </div>
              )}
            </div>
            {/* Upload controls */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={!isAdmin}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isAdmin}
              >
                <Upload className="h-4 w-4 mr-1" />
                {logoData ? 'Cambiar logo' : 'Subir logo'}
              </Button>
              {logoData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={!isAdmin}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                PNG o JPG. Max 500KB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company data card */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONFIG_KEYS.map((k) => (
            <div key={k.clave}>
              <Label>{k.label}</Label>
              {k.type === 'textarea' ? (
                <Textarea
                  value={values[k.clave] || ''}
                  onChange={(e) => handleChange(k.clave, e.target.value)}
                  disabled={!isAdmin}
                  rows={3}
                />
              ) : (
                <Input
                  value={values[k.clave] || ''}
                  onChange={(e) => handleChange(k.clave, e.target.value)}
                  disabled={!isAdmin}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
