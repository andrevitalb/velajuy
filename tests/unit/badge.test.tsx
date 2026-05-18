import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"
import { describe, expect, it } from "vitest"

describe("Badge", () => {
	it("renders text content without leaking decorative icon labels to AT", () => {
		render(<Badge tone="warning">Últimas 2</Badge>)
		expect(screen.getByText("Últimas 2")).toBeTruthy()
		expect(screen.queryByLabelText("warning")).toBeNull()
	})
	it("exposes an sr-only label when srLabel is provided", () => {
		const { container } = render(
			<Badge tone="danger" srLabel="Sin stock">
				Agotado
			</Badge>,
		)
		expect(screen.getByText("Agotado")).toBeTruthy()
		const srOnly = container.querySelector(".sr-only")
		expect(srOnly).not.toBeNull()
		expect(srOnly?.textContent).toBe("Sin stock")
	})
})
