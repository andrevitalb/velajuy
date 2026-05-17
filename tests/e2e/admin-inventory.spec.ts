import { test, expect } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("owner adjusts stock", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/admin/inventario")
	const firstRow = page.locator("tbody tr").first()
	await expect(firstRow).toBeVisible({ timeout: 10_000 })
	await firstRow.locator("input[type=number]").fill("5")
	await firstRow.getByRole("button", { name: "Aplicar" }).click()
	await expect(page.getByText("Stock actualizado")).toBeVisible({ timeout: 10_000 })
})
