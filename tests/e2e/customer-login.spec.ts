import { expect, test } from "@playwright/test"

test("customer login form posts and shows confirmation", async ({ page }) => {
	await page.goto("/ingresar")
	await page.getByPlaceholder("tu@correo.com").fill("test@example.com")
	await page.getByRole("button", { name: /Enviar enlace/i }).click()
	await expect(page.getByText(/Revisa tu correo/i)).toBeVisible({ timeout: 10_000 })
})
