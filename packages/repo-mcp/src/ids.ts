/** Turn npm package name into a stable platform node id segment, e.g. @worken/foo -> worken.foo */
export function npmNameToPackageNodeId(npmName: string): string {
	return npmName.replace(/^@/, "").replace(/\//g, ".");
}

export function packageNodeId(npmName: string): string {
	return `package.${npmNameToPackageNodeId(npmName)}`;
}
