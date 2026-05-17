import type { NextConfig } from "next"

const config: NextConfig = {
	typedRoutes: true,
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
			{ protocol: "https", hostname: "*.r2.dev" },
			{ protocol: "https", hostname: "cdn.velajuy.com" },
		],
	},
}

export default config
