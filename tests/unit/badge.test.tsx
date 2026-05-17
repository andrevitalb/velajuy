import { render, screen } from "@testing-library/react"
import { Badge } from "@/components/ui/badge"
import { describe, expect, it } from "vitest"

describe("Badge", () => {
	it("renders icon + label so meaning is not color-only", () => {
		render(<Badge tone="warning">Últimas 2</Badge>)
		expect(screen.getByText("Últimas 2")).toBeTruthy()
		expect(screen.getByLabelText("warning")).toBeTruthy()
	})
	it("supports an explicit aria-label override", () => {
		render(<Badge tone="danger" srLabel="Agotado">Agotado</Badge>)
		expect(screen.getByLabelText("Agotado")).toBeTruthy()
	})
})
