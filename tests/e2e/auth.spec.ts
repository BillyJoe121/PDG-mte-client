import { expect, test, type Page } from '@playwright/test';

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
  await page.addInitScript((sessionUser) => {
    window.sessionStorage.setItem('sgp_session_user', JSON.stringify(sessionUser));
  }, user);
}

test.describe('authentication and permissions', () => {
  test('happy path: completes a PKCE callback and validates the bearer with the backend', async ({ page }) => {
    const verifier = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';
    await page.addInitScript(({ codeVerifier }) => {
      window.sessionStorage.setItem('mte_sso_transaction', JSON.stringify({
        state: 'expected-state',
        codeVerifier,
        returnTo: '/dashboard',
        startedAt: Date.now(),
      }));
    }, { codeVerifier: verifier });
    await page.route('**/api/v1/**', (route) => route.fulfill({ contentType: 'application/json', body: '[]' }));
    await page.route('**/api/v1/auth/sso/exchange', async (route) => {
      expect(route.request().postDataJSON()).toEqual({ code: 'single-use-code', codeVerifier: verifier });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ accessToken: 'institutional-token', tokenType: 'Bearer', expiresIn: 3600 }) });
    });
    await page.route('**/api/v1/auth/me', async (route) => {
      expect(route.request().headers().authorization).toBe('Bearer institutional-token');
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
        user: { externalUserId: 44, username: 'joseph', email: 'joseph@icesi.edu.co', roles: ['MANAGER'], professorName: 'Joseph Velez', departmentName: 'DCSI' },
        capabilities: { viewDashboard: true },
      }) });
    });
    await page.goto('/auth/callback?code=single-use-code&state=expected-state');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Dashboard de impacto/i })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.sessionStorage.getItem('sgp_access_token'))).toBe('institutional-token');
    await expect.poll(() => page.evaluate(() => JSON.parse(window.sessionStorage.getItem('sgp_session_user') ?? '{}').token)).toBeUndefined();
  });

  test('sad path: rejects a callback with a mismatched state before token exchange', async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem('mte_sso_transaction', JSON.stringify({
        state: 'expected-state',
        codeVerifier: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~',
        returnTo: '/dashboard',
        startedAt: Date.now(),
      }));
    });
    let exchangeCalls = 0;
    await page.route('**/api/v1/auth/sso/exchange', (route) => { exchangeCalls += 1; return route.abort(); });

    await page.goto('/auth/callback?code=single-use-code&state=attacker-state');

    await expect(page.getByRole('alert')).toContainText(/no coincide/i);
    expect(exchangeCalls).toBe(0);
  });

  test('happy path: admin can sign in manually and open the dashboard', async ({ page }) => {
    await page.route('**/api/v1/auth/me', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          externalUserId: 10,
          username: 'demo.profesor',
          email: 'demo.profesor@icesi.edu.co',
          roles: ['ADMIN'],
          professorName: 'Profesor Demo',
          departmentName: 'DCSI',
        },
        capabilities: { viewDashboard: true, manageCatalogs: true },
      }),
    }));
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('demo.profesor@icesi.edu.co');
    await page.locator('input[type="password"]').fill('demo1234');
    await page.getByRole('button', { name: /Ingresar al MTE/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Dashboard de impacto/i })).toBeVisible();
  });

  test('sad path: protected routes redirect anonymous users to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /Ingresar al MTE/i })).toBeVisible();
  });

  test('sad path: empty credentials show validation feedback', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Ingresar al MTE/i }).click();

    await expect(page.getByText(/Por favor/i)).toBeVisible();
  });

  test('sad path: wrong credentials are rejected', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('nadie@icesi.edu.co');
    await page.locator('input[type="password"]').fill('demo1234');
    await page.getByRole('button', { name: /Ingresar al MTE/i }).click();

    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible();
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
    await expect(page.getByRole('heading', { name: /Dashboard de impacto/i })).toBeVisible();
  });
});
