import { afterEach, describe, expect, it, vi } from 'vitest';
import { calcularImpacto, type ImpactoTipo } from './aiImpact';

describe('calcularImpacto', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns deterministic IA impact inside the expected range', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const promise = calcularImpacto({
      tipo: 'objetivo-apuesta',
      origen: { titulo: 'Objetivo curricular' },
      destino: { titulo: 'Innovacion curricular' },
      contexto: 'pregrado',
    });

    await vi.advanceTimersByTimeAsync(700);
    const result = await promise;

    expect(result.origen).toBe('ia');
    expect(result.porcentaje).toBeGreaterThanOrEqual(25);
    expect(result.porcentaje).toBeLessThanOrEqual(70);
    expect(result.calculadoEn).toBe('2026-04-14T12:00:00.700Z');
    expect(result.justificacion).toContain('Objetivo curricular');
  });

  it.each([
    ['objetivo-meta', 20, 65],
    ['kr-objetivo', 15, 50],
    ['proyecto-kr', 10, 45],
  ] satisfies [ImpactoTipo, number, number][])('uses configured range for %s', async (tipo, min, max) => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const promise = calcularImpacto({
      tipo,
      origen: { titulo: 'Origen' },
      destino: { titulo: 'Destino' },
    });

    await vi.advanceTimersByTimeAsync(700);
    const result = await promise;

    expect(result.porcentaje).toBeGreaterThanOrEqual(min);
    expect(result.porcentaje).toBeLessThanOrEqual(max);
    expect(result.justificacion).toContain('Destino');
  });
});
