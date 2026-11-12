import type { Page } from '@playwright/test';

/**
 * Marks the guided tour as finished for these users, so its first-visit overlay does not cover the
 * screens under test. The tour has its own unit tests.
 */
export async function skipGuidedTour(page: Page, ...userIds: string[]) {
  await page.addInitScript((ids) => {
    for (const id of ids) window.localStorage.setItem(`mte.tutorial.completed.${id}`, '1');
  }, userIds);
}
