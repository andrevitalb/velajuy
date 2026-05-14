import { expect, test } from "@playwright/test"

test("home renders brand mark", async ({ page }) => {
	await page.goto("/")
	await expect(page.getByRole("heading", { name: /Velajuy Pelucas/i })).toBeVisible()
})

test("storefront header links work", async ({ page }) => {
	await page.goto("/")
	await page.getByRole("link", { name: "Catálogo" }).click()
	await expect(page).toHaveURL(/\/catalogo$/)
})
