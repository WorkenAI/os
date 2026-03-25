import path from "node:path";
import { REGISTERED_SHELL_DOMAIN_IDS } from "@worken/demo-data/shell-catalog";
import { withWorkflow } from "@workflow/next";
import type { NextConfig } from "next";

const config: NextConfig = {
	reactStrictMode: true,
	output: "standalone",
	turbopack: {
		root: path.resolve(__dirname, "../.."),
	},
	async redirects() {
		return [
			{ source: "/view/:path*", destination: "/shell/:path*", permanent: true },
			{
				source: "/surface/:path*",
				destination: "/shell/:path*",
				permanent: true,
			},
			...REGISTERED_SHELL_DOMAIN_IDS.map((id) => ({
				source: `/${id}`,
				destination: `/shell/${encodeURIComponent(id)}`,
				permanent: true,
			})),
		];
	},
};

export default withWorkflow(config);
