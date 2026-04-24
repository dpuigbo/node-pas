import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, ChevronLeft, Plus, Trash2,
  Cpu, Bot, Cog, Check, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModelos, useModelosCompatiblesCon } from '@/hooks/useModelos';
import { useFabricantes } from '@/hooks/useFabricantes';
import { useCreateSistemaCompleto } from '@/hooks/useSistemas';

// ===== Controller capability rules =====
type Capabilities = {
  multimove: boolean;
  maxRobots: number;
  allowExternalAxes: boolean;
  maxExternalAxesPerDU: number;
};

function getControllerCapabilities(nombre: string): Capabilities {
  const n = nombre.toLowerCase();
  if (n.includes('single') || n.includes('pmc')) {
    return { multimove: true, maxRobots: 4, allowExternalAxes: true, maxExternalAxesPerDU: 3 };
  }
  if (n.includes('paint')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 3 };
  }
  if (n.includes('compact')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: false, maxExternalAxesPerDU: 0 };
  }
  // OmniCore, S4, S4C, S4C+ → 1 robot + 3 ejes
  return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 3 };
}

// ===== Types =====
type ComponenteDraft = {
  modeloComponenteId: number;
  modeloNombre: string;
  tipo: 'controller' | 'mechanical_unit' | 'drive_unit' | 'external_axis';
  etiqueta: string;
  numeroSerie: string;
  numEjes: number | null;
};

const STEP_LABELS = ['Controladora', 'Robot', 'Ejes externos', 'Resumen'];

export default function NuevoSistemaPage() {
  const { clienteId: cId } = useParams<{ clienteId: string }>();
  const clienteId = Number(cId);
  const navigate = useNavigate();
  const createMutation = useCreateSistemaCompleto();

  // Wizard step
  const [step, setStep] = useState(0);

  // Step 1: Sistema info + fabricante + controladora
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fabricanteId, setFabricanteId] = useState<number>(0);
  const [controllerFamilia, setControllerFamilia] = useState('');
  const [controllerId, setControllerId] = useState<number>(0);
  const [controllerNombre, setControllerNombre] = useState('');
  const [controllerEtiqueta, setControllerEtiqueta] = useState('');
  const [controllerSerie, setControllerSerie] = useState('');

  // Step 2: Robot principal
  const [robotFamilia, setRobotFamilia] = useState('');
  const [robotId, setRobotId] = useState<number>(0);
  const [robotNombre, setRobotNombre] = useState('');
  const [robotEtiqueta, setRobotEtiqueta] = useState('');
  const [robotSerie, setRobotSerie] = useState('');
  const [robotEjes, setRobotEjes] = useState<number | null>(6);

  // Step 3: Ejes externos
  const [ejes, setEjes] = useState<ComponenteDraft[]>([]);
  const [ejeFamilia, setEjeFamilia] = useState('');
  const [ejeModeloId, setEjeModeloId] = useState<number>(0);
  const [ejeNombre, setEjeNombre] = useState('');
  const [ejeEtiqueta, setEjeEtiqueta] = useState('');
  const [ejeSerie, setEjeSerie] = useState('');

  // Data fetching
  const { data: fabricantes } = useFabricantes();
  const { data: controllers } = useModelos(
    fabricanteId ? { fabricanteId, tipo: 'controller' } : undefined,
  );
  const { data: robotModelos } = useModelosCompatiblesCon(
    controllerId || undefined,
    'mechanical_unit',
  );
  const { data: ejeModelos } = useModelosCompatiblesCon(
    controllerId || undefined,
    'external_axis',
  );

  // Derive controller capabilities
  const capabilities = useMemo(() => {
    if (!controllerNombre) return null;
    return getControllerCapabilities(controllerNombre);
  }, [controllerNombre]);

  // Group controllers by familia
  const controllerFamilias = useMemo(() => {
    if (!controllers || !Array.isArray(controllers)) return [];
    const fams = new Set<string>();
    controllers.forEach((c: any) => { if (c.familia) fams.add(c.familia); });
    return [...fams].sort();
  }, [controllers]);

  const controllersInFamilia = useMemo(() => {
    if (!controllers || !controllerFamilia) return [];
    return (controllers as any[]).filter((c) => c.familia === controllerFamilia);
  }, [controllers, controllerFamilia]);

  // Group robots by familia
  const robotFamilias = useMemo(() => {
    if (!robotModelos) return [];
    const fams = new Set<string>();
    robotModelos.forEach((m: any) => { if (m.familia) fams.add(m.familia); });
    return [...fams].sort();
  }, [robotModelos]);

  const robotsInFamilia = useMemo(() => {
    if (!robotModelos || !robotFamilia) return [];
    return robotModelos.filter((m: any) => m.familia === robotFamilia);
  }, [robotModelos, robotFamilia]);

  // Group ejes by familia
  const ejeFamilias = useMemo(() => {
    if (!ejeModelos) return [];
    const fams = new Set<string>();
    ejeModelos.forEach((m: any) => { if (m.familia) fams.add(m.familia); });
    return [...fams].sort();
  }, [ejeModelos]);

  const ejesInFamilia = useMemo(() => {
    if (!ejeModelos || !ejeFamilia) return [];
    return ejeModelos.filter((m: any) => m.familia === ejeFamilia);
  }, [ejeModelos, ejeFamilia]);

  // Max ejes = 3 (1 DU for first robot, always present implicitly)
  const maxEjes = capabilities?.maxExternalAxesPerDU ?? 3;

  // Steps available (skip step 3 if controller doesn't allow external axes)
  const steps = useMemo(() => {
    if (capabilities && !capabilities.allowExternalAxes) {
      return [0, 1, 3]; // skip ejes
    }
    return [0, 1, 2, 3];
  }, [capabilities]);

  const currentStepIndex = steps.indexOf(step);
  const canGoNext = currentStepIndex < steps.length - 1;
  const canGoPrev = currentStepIndex > 0;

  const goNext = () => {
    if (canGoNext) setStep(steps[currentStepIndex + 1]!);
  };
  const goPrev = () => {
    if (canGoPrev) setStep(steps[currentStepIndex - 1]!);
  };

  // Validation per step
  const isStep0Valid = nombre.trim() && fabricanteId > 0 && controllerId > 0 && controllerEtiqueta.trim();
  const isStep1Valid = robotId > 0 && robotEtiqueta.trim();
  const isStepValid = step === 0 ? isStep0Valid : step === 1 ? isStep1Valid : true;

  const addEje = () => {
    if (ejeModeloId <= 0 || !ejeEtiqueta.trim() || ejes.length >= maxEjes) return;
    setEjes([...ejes, {
      modeloComponenteId: ejeModeloId,
      modeloNombre: ejeNombre,
      tipo: 'external_axis',
      etiqueta: ejeEtiqueta,
      numeroSerie: ejeSerie,
      numEjes: null,
    }]);
    setEjeFamilia('');
    setEjeModeloId(0);
    setEjeNombre('');
    setEjeEtiqueta('');
    setEjeSerie('');
  };

  const removeEje = (index: number) => {
    setEjes(ejes.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    const componentes = [
      {
        modeloComponenteId: controllerId,
        tipo: 'controller' as const,
        etiqueta: controllerEtiqueta,
        numeroSerie: controllerSerie || null,
        numEjes: null,
        orden: 0,
      },
      {
        modeloComponenteId: robotId,
        tipo: 'mechanical_unit' as const,
        etiqueta: robotEtiqueta,
        numeroSerie: robotSerie || null,
        numEjes: robotEjes,
        orden: 1,
      },
      ...ejes.map((eje, i) => ({
        modeloComponenteId: eje.modeloComponenteId,
        tipo: 'external_axis' as const,
        etiqueta: eje.etiqueta,
        numeroSerie: eje.numeroSerie || null,
        numEjes: null,
        orden: 2 + i,
      })),
    ];

    try {
      const sistema = await createMutation.mutateAsync({
        clienteId,
        fabricanteId,
        nombre,
        descripcion: descripcion || null,
        componentes,
      });
      navigate(`/sistemas/${sistema.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Error al crear sistema');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Nuevo Sistema"
          description="Configura los componentes del sistema robotico"
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          if (!steps.includes(i)) return null;
          const isActive = step === i;
          const isDone = steps.indexOf(i) < currentStepIndex;
          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && steps.includes(i) && (
                <div className="w-8 h-px bg-border" />
              )}
              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => {
                  const targetIdx = steps.indexOf(i);
                  if (targetIdx <= currentStepIndex) setStep(i);
                }}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : null}
                {label}
              </button>
            </div>
          );
        })}
      </div>

      {/* ===== STEP 0: Datos basicos + Controladora ===== */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" /> Datos del sistema y controladora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre del sistema</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Robot Linea 3 - Soldadura"
              />
            </div>
            <div>
              <Label>Descripcion <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Notas sobre este sistema..."
                rows={2}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Fabricante y controladora</h3>
              <div>
                <Label>Fabricante</Label>
                <Select
                  value={String(fabricanteId || '')}
                  onValueChange={(v) => {
                    setFabricanteId(Number(v));
                    setControllerFamilia('');
                    setControllerId(0);
                    setControllerNombre('');
                    setRobotFamilia('');
                    setRobotId(0);
                    setEjes([]);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar fabricante" /></SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(fabricantes) ? fabricantes : []).filter((f: any) => f.activo).map((f: any) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {fabricanteId > 0 && (<>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Familia controladora</Label>
                  <Select
                    value={controllerFamilia}
                    onValueChange={(v) => {
                      setControllerFamilia(v);
                      setControllerId(0);
                      setControllerNombre('');
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar familia" /></SelectTrigger>
                    <SelectContent>
                      {controllerFamilias.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Select
                    value={String(controllerId || '')}
                    onValueChange={(v) => {
                      const id = Number(v);
                      setControllerId(id);
                      const ctrl = controllersInFamilia.find((c: any) => c.id === id);
                      setControllerNombre(ctrl?.nombre ?? '');
                      setControllerEtiqueta(ctrl?.nombre ?? '');
                      // Reset robot when controller changes
                      setRobotFamilia('');
                      setRobotId(0);
                      setRobotNombre('');
                      setEjes([]);
                    }}
                    disabled={!controllerFamilia}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar modelo" /></SelectTrigger>
                    <SelectContent>
                      {controllersInFamilia.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {controllerId > 0 && capabilities && (
                <div className="mt-3 flex gap-2">
                  {capabilities.multimove && (
                    <Badge variant="default">Multimove</Badge>
                  )}
                  {capabilities.allowExternalAxes && (
                    <Badge variant="secondary">Ejes externos</Badge>
                  )}
                  {!capabilities.multimove && !capabilities.allowExternalAxes && (
                    <Badge variant="outline">Sistema simple</Badge>
                  )}
                </div>
              )}

              {controllerId > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label>Etiqueta</Label>
                    <Input
                      value={controllerEtiqueta}
                      onChange={(e) => setControllerEtiqueta(e.target.value)}
                      placeholder="Ej: IRC5 Principal"
                    />
                  </div>
                  <div>
                    <Label>N. Serie <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                    <Input
                      value={controllerSerie}
                      onChange={(e) => setControllerSerie(e.target.value)}
                      placeholder="Numero de serie"
                    />
                  </div>
                </div>
              )}
              </>)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== STEP 1: Robot principal ===== */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" /> Robot principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!robotModelos || robotModelos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay modelos de robot compatibles con {controllerNombre}.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Familia</Label>
                    <Select
                      value={robotFamilia}
                      onValueChange={(v) => {
                        setRobotFamilia(v);
                        setRobotId(0);
                        setRobotNombre('');
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar familia" /></SelectTrigger>
                      <SelectContent>
                        {robotFamilias.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Select
                      value={String(robotId || '')}
                      onValueChange={(v) => {
                        const id = Number(v);
                        setRobotId(id);
                        const m = robotsInFamilia.find((r: any) => r.id === id);
                        setRobotNombre(m?.nombre ?? '');
                        setRobotEtiqueta(m?.nombre ?? '');
                      }}
                      disabled={!robotFamilia}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar modelo" /></SelectTrigger>
                      <SelectContent>
                        {robotsInFamilia.map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {robotId > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Etiqueta</Label>
                      <Input
                        value={robotEtiqueta}
                        onChange={(e) => setRobotEtiqueta(e.target.value)}
                        placeholder="Ej: Robot Principal"
                      />
                    </div>
                    <div>
                      <Label>N. Serie <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                      <Input
                        value={robotSerie}
                        onChange={(e) => setRobotSerie(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>N. Ejes</Label>
                      <Input
                        type="number"
                        value={robotEjes ?? ''}
                        onChange={(e) => setRobotEjes(e.target.value ? Number(e.target.value) : null)}
                        min={1}
                        max={10}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== STEP 2: Ejes externos ===== */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5" /> Ejes externos
              <Badge variant="outline" className="ml-2">{ejes.length}/{maxEjes}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* List of added ejes */}
            {ejes.length > 0 && (
              <div className="space-y-2">
                {ejes.map((eje, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <span className="font-medium">{eje.modeloNombre}</span>
                      <span className="text-muted-foreground ml-2">— {eje.etiqueta}</span>
                      {eje.numeroSerie && (
                        <span className="text-xs text-muted-foreground ml-2">S/N: {eje.numeroSerie}</span>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeEje(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add eje form */}
            {ejes.length < maxEjes && ejeModelos && ejeModelos.length > 0 && (
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-medium">Anadir eje externo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Familia</Label>
                    <Select
                      value={ejeFamilia}
                      onValueChange={(v) => {
                        setEjeFamilia(v);
                        setEjeModeloId(0);
                        setEjeNombre('');
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar familia" /></SelectTrigger>
                      <SelectContent>
                        {ejeFamilias.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modelo</Label>
                    <Select
                      value={String(ejeModeloId || '')}
                      onValueChange={(v) => {
                        const id = Number(v);
                        setEjeModeloId(id);
                        const m = ejesInFamilia.find((e: any) => e.id === id);
                        setEjeNombre(m?.nombre ?? '');
                        setEjeEtiqueta(m?.nombre ?? '');
                      }}
                      disabled={!ejeFamilia}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar modelo" /></SelectTrigger>
                      <SelectContent>
                        {ejesInFamilia.map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {ejeModeloId > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Etiqueta</Label>
                      <Input
                        value={ejeEtiqueta}
                        onChange={(e) => setEjeEtiqueta(e.target.value)}
                        placeholder="Ej: Posicionador 1"
                      />
                    </div>
                    <div>
                      <Label>N. Serie <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                      <Input
                        value={ejeSerie}
                        onChange={(e) => setEjeSerie(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {ejeModeloId > 0 && ejeEtiqueta.trim() && (
                  <Button size="sm" variant="secondary" onClick={addEje}>
                    <Plus className="h-4 w-4 mr-1" /> Anadir
                  </Button>
                )}
              </div>
            )}

            {ejes.length >= maxEjes && (
              <p className="text-sm text-orange-500">Limite de {maxEjes} ejes externos alcanzado.</p>
            )}

            {(!ejeModelos || ejeModelos.length === 0) && (
              <p className="text-sm text-muted-foreground">
                No hay ejes externos compatibles con {controllerNombre}.
              </p>
            )}

            {ejes.length === 0 && ejeModelos && ejeModelos.length > 0 && !ejeFamilia && (
              <p className="text-sm text-muted-foreground">
                Este paso es opcional. Puedes continuar sin ejes externos.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== STEP 3: Resumen ===== */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" /> Resumen del sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 space-y-1">
              <h3 className="font-semibold text-lg">{nombre}</h3>
              {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
              {capabilities && (
                <div className="flex gap-2 mt-1">
                  {capabilities.multimove && <Badge>Multimove</Badge>}
                  {capabilities.allowExternalAxes && <Badge variant="secondary">Ejes externos</Badge>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {/* Controladora */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Cpu className="h-5 w-5 text-blue-500 shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">{controllerNombre}</span>
                  <span className="text-muted-foreground ml-2">— {controllerEtiqueta}</span>
                </div>
                {controllerSerie && (
                  <span className="text-xs text-muted-foreground">S/N: {controllerSerie}</span>
                )}
              </div>

              {/* Robot */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Bot className="h-5 w-5 text-green-500 shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">{robotNombre}</span>
                  <span className="text-muted-foreground ml-2">— {robotEtiqueta}</span>
                </div>
                <div className="flex items-center gap-2">
                  {robotEjes && <Badge variant="outline">{robotEjes} ejes</Badge>}
                  {robotSerie && <span className="text-xs text-muted-foreground">S/N: {robotSerie}</span>}
                </div>
              </div>

              {/* Ejes */}
              {ejes.map((eje, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Cog className="h-5 w-5 text-orange-500 shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{eje.modeloNombre}</span>
                    <span className="text-muted-foreground ml-2">— {eje.etiqueta}</span>
                  </div>
                  {eje.numeroSerie && (
                    <span className="text-xs text-muted-foreground">S/N: {eje.numeroSerie}</span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Total: {2 + ejes.length} componentes
              {capabilities?.multimove && ' — Podras anadir mas robots desde la pagina del sistema'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={canGoPrev ? goPrev : () => navigate(-1)}
        >
          {canGoPrev ? (
            <><ChevronLeft className="h-4 w-4 mr-1" /> Anterior</>
          ) : (
            'Cancelar'
          )}
        </Button>

        {step === 3 ? (
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creando...</>
            ) : (
              'Crear sistema'
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!isStepValid}>
            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
