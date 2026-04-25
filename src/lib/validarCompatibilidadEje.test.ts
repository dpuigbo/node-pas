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
import { evaluarReglas, type ReglasEje } from './validarCompatibilidadEje';

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
