import { expect, test } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("wishlist add → list → remove", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/producto/rosa-pastel-50cm")
	await page.getByRole("button", { name: /Agregar a la lista de deseos/i }).click()
	await expect(page.getByRole("button", { name: /Quitar de la lista de deseos/i })).toBeVisible()
	await page.goto("/cuenta/wishlist")
	await expect(page.getByText("Peluca Rosa Pastel 50cm")).toBeVisible()

	await page.goto("/producto/rosa-pastel-50cm")
	await page.getByRole("button", { name: /Quitar de la lista de deseos/i }).click()
	await expect(page.getByRole("button", { name: /Agregar a la lista de deseos/i })).toBeVisible()
	await page.goto("/cuenta/wishlist")
	await expect(page.getByText("Tu lista está vacía")).toBeVisible()
})

test("logged-out wishlist click redirects to login", async ({ page }) => {
	await page.goto("/producto/rosa-pastel-50cm")
	await page.getByRole("button", { name: /Agregar a la lista de deseos/i }).click()
	await expect(page).toHaveURL(/\/ingresar\?redirect=/)
})
