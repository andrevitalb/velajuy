import { test, expect } from "@playwright/test"

test("customer ingresar honors redirect param", async ({ page }) => {
	await page.goto("/ingresar?redirect=%2Fcuenta%2Fwishlist")
	await expect(page.getByText("Te enviamos un enlace mágico")).toBeVisible()
	// The hidden input drives signIn.magicLink callbackURL
	const callback = await page.locator('input[name="callbackURL"]').inputValue()
	expect(callback).toBe("/cuenta/wishlist")
})

test("ingresar rejects unsafe redirects", async ({ page }) => {
	await page.goto("/ingresar?redirect=https%3A%2F%2Fevil.com")
	const callback = await page.locator('input[name="callbackURL"]').inputValue()
	expect(callback).toBe("/cuenta")
})

test("admin ingresar honors redirect param", async ({ page }) => {
	await page.goto("/admin/ingresar?redirect=%2Fadmin%2Fpedidos")
	const callback = await page.locator('input[name="callbackURL"]').inputValue()
	expect(callback).toBe("/admin/pedidos")
})
