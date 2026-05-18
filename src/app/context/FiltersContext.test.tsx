import { act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderFiltersHook } from '../../test/contextHarness';
import { useGlobalFilters } from './FiltersContext';

describe('FiltersContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('updates, clears and persists global filters', () => {
    const getFilters = renderFiltersHook();

    act(() => getFilters().setFilter('periodo', '2026-I'));
    act(() => getFilters().setFilter('departamento', 'DCSI'));

    expect(getFilters().filters).toMatchObject({ periodo: '2026-I', departamento: 'DCSI' });
    expect(JSON.parse(sessionStorage.getItem('mte-global-filters') ?? '{}')).toMatchObject({ periodo: '2026-I' });

    act(() => getFilters().clearFilters());
    expect(getFilters().filters).toMatchObject({ periodo: 'todos', departamento: 'todos' });
  });

  it('saves, replaces, applies and deletes presets', () => {
    const getFilters = renderFiltersHook();

    act(() => getFilters().setFilter('periodo', '2026-I'));
    act(() => getFilters().savePreset(' Prioridad actual '));
    const firstId = getFilters().presets[0].id;
    act(() => getFilters().setFilter('periodo', '2025-I'));
    act(() => getFilters().savePreset('prioridad actual'));

    expect(getFilters().presets).toHaveLength(1);
    expect(getFilters().presets[0].nombre).toBe('prioridad actual');

    act(() => getFilters().clearFilters());
    act(() => getFilters().applyPreset(getFilters().presets[0].id));
    expect(getFilters().filters.periodo).toBe('2025-I');

    act(() => getFilters().deletePreset(firstId));
    expect(getFilters().presets).toHaveLength(0);
  });

  it('ignores empty preset names and unknown presets', () => {
    const getFilters = renderFiltersHook();

    act(() => getFilters().savePreset('   '));
    act(() => getFilters().applyPreset('missing'));

    expect(getFilters().presets).toEqual([]);
    expect(getFilters().filters.periodo).toBe('todos');
  });

  it('falls back to defaults when stored filters or presets are malformed', () => {
    sessionStorage.setItem('mte-global-filters', '{bad');
    localStorage.setItem('mte-filter-presets', '{bad');

    const getFilters = renderFiltersHook();

    expect(getFilters().filters.periodo).toBe('todos');
    expect(getFilters().presets).toEqual([]);
  });

  it('exposes safe default no-op methods outside the provider', () => {
    let api: ReturnType<typeof useGlobalFilters>;
    function Probe() {
      api = useGlobalFilters();
      return null;
    }

    render(<Probe />);

    expect(api!.filters.periodo).toBe('todos');
    expect(() => {
      api!.setFilter('periodo', '2026-I');
      api!.clearFilters();
      api!.applyPreset('missing');
      api!.savePreset('Demo');
      api!.deletePreset('missing');
    }).not.toThrow();
  });
});
