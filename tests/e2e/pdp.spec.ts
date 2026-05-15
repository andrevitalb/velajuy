import { expect, test } from "@playwright/test"

test("PDP renders gallery, info, tabs", async ({ page }) => {
	await page.goto("/producto/rosa-pastel-50cm")
	await expect(page.getByRole("heading", { name: "Peluca Rosa Pastel 50cm" })).toBeVisible()
	await expect(page.getByText("Disponible").first()).toBeVisible()
	await page.getByRole("button", { name: "Cuidado" }).click()
	await expect(page.getByText(/Lava la peluca/i)).toBeVisible()
	await page.getByRole("button", { name: "Devoluciones" }).click()
	await expect(page.getByText(/no se aceptan devoluciones|no aceptan devoluciones/i)).toBeVisible()
})

test("out-of-stock PDP shows back-in-stock form", async ({ page }) => {
	await page.goto("/producto/rubio-platino-100cm")
	await expect(page.getByText("Agotado").first()).toBeVisible()
	await expect(page.getByText(/Avísame cuando vuelva/i)).toBeVisible()
})

test("unknown slug renders 404", async ({ page }) => {
	const response = await page.goto("/producto/does-not-exist")
	expect(response?.status()).toBe(404)
})
