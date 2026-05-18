import { test, expect } from "@playwright/test"

test.describe("Reduced motion", () => {
	test("forces near-instant transitions", async ({ browser }) => {
		const ctx = await browser.newContext({ reducedMotion: "reduce" })
		const page = await ctx.newPage()
		await page.goto("/catalogo")
		const card = page.locator("article").first()
		await card.waitFor({ state: "visible" })
		const durationMs = await card.evaluate((el) => {
			const raw = getComputedStyle(el).animationDuration
			// Chromium reports the global reduced-motion override as "1e-06s";
			// other engines may report "0.001ms" or "0s". Normalize to ms.
			if (raw.endsWith("ms")) return parseFloat(raw)
			if (raw.endsWith("s")) return parseFloat(raw) * 1000
			return Number.POSITIVE_INFINITY
		})
		// Anything under 1ms confirms the prefers-reduced-motion rule kicked in.
		expect(durationMs).toBeLessThan(1)
		await ctx.close()
	})
})
