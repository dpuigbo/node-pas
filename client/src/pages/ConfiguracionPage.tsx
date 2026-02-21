import { useState, useEffect } from 'react';
import { Save, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConfiguracion, useUpdateConfiguracion } from '@/hooks/useCatalogos';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
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

const TIPO_LABELS: Record<string, string> = {
  preventivo: 'Preventivo',
  correctivo: 'Correctivo',
};

export default function ConfiguracionPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: config, isLoading } = useConfiguracion();
  const updateMutation = useUpdateConfiguracion();
  const { data: templates, isLoading: templatesLoading } = useDocumentTemplates();

  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

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

  const handleSave = async () => {
    const items = CONFIG_KEYS.map((k) => ({
      clave: k.clave,
      valor: values[k.clave] || '',
    }));
    await updateMutation.mutateAsync(items);
    setDirty(false);
  };

  if (isLoading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracion"
        description="Datos de la empresa y configuracion general"
        actions={
          isAdmin && dirty && (
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" /> Guardar
            </Button>
          )
        }
      />
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

      {/* Document Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas de documento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Plantillas globales que definen la estructura del documento de informe (portada, cabecera, pie, contraportada, secciones generales).
          </p>
          {templatesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando plantillas...
            </div>
          ) : !templates || templates.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No hay plantillas de documento. Ejecuta el SQL de migracion para crearlas.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Tipo: {TIPO_LABELS[t.tipo] || t.tipo}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => navigate(`/document-templates/${t.id}/editor`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
