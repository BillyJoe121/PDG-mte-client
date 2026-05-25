import { describe, expect, it } from 'vitest';
import type { UsuarioActual } from '../context/AuthContext';
import { canSeeDepartamento, hasPermission } from './permissions';

const baseUser: UsuarioActual = {
  id: 'U1',
  nombre: 'Usuario Base',
  correo: 'usuario@example.com',
  rol: 'jefe',
  departamento: 'Ingenieria',
  iniciales: 'UB',
};

describe('permissions', () => {
  it('denies permissions when there is no active user', () => {
    expect(hasPermission(null, 'dashboard.view')).toBe(false);
  });

  it('allows administrator-only actions for administrators', () => {
    expect(hasPermission({ ...baseUser, rol: 'administrador' }, 'usuarios.manage')).toBe(true);
  });

  it('uses backend capabilities when they are present', () => {
    const userWithCapabilities = {
      ...baseUser,
      rol: 'tutor' as const,
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
  });

  it('limits department visibility for department heads', () => {
    expect(canSeeDepartamento(baseUser, 'Ingenieria')).toBe(true);
    expect(canSeeDepartamento(baseUser, 'Medicina')).toBe(false);
  });

  it('allows directors to see every department', () => {
    expect(canSeeDepartamento({ ...baseUser, rol: 'director' }, 'Medicina')).toBe(true);
  });

  it('allows unrestricted department visibility when user or department is missing', () => {
    expect(canSeeDepartamento(null, 'Ingenieria')).toBe(true);
    expect(canSeeDepartamento(baseUser)).toBe(true);
  });

  it('allows tutors to see departments through the default branch', () => {
    expect(canSeeDepartamento({ ...baseUser, rol: 'tutor' }, 'Medicina')).toBe(true);
  });
});
