import { expect, test } from "@playwright/test"

test("guest subscribes to back-in-stock and sees confirmation", async ({ page }) => {
	await page.goto("/producto/rubio-platino-100cm")
	await page.getByPlaceholder("tu@correo.com").fill(`bis-${Date.now()}@example.com`)
	await page.getByRole("button", { name: /Avísame/i }).click()
	await expect(page.getByText(/Te enviaremos un correo/i)).toBeVisible()
})

test("unsubscribe page handles bad token gracefully", async ({ page }) => {
	await page.goto("/desuscribir/back-in-stock?token=nope")
	await expect(page.getByText(/No pudimos procesar/i)).toBeVisible()
})
