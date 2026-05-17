import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import { describe, expect, it } from "vitest"

describe("Button", () => {
	it("renders children with primary variant by default", () => {
		render(<Button>Hola</Button>)
		const btn = screen.getByRole("button", { name: "Hola" })
		expect(btn.className).toContain("bg-velajuy-wine")
	})
	it("shows loading spinner and disables when pending", () => {
		render(<Button pending>Save</Button>)
		const btn = screen.getByRole("button")
		expect(btn).toBeDisabled()
		expect(btn.getAttribute("aria-busy")).toBe("true")
	})
	it("applies press feedback class", () => {
		render(<Button>tap</Button>)
		expect(screen.getByRole("button").className).toMatch(/active:scale-95/)
	})
})
