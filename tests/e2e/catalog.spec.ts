import { expect, test } from "@playwright/test"

test("PLP lists seeded products", async ({ page }) => {
	await page.goto("/catalogo")
	await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible()
	await expect(page.getByText("Peluca Rosa Pastel 50cm")).toBeVisible()
	await expect(page.getByText("Peluca Bob Negro")).toBeVisible()
})

test("PLP filter by color narrows the grid", async ({ page }) => {
	await page.goto("/catalogo")
	await page.getByLabel(/Rosa pastel/i).check()
	await page.getByRole("button", { name: "Aplicar" }).click()
	await expect(page).toHaveURL(/color=rosa-pastel/)
	await expect(page.getByText("Peluca Rosa Pastel 50cm")).toBeVisible()
	await expect(page.getByText("Peluca Bob Negro")).toHaveCount(0)
})

test("PLP sort by price ascending", async ({ page }) => {
	await page.goto("/catalogo")
	await page.getByLabel("Ordenar:").selectOption("precio-asc")
	await expect(page).toHaveURL(/sort=precio-asc/)
	const firstCard = page.locator("article").first()
	await expect(firstCard).toContainText("Peluca Bob Negro")
})

test("PLP click navigates to PDP", async ({ page }) => {
	await page.goto("/catalogo")
	await page.getByText("Peluca Rosa Pastel 50cm").first().click()
	await expect(page).toHaveURL(/\/producto\/rosa-pastel-50cm/)
})
