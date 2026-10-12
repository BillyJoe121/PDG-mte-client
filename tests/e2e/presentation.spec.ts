import { expect, test } from "@playwright/test";

const adminUser = {
  id: "U10",
  nombre: "Sistemas MTE",
  correo: "mte-admin@icesi.edu.co",
  rol: "admin",
  departamento: "TI Institucional",
  iniciales: "AD",
};

test("presentation renders options hub and supports general report, comparison and slide navigation", async ({ page }) => {
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

  // 1. Visit presentation hub
  await page.goto("/presentacion");

  // Verify Hub title and 2 primary options
  await expect(page.getByRole("heading", { name: /modo presentaci[oó]n estrat[eé]gica msp/i })).toBeVisible();
  await expect(page.getByText("Opción 1")).toBeVisible();
  await expect(page.getByText("Ver todas las metas y apuestas juntas")).toBeVisible();
  await expect(page.getByText("Opción 2")).toBeVisible();
  await expect(page.getByText("Comparar entidades estratégicas")).toBeVisible();

  // 2. Test Opción 1: Informe General
  await page.getByRole("button", { name: /explorar informe general/i }).click();
  await expect(page.getByRole("heading", { name: /todas las metas y apuestas en conjunto/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /exportar csv/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /exportar pdf/i }).first()).toBeVisible();

  // 3. Test Opción 2: Modo Comparar
  await page.getByRole("button", { name: /opci[oó]n 2: comparar/i }).first().click();
  await expect(page.getByRole("heading", { name: /comparativa de desempe[nñ]o estrat[eé]gico/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /exportar csv/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /imprimir \/ pdf/i }).first()).toBeVisible();

  // 4. Test Diapositivas
  await page.getByRole("button", { name: /diapositivas/i }).first().click();
  await expect(page.getByRole("heading", { name: "Seguimiento estratégico" })).toBeVisible();
  await expect(page.getByRole("button", { name: /exportar csv/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /imprimir \/ pdf/i }).first()).toBeVisible();
  await expect(page.getByText("1 / 2")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "Transformación educativa" })).toBeVisible();
  await expect(page.getByText("2 / 2")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progreso de la presentación" })).toHaveAttribute("aria-valuenow", "2");
});
