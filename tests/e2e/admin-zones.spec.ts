import { test, expect } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("owner sees seeded zones", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/admin/zonas")
	await expect(page.getByText("Bucaramanga", { exact: true })).toBeVisible({ timeout: 10_000 })
})
