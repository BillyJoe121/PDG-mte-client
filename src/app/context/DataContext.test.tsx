import { act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { renderDataHook } from '../../test/contextHarness';
import { useData } from './DataContext';
import type { IndicadorContribucion, KeyResult, RubricaCriterio } from '../data/mockData';

const toastMock = vi.mocked(toast);

const baseKR: Omit<KeyResult, 'id'> = {
  enunciado: 'Aumentar pilotos de IA',
  metrica: 'Pilotos',
  valorBase: 0,
  valorActual: 5,
  valorObjetivo: 10,
  unidad: 'proyectos',
  estado: 'normal',
  proyectoIds: [],
};

const baseIndicador: Omit<IndicadorContribucion, 'id' | 'estado' | 'creadoEn'> = {
  proyectoId: 'P1',
  okrId: 'OKR1',
  krId: 'KR1-2',
  nombre: 'Indicador de prueba',
  descripcion: 'Descripcion',
  valorBase: 0,
  valorObjetivo: 10,
  valorActual: 0,
  unidad: 'proyectos',
};

describe('DataContext', () => {
  beforeEach(() => {
    let now = 1_777_777_000_000;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));
    vi.spyOn(Date, 'now').mockImplementation(() => ++now);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates, updates and deletes strategic bets and institutional goals', () => {
    const getData = renderDataHook();

    let apuestaId = '';
    act(() => {
      apuestaId = getData().addApuesta({
        nombre: 'Nueva apuesta',
        descripcion: 'Descripcion',
        fechaInicio: '2026-01-01',
        fechaCierre: '2026-12-31',
        estado: 'activa',
        areaInstitucional: 'Escuela TDI',
      });
    });
    expect(getData().apuestas.find((apuesta) => apuesta.id === apuestaId)?.cumplimiento).toBe(0);

    act(() => getData().updateApuesta(apuestaId, { nombre: 'Apuesta editada' }));
    expect(getData().apuestas.find((apuesta) => apuesta.id === apuestaId)?.nombre).toBe('Apuesta editada');

    let metaId = '';
    act(() => {
      metaId = getData().addMeta({
        nombre: 'Meta nueva',
        descripcion: 'Descripcion',
        estado: 'activa',
        areaInstitucional: 'Escuela TDI',
      });
    });
    act(() => getData().updateMeta(metaId, { estado: 'inactiva' }));
    expect(getData().metas.find((meta) => meta.id === metaId)?.estado).toBe('inactiva');

    act(() => {
      getData().deleteApuesta(apuestaId);
      getData().deleteMeta(metaId);
    });
    expect(getData().apuestas.some((apuesta) => apuesta.id === apuestaId)).toBe(false);
    expect(getData().metas.some((meta) => meta.id === metaId)).toBe(false);
  });

  it('guards period catalog duplicate, missing and in-use deletion paths', () => {
    const getData = renderDataHook();

    expect(getData().isPeriodoInUse('2025-I')).toBe(true);
    expect(getData().isPeriodoInUse('2099-I')).toBe(false);

    let duplicated = 'not-empty';
    act(() => {
      duplicated = getData().addPeriodoAcademico({
        nombre: '2025-I',
        fechaInicio: '2025-01-01',
        fechaFin: '2025-06-30',
        estado: 'activo',
      });
    });
    expect(duplicated).toBe('');
    expect(toastMock.error).toHaveBeenCalled();

    let periodoId = '';
    act(() => {
      periodoId = getData().addPeriodoAcademico({
        nombre: '2099-I',
        fechaInicio: '2099-01-01',
        fechaFin: '2099-06-30',
        estado: 'planificacion',
      });
    });
    act(() => getData().updatePeriodoAcademico(periodoId, { nombre: '2025-I' }));
    expect(getData().periodosAcademicos.find((periodo) => periodo.id === periodoId)?.nombre).toBe('2099-I');

    act(() => getData().updatePeriodoAcademico('missing', { estado: 'cerrado' }));
    act(() => getData().updatePeriodoAcademico(periodoId, { estado: 'activo' }));
    expect(getData().periodosAcademicos.find((periodo) => periodo.id === periodoId)?.estado).toBe('activo');

    act(() => getData().deletePeriodoAcademico('missing'));
    act(() => getData().deletePeriodoAcademico('PER-2025-I'));
    expect(getData().periodosAcademicos.find((periodo) => periodo.id === 'PER-2025-I')?.estado).toBe('cerrado');

    act(() => getData().deletePeriodoAcademico(periodoId));
    expect(getData().periodosAcademicos.some((periodo) => periodo.id === periodoId)).toBe(false);
  });

  it('guards measurement unit duplicate, missing and in-use deletion paths', () => {
    const getData = renderDataHook();

    expect(getData().isUnidadInUse('proyectos')).toBe(true);
    expect(getData().isUnidadInUse('creditos')).toBe(false);

    let duplicated = 'not-empty';
    act(() => {
      duplicated = getData().addUnidadMedida({ nombre: 'proyectos', tipo: 'numerica', descripcion: 'Dup', activa: true });
    });
    expect(duplicated).toBe('');

    let unidadId = '';
    act(() => {
      unidadId = getData().addUnidadMedida({ nombre: 'creditos', tipo: 'numerica', descripcion: 'Creditos', activa: true });
    });
    act(() => getData().updateUnidadMedida(unidadId, { nombre: '%' }));
    expect(getData().unidadesMedida.find((unidad) => unidad.id === unidadId)?.nombre).toBe('creditos');

    act(() => getData().updateUnidadMedida('missing', { activa: false }));
    act(() => getData().updateUnidadMedida(unidadId, { descripcion: 'Creditos academicos' }));
    expect(getData().unidadesMedida.find((unidad) => unidad.id === unidadId)?.descripcion).toBe('Creditos academicos');

    act(() => getData().deleteUnidadMedida('missing'));
    act(() => getData().deleteUnidadMedida('UM-PROY'));
    expect(getData().unidadesMedida.find((unidad) => unidad.id === 'UM-PROY')?.activa).toBe(false);

    act(() => getData().deleteUnidadMedida(unidadId));
    expect(getData().unidadesMedida.some((unidad) => unidad.id === unidadId)).toBe(false);
  });

  it('manages OKRs and KRs including no-op compatibility methods', () => {
    const getData = renderDataHook();

    expect(getData().addOCP({ nombre: 'Compat', descripcion: '', estado: 'borrador' })).toBe('');
    expect(() => getData().updateOCP('OCP1', { nombre: 'Nada' })).not.toThrow();

    let okrId = '';
    act(() => {
      okrId = getData().addOKR({
        objetivo: 'Objetivo nuevo',
        apuestaId: 'A1',
        metaId: 'M1',
        estado: 'activo',
        departamento: 'DCSI',
        periodo: '2026-I',
        keyResults: [{ ...baseKR, valorActual: 5, valorObjetivo: 10 }],
      });
    });
    expect(getData().okrs.find((okr) => okr.id === okrId)?.cumplimiento).toBe(50);

    let emptyOkrId = '';
    act(() => {
      emptyOkrId = getData().addOKR({
        objetivo: 'Objetivo sin KR',
        apuestaId: 'A1',
        metaId: 'M1',
        estado: 'borrador',
        departamento: 'DCSI',
        periodo: '2026-I',
        keyResults: [],
      });
    });
    expect(getData().okrs.find((okr) => okr.id === emptyOkrId)?.cumplimiento).toBe(0);

    let krId = '';
    act(() => {
      krId = getData().addKR(okrId, { ...baseKR, valorActual: 10 });
    });
    expect(getData().okrs.find((okr) => okr.id === okrId)?.keyResults.some((kr) => kr.id === krId)).toBe(true);

    act(() => getData().updateKR(okrId, krId, { valorActual: 12 }));
    expect(getData().okrs.find((okr) => okr.id === okrId)?.cumplimiento).toBeGreaterThan(50);

    act(() => getData().registrarAvanceKR(okrId, krId, 8, 'Tester', 'Normal'));
    expect(getData().okrs.find((okr) => okr.id === okrId)?.keyResults.find((kr) => kr.id === krId)?.estado).toBe('normal');

    act(() => getData().registrarAvanceKR(okrId, krId, 20, 'Tester', 'Superado'));
    expect(getData().getRegistrosByKR(krId)).toHaveLength(2);
    expect(getData().okrs.find((okr) => okr.id === okrId)?.keyResults.find((kr) => kr.id === krId)?.estado).toBe('superado');

    act(() => {
      getData().registrarAvanceKR('missing', krId, 1, 'Tester', 'No-op');
      getData().removeKR(okrId, krId);
    });
    expect(getData().getRegistrosByKR(krId)).toHaveLength(0);

    act(() => {
      getData().updateOKR(okrId, { estado: 'cancelado' });
      getData().deleteOKR(okrId);
      getData().deleteOKR(emptyOkrId);
    });
    expect(getData().okrs.some((okr) => okr.id === okrId)).toBe(false);
  });

  it('creates projects and blocks invalid state transitions', () => {
    const getData = renderDataHook();

    let projectId = '';
    act(() => {
      projectId = getData().addProyecto({
        nombre: 'Proyecto nuevo',
        descripcion: 'Descripcion',
        tipo: 'grado',
        departamento: 'DCSI',
        tutores: ['Tutor'],
        fechaInicio: '2026-01-01',
        fechaCierre: '2026-06-30',
        periodoInicio: '2026-I',
        periodoFin: '2026-I',
        estado: 'borrador',
        krId: 'KR1-2',
        contribucionTipo: 'directa',
      });
    });
    expect(getData().proyectos.find((project) => project.id === projectId)?.okrIds).toContain('OKR1');

    let explicitProjectId = '';
    act(() => {
      explicitProjectId = getData().addProyecto({
        nombre: 'Proyecto explicito',
        descripcion: 'Descripcion',
        tipo: 'grado',
        departamento: 'DCSI',
        tutores: ['Tutor'],
        fechaInicio: '2026-01-01',
        fechaCierre: '2026-06-30',
        periodoInicio: '2026-I',
        periodoFin: '2026-I',
        estado: 'borrador',
        krId: '',
        contribucionTipo: 'soporte',
        okrIds: ['OKR2'],
      });
    });
    expect(getData().proyectos.find((project) => project.id === explicitProjectId)?.okrIds).toEqual(['OKR2']);

    act(() => getData().updateProyecto(projectId, { estado: 'activo' }));
    expect(getData().proyectos.find((project) => project.id === projectId)?.estado).toBe('borrador');

    let indicadorId = '';
    act(() => {
      indicadorId = getData().addIndicadorContribucion({ ...baseIndicador, proyectoId: projectId, valorActual: 4 });
    });
    expect(getData().getIndicadoresByProyecto(projectId)[0].estado).toBe('en_progreso');

    act(() => getData().updateProyecto(projectId, { estado: 'activo' }));
    expect(getData().proyectos.find((project) => project.id === projectId)?.estado).toBe('activo');

    act(() => getData().updateProyecto(projectId, { estado: 'archivado' }));
    expect(getData().proyectos.find((project) => project.id === projectId)?.estado).toBe('activo');

    act(() => getData().updateProyecto(projectId, { estado: 'finalizado' }));
    expect(getData().proyectos.find((project) => project.id === projectId)?.estado).toBe('activo');

    act(() => getData().updateIndicadorContribucion(indicadorId, { valorActual: 10 }));
    expect(getData().getIndicadoresByOKR('OKR1').find((ind) => ind.id === indicadorId)?.estado).toBe('cumplido');

    act(() => getData().updateProyecto(projectId, { estado: 'finalizado' }));
    expect(getData().proyectos.find((project) => project.id === projectId)?.estado).toBe('finalizado');

    act(() => getData().deleteProyecto(explicitProjectId));
  });

  it('blocks activation when a project has no OKR or KR linkage', () => {
    const getData = renderDataHook();

    let projectId = '';
    act(() => {
      projectId = getData().addProyecto({
        nombre: 'Proyecto aislado',
        descripcion: 'Descripcion',
        tipo: 'grado',
        departamento: 'DCSI',
        tutores: ['Tutor'],
        fechaInicio: '2026-01-01',
        fechaCierre: '2026-06-30',
        periodoInicio: '2026-I',
        periodoFin: '2026-I',
        estado: 'borrador',
        krId: '',
        contribucionTipo: 'directa',
      });
    });

    act(() => getData().updateProyecto(projectId, { estado: 'activo' }));

    expect(getData().proyectos.find((project) => project.id === projectId)?.estado).toBe('borrador');
    expect(toastMock.error).toHaveBeenCalledWith('Para activar el proyecto debes vincular al menos un OKR o KR.');
  });

  it('manages project progress, KR linking and compatibility links', () => {
    const getData = renderDataHook();
    const projectId = 'P1';

    act(() => getData().addRegistroAvance({
      id: 'RA-TEST',
      proyectoId: projectId,
      fecha: '2026-04-14',
      fechaCorte: '2026-04-14',
      porcentaje: 80,
      comentario: 'Avance',
      indicadorId: 'IND-P1-OKR1-1',
      valorActual: 3,
      registradoPor: 'Tester',
      hitos: ['Hito'],
    }));
    expect(getData().getRegistrosByProyecto(projectId).some((registro) => registro.id === 'RA-TEST')).toBe(true);
    expect(getData().indicadoresContribucion.find((ind) => ind.id === 'IND-P1-OKR1-1')?.estado).toBe('cumplido');

    act(() => getData().setProyectoKR(projectId, 'KR1-1', { porcentaje: 55, justificacion: 'Alineado', origen: 'manual' }));
    expect(getData().proyectos.find((project) => project.id === projectId)?.krId).toBe('KR1-1');
    expect(getData().getVinculo(projectId, 'OKR1')).toBeDefined();

    act(() => getData().setProyectoKR(projectId, 'KR1-1'));
    act(() => getData().setProyectoKR(projectId, 'missing-kr'));

    act(() => getData().addVinculo({ proyectoId: projectId, okrId: 'OKR2', peso: 20, contribucionTipo: 'soporte' }));
    act(() => getData().addVinculo({ proyectoId: projectId, okrId: 'OKR2', peso: 35 }));
    expect(getData().getVinculosByProyecto(projectId).some((link) => link.okrId === 'OKR2')).toBe(true);

    act(() => getData().updateVinculoPeso(projectId, 'OKR2', 75));
    expect(getData().getVinculo(projectId, 'OKR2')?.peso).toBe(75);

    act(() => getData().removeVinculo(projectId, 'OKR2'));
    expect(getData().getVinculo(projectId, 'OKR2')).toBeUndefined();

    act(() => getData().unlinkProjectFromKR(projectId, 'KR1-1'));
    expect(getData().proyectos.find((project) => project.id === projectId)?.krId).toBe('');
  });

  it('saves, copies and rejects rubrics and contribution evaluations', () => {
    const getData = renderDataHook();
    const criterios: RubricaCriterio[] = [
      { id: 'C1', nombre: 'Impacto', descripcion: 'Impacto', peso: 60 },
      { id: 'C2', nombre: 'Evidencia', descripcion: 'Evidencia', peso: 40 },
    ];

    act(() => getData().saveRubrica('OKR3', criterios, 'Tester'));
    expect(getData().getRubricaByOKR('OKR3')?.version).toBe(1);

    act(() => getData().saveRubrica('OKR3', criterios.slice(0, 1), 'Tester 2'));
    expect(getData().getRubricaByOKR('OKR3')?.version).toBe(2);

    act(() => getData().copyRubrica('OKR3', 'OKR2', 'Copiador'));
    expect(getData().getRubricaByOKR('OKR2')?.criterios.length).toBe(1);

    act(() => getData().copyRubrica('missing', 'OKR2', 'Copiador'));
    expect(toastMock.error).toHaveBeenCalledWith('El objetivo origen no tiene rubrica');

    act(() => getData().saveEvaluacionAporte({
      proyectoId: 'P1',
      okrId: 'OKR1',
      krId: 'KR1-2',
      evaluador: 'Tester',
      calificaciones: [
        { criterioId: 'RUB-OKR1-C1', puntaje: 5, observacion: 'Muy bien' },
        { criterioId: 'RUB-OKR1-C2', puntaje: 4, observacion: 'Bien' },
        { criterioId: 'RUB-OKR1-C3', puntaje: 3, observacion: 'Aceptable' },
      ],
      observaciones: 'Obs',
    }));
    expect(getData().getEvaluacionesByProyecto('P1')[0].puntajeTotal).toBeGreaterThan(0);
    expect(getData().getEvaluacionesByOKR('OKR1')[0].proyectoId).toBe('P1');

    act(() => getData().saveEvaluacionAporte({
      proyectoId: 'missing',
      okrId: 'OKR1',
      evaluador: 'Tester',
      calificaciones: [],
      observaciones: 'No-op',
    }));
    expect(toastMock.error).toHaveBeenCalledWith('No se puede evaluar sin rubrica y proyecto');
  });

  it('updates and deletes indicators and projects with cleanup', () => {
    const getData = renderDataHook();

    let indicatorId = '';
    act(() => {
      indicatorId = getData().addIndicadorContribucion({ ...baseIndicador, valorActual: 2 });
    });
    expect(getData().indicadoresContribucion.find((ind) => ind.id === indicatorId)?.estado).toBe('en_riesgo');

    act(() => getData().updateIndicadorContribucion(indicatorId, { valorActual: 5 }));
    expect(getData().indicadoresContribucion.find((ind) => ind.id === indicatorId)?.estado).toBe('en_progreso');

    let emptyIndicatorId = '';
    act(() => {
      emptyIndicatorId = getData().addIndicadorContribucion({ ...baseIndicador, nombre: 'Sin registro', valorActual: 0 });
    });
    expect(getData().indicadoresContribucion.find((ind) => ind.id === emptyIndicatorId)?.estado).toBe('sin_registro');

    act(() => getData().deleteIndicadorContribucion(indicatorId));
    act(() => getData().deleteIndicadorContribucion(emptyIndicatorId));
    expect(getData().indicadoresContribucion.some((ind) => ind.id === indicatorId)).toBe(false);

    act(() => getData().deleteProyecto('P1'));
    expect(getData().proyectos.some((project) => project.id === 'P1')).toBe(false);
    expect(getData().getRegistrosByProyecto('P1')).toEqual([]);
  });

  it('exposes safe default no-op methods outside the provider', () => {
    let api: ReturnType<typeof useData>;
    function Probe() {
      api = useData();
      return null;
    }

    render(<Probe />);

    expect(api!.apuestas).toEqual([]);
    expect(api!.addApuesta({ nombre: '', descripcion: '', fechaInicio: '', fechaCierre: '', estado: 'activa', areaInstitucional: '' })).toBe('');
    expect(api!.addPeriodoAcademico({ nombre: '', fechaInicio: '', fechaFin: '', estado: 'activo' })).toBe('');
    expect(api!.addUnidadMedida({ nombre: '', tipo: 'otra', activa: true })).toBe('');
    expect(api!.addMeta({ nombre: '', descripcion: '', estado: 'activa', areaInstitucional: '' })).toBe('');
    expect(api!.addOCP({ nombre: '', descripcion: '', estado: 'borrador' })).toBe('');
    expect(api!.addOKR({ objetivo: '', apuestaId: '', metaId: '', estado: 'borrador', departamento: '', periodo: '', keyResults: [] })).toBe('');
    expect(api!.addKR('OKR', baseKR)).toBe('');
    expect(api!.addProyecto({
      nombre: '',
      descripcion: '',
      tipo: 'grado',
      departamento: '',
      tutores: [],
      fechaInicio: '',
      fechaCierre: '',
      periodoInicio: '',
      periodoFin: '',
      estado: 'borrador',
      krId: '',
      contribucionTipo: 'directa',
    })).toBe('');
    expect(api!.addIndicadorContribucion(baseIndicador)).toBe('');
    expect(api!.isPeriodoInUse('x')).toBe(false);
    expect(api!.isUnidadInUse('x')).toBe(false);
    expect(api!.getRegistrosByKR('x')).toEqual([]);
    expect(api!.getRegistrosByProyecto('x')).toEqual([]);
    expect(api!.getVinculo('x', 'y')).toBeUndefined();
    expect(api!.getVinculosByOKR('x')).toEqual([]);
    expect(api!.getVinculosByProyecto('x')).toEqual([]);
    expect(api!.getRubricaByOKR('x')).toBeUndefined();
    expect(api!.getEvaluacionesByProyecto('x')).toEqual([]);
    expect(api!.getEvaluacionesByOKR('x')).toEqual([]);
    expect(api!.getIndicadoresByProyecto('x')).toEqual([]);
    expect(api!.getIndicadoresByOKR('x')).toEqual([]);
    expect(() => {
      api!.updateApuesta('x', {});
      api!.deleteApuesta('x');
      api!.updatePeriodoAcademico('x', {});
      api!.deletePeriodoAcademico('x');
      api!.updateUnidadMedida('x', {});
      api!.deleteUnidadMedida('x');
      api!.updateMeta('x', {});
      api!.deleteMeta('x');
      api!.updateOCP('x', {});
      api!.updateOKR('x', {});
      api!.deleteOKR('x');
      api!.updateKR('x', 'y', {});
      api!.removeKR('x', 'y');
      api!.registrarAvanceKR('x', 'y', 1, 'z', 'n');
      api!.updateProyecto('x', {});
      api!.deleteProyecto('x');
      api!.addRegistroAvance({ id: '', proyectoId: '', fecha: '', porcentaje: 0, comentario: '', registradoPor: '', hitos: [] });
      api!.setProyectoKR('x', 'y');
      api!.unlinkProjectFromKR('x', 'y');
      api!.addVinculo({ proyectoId: '', okrId: '', peso: 0 });
      api!.removeVinculo('x', 'y');
      api!.updateVinculoPeso('x', 'y', 1);
      api!.saveRubrica('x', [], 'tester');
      api!.copyRubrica('x', 'y', 'tester');
      api!.saveEvaluacionAporte({ proyectoId: '', okrId: '', evaluador: '', calificaciones: [], observaciones: '' });
      api!.updateIndicadorContribucion('x', {});
      api!.deleteIndicadorContribucion('x');
    }).not.toThrow();
  });
});
