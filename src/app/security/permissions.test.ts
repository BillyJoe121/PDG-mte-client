import { describe, expect, it } from 'vitest';
import type { UsuarioActual } from '../context/AuthContext';
import { canSeeDepartamento, hasPermission } from './permissions';

const baseUser: UsuarioActual = {
  id: 'U1',
  nombre: 'Usuario Base',
  correo: 'usuario@example.com',
  rol: 'manager',
  departamento: 'Ingenieria',
  iniciales: 'UB',
};

describe('permissions', () => {
  it('denies permissions when there is no active user', () => {
    expect(hasPermission(null, 'dashboard.view')).toBe(false);
  });

  it('allows every administrative action for admin', () => {
    expect(hasPermission({ ...baseUser, rol: 'admin' }, 'usuarios.manage')).toBe(true);
    expect(hasPermission({ ...baseUser, rol: 'admin' }, 'catalogos.manage')).toBe(true);
    expect(hasPermission({ ...baseUser, rol: 'admin' }, 'proyectos.manage')).toBe(true);
  });

  it('allows managers to manage strategy and projects without platform administration', () => {
    expect(hasPermission(baseUser, 'dashboard.view')).toBe(true);
    expect(hasPermission(baseUser, 'jerarquia.view')).toBe(true);
    expect(hasPermission(baseUser, 'okrs.manage')).toBe(true);
    expect(hasPermission(baseUser, 'reportes.view')).toBe(true);
    expect(hasPermission(baseUser, 'catalogos.manage')).toBe(false);
    expect(hasPermission(baseUser, 'proyectos.view')).toBe(true);
    expect(hasPermission(baseUser, 'proyectos.create')).toBe(true);
    expect(hasPermission(baseUser, 'usuarios.manage')).toBe(false);
  });

  it('limits contributors to consultation and project progress', () => {
    const contributor = { ...baseUser, rol: 'contributor' as const };

    expect(hasPermission(contributor, 'dashboard.view')).toBe(true);
    expect(hasPermission(contributor, 'proyectos.view')).toBe(true);
    expect(hasPermission(contributor, 'proyectos.progress')).toBe(true);
    expect(hasPermission(contributor, 'proyectos.create')).toBe(false);
    expect(hasPermission(contributor, 'proyectos.manage')).toBe(false);
    expect(hasPermission(contributor, 'proyectos.link')).toBe(false);
    expect(hasPermission(contributor, 'okrs.manage')).toBe(false);
  });

  it('uses backend capabilities when they are present', () => {
    const userWithCapabilities = {
      ...baseUser,
      rol: 'manager' as const,
      capabilities: ['USERS_MANAGE'],
    };

    expect(hasPermission(userWithCapabilities, 'usuarios.manage')).toBe(true);
    expect(hasPermission(userWithCapabilities, 'dashboard.view')).toBe(false);
  });

  it('accepts all-permissions capabilities from the backend', () => {
    expect(hasPermission({ ...baseUser, capabilities: ['ALL_PERMISSIONS'] }, 'auditoria.view')).toBe(true);
  });

  it('matches camelCase capabilities returned by auth/me', () => {
    expect(hasPermission({ ...baseUser, capabilities: ['viewDashboard'] }, 'dashboard.view')).toBe(true);
    expect(hasPermission({ ...baseUser, capabilities: ['manageCatalogs'] }, 'catalogos.manage')).toBe(true);
    expect(hasPermission({ ...baseUser, capabilities: ['registerProjectProgress'] }, 'proyectos.progress')).toBe(true);
    expect(hasPermission({ ...baseUser, capabilities: ['registerProjectProgress'] }, 'proyectos.create')).toBe(false);
  });

  it('does not apply legacy department restrictions to user', () => {
    expect(canSeeDepartamento(baseUser, 'Ingenieria')).toBe(true);
    expect(canSeeDepartamento(baseUser, 'Medicina')).toBe(true);
  });

  it('allows unrestricted department visibility when user or department is missing', () => {
    expect(canSeeDepartamento(null, 'Ingenieria')).toBe(true);
    expect(canSeeDepartamento(baseUser)).toBe(true);
  });

});
