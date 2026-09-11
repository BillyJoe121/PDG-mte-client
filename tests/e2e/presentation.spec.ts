import { expect, test } from "@playwright/test";

const adminUser = {
  id: "U10",
  nombre: "Sistemas MTE",
  correo: "mte-admin@icesi.edu.co",
  rol: "admin",
  departamento: "TI Institucional",
  iniciales: "AD",
};

test("presentation renders API slides and supports keyboard navigation", async ({ page }) => {
  await page.addInitScript((user) => {
    window.sessionStorage.setItem("sgp_session_user", JSON.stringify(user));
  }, adminUser);

  await page.route("**/academic-periods", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" }]),
  }));
  await page.route("**/presentation*", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      period: "2026-1",
      title: "Modo presentación MTE",
      controls: {
        fullscreenEnabled: true,
        keyboardNavigationEnabled: true,
        nextKeys: ["ArrowRight", "Space"],
        previousKeys: ["ArrowLeft"],
        exitKeys: ["Escape"],
      },
      slides: [
        { order: 1, type: "COVER", title: "Seguimiento estratégico", subtitle: "Periodo 2026-1", content: { completedObjectives: 4, inProgressObjectives: 2 } },
        { order: 2, type: "STRATEGIC_BET", title: "Transformación educativa", subtitle: "Apuesta institucional", content: { executionSummary: { completedKeyResults: 3, inProgressKeyResults: 2 } } },
      ],
    }),
  }));

  await page.goto("/presentacion");

  await expect(page.getByRole("heading", { name: "Seguimiento estratégico" })).toBeVisible();
  await expect(page.getByText("1 / 2")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Transformación educativa" })).toBeVisible();
  await expect(page.getByText("2 / 2")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progreso de la presentación" })).toHaveAttribute("aria-valuenow", "2");
});
