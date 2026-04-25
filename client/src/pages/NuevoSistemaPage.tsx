import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, ChevronLeft, Plus, Trash2,
  Cpu, Bot, Cog, Check, Loader2, Zap, AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModelos, useModelosCompatiblesCon, useEjeCompatibilidad, useEjesCompatibles } from '@/hooks/useModelos';
import { useFabricantes } from '@/hooks/useFabricantes';
import { useCreateSistemaCompleto, useSistema, useUpdateSistemaCompleto } from '@/hooks/useSistemas';
import { getControllerCapabilities } from '@/lib/controller-capabilities';

// ===== Types =====
type RobotDraft = {
  modeloComponenteId: number;
  modeloNombre: string;
  familia: string;
  etiqueta: string;
  numeroSerie: string;
  numEjes: number | null;
  duEtiqueta: string;
  duSerie: string;
};

type EjeDraft = {
  modeloComponenteId: number;
  modeloNombre: string;
  etiqueta: string;
  numeroSerie: string;
};

const emptyRobot = (): RobotDraft => ({
  modeloComponenteId: 0,
  modeloNombre: '',
  familia: '',
  etiqueta: '',
  numeroSerie: '',
  numEjes: 6,
  duEtiqueta: '',
  duSerie: '',
});

const STEP_LABELS = ['Controladora', 'Robots', 'Ejes externos', 'Resumen'];

export default function NuevoSistemaPage() {
  const params = useParams<{ clienteId?: string; id?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const isEdit = editId !== null;
  const clienteIdParam = params.clienteId ? Number(params.clienteId) : null;
  const navigate = useNavigate();

  const createMutation = useCreateSistemaCompleto();
  const updateMutation = useUpdateSistemaCompleto();
  const { data: existingSistema, isLoading: isLoadingEdit } = useSistema(editId || undefined);

  // Wizard step
  const [step, setStep] = useState(0);
  const [initialized, setInitialized] = useState(!isEdit);

  // Step 1: Sistema info + fabricante + controladora
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fabricanteId, setFabricanteId] = useState<number>(0);
  const [controllerFamilia, setControllerFamilia] = useState('');
  const [controllerId, setControllerId] = useState<number>(0);
  const [controllerNombre, setControllerNombre] = useState('');
  const [controllerEtiqueta, setControllerEtiqueta] = useState('');
  const [controllerSerie, setControllerSerie] = useState('');

  // Step 2: Robots (array — first = principal, rest = multimove)
  const [robots, setRobots] = useState<RobotDraft[]>([emptyRobot()]);

  // Step 3: Ejes externos
  const [ejes, setEjes] = useState<EjeDraft[]>([]);
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
  // Robot principal familiaId (para filtrado de ejes compatibles)
  const robotPrincipalFamiliaId = useMemo(() => {
    const principal = robots[0];
    if (!robotModelos || !principal?.modeloComponenteId) return undefined;
    const modelo = robotModelos.find((m: any) => m.id === principal.modeloComponenteId);
    return modelo?.familiaId as number | undefined;
  }, [robotModelos, robots]);

  // Ejes externos compatibles (tri-via aplicada en backend)
  const { data: ejeModelos } = useEjesCompatibles(
    controllerId || undefined,
    robotPrincipalFamiliaId,
  );

  // Validacion del eje seleccionado (mantenida como guardrail)
  const { data: ejeCompat, isLoading: ejeCompatLoading } = useEjeCompatibilidad(
    ejeModeloId || undefined,
    robotPrincipalFamiliaId,
    controllerId || undefined,
  );

  // Derive controller capabilities
  const capabilities = useMemo(() => {
    if (!controllerNombre) return null;
    return getControllerCapabilities(controllerNombre);
  }, [controllerNombre]);

  // === Precarga datos existentes en modo edicion ===
  useEffect(() => {
    if (!isEdit || !existingSistema || initialized) return;

    const comps: any[] = existingSistema.componentes ?? [];
    const ctrl = comps.find((c: any) => c.tipo === 'controller');
    const mechs = comps.filter((c: any) => c.tipo === 'mechanical_unit');
    const dus = comps.filter((c: any) => c.tipo === 'drive_unit');
    const exAxes = comps.filter((c: any) => c.tipo === 'external_axis');

    setNombre(existingSistema.nombre);
    setDescripcion(existingSistema.descripcion || '');
    setFabricanteId(existingSistema.fabricanteId);

    if (ctrl) {
      setControllerId(ctrl.modeloComponenteId);
      setControllerNombre(ctrl.modeloComponente?.nombre ?? '');
      setControllerFamilia(''); // will be set by effect below
      setControllerEtiqueta(ctrl.etiqueta);
      setControllerSerie(ctrl.numeroSerie || '');
    }

    if (mechs.length > 0) {
      // Associate DUs with their robots (DU[i] matches mech[i+1], first robot has no DU)
      setRobots(mechs.map((m: any, i: number) => {
        const du = i > 0 && dus[i - 1] ? dus[i - 1] : null;
        return {
          modeloComponenteId: m.modeloComponenteId,
          modeloNombre: m.modeloComponente?.nombre ?? '',
          familia: '', // will resolve from modelos list
          etiqueta: m.etiqueta,
          numeroSerie: m.numeroSerie || '',
          numEjes: m.numEjes,
          duEtiqueta: du?.etiqueta || '',
          duSerie: du?.numeroSerie || '',
        };
      }));
    }

    if (exAxes.length > 0) {
      setEjes(exAxes.map((e: any) => ({
        modeloComponenteId: e.modeloComponenteId,
        modeloNombre: e.modeloComponente?.nombre ?? '',
        etiqueta: e.etiqueta,
        numeroSerie: e.numeroSerie || '',
      })));
    }

    setInitialized(true);
  }, [isEdit, existingSistema, initialized]);

  // Resolve controller familia once controllers list loads (edit mode)
  useEffect(() => {
    if (!isEdit || !controllers || !controllerId || controllerFamilia) return;
    const ctrl = (controllers as any[]).find((c: any) => c.id === controllerId);
    if (ctrl?.familia) setControllerFamilia(ctrl.familia);
  }, [isEdit, controllers, controllerId, controllerFamilia]);

  // Resolve robot familias once robotModelos loads (edit mode)
  useEffect(() => {
    if (!isEdit || !robotModelos || robotModelos.length === 0) return;
    setRobots(prev => {
      let changed = false;
      const updated = prev.map(r => {
        if (r.modeloComponenteId && !r.familia) {
          const modelo = robotModelos.find((m: any) => m.id === r.modeloComponenteId);
          if (modelo?.familia) {
            changed = true;
            return { ...r, familia: modelo.familia };
          }
        }
        return r;
      });
      return changed ? updated : prev;
    });
  }, [isEdit, robotModelos]);

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

  const robotsInFamilia = (familia: string) => {
    if (!robotModelos || !familia) return [];
    return robotModelos.filter((m: any) => m.familia === familia);
  };

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

  // Max ejes = 3 per DU (1 implicit for first robot, 1 per additional robot)
  const duCount = robots.length > 1 ? robots.length - 1 : 0;
  const maxEjes = (duCount + 1) * (capabilities?.maxExternalAxesPerDU ?? 3);

  // Steps available (skip step 2 if controller doesn't allow external axes)
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
  const isStep1Valid = robots.length > 0 && robots.every(r => r.modeloComponenteId > 0 && r.etiqueta.trim());
  const isStepValid = step === 0 ? isStep0Valid : step === 1 ? isStep1Valid : true;

  // Robot CRUD
  const updateRobot = (index: number, updates: Partial<RobotDraft>) => {
    setRobots(prev => prev.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const addRobot = () => {
    if (!capabilities?.multimove || robots.length >= capabilities.maxRobots) return;
    setRobots(prev => [...prev, emptyRobot()]);
  };

  const removeRobot = (index: number) => {
    if (index === 0) return; // can't remove principal
    setRobots(prev => prev.filter((_, i) => i !== index));
  };

  // Ejes CRUD
  const addEje = () => {
    if (ejeModeloId <= 0 || !ejeEtiqueta.trim() || ejes.length >= maxEjes) return;
    setEjes([...ejes, {
      modeloComponenteId: ejeModeloId,
      modeloNombre: ejeNombre,
      etiqueta: ejeEtiqueta,
      numeroSerie: ejeSerie,
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

  // Build component list for submit
  const buildComponentes = () => {
    let orden = 0;
    const componentes: any[] = [];

    // Controller
    componentes.push({
      modeloComponenteId: controllerId,
      tipo: 'controller',
      etiqueta: controllerEtiqueta,
      numeroSerie: controllerSerie || null,
      numEjes: null,
      orden: orden++,
    });

    // Robots + DUs
    robots.forEach((robot, i) => {
      if (i > 0) {
        // Drive unit for additional robots
        componentes.push({
          modeloComponenteId: robot.modeloComponenteId,
          tipo: 'drive_unit',
          etiqueta: robot.duEtiqueta || `DU - ${robot.etiqueta}`,
          numeroSerie: robot.duSerie || null,
          numEjes: null,
          orden: orden++,
        });
      }
      componentes.push({
        modeloComponenteId: robot.modeloComponenteId,
        tipo: 'mechanical_unit',
        etiqueta: robot.etiqueta,
        numeroSerie: robot.numeroSerie || null,
        numEjes: robot.numEjes,
        orden: orden++,
      });
    });

    // External axes
    ejes.forEach((eje) => {
      componentes.push({
        modeloComponenteId: eje.modeloComponenteId,
        tipo: 'external_axis',
        etiqueta: eje.etiqueta,
        numeroSerie: eje.numeroSerie || null,
        numEjes: null,
        orden: orden++,
      });
    });

    return componentes;
  };

  const handleSubmit = async () => {
    const componentes = buildComponentes();
    const clienteId = isEdit ? existingSistema?.clienteId : clienteIdParam;

    if (!clienteId) return;

    const payload = {
      clienteId,
      fabricanteId,
      nombre,
      descripcion: descripcion || null,
      componentes,
    };

    try {
      if (isEdit && editId) {
        await updateMutation.mutateAsync({ id: editId, ...payload });
        navigate(`/sistemas/${editId}`);
      } else {
        const sistema = await createMutation.mutateAsync(payload);
        navigate(`/sistemas/${sistema.id}`);
      }
    } catch (err: any) {
      alert(err?.response?.data?.error ?? `Error al ${isEdit ? 'guardar' : 'crear'} sistema`);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Loading state for edit mode
  if (isEdit && isLoadingEdit) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={isEdit ? 'Editar Sistema' : 'Nuevo Sistema'}
          description={isEdit
            ? `Editando ${existingSistema?.nombre ?? ''}`
            : 'Configura los componentes del sistema robotico'}
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
                    setRobots([emptyRobot()]);
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
                      // Reset robots when controller changes
                      setRobots([emptyRobot()]);
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
                    <Badge variant="default">Multimove (hasta {capabilities.maxRobots} robots)</Badge>
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

      {/* ===== STEP 1: Robots ===== */}
      {step === 1 && (
        <div className="space-y-4">
          {!robotModelos || robotModelos.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">
                  No hay modelos de robot compatibles con {controllerNombre}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {robots.map((robot, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-base">
                        <Bot className="h-5 w-5" />
                        {index === 0 ? 'Robot principal' : `Robot ${index + 1}`}
                        {index > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            <Zap className="h-3 w-3 mr-0.5" /> + Drive Unit
                          </Badge>
                        )}
                      </div>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeRobot(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Familia</Label>
                        <Select
                          value={robot.familia}
                          onValueChange={(v) => {
                            updateRobot(index, { familia: v, modeloComponenteId: 0, modeloNombre: '' });
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
                          value={String(robot.modeloComponenteId || '')}
                          onValueChange={(v) => {
                            const id = Number(v);
                            const m = robotsInFamilia(robot.familia).find((r: any) => r.id === id);
                            updateRobot(index, {
                              modeloComponenteId: id,
                              modeloNombre: m?.nombre ?? '',
                              etiqueta: robot.etiqueta || m?.nombre || '',
                            });
                          }}
                          disabled={!robot.familia}
                        >
                          <SelectTrigger><SelectValue placeholder="Seleccionar modelo" /></SelectTrigger>
                          <SelectContent>
                            {robotsInFamilia(robot.familia).map((m: any) => (
                              <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {robot.modeloComponenteId > 0 && (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Etiqueta</Label>
                            <Input
                              value={robot.etiqueta}
                              onChange={(e) => updateRobot(index, { etiqueta: e.target.value })}
                              placeholder={index === 0 ? 'Ej: Robot Principal' : `Ej: Robot ${index + 1}`}
                            />
                          </div>
                          <div>
                            <Label>N. Serie <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                            <Input
                              value={robot.numeroSerie}
                              onChange={(e) => updateRobot(index, { numeroSerie: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>N. Ejes</Label>
                            <Input
                              type="number"
                              value={robot.numEjes ?? ''}
                              onChange={(e) => updateRobot(index, {
                                numEjes: e.target.value ? Number(e.target.value) : null,
                              })}
                              min={1}
                              max={10}
                            />
                          </div>
                        </div>

                        {/* Drive Unit fields for additional robots */}
                        {index > 0 && (
                          <div className="border-t pt-3 mt-1">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Zap className="h-3 w-3" /> Drive Unit
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Etiqueta DU</Label>
                                <Input
                                  value={robot.duEtiqueta}
                                  onChange={(e) => updateRobot(index, { duEtiqueta: e.target.value })}
                                  placeholder={`DU - ${robot.etiqueta || `Robot ${index + 1}`}`}
                                />
                              </div>
                              <div>
                                <Label>N. Serie DU <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                                <Input
                                  value={robot.duSerie}
                                  onChange={(e) => updateRobot(index, { duSerie: e.target.value })}
                                  placeholder="Numero de serie"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Add robot button (multimove only) */}
              {capabilities?.multimove && robots.length < capabilities.maxRobots && (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={addRobot}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Anadir robot ({robots.length}/{capabilities.maxRobots})
                </Button>
              )}
            </>
          )}
        </div>
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
                {ejeModeloId > 0 && ejeCompat && !ejeCompat.compatible && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">{ejeCompat.motivo}</p>
                      {ejeCompat.familiasPermitidas && (
                        <p className="text-muted-foreground mt-1">
                          Familias compatibles: {ejeCompat.familiasPermitidas.map(f => f.codigo).join(', ')}
                        </p>
                      )}
                      {ejeCompat.controladoresRequeridos && (
                        <p className="text-muted-foreground mt-1">
                          Controladores requeridos: {ejeCompat.controladoresRequeridos.map(c => c.nombre).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {ejeModeloId > 0 && ejeEtiqueta.trim() && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={addEje}
                    disabled={ejeCompatLoading || (ejeCompat !== undefined && !ejeCompat.compatible)}
                  >
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

              {/* Robots + DUs */}
              {robots.map((robot, i) => (
                <div key={i}>
                  {i > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
                      <Zap className="h-5 w-5 text-purple-500 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-muted-foreground">Drive Unit</span>
                        <span className="text-muted-foreground ml-2">— {robot.duEtiqueta || `DU - ${robot.etiqueta}`}</span>
                      </div>
                      {robot.duSerie && (
                        <span className="text-xs text-muted-foreground">S/N: {robot.duSerie}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Bot className="h-5 w-5 text-green-500 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">{robot.modeloNombre}</span>
                      <span className="text-muted-foreground ml-2">— {robot.etiqueta}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {robot.numEjes && <Badge variant="outline">{robot.numEjes} ejes</Badge>}
                      {robot.numeroSerie && <span className="text-xs text-muted-foreground">S/N: {robot.numeroSerie}</span>}
                    </div>
                  </div>
                </div>
              ))}

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
              Total: {1 + robots.length + (robots.length > 1 ? robots.length - 1 : 0) + ejes.length} componentes
              (controladora + {robots.length} robot{robots.length > 1 ? 's' : ''}
              {robots.length > 1 ? ` + ${robots.length - 1} DU` : ''}
              {ejes.length > 0 ? ` + ${ejes.length} eje${ejes.length > 1 ? 's' : ''}` : ''})
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
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {isEdit ? 'Guardando...' : 'Creando...'}</>
            ) : (
              isEdit ? 'Guardar cambios' : 'Crear sistema'
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
