import { test, expect } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("owner edits a CMS page", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/admin/paginas")
	await page.getByRole("link", { name: "Cuidado" }).click()
	// The body textarea follows the "Cuerpo (Markdown)" label span
	await page.locator("textarea").fill("Lava la peluca con cuidado.")
	await page.getByRole("button", { name: "Guardar" }).click()
	await expect(page).toHaveURL("/admin/paginas", { timeout: 10_000 })
})
