import { describe, expect, it } from 'vitest';
import type {
  ApuestaEstrategica,
  IndicadorContribucion,
  MetaInstitucional,
  OKR,
  Proyecto,
} from '../data/mockData';
import { validateStrategicConsistency } from './strategicValidation';

const apuesta: ApuestaEstrategica = {
  id: 'A1',
  nombre: 'Apuesta 1',
  descripcion: 'Descripcion',
  fechaInicio: '2026-01-01',
  fechaCierre: '2026-12-31',
  estado: 'activa',
  cumplimiento: 50,
  areaInstitucional: 'Academica',
};

const meta: MetaInstitucional = {
  id: 'M1',
  nombre: 'Meta 1',
  descripcion: 'Descripcion',
  estado: 'activa',
  areaInstitucional: 'Academica',
};

const okr: OKR = {
  id: 'O1',
  objetivo: 'Mejorar resultados academicos',
  apuestaId: 'A1',
  metaId: 'M1',
  estado: 'activo',
  cumplimiento: 35,
  departamento: 'Ingenieria',
  periodo: '2026-I',
  keyResults: [
    {
      id: 'KR1',
      enunciado: 'Aumentar la permanencia estudiantil',
      metrica: 'Permanencia',
      valorBase: 60,
      valorActual: 70,
      valorObjetivo: 80,
      unidad: '%',
      estado: 'normal',
      proyectoIds: ['P1'],
    },
  ],
  proyectoIds: ['P1'],
};

const proyecto: Proyecto = {
  id: 'P1',
  nombre: 'Proyecto de acompanamiento',
  descripcion: 'Descripcion',
  tipo: 'grado',
  departamento: 'Ingenieria',
  tutores: ['Tutor 1'],
  fechaInicio: '2026-01-01',
  fechaCierre: '2026-06-30',
  periodoInicio: '2026-I',
  periodoFin: '2026-I',
  estado: 'activo',
  krId: 'KR1',
  avanceGlobal: 40,
  ultimoRegistro: '2026-04-10',
  contribucionTipo: 'directa',
  okrIds: ['O1'],
};

const indicador: IndicadorContribucion = {
  id: 'I1',
  proyectoId: 'P1',
  okrId: 'O1',
  krId: 'KR1',
  nombre: 'Indicador',
  descripcion: 'Descripcion',
  unidad: '%',
  lineaBase: 60,
  valorActual: 70,
  valorMeta: 80,
  peso: 100,
};

describe('validateStrategicConsistency', () => {
  it('returns no issues for a consistent strategic graph', () => {
    expect(
      validateStrategicConsistency({
        apuestas: [apuesta],
        metas: [meta],
        okrs: [okr],
        proyectos: [proyecto],
        indicadoresContribucion: [indicador],
      })
    ).toEqual([]);
  });

  it('reports high severity issues before medium and low severity issues', () => {
    const issues = validateStrategicConsistency({
      apuestas: [],
      metas: [{ ...meta, id: 'M2' }],
      okrs: [{ ...okr, apuestaId: 'missing', metaId: 'missing', keyResults: [] }],
      proyectos: [
        {
          ...proyecto,
          krId: 'missing',
          okrIds: ['missing'],
          ultimoRegistro: '2026-02-01',
        },
      ],
      indicadoresContribucion: [],
    });

    expect(issues.map((issue) => issue.severity)).toEqual([
      'alta',
      'alta',
      'alta',
      'alta',
      'alta',
      'media',
      'media',
      'baja',
    ]);
    expect(issues.map((issue) => issue.id)).toContain('okr-apuesta-O1');
    expect(issues.map((issue) => issue.id)).toContain('proyecto-avance-P1');
    expect(issues.map((issue) => issue.id)).toContain('meta-okrs-M2');
  });

  it('reports a medium issue when a KR has no linked projects', () => {
    const issues = validateStrategicConsistency({
      apuestas: [apuesta],
      metas: [meta],
      okrs: [{ ...okr, keyResults: [{ ...okr.keyResults[0], proyectoIds: [] }] }],
      proyectos: [proyecto],
      indicadoresContribucion: [indicador],
    });

    expect(issues).toContainEqual(expect.objectContaining({ id: 'kr-proyectos-KR1', severity: 'media' }));
  });
});
