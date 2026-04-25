/**
 * Tests unitarios del validador tri-via.
 *
 * Cubren los 4 casos canonicos:
 *   A. IRBT 4004 + IRB 6700 + IRC5 Single → falla por whitelist familias
 *   B. IRBP A-500 + IRB 4600 + IRC5 Single → OK (blacklist no aplica)
 *   C. IRP B + IRB 4600 + OmniCore C30 → falla por whitelist controladores
 *   D. IRBP A-500 + IRB 120 + IRC5 Compact → falla por blacklist
 *
 * Plus: tests de orden de evaluacion y reglas vacias.
 */

import { describe, it, expect } from 'vitest';
import { evaluarReglas, evaluarRobotControlador, type ReglasEje } from './validarCompatibilidadEje';

// IDs de prueba (ficticios, solo para los tests)
const FAM = {
  IRB_120: 1,
  IRB_4400: 2,
  IRB_4450S: 3,
  IRB_4600: 4,
  IRB_6700: 5,
  IRBP_A: 10,
  IRBT_4004: 11,
  IRP_B: 12,
};

const CTRL = {
  IRC5_SINGLE: 28,
  IRC5_COMPACT: 29,
  V250XT: 36,
  V400XT: 37,
  C30: 34,
};

const reglasIRBT4004: ReglasEje = {
  // IRBT 4004 solo permite IRB 4400, 4450S, 4600
  permitidas: [
    { familiaId: FAM.IRB_4400, codigo: 'IRB 4400' },
    { familiaId: FAM.IRB_4450S, codigo: 'IRB 4450S' },
    { familiaId: FAM.IRB_4600, codigo: 'IRB 4600' },
  ],
  excluidas: [],
  controladoresRequeridos: [],
};

const reglasIRBP_A: ReglasEje = {
  // IRBP A excluye IRB 120 (motivo: pequeño)
  permitidas: [],
  excluidas: [
    { familiaId: FAM.IRB_120, codigo: 'IRB 120', motivo: 'IRB 120 demasiado pequeño para mover este positioner' },
  ],
  controladoresRequeridos: [],
};

const reglasIRP_B: ReglasEje = {
  // IRP B requiere V250XT o V400XT
  permitidas: [],
  excluidas: [],
  controladoresRequeridos: [
    { id: CTRL.V250XT, nombre: 'OmniCore V250XT' },
    { id: CTRL.V400XT, nombre: 'OmniCore V400XT' },
  ],
};

describe('evaluarReglas — casos canonicos', () => {
  it('Caso A: IRBT 4004 + IRB 6700 + IRC5 Single → falla whitelist familias', () => {
    const r = evaluarReglas(reglasIRBT4004, FAM.IRB_6700, CTRL.IRC5_SINGLE);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('solo es compatible con');
    expect(r.motivo).toContain('IRB 4400');
    expect(r.motivo).toContain('IRB 4450S');
    expect(r.motivo).toContain('IRB 4600');
    expect(r.reglasAplicadas?.permitidas).toHaveLength(3);
  });

  it('Caso B: IRBP A-500 + IRB 4600 + IRC5 Single → OK', () => {
    const r = evaluarReglas(reglasIRBP_A, FAM.IRB_4600, CTRL.IRC5_SINGLE);
    expect(r.ok).toBe(true);
    expect(r.motivo).toBeUndefined();
  });

  it('Caso C: IRP B + IRB 4600 + OmniCore C30 → falla whitelist controladores', () => {
    const r = evaluarReglas(reglasIRP_B, FAM.IRB_4600, CTRL.C30);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('requiere uno de los siguientes controladores');
    expect(r.motivo).toContain('V250XT');
    expect(r.motivo).toContain('V400XT');
  });

  it('Caso D: IRBP A-500 + IRB 120 + IRC5 Compact → falla blacklist', () => {
    const r = evaluarReglas(reglasIRBP_A, FAM.IRB_120, CTRL.IRC5_COMPACT);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('no es compatible con la familia IRB 120');
    expect(r.motivo).toContain('demasiado pequeño');
  });
});

describe('evaluarReglas — orden y casos limite', () => {
  it('Eje sin reglas (las 3 tablas vacias) → siempre OK', () => {
    const reglasVacias: ReglasEje = { permitidas: [], excluidas: [], controladoresRequeridos: [] };
    const r = evaluarReglas(reglasVacias, FAM.IRB_120, CTRL.IRC5_COMPACT);
    expect(r.ok).toBe(true);
  });

  it('Eje con whitelist familias y robotFamiliaId nulo → falla', () => {
    const r = evaluarReglas(reglasIRBT4004, null, CTRL.IRC5_SINGLE);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('requiere familia robot conocida');
  });

  it('Eje con solo blacklist y robotFamiliaId nulo → OK (no filtra)', () => {
    const r = evaluarReglas(reglasIRBP_A, null, CTRL.IRC5_SINGLE);
    expect(r.ok).toBe(true);
  });

  it('Whitelist familias se evalua ANTES que blacklist', () => {
    // Eje con whitelist [IRB 4600] + blacklist [IRB 120]
    // Robot IRB 6700: la whitelist falla primero
    const reglasMix: ReglasEje = {
      permitidas: [{ familiaId: FAM.IRB_4600, codigo: 'IRB 4600' }],
      excluidas: [{ familiaId: FAM.IRB_120, codigo: 'IRB 120', motivo: 'pequeño' }],
      controladoresRequeridos: [],
    };
    const r = evaluarReglas(reglasMix, FAM.IRB_6700, CTRL.IRC5_SINGLE);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('solo es compatible'); // whitelist gana
  });

  it('Whitelist controladores aplica solo si pasan las 2 reglas previas', () => {
    // Robot en blacklist + control no permitido: blacklist gana
    const reglasFull: ReglasEje = {
      permitidas: [],
      excluidas: [{ familiaId: FAM.IRB_120, codigo: 'IRB 120', motivo: 'pequeño' }],
      controladoresRequeridos: [{ id: CTRL.V250XT, nombre: 'V250XT' }],
    };
    const r = evaluarReglas(reglasFull, FAM.IRB_120, CTRL.C30);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('IRB 120'); // blacklist gana
  });

  it('Eje OK cuando pasa las 3 reglas en serie', () => {
    const reglasTodo: ReglasEje = {
      permitidas: [{ familiaId: FAM.IRB_4600, codigo: 'IRB 4600' }],
      excluidas: [{ familiaId: FAM.IRB_120, codigo: 'IRB 120', motivo: 'pequeño' }],
      controladoresRequeridos: [{ id: CTRL.V250XT, nombre: 'V250XT' }],
    };
    const r = evaluarReglas(reglasTodo, FAM.IRB_4600, CTRL.V250XT);
    expect(r.ok).toBe(true);
  });

  it('Blacklist sin motivo no rompe el output', () => {
    const reglasSinMotivo: ReglasEje = {
      permitidas: [],
      excluidas: [{ familiaId: FAM.IRB_120, codigo: 'IRB 120', motivo: null }],
      controladoresRequeridos: [],
    };
    const r = evaluarReglas(reglasSinMotivo, FAM.IRB_120, CTRL.IRC5_COMPACT);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('IRB 120');
    expect(r.motivo).not.toContain(': null');
  });
});

// ============================================================================
// Tests robot↔controlador (matriz a granularidad de variante de cabinet)
// ============================================================================

const CTRL_MATRIZ = {
  IRC5_SINGLE: 28,
  IRC5_COMPACT: 29,
  IRC5_PMC: 30,
  IRC5P: 32,
  E10: 33,
  C30: 34,
  C90XT: 35,
  V250XT: 36,
  V400XT: 37,
};

describe('evaluarRobotControlador — matriz cabinet-especifica', () => {
  // Caso 1 — IRB 6660 + IRC5 Compact → falla (este caso lo descubrio Daniel)
  it('IRB 6660 + IRC5 Compact → falla (gama grande no entra en Compact)', () => {
    // IRB 6660 solo permite IRC5 Single, IRC5 PMC, V250XT, V400XT
    const compatibles = [
      { id: CTRL_MATRIZ.IRC5_SINGLE, nombre: 'IRC5 Single' },
      { id: CTRL_MATRIZ.IRC5_PMC, nombre: 'IRC5 Panel Mounted (PMC)' },
      { id: CTRL_MATRIZ.V250XT, nombre: 'OmniCore V250XT' },
      { id: CTRL_MATRIZ.V400XT, nombre: 'OmniCore V400XT' },
    ];
    const r = evaluarRobotControlador(CTRL_MATRIZ.IRC5_COMPACT, compatibles, 'IRB 6660');
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('IRB 6660');
    expect(r.motivo).toContain('no es compatible');
    expect(r.motivo).toContain('IRC5 Single');
    expect(r.motivo).toContain('V250XT');
  });

  // Caso 2 — IRB 7710 + IRC5 Single → falla (OmniCore-only)
  it('IRB 7710 + IRC5 Single → falla (robot OmniCore-only lanzado 2024)', () => {
    const compatibles = [
      { id: CTRL_MATRIZ.V250XT, nombre: 'OmniCore V250XT' },
      { id: CTRL_MATRIZ.V400XT, nombre: 'OmniCore V400XT' },
    ];
    const r = evaluarRobotControlador(CTRL_MATRIZ.IRC5_SINGLE, compatibles, 'IRB 7710');
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('IRB 7710');
    expect(r.motivo).toContain('V250XT');
    expect(r.motivo).toContain('V400XT');
  });

  // Caso 3 — IRB 5720 + OmniCore C30 → falla (requiere V250XT/V400XT)
  it('IRB 5720 + OmniCore C30 → falla (requiere V250XT o V400XT)', () => {
    const compatibles = [
      { id: CTRL_MATRIZ.V250XT, nombre: 'OmniCore V250XT' },
      { id: CTRL_MATRIZ.V400XT, nombre: 'OmniCore V400XT' },
    ];
    const r = evaluarRobotControlador(CTRL_MATRIZ.C30, compatibles, 'IRB 5720');
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('IRB 5720');
  });

  // Caso 4 — IRB 1200 + IRC5 Compact → OK
  it('IRB 1200 + IRC5 Compact → OK (gama pequeña)', () => {
    const compatibles = [
      { id: CTRL_MATRIZ.IRC5_SINGLE, nombre: 'IRC5 Single' },
      { id: CTRL_MATRIZ.IRC5_COMPACT, nombre: 'IRC5 Compact' },
      { id: CTRL_MATRIZ.IRC5_PMC_SMALL, nombre: 'IRC5 PMC Small' },
    ];
    const r = evaluarRobotControlador(CTRL_MATRIZ.IRC5_COMPACT, compatibles, 'IRB 1200');
    expect(r.ok).toBe(true);
    expect(r.motivo).toBeUndefined();
  });

  // Caso 5 — IRB 6700 + OmniCore V250XT → OK (hibrido IRC5+OmniCore)
  it('IRB 6700 + OmniCore V250XT → OK (robot hibrido)', () => {
    const compatibles = [
      { id: CTRL_MATRIZ.IRC5_SINGLE, nombre: 'IRC5 Single' },
      { id: CTRL_MATRIZ.IRC5_PMC_LARGE, nombre: 'IRC5 PMC Large' },
      { id: CTRL_MATRIZ.V250XT, nombre: 'OmniCore V250XT' },
      { id: CTRL_MATRIZ.V400XT, nombre: 'OmniCore V400XT' },
    ];
    const r = evaluarRobotControlador(CTRL_MATRIZ.V250XT, compatibles, 'IRB 6700');
    expect(r.ok).toBe(true);
  });

  // Caso 6 — IRB 8700 + OmniCore V250XT → falla (solo V400XT en OmniCore)
  it('IRB 8700 + OmniCore V250XT → falla (drive system mayor, solo V400XT)', () => {
    // IRB 8700 solo: IRC5 Single + OmniCore V400XT
    const compatibles = [
      { id: CTRL_MATRIZ.IRC5_SINGLE, nombre: 'IRC5 Single' },
      { id: CTRL_MATRIZ.V400XT, nombre: 'OmniCore V400XT' },
    ];
    const r = evaluarRobotControlador(CTRL_MATRIZ.V250XT, compatibles, 'IRB 8700');
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('IRB 8700');
    expect(r.motivo).toContain('V400XT');
    expect(r.motivo).not.toContain('V250XT,'); // V250XT NO debe estar en compatibles
  });

  it('Familia sin reglas en BD → falla con mensaje claro', () => {
    const r = evaluarRobotControlador(CTRL_MATRIZ.IRC5_SINGLE, [], 'IRB inventado');
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('no tiene controladores documentados');
  });
});
