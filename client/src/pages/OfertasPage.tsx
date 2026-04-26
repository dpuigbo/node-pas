import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useOfertas } from '@/hooks/useOfertas';

const ESTADO_BADGE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
};

const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const TIPO_BADGE: Record<string, string> = {
  preventiva: 'bg-blue-100 text-blue-700',
  correctiva: 'bg-orange-100 text-orange-700',
};

export default function OfertasPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: ofertas, isLoading } = useOfertas();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ofertas"
        description="Gestiona ofertas de mantenimiento para clientes"
        actions={
          isAdmin ? (
            <Button onClick={() => navigate('/ofertas/nuevo')}>
              <Plus className="mr-1 h-4 w-4" /> Nueva oferta
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!Array.isArray(ofertas) || ofertas.length === 0) && (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <FileText className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-muted-foreground">No hay ofertas registradas</p>
        </div>
      )}

      {Array.isArray(ofertas) && ofertas.length > 0 && (
        <div className="space-y-3">
          {ofertas.map((oferta: any) => (
            <div
              key={oferta.id}
              onClick={() => navigate(`/ofertas/${oferta.id}`)}
              className="flex items-center justify-between rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{oferta.titulo}</span>
                  {oferta.referencia && (
                    <span className="text-xs text-muted-foreground">({oferta.referencia})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{oferta.cliente?.nombre}</span>
                  <span>-</span>
                  <span>{oferta.sistemas?.length ?? 0} sistema(s)</span>
                  <span>-</span>
                  <span>{new Date(oferta.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={TIPO_BADGE[oferta.tipo] ?? ''}>
                  {oferta.tipo}
                </Badge>
                <Badge className={ESTADO_BADGE[oferta.estado] ?? 'bg-gray-100 text-gray-700'}>
                  {ESTADO_LABEL[oferta.estado] ?? oferta.estado}
                </Badge>
                {oferta.totalPrecio && (
                  <span className="text-sm font-mono font-medium">
                    {Number(oferta.totalPrecio).toFixed(2)} €
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
