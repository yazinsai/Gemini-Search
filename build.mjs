import * as esbuild from "esbuild";

await esbuild.build({
	entryPoints: ["server/index.ts"],
	bundle: true,
	platform: "node",
	format: "esm",
	outdir: "dist",
	external: [
		"express",
		"@google/generative-ai",
		"ws",
		"marked",
		"@babel/preset-typescript",
		"lightningcss",
	],
	target: "node18",
});
