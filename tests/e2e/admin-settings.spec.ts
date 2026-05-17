import { test, expect } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("owner toggles a notification", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/admin/configuracion")
	// The "Stock bajo" label wraps a checkbox — locate by the label text
	const stockLowLabel = page.locator("label").filter({ hasText: "Stock bajo" })
	const stockLowToggle = stockLowLabel.locator("input[type=checkbox]")
	// Ensure it's visible, then toggle it
	await expect(stockLowToggle).toBeVisible({ timeout: 10_000 })
	const wasChecked = await stockLowToggle.isChecked()
	if (wasChecked) {
		await stockLowToggle.uncheck()
	} else {
		await stockLowToggle.check()
	}
	await page.getByRole("button", { name: "Guardar configuración" }).click()
	await expect(page.getByText("Configuración guardada")).toBeVisible({ timeout: 10_000 })
})
