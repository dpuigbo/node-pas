import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Bot, Image as ImageIcon, Plus, Clock, CalendarDays, Download, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfiguracion, useUpdateConfiguracion } from '@/hooks/useCatalogos';
import { useAuth } from '@/hooks/useAuth';

const COMUNIDADES_AUTONOMAS: Record<string, string> = {
  'ES-AN': 'Andalucia',
  'ES-AR': 'Aragon',
  'ES-AS': 'Asturias',
  'ES-CN': 'Canarias',
  'ES-CB': 'Cantabria',
  'ES-CL': 'Castilla y Leon',
  'ES-CM': 'Castilla-La Mancha',
  'ES-CT': 'Cataluna',
  'ES-CE': 'Ceuta',
  'ES-EX': 'Extremadura',
  'ES-GA': 'Galicia',
  'ES-IB': 'Islas Baleares',
  'ES-RI': 'La Rioja',
  'ES-MD': 'Madrid',
  'ES-ML': 'Melilla',
  'ES-MC': 'Murcia',
  'ES-NC': 'Navarra',
  'ES-PV': 'Pais Vasco',
  'ES-VC': 'Comunidad Valenciana',
};

const CONFIG_KEYS: { clave: string; label: string; type: string; options?: Record<string, string> }[] = [
  { clave: 'empresa_nombre', label: 'Nombre de la empresa', type: 'text' },
  { clave: 'empresa_cif', label: 'CIF', type: 'text' },
  { clave: 'empresa_direccion', label: 'Direccion', type: 'text' },
  { clave: 'empresa_comunidad_autonoma', label: 'Comunidad Autonoma', type: 'select', options: COMUNIDADES_AUTONOMAS },
  { clave: 'empresa_telefono', label: 'Telefono', type: 'text' },
  { clave: 'empresa_email', label: 'Email', type: 'text' },
  { clave: 'empresa_web', label: 'Web', type: 'text' },
  { clave: 'informe_pie_pagina', label: 'Pie de pagina en informes', type: 'textarea' },
];

const RECARGO_KEYS = [
  { clave: 'recargo_tarde_pct', label: 'Tarde (18:00-22:00)', defaultVal: '25' },
  { clave: 'recargo_nocturno_pct', label: 'Nocturno (22:00-6:00)', defaultVal: '100' },
  { clave: 'recargo_madrugada_pct', label: 'Madrugada (6:00-8:00)', defaultVal: '25' },
  { clave: 'recargo_domingo_festivo_pct', label: 'Domingos + Festivos', defaultVal: '100' },
  { clave: 'recargo_navidad_pct', label: 'Navidad + Ano Nuevo', defaultVal: '200' },
];

// All config keys including the logos, surcharges and holidays (for saving)
const ALL_KEYS = [
  ...CONFIG_KEYS.map((k) => k.clave),
  'empresa_logo', 'empresa_logo_app',
  ...RECARGO_KEYS.map((k) => k.clave),
  'festivos', 'festivos_especiales',
];

// Reusable logo upload section
function LogoUploadSection({
  title,
  description,
  configKey,
  logoData,
  isAdmin,
  onUpload,
  onRemove,
  icon: Icon,
}: {
  title: string;
  description: string;
  configKey: string;
  logoData: string;
  isAdmin: boolean;
  onUpload: (key: string, data: string) => void;
  onRemove: (key: string) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 500 * 1024) {
      alert('El logo no puede superar los 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onUpload(configKey, reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex items-center gap-6">
          <div className="shrink-0 flex items-center justify-center w-40 h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 overflow-hidden">
            {logoData ? (
              <img src={logoData} alt={title} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                <Icon className="h-8 w-8" />
                <span className="text-xs">Sin logo</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
              disabled={!isAdmin}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={!isAdmin}
            >
              <Upload className="h-4 w-4 mr-1" />
              {logoData ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            {logoData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(configKey)}
                disabled={!isAdmin}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
            <p className="text-xs text-muted-foreground">PNG o JPG. Max 500KB.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Editable date list for holidays
function FestivosEditor({
  configKey,
  label,
  description,
  dates,
  isAdmin,
  onChange,
}: {
  configKey: string;
  label: string;
  description: string;
  dates: string[];
  isAdmin: boolean;
  onChange: (key: string, dates: string[]) => void;
}) {
  const [newDate, setNewDate] = useState('');

  const addDate = () => {
    if (!newDate) return;
    if (dates.includes(newDate)) return;
    const updated = [...dates, newDate].sort();
    onChange(configKey, updated);
    setNewDate('');
  };

  const removeDate = (date: string) => {
    onChange(configKey, dates.filter((d) => d !== date));
  };

  const formatDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch { return dateStr; }
  };

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {dates.map((d) => (
          <span key={d} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">
            {formatDisplay(d)}
            {isAdmin && (
              <button onClick={() => removeDate(d)} className="text-destructive hover:text-destructive/80 ml-0.5">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        {dates.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Sin fechas configuradas</span>
        )}
      </div>
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-44 h-8 text-sm"
          />
          <Button variant="outline" size="sm" onClick={addDate} disabled={!newDate}>
            <Plus className="h-3 w-3 mr-1" /> Anadir
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  const { isAdmin } = useAuth();
  const { data: config, isLoading } = useConfiguracion();
  const updateMutation = useUpdateConfiguracion();

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

  // Helper to parse JSON date arrays from config
  const getDateArray = (key: string): string[] => {
    try { return JSON.parse(values[key] || '[]'); } catch { return []; }
  };
  const setDateArray = (key: string, dates: string[]) => {
    handleChange(key, JSON.stringify(dates));
  };

  // Auto-load holidays state
  const [festivosYear, setFestivosYear] = useState(String(new Date().getFullYear()));
  const [loadingFestivos, setLoadingFestivos] = useState(false);
  const [festivosMsg, setFestivosMsg] = useState('');

  const handleCargarFestivos = async () => {
    const ccaa = values.empresa_comunidad_autonoma;
    if (!ccaa) {
      setFestivosMsg('Selecciona una Comunidad Autonoma en "Datos de empresa" primero.');
      return;
    }
    setLoadingFestivos(true);
    setFestivosMsg('');
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${festivosYear}/ES`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const holidays: { date: string; localName: string; global: boolean; counties: string[] | null }[] = await res.json();

      // Filter: national (global) + regional (counties includes our CCAA)
      const relevant = holidays.filter(
        (h) => h.global || (h.counties && h.counties.includes(ccaa)),
      );

      // Classify: Dec 25 and Jan 1 → festivos_especiales, rest → festivos
      const especiales: string[] = [];
      const normales: string[] = [];
      for (const h of relevant) {
        const [, mm, dd] = h.date.split('-');
        if ((mm === '12' && dd === '25') || (mm === '01' && dd === '01')) {
          especiales.push(h.date);
        } else {
          normales.push(h.date);
        }
      }

      // Merge with existing (don't replace, add new ones)
      const existingFestivos = getDateArray('festivos');
      const existingEspeciales = getDateArray('festivos_especiales');
      const mergedFestivos = [...new Set([...existingFestivos, ...normales])].sort();
      const mergedEspeciales = [...new Set([...existingEspeciales, ...especiales])].sort();

      setDateArray('festivos', mergedFestivos);
      setDateArray('festivos_especiales', mergedEspeciales);

      const added = (mergedFestivos.length - existingFestivos.length) + (mergedEspeciales.length - existingEspeciales.length);
      const ccaaName = COMUNIDADES_AUTONOMAS[ccaa] || ccaa;
      setFestivosMsg(
        added > 0
          ? `Se han anadido ${added} festivos para ${ccaaName} en ${festivosYear} (${normales.length} nacionales/autonomicos + ${especiales.length} especiales).`
          : `Todos los festivos de ${ccaaName} para ${festivosYear} ya estaban cargados.`,
      );
    } catch (err) {
      setFestivosMsg(`Error al cargar festivos: ${(err as Error).message}`);
    } finally {
      setLoadingFestivos(false);
    }
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

      {/* App logo */}
      <LogoUploadSection
        title="Logo de la aplicacion"
        description="Este logo aparece en el menu lateral y en la barra de navegacion."
        configKey="empresa_logo_app"
        logoData={values.empresa_logo_app || ''}
        isAdmin={!!isAdmin}
        onUpload={handleChange}
        onRemove={(key) => handleChange(key, '')}
        icon={ImageIcon}
      />

      {/* Company logo for reports */}
      <LogoUploadSection
        title="Logo de la empresa (informes)"
        description="Este logo se usara en las cabeceras y portadas de los informes."
        configKey="empresa_logo"
        logoData={values.empresa_logo || ''}
        isAdmin={!!isAdmin}
        onUpload={handleChange}
        onRemove={(key) => handleChange(key, '')}
        icon={Bot}
      />

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
              ) : k.type === 'select' && k.options ? (
                <Select
                  value={values[k.clave] || ''}
                  onValueChange={(v) => handleChange(k.clave, v)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(k.options).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Surcharges card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recargos horarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Porcentajes de recargo sobre la tarifa horaria de trabajo segun la franja horaria.
            Los recargos son aditivos (ej: domingo nocturno = recargo domingo + recargo nocturno).
          </p>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            <span className="font-medium">Diurno (8:00-18:00):</span> 0% (estandar, sin recargo)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RECARGO_KEYS.map((k) => (
              <div key={k.clave}>
                <Label className="text-sm">{k.label}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={values[k.clave] ?? k.defaultVal}
                    onChange={(e) => handleChange(k.clave, e.target.value)}
                    disabled={!isAdmin}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Holidays card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendario de festivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-load holidays */}
          {isAdmin && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">Carga automatica de festivos</p>
              <p className="text-xs text-muted-foreground">
                Carga los festivos nacionales y autonomicos desde la API publica de Nager.Date
                segun la Comunidad Autonoma configurada en "Datos de empresa".
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  type="number"
                  min={2020}
                  max={2050}
                  value={festivosYear}
                  onChange={(e) => setFestivosYear(e.target.value)}
                  className="w-24 h-8 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCargarFestivos}
                  disabled={loadingFestivos}
                >
                  {loadingFestivos ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  {loadingFestivos ? 'Cargando...' : `Cargar festivos ${festivosYear}`}
                </Button>
              </div>
              {festivosMsg && (
                <p className={`text-xs ${festivosMsg.startsWith('Error') || festivosMsg.startsWith('Selecciona') ? 'text-orange-500' : 'text-green-600'}`}>
                  {festivosMsg}
                </p>
              )}
              <p className="text-xs text-muted-foreground italic">
                Los festivos locales (2 por municipio) no estan disponibles en la API. Anadelos manualmente.
              </p>
            </div>
          )}

          <FestivosEditor
            configKey="festivos"
            label="Festivos nacionales y locales"
            description="Dias festivos con recargo de domingo/festivo. Incluir festivos nacionales, autonomicos y locales."
            dates={getDateArray('festivos')}
            isAdmin={!!isAdmin}
            onChange={setDateArray}
          />
          <div className="border-t pt-4">
            <FestivosEditor
              configKey="festivos_especiales"
              label="Festivos especiales (Navidad / Ano Nuevo)"
              description="Dias con recargo especial superior (ej: 25 dic, 26 dic, 1 ene)."
              dates={getDateArray('festivos_especiales')}
              isAdmin={!!isAdmin}
              onChange={setDateArray}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
