import { describe, expect, it } from 'vitest';
import {
  composeKRSentence,
  diasSinRegistro,
  findKRById,
  findOKRByKR,
  getColorEstadoOKR,
  getColorEstadoProyecto,
  getLabelRol,
  getTipoProyectoLabel,
  okrs,
  proyectos,
  vinculosIniciales,
} from './mockData';

describe('mockData helpers', () => {
  it('builds KR sentences and lookup labels for valid values', () => {
    expect(composeKRSentence({ metrica: 'Cursos actualizados', valorBase: 1, valorObjetivo: 4, unidad: 'cursos' }))
      .toBe('Pasar de 1 a 4 cursos en: Cursos actualizados');
    expect(getColorEstadoProyecto('activo')).toBe('#4CB979');
    expect(getColorEstadoOKR('cancelado')).toBe('#E9683B');
    expect(getLabelRol('administrador')).toBe('Administrador');
    expect(getTipoProyectoLabel('macroproyecto')).toBe('Macroproyecto');
  });

  it('returns undefined for unsupported lookup values', () => {
    expect(getColorEstadoProyecto('desconocido' as never)).toBeUndefined();
    expect(getColorEstadoOKR('desconocido' as never)).toBeUndefined();
    expect(getLabelRol('visitante' as never)).toBeUndefined();
    expect(getTipoProyectoLabel('otro' as never)).toBeUndefined();
  });

  it('calculates days without records using the fixed project reference date', () => {
    expect(diasSinRegistro('2026-04-14')).toBe(0);
    expect(diasSinRegistro('2026-04-01')).toBe(13);
  });

  it('finds OKRs and KRs by KR id', () => {
    expect(findOKRByKR(okrs, 'KR1-2')?.id).toBe('OKR1');
    expect(findKRById(okrs, 'KR1-2')?.metrica).toContain('IA/ML');
  });

  it('returns undefined when KR lookups do not match', () => {
    expect(findOKRByKR(okrs, 'KR-NOPE')).toBeUndefined();
    expect(findKRById(okrs, 'KR-NOPE')).toBeUndefined();
  });

  it('keeps project and initial link fixtures internally consistent', () => {
    const projectIds = new Set(proyectos.map((project) => project.id));
    expect(vinculosIniciales.length).toBeGreaterThan(0);
    expect(vinculosIniciales.every((link) => projectIds.has(link.proyectoId))).toBe(true);
  });
});
