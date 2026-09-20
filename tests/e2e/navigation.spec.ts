import { expect, test, type Page } from '@playwright/test';

const adminUser = {
  id: 'U10',
  nombre: 'Sistemas MTE',
  correo: 'mte-admin@icesi.edu.co',
  rol: 'admin',
  departamento: 'TI Institucional',
  iniciales: 'AD',
};

async function loginAsAdmin(page: Page) {
  await page.addInitScript((user) => {
    window.sessionStorage.setItem('sgp_session_user', JSON.stringify(user));
  }, adminUser);
}

test.describe('admin navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('happy path: admin opens user management', async ({ page }) => {
    await page.route('**/api/v1/directory-users**', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{ id: 10, name: 'Sistemas MTE', email: 'mte-admin@icesi.edu.co', departmentId: 1, departmentName: 'TI Institucional', accessRole: 'ADMIN', active: true, lastAccessAt: null }]),
    }));
    await page.route('**/api/v1/departments**', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'TI Institucional', description: 'Tecnología', schoolId: 1, schoolName: 'Escuela TDI' }]),
    }));
    await page.route('**/api/v1/schools**', (route) => route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, name: 'Escuela TDI' }]),
    }));
    await page.goto('/usuarios');

    await expect(page.getByRole('heading', { name: /Usuarios, departamentos y responsables/i })).toBeVisible();
    await expect(page.getByText('Sistemas MTE')).toBeVisible();
    await expect(page.getByRole('button', { name: /Nuevo Usuario/i })).toBeVisible();
  });

  test('happy path: admin opens consistency dashboard', async ({ page }) => {
    await page.goto('/consistencia');

    await expect(page.getByText(/consistencia/i).first()).toBeVisible();
  });

  test('happy path: admin reviews a persisted audit event and its snapshots', async ({ page }) => {
    await page.route('**/api/v1/audit-logs**', async (route) => {
      const isSummary = new URL(route.request().url()).pathname.endsWith('/summary');
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(isSummary ? {
          totalEvents: 1,
          byAction: [{ key: 'UPDATE', count: 1 }],
          byEntityType: [{ key: 'OBJECTIVE', count: 1 }],
          byActor: [{ key: 'admin', count: 1 }],
          trend: [{ date: '2026-09-01', count: 1 }],
        } : [{
          id: 31,
          action: 'UPDATE',
          entityType: 'OBJECTIVE',
          entityId: '12',
          summary: 'Objetivo actualizado',
          actorUsername: 'admin',
          actorRoles: 'ADMIN',
          beforeSnapshot: '{"name":"Objetivo anterior"}',
          afterSnapshot: '{"name":"Objetivo vigente"}',
          createdAt: '2026-09-01T14:00:00Z',
        }]),
      });
    });

    await page.goto('/auditoria');
    await expect(page.getByRole('heading', { name: /Log de auditoría y tendencias/i })).toBeVisible();
    await page.getByRole('button', { name: /Ver detalle de Objetivo actualizado/i }).click();
    await expect(page.getByRole('dialog', { name: /Detalle del evento/i })).toContainText('Objetivo vigente');
  });
});
