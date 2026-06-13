/**
 * Tests del evaluador de criterios de aplicacion v3.
 * Los criterios sustituyen a las cohortes fijas: cada fila de lubricacion o
 * actividad puede llevar [{atributo, op, valor}] y se evalua contra el
 * contexto del componente (montaje, proteccion, controlador, nº serie...).
 */

import { describe, it, expect } from 'vitest';
import { evaluarCriterios, matchCohorte } from './planMantenimiento';

describe('evaluarCriterios — semantica base', () => {
  it('criterios NULL → aplica a todos', () => {
    expect(evaluarCriterios(null, { montajeId: 2 })).toBe(true);
  });

  it('array vacio → aplica a todos', () => {
    expect(evaluarCriterios([], { montajeId: 2 })).toBe(true);
  });

  it('contexto sin definir → aplica (el usuario aun no eligio)', () => {
    const criterios = [{ atributo: 'montaje', op: 'in', valor: [2, 3] }];
    expect(evaluarCriterios(criterios, undefined)).toBe(true);
    expect(evaluarCriterios(criterios, {})).toBe(true);
    expect(evaluarCriterios(criterios, { montajeId: null })).toBe(true);
  });

  it('atributo desconocido → no restringe (forward-compatible)', () => {
    const criterios = [{ atributo: 'criterio_futuro', op: 'eq', valor: 'x' }];
    expect(evaluarCriterios(criterios, { montajeId: 2 })).toBe(true);
  });

  it('acepta criterios como string JSON (longtext de MariaDB)', () => {
    const criterios = JSON.stringify([{ atributo: 'montaje', op: 'in', valor: [2] }]);
    expect(evaluarCriterios(criterios, { montajeId: 2 })).toBe(true);
    expect(evaluarCriterios(criterios, { montajeId: 5 })).toBe(false);
  });
});

describe('evaluarCriterios — operadores', () => {
  it('in: incluido / excluido', () => {
    const c = [{ atributo: 'controlador', op: 'in', valor: [28, 29, 30] }];
    expect(evaluarCriterios(c, { controladorId: 29 })).toBe(true);
    expect(evaluarCriterios(c, { controladorId: 34 })).toBe(false);
  });

  it('eq con type_variant', () => {
    const c = [{ atributo: 'type_variant', op: 'eq', valor: 'Type C' }];
    expect(evaluarCriterios(c, { typeVariant: 'Type C' })).toBe(true);
    expect(evaluarCriterios(c, { typeVariant: 'Type A' })).toBe(false);
  });

  it('between con rango de numeros de serie', () => {
    const c = [{ atributo: 'numero_serie', op: 'between', valor: ['6700-105000', '6700-108999'] }];
    expect(evaluarCriterios(c, { numeroSerie: '6700-106500' })).toBe(true);
    expect(evaluarCriterios(c, { numeroSerie: '6700-200000' })).toBe(false);
  });

  it('between con LISTA de rangos de serie (OR entre rangos; IRB 7600 gen 1)', () => {
    const c = [{
      atributo: 'numero_serie', op: 'between',
      valor: [['76-20000', '76-26999'], ['76-30000', '76-33999'], ['76-50000', '76-50999']],
    }];
    expect(evaluarCriterios(c, { numeroSerie: '76-21500' })).toBe(true);  // 1er rango
    expect(evaluarCriterios(c, { numeroSerie: '76-33999' })).toBe(true);  // borde 2o rango
    expect(evaluarCriterios(c, { numeroSerie: '76-50500' })).toBe(true);  // 3er rango
    expect(evaluarCriterios(c, { numeroSerie: '76-27000' })).toBe(false); // hueco gen 2
    expect(evaluarCriterios(c, { numeroSerie: '76-51000' })).toBe(false); // gen 2/3 M2004
    // sin numero de serie en contexto → no filtra
    expect(evaluarCriterios(c, { montajeId: 2 })).toBe(true);
  });

  it('gte/lte con anio de fabricacion', () => {
    expect(evaluarCriterios([{ atributo: 'anio_fabricacion', op: 'gte', valor: 2018 }], { anioFabricacion: 2020 })).toBe(true);
    expect(evaluarCriterios([{ atributo: 'anio_fabricacion', op: 'gte', valor: 2018 }], { anioFabricacion: 2015 })).toBe(false);
    expect(evaluarCriterios([{ atributo: 'anio_fabricacion', op: 'lte', valor: 2010 }], { anioFabricacion: 2008 })).toBe(true);
  });

  it('opcion: el armario "tiene" la opcion (interseccion del conjunto)', () => {
    const c = [{ atributo: 'opcion', op: 'in', valor: ['3005-2'] }];
    // armario con la opcion 3005-2 (y otras) → aplica
    expect(evaluarCriterios(c, { opciones: ['3004-2', '3005-2'] })).toBe(true);
    // armario sin esa opcion → no aplica
    expect(evaluarCriterios(c, { opciones: ['3005-1'] })).toBe(false);
    // armario sin opciones declaradas → no aplica (opcional excluida)
    expect(evaluarCriterios(c, { opciones: [] })).toBe(false);
    // opciones aun sin elegir → no filtra
    expect(evaluarCriterios(c, { opciones: null })).toBe(true);
    expect(evaluarCriterios(c, {})).toBe(true);
  });

  it('opcion compuesta: dos criterios = AND (filtro heat exchanger 3004-2 + 3005-x)', () => {
    const c = [
      { atributo: 'opcion', op: 'in', valor: ['3004-2'] },
      { atributo: 'opcion', op: 'in', valor: ['3005-1', '3005-2'] },
    ];
    expect(evaluarCriterios(c, { opciones: ['3004-2', '3005-2'] })).toBe(true);
    expect(evaluarCriterios(c, { opciones: ['3004-2', '3005-1'] })).toBe(true);
    // tiene 3004-2 pero ninguna 3005-x → no aplica
    expect(evaluarCriterios(c, { opciones: ['3004-2'] })).toBe(false);
    // tiene 3005-2 pero no 3004-2 → no aplica
    expect(evaluarCriterios(c, { opciones: ['3005-2'] })).toBe(false);
  });

  it('varios criterios = AND', () => {
    const c = [
      { atributo: 'montaje', op: 'in', valor: [2] },
      { atributo: 'proteccion', op: 'in', valor: [6] },
    ];
    expect(evaluarCriterios(c, { montajeId: 2, proteccionId: 6 })).toBe(true);
    expect(evaluarCriterios(c, { montajeId: 2, proteccionId: 1 })).toBe(false);
    // proteccion sin elegir → solo filtra el montaje
    expect(evaluarCriterios(c, { montajeId: 2 })).toBe(true);
  });
});

describe('matchCohorte — integracion v3 + fallback legacy', () => {
  it('fila con criterios v3: mandan los criterios', () => {
    const row = {
      criterios: [{ atributo: 'montaje', op: 'in', valor: [3] }],
      // legacy contradictorio: debe ignorarse
      montajesAplicables: [2],
    };
    expect(matchCohorte(row, { montajeId: 3 })).toBe(true);
    expect(matchCohorte(row, { montajeId: 2 })).toBe(false);
  });

  it('fila sin criterios: fallback a columnas legacy', () => {
    const row = { criterios: null, montajesAplicables: [2, 3], proteccionesAplicables: null, controladoresAplicables: null };
    expect(matchCohorte(row, { montajeId: 2 })).toBe(true);
    expect(matchCohorte(row, { montajeId: 5 })).toBe(false);
  });
});
