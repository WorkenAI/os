export type Id = string;

export type NodeRef<TKind extends string = string> = {
	kind: TKind;
	id: Id;
};

export function makeId(parts: (string | number | undefined)[]): Id {
	return parts.filter((p) => p !== undefined && p !== "").join(".");
}

export function nodeRef<TKind extends string>(
	kind: TKind,
	id: Id,
): NodeRef<TKind> {
	return { kind, id };
}

export type RelationId = Id;
