import { expect, test, type Page } from '@playwright/test';
import { skipGuidedTour } from './guidedTour';

const adminUser = {
  id: 'U10',
  nombre: 'Sistemas MTE',
  correo: 'mte-admin@icesi.edu.co',
  rol: 'admin',
  departamento: 'TI Institucional',
  iniciales: 'AD',
};

const standardUser = {
  id: 'U12',
  nombre: 'Leonardo Bustamante',
  correo: 'lbustamante@icesi.edu.co',
  rol: 'manager',
  departamento: 'DCSI',
  iniciales: 'LB',
};

async function seedSession(page: Page, user: typeof adminUser | typeof standardUser) {
  await skipGuidedTour(page, user.id);
  await page.addInitScript((sessionUser) => {
    window.sessionStorage.setItem('sgp_session_user', JSON.stringify(sessionUser));
  }, user);
}

test.describe('authentication and permissions', () => {
  test('happy path: signs in with email and password through the API', async ({ page }) => {
    await skipGuidedTour(page, '44');
    await page.route('**/api/v1/**', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await page.route('**/api/v1/auth/login', async (route) => {
      expect(route.request().headers().authorization).toBeUndefined();
      expect(route.request().postDataJSON()).toEqual({ email: 'joseph@icesi.edu.co', password: 'una-clave-larga' });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ accessToken: 'session-token', tokenType: 'bearer', expiresIn: 3600, expiresAt: 0 }) });
    });
    await page.route('**/api/v1/auth/me', async (route) => {
      expect(route.request().headers().authorization).toBe('Bearer session-token');
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
        user: { externalUserId: 44, username: 'joseph', email: 'joseph@icesi.edu.co', roles: ['MANAGER'], professorName: 'Joseph Velez', departmentName: 'DCSI' },
        capabilities: { viewDashboard: true },
      }) });
    });
    await page.goto('/login');
    await page.getByLabel('Correo institucional').fill('joseph@icesi.edu.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('una-clave-larga');
    await page.getByRole('button', { name: /Ingresar al MTE/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('sgp_access_token'))).toBe('session-token');
    await expect.poll(() => page.evaluate(() => JSON.parse(window.sessionStorage.getItem('sgp_session_user') ?? '{}').token)).toBeUndefined();
  });

  test('happy path: logout closes the API session and returns to login', async ({ page }) => {
    let logoutAuthorization: string | undefined;
    await page.addInitScript(() => window.sessionStorage.setItem('sgp_access_token', 'session-token'));
    await seedSession(page, adminUser);
    await page.route('**/api/v1/**', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await page.route('**/api/v1/auth/logout', (route) => {
      logoutAuthorization = route.request().headers().authorization;
      return route.fulfill({ status: 204 });
    });
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Cerrar sesión/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect.poll(() => logoutAuthorization).toBe('Bearer session-token');
    await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('sgp_access_token'))).toBeNull();
  });

  test('happy path: an access link sets the first password and leaves no token in the address', async ({ page }) => {
    await page.route('**/api/v1/auth/set-password', async (route) => {
      expect(route.request().postDataJSON()).toEqual({ tokenHash: 'abc_123-XYZ', type: 'invite', password: 'una-clave-larga' });
      await route.fulfill({ status: 204 });
    });
    await page.goto('/establecer-contrasena?token_hash=abc_123-XYZ&type=invite');
    await page.getByLabel('Nueva contraseña').fill('una-clave-larga');
    await page.getByLabel('Confirma la contraseña').fill('una-clave-larga');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();

    await expect(page.getByRole('heading', { name: 'Contraseña guardada' })).toBeVisible();
    await expect(page).toHaveURL(/\/establecer-contrasena$/);
  });

  test('sad path: an altered access link never reaches the API', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/v1/auth/set-password', (route) => { calls += 1; return route.abort(); });
    await page.goto('/establecer-contrasena?token_hash=abc%3Cscript%3E&type=invite');

    await expect(page.getByRole('heading', { name: 'Enlace incompleto' })).toBeVisible();
    expect(calls).toBe(0);
  });

  test('sad path: protected routes redirect anonymous users to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /Ingresar al MTE/i })).toBeVisible();
  });

  test('sad path: empty credentials show validation feedback', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Ingresar al MTE/i }).click();

    await expect(page.getByRole('alert')).toHaveText('Ingresa tu correo y tu contraseña.');
  });

  test('sad path: wrong credentials show the API message and open no session', async ({ page }) => {
    const message = 'No pudimos iniciar sesión con esos datos. Después de 5 intentos fallidos la cuenta se bloquea 15 minutos.';
    await page.route('**/api/v1/auth/login', (route) => route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'INVALID_LOGIN', message }),
    }));
    await page.goto('/login');
    await page.getByLabel('Correo institucional').fill('nadie@icesi.edu.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('clave-equivocada');
    await page.getByRole('button', { name: /Ingresar al MTE/i }).click();

    await expect(page.getByRole('alert')).toHaveText(message);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('sad path: user cannot open user administration', async ({ page }) => {
    await seedSession(page, standardUser);
    await page.goto('/usuarios');

    await expect(page.getByText(/Acceso restringido/i)).toBeVisible();
  });

  test('sad path: unknown routes fall back to the dashboard for signed-in users', async ({ page }) => {
    await seedSession(page, adminUser);
    await page.goto('/ruta-inexistente');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  });
});
