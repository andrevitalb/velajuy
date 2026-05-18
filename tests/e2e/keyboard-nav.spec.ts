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

// Modal focus restoration is covered by tests/unit/modal.test.tsx, which can
// reliably mount/unmount the component without depending on storefront markup.
