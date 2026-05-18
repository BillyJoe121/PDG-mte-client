import { describe, expect, it } from 'vitest';
import type { ApuestaEstrategica, OKR, PeriodoAcademico, Proyecto } from '../data/mockData';
import { buildApuestaTrend, buildPeriodComparativo } from './analytics';

const periodos: PeriodoAcademico[] = [
  { id: 'P1', nombre: '2026-I', fechaInicio: '2026-01-01', fechaFin: '2026-06-30', estado: 'activo' },
  { id: 'P2', nombre: '2026-II', fechaInicio: '2026-07-01', fechaFin: '2026-12-31', estado: 'planificacion' },
];

const apuestas: ApuestaEstrategica[] = [
  { id: 'A1', nombre: 'Apuesta 1', descripcion: '', fechaInicio: '', fechaCierre: '', estado: 'activa', cumplimiento: 0, areaInstitucional: '' },
  { id: 'A2', nombre: 'Apuesta 2', descripcion: '', fechaInicio: '', fechaCierre: '', estado: 'activa', cumplimiento: 0, areaInstitucional: '' },
];

const okrs: OKR[] = [
  {
    id: 'O1',
    objetivo: 'Objetivo 1',
    apuestaId: 'A1',
    metaId: 'M1',
    estado: 'activo',
    cumplimiento: 80,
    departamento: 'DCSI',
    periodo: '2026-I',
    keyResults: [],
    proyectoIds: ['PR1'],
  },
  {
    id: 'O2',
    objetivo: 'Objetivo 2',
    apuestaId: 'A2',
    metaId: 'M2',
    estado: 'activo',
    cumplimiento: 40,
    departamento: 'DDI',
    periodo: '2025-II',
    keyResults: [],
    proyectoIds: [],
  },
];

const proyectos: Proyecto[] = [
  {
    id: 'PR1',
    nombre: 'Proyecto activo',
    descripcion: '',
    tipo: 'grado',
    departamento: 'DCSI',
    tutores: [],
    fechaInicio: '',
    fechaCierre: '',
    periodoInicio: '2026-I',
    periodoFin: '2026-II',
    estado: 'activo',
    krId: '',
    avanceGlobal: 60,
    ultimoRegistro: '',
    contribucionTipo: 'directa',
    okrIds: ['O1'],
  },
];

describe('analytics builders', () => {
  it('builds period comparisons from current OKRs, projects and evaluations', () => {
    const rows = buildPeriodComparativo({
      periodosAcademicos: periodos,
      okrs,
      proyectos,
      evaluacionesAporte: [{ id: 'E1', proyectoId: 'PR1', okrId: 'O1', rubricaId: 'R1', rubricaVersion: 1, fecha: '', evaluador: '', calificaciones: [], puntajeTotal: 90, aportePonderado: 72, observaciones: '' }],
    });

    expect(rows[0]).toMatchObject({ nombre: '2026-I', okrCumpl: 80, proyActivos: 1, promedioAporte: 72, okrsTotal: 1, proyectosTotal: 1 });
    expect(rows[1]).toMatchObject({ nombre: '2026-II', okrCumpl: 0, proyActivos: 1, promedioAporte: 72, okrsTotal: 0, proyectosTotal: 1 });
  });

  it('falls back to historical OKR data and project progress when needed', () => {
    const rows = buildPeriodComparativo({
      periodosAcademicos: periodos,
      okrs: [],
      proyectos: [{ ...proyectos[0], periodoFin: '' }],
      historicoOKRs: { O1: [{ periodo: '2026-I C1', cumplimiento: 55 }] },
    });

    expect(rows[0].okrCumpl).toBe(55);
    expect(rows[0].promedioAporte).toBe(60);
  });

  it('handles empty and invalid numeric inputs as zeroes', () => {
    const rows = buildPeriodComparativo({
      periodosAcademicos: periodos,
      okrs: [{ ...okrs[0], cumplimiento: Number.NaN }],
      proyectos: [{ ...proyectos[0], avanceGlobal: Number.POSITIVE_INFINITY }],
    });

    expect(rows[0].okrCumpl).toBe(0);
    expect(rows[0].promedioAporte).toBe(0);
  });

  it('builds apuesta trends from current and historical sources', () => {
    const rows = buildApuestaTrend(periodos, apuestas, okrs, {
      O2: [{ periodo: '2026-II C1', cumplimiento: 35 }],
    });

    expect(rows[0]).toMatchObject({ p: '2026-I', A1: 80, A2: 0 });
    expect(rows[1]).toMatchObject({ p: '2026-II', A1: 0, A2: 35 });
  });
});
