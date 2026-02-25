import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Building2, Cog, DollarSign, Truck, Save, X, Calculator, Loader2, Pencil, Trash2, User, Phone, Mail, MapPin, FileText, ImagePlus, Trash } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useCliente, useUpdateCliente,
  usePlantas, useCreatePlanta, useUpdatePlanta, useDeletePlanta,
  useMaquinas, useCreateMaquina, useUpdateMaquina, useDeleteMaquina,
  useUploadLogo, useDeleteLogo,
} from '@/hooks/useClientes';
import { useSistemas, useCreateSistema } from '@/hooks/useSistemas';
import { useFabricantes } from '@/hooks/useFabricantes';
import { useAuth } from '@/hooks/useAuth';
import { calculateRoute, composeAddress } from '@/lib/routeCalc';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: cliente, isLoading } = useCliente(clienteId);
  const { data: plantas } = usePlantas(clienteId);
  const { data: maquinas } = useMaquinas(clienteId);
  const { data: sistemas } = useSistemas({ clienteId });
  const { data: fabricantes } = useFabricantes();

  const createPlanta = useCreatePlanta(clienteId);
  const updatePlanta = useUpdatePlanta(clienteId);
  const deletePlanta = useDeletePlanta(clienteId);
  const createMaquina = useCreateMaquina(clienteId);
  const updateMaquina = useUpdateMaquina(clienteId);
  const deleteMaquina = useDeleteMaquina(clienteId);
  const createSistema = useCreateSistema();
  const updateCliente = useUpdateCliente();
  const uploadLogo = useUploadLogo(clienteId);
  const deleteLogo = useDeleteLogo(clienteId);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // General info editing state
  const [editingGeneral, setEditingGeneral] = useState(false);
  const [genForm, setGenForm] = useState({
    nombre: '', sede: '', direccion: '', ciudad: '', codigoPostal: '', provincia: '',
    telefono: '', email: '', personaContacto: '',
  });

  // Logistics editing state
  const [editingLogistics, setEditingLogistics] = useState(false);
  const [logForm, setLogForm] = useState({
    tarifaHoraTrabajo: '', tarifaHoraViaje: '', dietas: '', gestionAccesos: '',
    horasTrayecto: '', diasViaje: '', km: '', peajes: '', precioHotel: '', precioKm: '',
  });

  // Sync forms with client data
  useEffect(() => {
    if (cliente) {
      setGenForm({
        nombre: cliente.nombre || '',
        sede: cliente.sede || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        codigoPostal: cliente.codigoPostal || '',
        provincia: cliente.provincia || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        personaContacto: cliente.personaContacto || '',
      });
      setLogForm({
        tarifaHoraTrabajo: cliente.tarifaHoraTrabajo != null ? String(cliente.tarifaHoraTrabajo) : '',
        tarifaHoraViaje: cliente.tarifaHoraViaje != null ? String(cliente.tarifaHoraViaje) : '',
        dietas: cliente.dietas != null ? String(cliente.dietas) : '',
        gestionAccesos: cliente.gestionAccesos != null ? String(cliente.gestionAccesos) : '',
        horasTrayecto: cliente.horasTrayecto != null ? String(cliente.horasTrayecto) : '',
        diasViaje: cliente.diasViaje != null ? String(cliente.diasViaje) : '',
        km: cliente.km != null ? String(cliente.km) : '',
        peajes: cliente.peajes != null ? String(cliente.peajes) : '',
        precioHotel: cliente.precioHotel != null ? String(cliente.precioHotel) : '',
        precioKm: cliente.precioKm != null ? String(cliente.precioKm) : '',
      });
    }
  }, [cliente]);

  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const handleSaveGeneral = async () => {
    await updateCliente.mutateAsync({
      id: clienteId,
      nombre: genForm.nombre,
      sede: genForm.sede || null,
      direccion: genForm.direccion || null,
      ciudad: genForm.ciudad || null,
      codigoPostal: genForm.codigoPostal || null,
      provincia: genForm.provincia || null,
      telefono: genForm.telefono || null,
      email: genForm.email || null,
      personaContacto: genForm.personaContacto || null,
    });
    setEditingGeneral(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadLogo.mutateAsync(file);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleLogoDelete = async () => {
    if (!window.confirm('Eliminar el logo del cliente?')) return;
    await deleteLogo.mutateAsync();
  };

  const handleSaveLogistics = async () => {
    const toNum = (v: string) => v.trim() ? Number(v) : null;
    await updateCliente.mutateAsync({
      id: clienteId,
      tarifaHoraTrabajo: toNum(logForm.tarifaHoraTrabajo),
      tarifaHoraViaje: toNum(logForm.tarifaHoraViaje),
      dietas: toNum(logForm.dietas),
      gestionAccesos: toNum(logForm.gestionAccesos),
      horasTrayecto: toNum(logForm.horasTrayecto),
      diasViaje: toNum(logForm.diasViaje),
      km: toNum(logForm.km),
      peajes: toNum(logForm.peajes),
      precioHotel: toNum(logForm.precioHotel),
      precioKm: toNum(logForm.precioKm),
    });
    setEditingLogistics(false);
  };

  const handleCalculateRoute = async () => {
    if (!cliente) return;
    setCalcError(null);
    setCalculating(true);
    try {
      const address = composeAddress({
        direccion: cliente.direccion,
        ciudad: cliente.ciudad,
        codigoPostal: cliente.codigoPostal,
        provincia: cliente.provincia,
      });
      if (!address || address === 'Spain') {
        setCalcError('El cliente no tiene direccion configurada. Rellena la direccion primero.');
        return;
      }
      const result = await calculateRoute(address);
      setLogForm((prev) => ({
        ...prev,
        horasTrayecto: String(result.durationHours),
        diasViaje: String(result.diasViaje),
        km: String(result.distanceKm),
      }));
      // Auto-enter edit mode if not already editing
      if (!editingLogistics) setEditingLogistics(true);
    } catch (err: any) {
      setCalcError(err.message || 'Error al calcular la ruta');
    } finally {
      setCalculating(false);
    }
  };

  const [plantaOpen, setPlantaOpen] = useState(false);
  const [editingPlanta, setEditingPlanta] = useState<any>(null);
  const [maquinaOpen, setMaquinaOpen] = useState(false);
  const [editingMaquina, setEditingMaquina] = useState<any>(null);
  const [sistemaOpen, setSistemaOpen] = useState(false);
  const [plantaForm, setPlantaForm] = useState({ nombre: '', direccion: '' });
  const [maquinaForm, setMaquinaForm] = useState({ plantaId: 0, nombre: '', descripcion: '' });
  const [sistemaForm, setSistemaForm] = useState({
    plantaId: 0,
    maquinaId: 0,
    fabricanteId: 0,
    nombre: '',
    descripcion: '',
  });

  if (isLoading) return <div className="p-6">Cargando...</div>;
  if (!cliente) return <div className="p-6">Cliente no encontrado</div>;

  const openCreatePlanta = () => {
    setEditingPlanta(null);
    setPlantaForm({ nombre: '', direccion: '' });
    setPlantaOpen(true);
  };

  const openEditPlanta = (p: any) => {
    setEditingPlanta(p);
    setPlantaForm({ nombre: p.nombre, direccion: p.direccion || '' });
    setPlantaOpen(true);
  };

  const handleSubmitPlanta = async () => {
    if (editingPlanta) {
      await updatePlanta.mutateAsync({ id: editingPlanta.id, nombre: plantaForm.nombre, direccion: plantaForm.direccion || null });
    } else {
      await createPlanta.mutateAsync({ nombre: plantaForm.nombre, direccion: plantaForm.direccion || null });
    }
    setPlantaOpen(false);
    setEditingPlanta(null);
    setPlantaForm({ nombre: '', direccion: '' });
  };

  const handleDeletePlanta = async (p: any) => {
    if (!window.confirm(`Eliminar planta "${p.nombre}"? Se eliminaran tambien sus maquinas asociadas.`)) return;
    await deletePlanta.mutateAsync(p.id);
  };

  const openCreateMaquina = () => {
    setEditingMaquina(null);
    setMaquinaForm({ plantaId: 0, nombre: '', descripcion: '' });
    setMaquinaOpen(true);
  };

  const openEditMaquina = (m: any) => {
    setEditingMaquina(m);
    setMaquinaForm({ plantaId: m.plantaId, nombre: m.nombre, descripcion: m.descripcion || '' });
    setMaquinaOpen(true);
  };

  const handleSubmitMaquina = async () => {
    if (editingMaquina) {
      await updateMaquina.mutateAsync({
        id: editingMaquina.id,
        plantaId: maquinaForm.plantaId,
        nombre: maquinaForm.nombre,
        descripcion: maquinaForm.descripcion || null,
      });
    } else {
      await createMaquina.mutateAsync({
        plantaId: maquinaForm.plantaId,
        nombre: maquinaForm.nombre,
        descripcion: maquinaForm.descripcion || null,
      });
    }
    setMaquinaOpen(false);
    setEditingMaquina(null);
    setMaquinaForm({ plantaId: 0, nombre: '', descripcion: '' });
  };

  const handleDeleteMaquina = async (m: any) => {
    if (!window.confirm(`Eliminar maquina "${m.nombre}"?`)) return;
    await deleteMaquina.mutateAsync(m.id);
  };

  const handleCreateSistema = async () => {
    await createSistema.mutateAsync({
      clienteId,
      plantaId: sistemaForm.plantaId || null,
      maquinaId: sistemaForm.maquinaId || null,
      fabricanteId: sistemaForm.fabricanteId,
      nombre: sistemaForm.nombre,
      descripcion: sistemaForm.descripcion || null,
    });
    setSistemaOpen(false);
    setSistemaForm({ plantaId: 0, maquinaId: 0, fabricanteId: 0, nombre: '', descripcion: '' });
  };

  // Maquinas filtered by selected planta in sistema form
  const maquinasForPlanta = (Array.isArray(maquinas) ? maquinas : []).filter(
    (m: any) => m.plantaId === sistemaForm.plantaId,
  );

  const plantaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'direccion', header: 'Direccion', render: (p) => p.direccion || '-' },
    { key: 'maquinas', header: 'Maquinas', render: (p) => <Badge variant="secondary">{p._count?.maquinas ?? 0}</Badge> },
    ...(isAdmin
      ? [{
          key: 'acciones' as const,
          header: '',
          render: (p: any) => (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-500" onClick={(e) => { e.stopPropagation(); openEditPlanta(p); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeletePlanta(p); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        }]
      : []),
  ];

  const maquinaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'planta', header: 'Planta', render: (m) => m.planta?.nombre ?? '-' },
    { key: 'descripcion', header: 'Descripcion', render: (m) => m.descripcion || '-' },
    ...(isAdmin
      ? [{
          key: 'acciones' as const,
          header: '',
          render: (m: any) => (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-500" onClick={(e) => { e.stopPropagation(); openEditMaquina(m); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteMaquina(m); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        }]
      : []),
  ];

  const sistemaCols: Column<any>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'fabricante', header: 'Fabricante', render: (s) => s.fabricante?.nombre },
    { key: 'planta', header: 'Planta', render: (s) => s.planta?.nombre },
    { key: 'componentes', header: 'Componentes', render: (s) => <Badge variant="secondary">{s._count?.componentes ?? 0}</Badge> },
  ];

  const canCreateSistema =
    sistemaForm.nombre.trim() &&
    sistemaForm.fabricanteId;

  const logoUrl = cliente.logo ? `/uploads/logos/${cliente.logo}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Logo */}
        <div className="relative group shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${cliente.nombre}`}
              className="h-14 w-14 rounded-lg object-contain border bg-white p-1"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-gray-300" />
            </div>
          )}
          {isAdmin && (
            <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              <button
                className="p-1 text-white hover:text-blue-300"
                onClick={() => logoInputRef.current?.click()}
                title="Subir logo"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              {logoUrl && (
                <button
                  className="p-1 text-white hover:text-red-300"
                  onClick={handleLogoDelete}
                  title="Eliminar logo"
                >
                  <Trash className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          {uploadLogo.isPending && (
            <div className="absolute inset-0 rounded-lg bg-white/80 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        <PageHeader title={cliente.nombre} description={cliente.sede || 'Sin sede'} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plantas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plantas?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maquinas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maquinas?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sistemas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sistemas?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Datos generales */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Datos generales
          </h2>
          {isAdmin && !editingGeneral && (
            <Button variant="outline" size="sm" onClick={() => setEditingGeneral(true)}>
              Editar
            </Button>
          )}
          {editingGeneral && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveGeneral} disabled={updateCliente.isPending || !genForm.nombre.trim()}>
                <Save className="h-4 w-4 mr-1" />
                {updateCliente.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditingGeneral(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Identificacion */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Identificacion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: 'nombre' as const, label: 'Nombre', placeholder: 'Nombre del cliente' },
                { key: 'sede' as const, label: 'Sede', placeholder: 'Ciudad o ubicacion' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground min-w-[120px]">{field.label}</span>
                  {editingGeneral ? (
                    <Input
                      className="h-8 flex-1"
                      value={genForm[field.key]}
                      onChange={(e) => setGenForm({ ...genForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <span className="text-sm">{cliente[field.key] || '-'}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" /> Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: 'personaContacto' as const, label: 'Persona', placeholder: 'Nombre contacto', icon: User },
                { key: 'telefono' as const, label: 'Telefono', placeholder: '+34 XXX XX XX XX', icon: Phone },
                { key: 'email' as const, label: 'Email', placeholder: 'email@cliente.com', icon: Mail },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground min-w-[120px]">{field.label}</span>
                  {editingGeneral ? (
                    <Input
                      className="h-8 flex-1"
                      value={genForm[field.key]}
                      onChange={(e) => setGenForm({ ...genForm, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <span className="text-sm">{cliente[field.key] || '-'}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Direccion */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Direccion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingGeneral ? (
                <div className="space-y-2">
                  <Input
                    className="h-8"
                    value={genForm.direccion}
                    onChange={(e) => setGenForm({ ...genForm, direccion: e.target.value })}
                    placeholder="Calle, numero..."
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      className="h-8"
                      value={genForm.ciudad}
                      onChange={(e) => setGenForm({ ...genForm, ciudad: e.target.value })}
                      placeholder="Ciudad"
                    />
                    <Input
                      className="h-8"
                      value={genForm.codigoPostal}
                      onChange={(e) => setGenForm({ ...genForm, codigoPostal: e.target.value })}
                      placeholder="CP"
                    />
                    <Input
                      className="h-8"
                      value={genForm.provincia}
                      onChange={(e) => setGenForm({ ...genForm, provincia: e.target.value })}
                      placeholder="Provincia"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm">
                  {[cliente.direccion, cliente.codigoPostal, cliente.ciudad, cliente.provincia]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tarifas y logistica */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Tarifas y logistica
          </h2>
          {isAdmin && !editingLogistics && (
            <Button variant="outline" size="sm" onClick={() => setEditingLogistics(true)}>
              Editar
            </Button>
          )}
          {editingLogistics && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveLogistics} disabled={updateCliente.isPending}>
                <Save className="h-4 w-4 mr-1" />
                {updateCliente.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditingLogistics(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Tarifas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Tarifas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { key: 'tarifaHoraTrabajo' as const, label: '€/hora trabajo' },
                { key: 'tarifaHoraViaje' as const, label: '€/hora desplazamiento' },
                { key: 'dietas' as const, label: '€ dieta' },
                { key: 'gestionAccesos' as const, label: '€ gestion accesos' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground min-w-[160px]">{field.label}</span>
                  {editingLogistics ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 h-8 text-right"
                      value={logForm[field.key]}
                      onChange={(e) => setLogForm({ ...logForm, [field.key]: e.target.value })}
                      placeholder="0.00"
                    />
                  ) : (
                    <span className="text-sm font-mono">
                      {cliente[field.key] != null ? `${Number(cliente[field.key]).toFixed(2)} €` : '-'}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Logistica viaje */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Truck className="h-4 w-4" /> Logistica viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Calculable fields: Horas trayecto, Dias viaje, KM */}
              <div className="rounded-md border border-dashed border-blue-200 bg-blue-50/30 p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-600">Ruta desde oficina PAS</span>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={handleCalculateRoute}
                      disabled={calculating}
                    >
                      {calculating ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Calculando...</>
                      ) : (
                        <><Calculator className="h-3 w-3" /> Calcular</>
                      )}
                    </Button>
                  )}
                </div>
                {calcError && (
                  <p className="text-xs text-red-500">{calcError}</p>
                )}
                {[
                  { key: 'horasTrayecto' as const, label: 'Horas trayecto', suffix: 'h' },
                  { key: 'diasViaje' as const, label: 'Dias viaje (8h/dia)', suffix: 'd' },
                  { key: 'km' as const, label: 'Kilometros', suffix: 'km' },
                ].map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground min-w-[160px]">{field.label}</span>
                    {editingLogistics ? (
                      <Input
                        type="number"
                        step="0.01"
                        className="w-32 h-8 text-right"
                        value={logForm[field.key]}
                        onChange={(e) => setLogForm({ ...logForm, [field.key]: e.target.value })}
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-sm font-mono">
                        {cliente[field.key] != null ? `${Number(cliente[field.key]).toFixed(2)} ${field.suffix}` : '-'}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Other travel fields */}
              {[
                { key: 'peajes' as const, label: 'Peajes', suffix: '€' },
                { key: 'precioHotel' as const, label: 'Precio hotel', suffix: '€' },
                { key: 'precioKm' as const, label: 'Precio por km', suffix: '€' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground min-w-[140px]">{field.label}</span>
                  {editingLogistics ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-32 h-8 text-right"
                      value={logForm[field.key]}
                      onChange={(e) => setLogForm({ ...logForm, [field.key]: e.target.value })}
                      placeholder="0.00"
                    />
                  ) : (
                    <span className="text-sm font-mono">
                      {cliente[field.key] != null ? `${Number(cliente[field.key]).toFixed(2)} ${field.suffix}` : '-'}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Plantas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" /> Plantas</h2>
          {isAdmin && <Button size="sm" onClick={openCreatePlanta}><Plus className="h-4 w-4" /> Planta</Button>}
        </div>
        <DataTable columns={plantaCols} data={plantas || []} emptyMessage="Sin plantas" rowKey={(p) => p.id} />
      </div>

      {/* Maquinas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Cog className="h-5 w-5" /> Maquinas</h2>
          {isAdmin && (plantas?.length ?? 0) > 0 && (
            <Button size="sm" onClick={openCreateMaquina}><Plus className="h-4 w-4" /> Maquina</Button>
          )}
        </div>
        <DataTable columns={maquinaCols} data={maquinas || []} emptyMessage="Sin maquinas. Crea una planta primero." rowKey={(m) => m.id} />
      </div>

      {/* Sistemas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Cog className="h-5 w-5" /> Sistemas</h2>
          {isAdmin && (
            <Button size="sm" onClick={() => setSistemaOpen(true)}><Plus className="h-4 w-4" /> Sistema</Button>
          )}
        </div>
        <DataTable
          columns={sistemaCols}
          data={sistemas || []}
          emptyMessage="Sin sistemas."
          onRowClick={(s) => navigate(`/sistemas/${s.id}`)}
          rowKey={(s) => s.id}
        />
      </div>

      {/* Create/Edit Planta Dialog */}
      <Dialog open={plantaOpen} onOpenChange={(open) => { setPlantaOpen(open); if (!open) setEditingPlanta(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPlanta ? 'Editar planta' : 'Nueva planta'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={plantaForm.nombre} onChange={(e) => setPlantaForm({ ...plantaForm, nombre: e.target.value })} /></div>
            <div><Label>Direccion</Label><Input value={plantaForm.direccion} onChange={(e) => setPlantaForm({ ...plantaForm, direccion: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPlantaOpen(false); setEditingPlanta(null); }}>Cancelar</Button>
            <Button
              onClick={handleSubmitPlanta}
              disabled={!plantaForm.nombre.trim() || createPlanta.isPending || updatePlanta.isPending}
            >
              {(createPlanta.isPending || updatePlanta.isPending)
                ? (editingPlanta ? 'Guardando...' : 'Creando...')
                : (editingPlanta ? 'Guardar' : 'Crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Maquina Dialog */}
      <Dialog open={maquinaOpen} onOpenChange={(open) => { setMaquinaOpen(open); if (!open) setEditingMaquina(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingMaquina ? 'Editar maquina' : 'Nueva maquina'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Planta</Label>
              <Select
                value={String(maquinaForm.plantaId || '')}
                onValueChange={(v) => setMaquinaForm({ ...maquinaForm, plantaId: Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar planta..." /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(plantas) ? plantas : []).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nombre</Label><Input value={maquinaForm.nombre} onChange={(e) => setMaquinaForm({ ...maquinaForm, nombre: e.target.value })} /></div>
            <div><Label>Descripcion (opcional)</Label><Input value={maquinaForm.descripcion} onChange={(e) => setMaquinaForm({ ...maquinaForm, descripcion: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMaquinaOpen(false); setEditingMaquina(null); }}>Cancelar</Button>
            <Button
              onClick={handleSubmitMaquina}
              disabled={!maquinaForm.nombre.trim() || !maquinaForm.plantaId || createMaquina.isPending || updateMaquina.isPending}
            >
              {(createMaquina.isPending || updateMaquina.isPending)
                ? (editingMaquina ? 'Guardando...' : 'Creando...')
                : (editingMaquina ? 'Guardar' : 'Crear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Sistema Dialog */}
      <Dialog open={sistemaOpen} onOpenChange={setSistemaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo sistema</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Fabricante (obligatorio) */}
            <div>
              <Label>Fabricante</Label>
              <Select
                value={String(sistemaForm.fabricanteId || '')}
                onValueChange={(v) => setSistemaForm({ ...sistemaForm, fabricanteId: Number(v) })}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar fabricante..." /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(fabricantes) ? fabricantes : []).map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre */}
            <div>
              <Label>Nombre del sistema</Label>
              <Input
                value={sistemaForm.nombre}
                onChange={(e) => setSistemaForm({ ...sistemaForm, nombre: e.target.value })}
                placeholder="Ej: Robot IRB 6700 - Linea 1"
              />
            </div>

            {/* Descripcion */}
            <div>
              <Label>Descripcion (opcional)</Label>
              <Input
                value={sistemaForm.descripcion}
                onChange={(e) => setSistemaForm({ ...sistemaForm, descripcion: e.target.value })}
                placeholder="Notas adicionales"
              />
            </div>

            {/* Planta (opcional) */}
            {(plantas?.length ?? 0) > 0 && (
              <div>
                <Label>Planta (opcional)</Label>
                <Select
                  value={String(sistemaForm.plantaId || '')}
                  onValueChange={(v) => setSistemaForm({ ...sistemaForm, plantaId: Number(v), maquinaId: 0 })}
                >
                  <SelectTrigger><SelectValue placeholder="Sin planta asignada" /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(plantas) ? plantas : []).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Maquina (opcional, filtrada por planta) */}
            {sistemaForm.plantaId > 0 && maquinasForPlanta.length > 0 && (
              <div>
                <Label>Maquina (opcional)</Label>
                <Select
                  value={String(sistemaForm.maquinaId || '')}
                  onValueChange={(v) => setSistemaForm({ ...sistemaForm, maquinaId: Number(v) })}
                >
                  <SelectTrigger><SelectValue placeholder="Sin maquina asignada" /></SelectTrigger>
                  <SelectContent>
                    {maquinasForPlanta.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSistemaOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSistema} disabled={!canCreateSistema || createSistema.isPending}>
              {createSistema.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
