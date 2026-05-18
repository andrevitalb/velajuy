import { render } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { Modal } from "@/components/ui/modal"

// next/navigation isn't available in jsdom; stub useRouter so Modal's fallback
// `router.back()` doesn't crash. Our tests pass an explicit onClose so the
// router fallback isn't exercised, but the hook still runs.
vi.mock("next/navigation", () => ({
	useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}))

// jsdom doesn't implement HTMLDialogElement.showModal — polyfill it minimally.
beforeAll(() => {
	if (!HTMLDialogElement.prototype.showModal) {
		HTMLDialogElement.prototype.showModal = function () {
			this.setAttribute("open", "")
		}
	}
	if (!HTMLDialogElement.prototype.close) {
		HTMLDialogElement.prototype.close = function () {
			this.removeAttribute("open")
		}
	}
})

describe("Modal", () => {
	it("restores focus to the previously focused element on unmount", () => {
		const trigger = document.createElement("button")
		trigger.textContent = "Open"
		document.body.appendChild(trigger)
		trigger.focus()
		expect(document.activeElement).toBe(trigger)

		const { unmount } = render(
			<Modal label="Test" onClose={() => {}}>
				<button type="button">Inside</button>
			</Modal>,
		)

		// Focus moved into the modal (first focusable).
		expect(document.activeElement).not.toBe(trigger)

		unmount()

		// On unmount focus is restored to the originally focused element.
		expect(document.activeElement).toBe(trigger)

		document.body.removeChild(trigger)
	})
})
