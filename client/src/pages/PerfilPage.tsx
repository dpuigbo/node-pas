import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, UserCog } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function PerfilPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre ?? '');
      setTelefono(user.telefono ?? '');
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      api.put('/auth/me', { nombre: nombre.trim(), telefono: telefono.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const dirty = user
    ? nombre.trim() !== (user.nombre ?? '') || telefono.trim() !== (user.telefono ?? '')
    : false;
  const canSave = dirty && nombre.trim().length > 0 && !mutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi perfil"
        description="Tus datos como técnico. Se usan en la firma y en los informes."
        icon={UserCog}
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Datos del usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellidos"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+34 600 000 000"
              inputMode="tel"
            />
            <p className="text-xs text-muted-foreground">
              Aparece como teléfono del técnico en los informes.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ''} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Viene del inicio de sesión (Microsoft); no es editable.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rol">Rol</Label>
            <Input id="rol" value={user?.rol ?? ''} readOnly disabled />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => mutation.mutate()} disabled={!canSave}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
            {saved && <span className="text-sm text-green-600">Guardado ✓</span>}
            {mutation.isError && (
              <span className="text-sm text-red-600">Error al guardar</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
