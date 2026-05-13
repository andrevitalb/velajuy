import path from "node:path"
import dotenv from "dotenv"
import { defineConfig } from "vitest/config"

const loaded = dotenv.config({ path: ".env.development" }).parsed ?? {}

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/unit/**/*.test.ts"],
		env: loaded,
	},
	resolve: {
		alias: { "@": path.resolve(__dirname, "./src") },
	},
})
