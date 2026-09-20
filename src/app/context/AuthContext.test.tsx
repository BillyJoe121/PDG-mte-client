import { act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderAuthHook } from '../../test/contextHarness';
import { useAuth, type UsuarioActual } from './AuthContext';

const user: UsuarioActual = {
  id: 'U1',
  nombre: 'Hugo Arboleda',
  correo: 'hugo.arboleda@icesi.edu.co',
  rol: 'manager',
  departamento: 'Departamento de Computacion y Sistemas inteligentes.',
  iniciales: "HA",
  token: 'mock-token-ha',
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
    expect(sessionStorage.getItem('sgp_access_token')).toBe('mock-token-ha');

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

  it('migrates legacy session roles into the three-role model', () => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify({ ...user, rol: 'jefe' }));

    const getAuth = renderAuthHook();

    expect(getAuth().usuario?.rol).toBe('manager');
  });

  it('ignores malformed session storage', () => {
    sessionStorage.setItem('sgp_session_user', '{bad-json');

    const getAuth = renderAuthHook();

    expect(getAuth().usuario).toBeNull();
  });

  it('rejects an expired federated session and removes its bearer', () => {
    sessionStorage.setItem('sgp_session_user', JSON.stringify({ ...user, token: undefined, expiresAt: Date.now() - 1 }));
    sessionStorage.setItem('sgp_access_token', 'expired-token');

    const getAuth = renderAuthHook();

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
