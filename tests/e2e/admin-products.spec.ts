import { test, expect } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("owner creates a draft product", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/admin/productos/nuevo")
	const slug = `peluca-test-${Date.now()}`
	await page.getByLabel("Nombre").fill("Peluca Test E2E")
	await page.getByLabel("Slug").fill(slug)
	await page.getByLabel("Precio (pesos COP, sin decimales)").fill("100000")
	await page.getByRole("button", { name: "Guardar" }).click()
	await expect(page).toHaveURL(/\/admin\/productos\/[0-9a-f-]+/, { timeout: 10_000 })
})
