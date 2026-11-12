import { expect, test } from "@playwright/test";
import { skipGuidedTour } from "./guidedTour";

const adminUser = {
  id: "U10",
  nombre: "Sistemas MTE",
  correo: "mte-admin@icesi.edu.co",
  rol: "admin",
  departamento: "TI Institucional",
  iniciales: "AD",
};

test("presentation supports general report, comparison and slide navigation", async ({ page }) => {
  await skipGuidedTour(page, adminUser.id);
  await page.addInitScript((user) => {
    window.sessionStorage.setItem("sgp_session_user", JSON.stringify(user));
  }, adminUser);

  await page.route("**/api/v1/academic-periods", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify([{ id: 1, name: "2026-1", status: "ACTIVO", startDate: "2026-01-01", endDate: "2026-06-30" }]),
  }));
  await page.route("**/api/v1/presentation*", (route) => route.fulfill({
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

  // 1. The general report opens first
  await page.goto("/presentacion");
  const modes = page.getByRole("navigation", { name: "Modos de presentación" });
  await expect(modes.getByRole("button", { name: "Informe" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeVisible();
  await page.getByRole("button", { name: "Exportar" }).click();
  await expect(page.getByRole("menuitem", { name: "PDF del informe" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "CSV del informe" })).toBeVisible();
  await page.keyboard.press("Escape");

  // 2. Comparison mode
  await modes.getByRole("button", { name: "Comparar" }).click();
  await expect(page.getByRole("heading", { name: "Comparativa de registros" })).toBeVisible();
  await page.getByRole("button", { name: "Exportar" }).click();
  await expect(page.getByRole("menuitem", { name: "PDF de la comparativa" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "CSV de la comparativa" })).toBeVisible();
  await page.keyboard.press("Escape");

  // 3. Slides
  await modes.getByRole("button", { name: "Presentar" }).click();
  await page.getByRole("button", { name: "Exportar" }).click();
  await expect(page.getByRole("menuitem", { name: "PDF de la diapositiva actual" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "CSV de las diapositivas" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Cover, then the consolidated report slide, then the slides returned by the API
  await expect(page.getByText("1 / 3")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("2 / 3")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Transformación educativa" })).toBeVisible();
  await expect(page.getByText("3 / 3")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progreso de la presentación" })).toHaveAttribute("aria-valuenow", "3");
});
