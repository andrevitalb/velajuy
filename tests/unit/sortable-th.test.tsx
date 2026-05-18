import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SortableTh } from "@/components/admin/sortable-th"

const mockPush = vi.fn()
let currentParams = new URLSearchParams()

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
	useSearchParams: () => currentParams,
}))

function setParams(qs: string) {
	currentParams = new URLSearchParams(qs)
}

function renderTh(props: { field: string; label: string; defaultDir?: "asc" | "desc" }) {
	return render(
		<table>
			<thead>
				<tr>
					<SortableTh {...props} />
				</tr>
			</thead>
		</table>,
	)
}

describe("SortableTh", () => {
	it("renders aria-sort='none' when not the active sort field", () => {
		setParams("sort=other&dir=asc")
		renderTh({ field: "placedAt", label: "Fecha" })
		const th = screen.getByRole("columnheader")
		expect(th.getAttribute("aria-sort")).toBe("none")
	})

	it("renders descending when active and dir=desc", () => {
		setParams("sort=placedAt&dir=desc")
		renderTh({ field: "placedAt", label: "Fecha" })
		const th = screen.getByRole("columnheader")
		expect(th.getAttribute("aria-sort")).toBe("descending")
	})

	it("renders ascending when active and dir=asc", () => {
		setParams("sort=placedAt&dir=asc")
		renderTh({ field: "placedAt", label: "Fecha" })
		const th = screen.getByRole("columnheader")
		expect(th.getAttribute("aria-sort")).toBe("ascending")
	})

	it("defaults to 'descending' when active but dir param is missing (matches server)", () => {
		setParams("sort=placedAt")
		renderTh({ field: "placedAt", label: "Fecha" })
		const th = screen.getByRole("columnheader")
		// Server defaults to dir="desc" when none is provided; SortableTh must agree.
		expect(th.getAttribute("aria-sort")).toBe("descending")
	})

	it("first click on inactive header navigates with dir=asc and resets page", () => {
		setParams("page=5")
		mockPush.mockClear()
		renderTh({ field: "placedAt", label: "Fecha" })
		fireEvent.click(screen.getByRole("button", { name: /Fecha/i }))
		expect(mockPush).toHaveBeenCalledOnce()
		const arg = mockPush.mock.calls[0][0] as string
		expect(arg).toContain("sort=placedAt")
		expect(arg).toContain("dir=asc")
		expect(arg).not.toContain("page=")
	})
})
