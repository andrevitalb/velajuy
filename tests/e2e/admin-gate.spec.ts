import { expect, test } from "@playwright/test"

test("unauth visit to /admin redirects to /admin/ingresar", async ({ page }) => {
	await page.goto("/admin")
	await expect(page).toHaveURL(/\/admin\/ingresar/)
	await expect(page.getByRole("heading", { name: /Ingresar al Admin/i })).toBeVisible()
})
