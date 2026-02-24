import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useAuth } from '@/hooks/useAuth';

const TIPO_LABELS: Record<string, string> = {
  preventivo: 'Preventivo',
  correctivo: 'Correctivo',
};

export default function PlantillasPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: templates, isLoading } = useDocumentTemplates();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantillas de documento"
        description="Plantillas globales que definen la estructura de los informes"
      />

      <Card>
        <CardHeader>
          <CardTitle>Plantillas disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Cada plantilla define la portada, cabecera/pie de pagina y contraportada del documento de informe.
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando plantillas...
            </div>
          ) : !Array.isArray(templates) || templates.length === 0 ? (
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
