import type { NextConfig } from "next"

const config: NextConfig = {
	experimental: {
		typedRoutes: true,
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
			{ protocol: "https", hostname: "*.r2.dev" },
		],
	},
}

export default config
