import { expect, test, type Page } from '@playwright/test';

const adminUser = {
  id: 'U10',
  nombre: 'Sistemas MTE',
  correo: 'mte-admin@icesi.edu.co',
  rol: 'administrador',
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
    await page.goto('/usuarios');

    await expect(page.getByText(/Total Usuarios/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Nuevo Usuario/i })).toBeVisible();
  });

  test('happy path: admin opens consistency dashboard', async ({ page }) => {
    await page.goto('/consistencia');

    await expect(page.getByText(/consistencia/i).first()).toBeVisible();
  });
});
