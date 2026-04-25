export type ControllerCapabilities = {
  multimove: boolean;
  maxRobots: number;
  allowExternalAxes: boolean;
  maxExternalAxesPerDU: number;
};

// Datos del modelo controlador desde BD (campos nuevos en modelos_componente)
export type ControllerModelData = {
  nombre: string;
  soportaMultimove?: boolean | null;
  maxRobotsMultimove?: number | null;
  maxEjesExternos?: number | null;
};

// Lee capacidades desde el modelo del controlador en BD si tiene los campos.
// Fallback al hardcode por nombre si no estan poblados (modelos viejos).
export function getControllerCapabilitiesFromModel(modelo: ControllerModelData): ControllerCapabilities {
  // Si tenemos datos en BD, usarlos
  if (modelo.soportaMultimove != null && modelo.maxRobotsMultimove != null) {
    return {
      multimove: !!modelo.soportaMultimove,
      maxRobots: modelo.maxRobotsMultimove,
      allowExternalAxes: (modelo.maxEjesExternos ?? 0) > 0,
      // maxEjesExternos del v7 es por sistema completo. Lo dividimos por DUs en el wizard.
      maxExternalAxesPerDU: modelo.maxEjesExternos ?? 0,
    };
  }
  // Fallback hardcode
  return getControllerCapabilities(modelo.nombre);
}

export function getControllerCapabilities(nombre: string): ControllerCapabilities {
  const n = nombre.toLowerCase();
  if (n.includes('single') || n.includes('pmc')) {
    return { multimove: true, maxRobots: 4, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
  }
  if (n.includes('v250xt') || n.includes('v400xt')) {
    return { multimove: true, maxRobots: 4, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
  }
  if (n.includes('c90xt')) {
    return { multimove: true, maxRobots: 4, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
  }
  if (n.includes('c30')) {
    return { multimove: true, maxRobots: 2, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
  }
  if (n.includes('e10')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 2 };
  }
  if (n.includes('paint') || n.includes('irc5p')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
  }
  if (n.includes('compact')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
  }
  if (n.includes('s4c+')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
  }
  if (n.includes('s4c')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 4 };
  }
  if (n === 's4') {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 2 };
  }
  // Por defecto OmniCore u otros
  return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 6 };
}
