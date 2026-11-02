import { act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderAuthHook } from '../../test/contextHarness';
import { normalizeRole, useAuth, type UsuarioActual } from './AuthContext';

const user: UsuarioActual = {
  id: 'U1',
  nombre: 'Hugo Arboleda',
  correo: 'hugo.arboleda@icesi.edu.co',
  rol: 'manager',
  departamento: 'Departamento de Computacion y Sistemas inteligentes.',
  iniciales: "HA",
  token: 'session-token',
};

describe('AuthContext', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('starts without session and persists login/logout', () => {
    const getAuth = renderAuthHook();

    expect(getAuth().usuario).toBeNull();

    act(() => getAuth().login(user));
    expect(getAuth().usuario).toEqual(user);
    expect(JSON.parse(sessionStorage.getItem('sgp_session_user') ?? '{}')).toMatchObject({ id: 'U1' });
    expect(JSON.parse(sessionStorage.getItem('sgp_session_user') ?? '{}')).not.toHaveProperty('token');
    expect(sessionStorage.getItem('sgp_access_token')).toBe('session-token');

    act(() => getAuth().logout());
    expect(getAuth().usuario).toBeNull();
    expect(sessionStorage.getItem('sgp_session_user')).toBeNull();
    expect(sessionStorage.getItem('sgp_access_token')).toBeNull();
  });

  it('restores a valid session from storage', () => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify(user));

    const getAuth = renderAuthHook();

    expect(getAuth().usuario?.correo).toBe('hugo.arboleda@icesi.edu.co');
  });

  it('migrates legacy session roles into the current role model', () => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify({ ...user, rol: 'jefe' }));

    const getAuth = renderAuthHook();

    expect(getAuth().usuario?.rol).toBe('manager');
  });

  it('treats an unknown stored role as a read-only visitor', () => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify({ ...user, rol: 'superusuario' }));

    const getAuth = renderAuthHook();

    expect(getAuth().usuario?.rol).toBe('visitor');
  });

  it('normalizes the role received at login', () => {
    const getAuth = renderAuthHook();

    act(() => getAuth().login({ ...user, rol: 'role_admin' as never }));

    expect(getAuth().usuario?.rol).toBe('admin');
  });

  it.each([
    ['VISITOR', 'visitor'],
    ['Colaborador', 'contributor'],
    ['', 'visitor'],
    [undefined, 'visitor'],
  ])('maps the role %s to %s', (role, expected) => {
    expect(normalizeRole(role)).toBe(expected);
  });

  it('ignores malformed session storage', () => {
    sessionStorage.setItem('sgp_session_user', '{bad-json');

    const getAuth = renderAuthHook();

    expect(getAuth().usuario).toBeNull();
  });

  it('rejects an expired session and removes its bearer', () => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify({ ...user, token: undefined, expiresAt: Date.now() - 1 }));
    sessionStorage.setItem('sgp_access_token', 'expired-token');

    const getAuth = renderAuthHook();

    expect(getAuth().usuario).toBeNull();
    expect(sessionStorage.getItem('sgp_access_token')).toBeNull();
  });

  it('keeps a session whose expiry is beyond the browser timer limit', () => {
    const getAuth = renderAuthHook();

    act(() => getAuth().login({ ...user, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }));

    expect(getAuth().usuario?.correo).toBe('hugo.arboleda@icesi.edu.co');
  });

  it('closes the session when the API rejects the stored token', () => {
    const getAuth = renderAuthHook();
    act(() => getAuth().login(user));

    act(() => {
      window.dispatchEvent(new Event('mte:session-rejected'));
    });

    expect(getAuth().usuario).toBeNull();
    expect(sessionStorage.getItem('sgp_access_token')).toBeNull();
  });

  it('exposes safe default no-op methods outside the provider', () => {
    let api: ReturnType<typeof useAuth>;
    function Probe() {
      api = useAuth();
      return null;
    }

    render(<Probe />);

    expect(api!.usuario).toBeNull();
    expect(() => api!.login(user)).not.toThrow();
    expect(() => api!.logout()).not.toThrow();
  });
});
