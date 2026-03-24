export interface WorkSession {
	id: string;
	actorId: string;
	roleIds: string[];
	currentTask?: string;
	currentIntent?: string;
	selectedArea?: string;
	semanticFocusIds?: string[];
	platformFocusIds?: string[];
	context?: Record<string, unknown>;
}

export function createSession(input: {
	id: string;
	actorId: string;
	roleIds?: string[];
}): WorkSession {
	return {
		id: input.id,
		actorId: input.actorId,
		roleIds: input.roleIds ?? [],
		semanticFocusIds: [],
		platformFocusIds: [],
		context: {},
	};
}
