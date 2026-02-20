import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Cog, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIntervencion } from '@/hooks/useIntervenciones';
import { useCrearInformes } from '@/hooks/useInformes';
import { useAuth } from '@/hooks/useAuth';

const ESTADO_INFORME_BADGE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  finalizado: 'bg-amber-100 text-amber-700',
  entregado: 'bg-green-100 text-green-700',
};

const ESTADO_INFORME_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  finalizado: 'Finalizado',
  entregado: 'Entregado',
};

const TIPO_BADGE: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700',
  correctiva: 'bg-orange-100 text-orange-700',
};

export default function IntervencionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const intervencionId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: intervencion, isLoading } = useIntervencion(
    intervencionId || undefined,
  );
  const crearInformes = useCrearInformes(intervencionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!intervencion) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Intervención no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/intervenciones')}>
          Volver a intervenciones
        </Button>
      </div>
    );
  }

  const informes: any[] = intervencion.informes ?? [];
  const sistemas: any[] = intervencion.sistemas ?? [];
  const yaCreados = informes.length > 0 && informes.length >= sistemas.length;

  const handleCrearInformes = async () => {
    try {
      await crearInformes.mutateAsync();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ?? 'Error al crear informes';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/intervenciones')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={intervencion.titulo}
          description={`${intervencion.cliente?.nombre ?? 'Sin cliente'}`}
          actions={
            <div className="flex items-center gap-2">
              <Badge
                className={
                  TIPO_BADGE[intervencion.tipo as string] ??
                  'bg-gray-100 text-gray-700'
                }
              >
                {intervencion.tipo}
              </Badge>
              <Badge variant="outline">{intervencion.estado}</Badge>
            </div>
          }
        />
      </div>

      {/* Info */}
      {intervencion.notas && (
        <p className="text-sm text-muted-foreground">{intervencion.notas}</p>
      )}

      {/* Sistemas */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Cog className="h-5 w-5" /> Sistemas ({sistemas.length})
        </h2>
        {sistemas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay sistemas asignados a esta intervención.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sistemas.map((is: any) => (
              <Card key={is.sistemaId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {is.sistema?.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {is.sistema?.fabricante?.nombre ?? ''} —{' '}
                    {is.sistema?.componentes?.length ?? 0} componentes
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Informes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Informes ({informes.length})
          </h2>
          {isAdmin && !yaCreados && sistemas.length > 0 && (
            <Button
              onClick={handleCrearInformes}
              disabled={crearInformes.isPending}
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              {crearInformes.isPending ? 'Creando...' : 'Crear Informes'}
            </Button>
          )}
        </div>

        {informes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {sistemas.length === 0
              ? 'Asigna sistemas a la intervención primero.'
              : isAdmin
                ? 'Pulsa "Crear Informes" para generar los informes de cada sistema.'
                : 'Todavía no se han generado informes.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {informes.map((informe: any) => (
              <Card
                key={informe.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/informes/${informe.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium truncate">
                      {informe.sistema?.nombre ?? `Sistema #${informe.sistemaId}`}
                    </CardTitle>
                    <Badge
                      className={
                        ESTADO_INFORME_BADGE[informe.estado as string] ??
                        'bg-gray-100 text-gray-700'
                      }
                    >
                      {ESTADO_INFORME_LABEL[informe.estado as string] ??
                        informe.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Clic para abrir y rellenar
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
