import type { ReactNode } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { renderAuditHook } from '../../test/contextHarness';
import { useAudit } from './AuditContext';

function WithAuth({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuditContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('uses seeded entries when storage is empty', () => {
    const getAudit = renderAuditHook();

    expect(getAudit().entries.length).toBeGreaterThanOrEqual(4);
    expect(getAudit().entries[0].id).toBe('AUD-SEED-1');
  });

  it('uses seeded entries when storage is malformed or not an array', () => {
    sessionStorage.setItem('sgp-audit-log', '{"bad":true}');

    const getAudit = renderAuditHook();

    expect(getAudit().entries[0].id).toBe('AUD-SEED-1');
  });

  it('uses seeded entries when storage contains invalid JSON', () => {
    sessionStorage.setItem('sgp-audit-log', '{bad-json');

    const getAudit = renderAuditHook();

    expect(getAudit().entries[0].id).toBe('AUD-SEED-1');
  });

  it('logs entries with authenticated user data and persists them', () => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify({
      id: 'U1',
      nombre: 'Hugo Arboleda',
      correo: 'hugo.arboleda@icesi.edu.co',
      rol: 'director',
      departamento: 'Departamento de Computacion y Sistemas inteligentes.',
      iniciales: "HA",
    }));
    vi.spyOn(Math, 'random').mockReturnValue(0.12345);
    const getAudit = renderAuditHook(WithAuth);

    act(() => getAudit().logAudit({
      modulo: 'OKRs',
      accion: 'Creacion',
      entidad: 'OKR nuevo',
      detalle: 'Creacion de prueba',
      resultado: 'ok',
    }));

    expect(getAudit().entries[0]).toMatchObject({
      fecha: '2026-04-14T12:00:00.000Z',
      usuario: 'Hugo Arboleda',
      rol: 'director',
      modulo: 'OKRs',
      resultado: 'ok',
    });
    expect(JSON.parse(sessionStorage.getItem('sgp-audit-log') ?? '[]')[0]).toMatchObject({ entidad: 'OKR nuevo' });
  });

  it('logs entries as system when there is no authenticated user or override', () => {
    const getAudit = renderAuditHook();

    act(() => getAudit().logAudit({
      modulo: 'Sistema',
      accion: 'Tarea automatica',
      entidad: 'Scheduler',
      detalle: 'Ejecucion nocturna',
      resultado: 'info',
    }));

    expect(getAudit().entries[0]).toMatchObject({ usuario: 'Sistema', rol: 'sistema' });
  });

  it('allows explicit user overrides and caps history at 120 entries', () => {
    const existing = Array.from({ length: 130 }, (_, index) => ({
      id: `AUD-${index}`,
      fecha: '2026-01-01T00:00:00.000Z',
      usuario: 'A',
      rol: 'r',
      modulo: 'Sistema',
      accion: 'Seed',
      entidad: 'Entidad',
      detalle: 'Detalle',
      resultado: 'info',
    }));
    sessionStorage.setItem('sgp-audit-log', JSON.stringify(existing));
    const getAudit = renderAuditHook();

    act(() => getAudit().logAudit({
      usuario: 'Sistema externo',
      rol: 'integracion',
      modulo: 'Sistema',
      accion: 'Sync',
      entidad: 'Lote',
      detalle: 'Carga masiva',
      resultado: 'bloqueado',
    }));

    expect(getAudit().entries).toHaveLength(120);
    expect(getAudit().entries[0]).toMatchObject({ usuario: 'Sistema externo', rol: 'integracion', resultado: 'bloqueado' });
  });

  it('exposes a safe default no-op logger outside the provider', () => {
    let api: ReturnType<typeof useAudit>;
    function Probe() {
      api = useAudit();
      return null;
    }

    render(<Probe />);

    expect(api!.entries[0].id).toBe('AUD-SEED-1');
    expect(() => api!.logAudit({
      modulo: 'Sistema',
      accion: 'No-op',
      entidad: 'Nada',
      detalle: 'Nada',
      resultado: 'info',
    })).not.toThrow();
  });
});
