import { expect, test, type Page } from '@playwright/test';

const adminUser = {
  id: 'U10',
  nombre: 'Sistemas SGM',
  correo: 'sgm-admin@icesi.edu.co',
  rol: 'administrador',
  departamento: 'TI Institucional',
  iniciales: 'AD',
};

const tutorUser = {
  id: 'U12',
  nombre: 'Leonardo Bustamante',
  correo: 'lbustamante@icesi.edu.co',
  rol: 'tutor',
  departamento: 'DCSI',
  iniciales: 'LB',
};

async function seedSession(page: Page, user: typeof adminUser | typeof tutorUser) {
  await page.addInitScript((sessionUser) => {
    window.sessionStorage.setItem('sgp_session_user', JSON.stringify(sessionUser));
  }, user);
}

test.describe('authentication and permissions', () => {
  test('happy path: admin can sign in manually and open the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('sgm-admin@icesi.edu.co');
    await page.locator('input[type="password"]').fill('demo1234');
    await page.getByRole('button', { name: /Ingresar al SGP/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Dashboard de impacto/i })).toBeVisible();
  });

  test('sad path: protected routes redirect anonymous users to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /Ingresar al SGP/i })).toBeVisible();
  });

  test('sad path: empty credentials show validation feedback', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Ingresar al SGP/i }).click();

    await expect(page.getByText(/Por favor/i)).toBeVisible();
  });

  test('sad path: wrong credentials are rejected', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('nadie@icesi.edu.co');
    await page.locator('input[type="password"]').fill('demo1234');
    await page.getByRole('button', { name: /Ingresar al SGP/i }).click();

    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible();
  });

  test('sad path: tutor cannot open user administration', async ({ page }) => {
    await seedSession(page, tutorUser);
    await page.goto('/usuarios');

    await expect(page.getByText(/Acceso restringido/i)).toBeVisible();
  });

  test('sad path: unknown routes fall back to the dashboard for signed-in users', async ({ page }) => {
    await seedSession(page, adminUser);
    await page.goto('/ruta-inexistente');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Dashboard de impacto/i })).toBeVisible();
  });
});
