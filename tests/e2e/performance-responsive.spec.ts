import { expect, test, type Page } from '@playwright/test';

const adminUser = {
  id: 'U10',
  nombre: 'Sistemas MTE',
  correo: 'mte-admin@icesi.edu.co',
  rol: 'admin',
  departamento: 'TI Institucional',
  iniciales: 'AD',
};

async function prepareDashboard(page: Page) {
  await page.addInitScript((user) => {
    window.sessionStorage.setItem('sgp_session_user', JSON.stringify(user));
  }, adminUser);

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const responses: Record<string, unknown> = {
      '/api/v1/academic-periods': [{ id: 1, name: '2026-1', startDate: '2026-01-01', endDate: '2026-06-30', status: 'ACTIVO' }],
      '/api/v1/dashboard/summary': { period: '2026-1', activeProjects: 3, completedProjects: 1, draftProjects: 0, suspendedProjects: 0, archivedProjects: 0, objectivesInFollowUp: 4, lowCompletionObjectives: 1, completedObjectives: 1, objectivesAbove50: 2, objectivesBetween0And50: 1, objectivesAtZero: 0, completedKeyResults: 2, inProgressKeyResults: 5, averageKeyResultCoverage: 60 },
      '/api/v1/dashboard/projects/by-status': [{ status: 'ACTIVO', count: 3 }, { status: 'FINALIZADO', count: 1 }],
      '/api/v1/dashboard/key-results/by-progress': [{ bucket: 'ON_TRACK', count: 4 }, { bucket: 'AT_RISK', count: 1 }],
      '/api/v1/dashboard/departments/summary': [{ departmentId: 1, departmentName: 'DCSI', activeProjects: 3, completedProjects: 1, objectives: 2, completedKeyResults: 1, inProgressKeyResults: 2, averageObjectiveCoverage: 55 }],
      '/api/v1/dashboard/strategic-bets/summary': [{ strategicBetId: 1, strategicBetName: 'Transformación', objectives: 2, completedObjectives: 1, objectivesAbove50: 1, objectivesBetween0And50: 0, objectivesAtZero: 0, keyResults: 3, completedProjects: 1, inProgressProjects: 2 }],
      '/api/v1/dashboard/goals/summary': [{ goalId: 1, goalName: 'Excelencia', objectives: 2, completedObjectives: 1, objectivesAbove50: 1, objectivesBetween0And50: 0, objectivesAtZero: 0, keyResults: 3, completedProjects: 1, inProgressProjects: 2 }],
      '/api/v1/objectives/cards': [{ id: 1, name: 'Objetivo', departmentId: 1, departmentName: 'DCSI', completionPercentage: 60, keyResults: [] }],
    };
    const body = responses[path];
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body ?? []) });
  });
}

test('mobile dashboard avoids horizontal overflow and defers heavy charts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await prepareDashboard(page);
  const chartRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('DashboardCoverageChart')) chartRequests.push(request.url());
  });

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /Dashboard de impacto/i })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(chartRequests).toHaveLength(0);

  await page.getByText('Cobertura por apuesta estrategica').scrollIntoViewIfNeeded();
  await expect.poll(() => chartRequests.length).toBeGreaterThan(0);
});
