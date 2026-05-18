import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildExportFilename, downloadCSV, getDateStamp, printPDF } from './exportUtils';

describe('export utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T10:20:30.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.title = '';
  });

  it('builds dated filenames with normalized optional scope', () => {
    expect(getDateStamp()).toBe('2026-04-14');
    expect(buildExportFilename('reporte', ' Escuela TDI  2026 ')).toBe('reporte_Escuela_TDI_2026_2026-04-14');
    expect(buildExportFilename('reporte')).toBe('reporte_2026-04-14');
  });

  it('does nothing when downloading empty CSV data', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    downloadCSV([], 'empty');
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('downloads CSV with escaped values and UTF-8 BOM', () => {
    const click = vi.fn();
    const createObjectURL = vi.fn(() => 'blob:csv');
    vi.stubGlobal('URL', { ...URL, createObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click);

    downloadCSV([{ nombre: 'Ana "A"', avance: 90 }], 'reporte');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('adds printable header and cleans it after printing', () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);

    printPDF('Reporte estrategico');

    expect(document.title).toBe('Reporte estrategico');
    expect(document.querySelector('.sgp-print-header')).toBeInTheDocument();
    expect(print).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);

    expect(document.querySelector('.sgp-print-header')).not.toBeInTheDocument();
    expect(document.title).toBe('');
  });

  it('cleans print assets on afterprint event', () => {
    vi.stubGlobal('print', vi.fn());

    printPDF();
    window.dispatchEvent(new Event('afterprint'));

    expect(document.querySelector('.sgp-print-header')).not.toBeInTheDocument();
  });
});
