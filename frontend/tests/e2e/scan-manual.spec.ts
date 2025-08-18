// PATH: frontend/tests/e2e/scan-manual.spec.ts
import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

test("Flow manuel: Scan -> Analyse -> Résultat", async ({ page }) => {
  const payload = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "tests/fixtures/analysis.sample.json"), "utf-8")
  );

  await page.route("**/api/analysis/manual", async (route) => {
    const req = route.request();
    const body = await req.postDataJSON();
    expect(body.name).toBeTruthy();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });

  await page.goto("/scan");
  await page.getByRole("button", { name: "Saisie manuelle" }).click();

  await page.getByLabel("Nom du produit").fill("Yaourt nature");
  await page.getByLabel("Catégorie").selectOption("food");
  await page.getByLabel("Ingrédients (séparés par virgules)").fill("lait, ferments lactiques");
  await page.getByRole("button", { name: "Analyser" }).click();

  await expect(page).toHaveURL(/.*result/);
  await expect(page.getByRole("heading", { name: "Yaourt nature" })).toBeVisible();
  await expect(page.getByText("Nutri-Score")).toBeVisible();
  await expect(page.getByText("NOVA")).toBeVisible();
  await expect(page.getByText("Eco-Score")).toBeVisible();
});
