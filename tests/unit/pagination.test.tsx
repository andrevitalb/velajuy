import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Pagination } from "@/components/admin/pagination"

const mockPush = vi.fn()
let currentParams = new URLSearchParams()

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => currentParams,
}))

function setParams(qs: string) {
	currentParams = new URLSearchParams(qs)
}

describe("Pagination", () => {
	it("returns null when total fits in a single page", () => {
		setParams("")
		const { container } = render(<Pagination total={10} perPage={20} />)
		expect(container.firstChild).toBeNull()
	})

	it("shows correct range and only 'Siguiente' on first page", () => {
		setParams("")
		render(<Pagination total={45} perPage={20} />)
		expect(screen.getByText(/Mostrando 1.+20 de 45/)).toBeTruthy()
		expect(screen.queryByRole("button", { name: "Anterior" })).toBeNull()
		expect(screen.getByRole("button", { name: "Siguiente" })).toBeTruthy()
	})

	it("shows correct range and only 'Anterior' on last page", () => {
		setParams("page=3")
		render(<Pagination total={45} perPage={20} />)
		// page 3, last page = 3, from = 41, to = 45.
		expect(screen.getByText(/Mostrando 41.+45 de 45/)).toBeTruthy()
		expect(screen.getByRole("button", { name: "Anterior" })).toBeTruthy()
		expect(screen.queryByRole("button", { name: "Siguiente" })).toBeNull()
	})

	it("clamps a page above lastPage so the range stays valid", () => {
		setParams("page=99")
		render(<Pagination total={45} perPage={20} />)
		// Clamped to page 3 (lastPage) — range should be 41–45, not e.g. 1961–40.
		expect(screen.getByText(/Mostrando 41.+45 de 45/)).toBeTruthy()
	})
})
