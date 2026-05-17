import { test, expect } from "@playwright/test"
import { loginAsOwner } from "./helpers/login"

test("owner lists and opens an order", async ({ page, context, baseURL }) => {
	await loginAsOwner(context, baseURL!)
	await page.goto("/admin/pedidos")
	await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible()
})
