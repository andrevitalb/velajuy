import path from "node:path"
import dotenv from "dotenv"
import { defineConfig } from "vitest/config"

const loaded = dotenv.config({ path: ".env.local" }).parsed ?? {}

export default defineConfig({
	test: {
		environment: "jsdom",
		include: ["tests/unit/**/*.test.{ts,tsx}"],
		setupFiles: ["./tests/setup.ts"],
		env: loaded,
	},
	resolve: {
		alias: { "@": path.resolve(__dirname, "./src") },
	},
})
