import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const routes = ["/", "/catalogo", "/ingresar"]

for (const path of routes) {
	test(`a11y: ${path} has no serious violations`, async ({ page }) => {
		await page.goto(path)
		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze()
		const serious = results.violations.filter(
			(v) => v.impact === "serious" || v.impact === "critical",
		)
		expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
	})
}
