export type ControllerCapabilities = {
  multimove: boolean;
  maxRobots: number;
  allowExternalAxes: boolean;
  maxExternalAxesPerDU: number;
};

export function getControllerCapabilities(nombre: string): ControllerCapabilities {
  const n = nombre.toLowerCase();
  if (n.includes('single') || n.includes('pmc')) {
    return { multimove: true, maxRobots: 4, allowExternalAxes: true, maxExternalAxesPerDU: 3 };
  }
  if (n.includes('paint') || n.includes('irc5p')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 3 };
  }
  if (n.includes('compact')) {
    return { multimove: false, maxRobots: 1, allowExternalAxes: false, maxExternalAxesPerDU: 0 };
  }
  // OmniCore, S4, S4C, S4C+ → 1 robot + 3 ejes
  return { multimove: false, maxRobots: 1, allowExternalAxes: true, maxExternalAxesPerDU: 3 };
}
