import "@testing-library/jest-dom"
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"
import "vitest"

declare module "vitest" {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface Assertion<T = unknown> extends TestingLibraryMatchers<T, void> {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
