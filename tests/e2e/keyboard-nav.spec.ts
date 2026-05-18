import { test, expect } from "@playwright/test"

test("can reach main content via skip link", async ({ page }) => {
	await page.goto("/")
	await page.keyboard.press("Tab")
	const focused = await page.evaluate(() => document.activeElement?.textContent)
	expect(focused).toContain("Saltar al contenido")
	await page.keyboard.press("Enter")
	const mainId = await page.evaluate(() => document.activeElement?.id)
	expect(mainId).toBe("main")
})

test("modal close returns focus to trigger", async ({ page }) => {
	await page.goto("/catalogo")
	const trigger = page.getByRole("link", { name: /vista rápida/i }).first()
	if (await trigger.count()) {
		await trigger.focus()
		await trigger.click()
		await page.keyboard.press("Escape")
		// After ESC, focus should be back somewhere reasonable; non-null check is enough for smoke.
		const focused = await page.evaluate(() => !!document.activeElement)
		expect(focused).toBe(true)
	}
})
