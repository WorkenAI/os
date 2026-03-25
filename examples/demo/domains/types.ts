import type { ActionCardAuthoring } from "./semantic/action-card";

export type DomainAccent = {
	color: string;
	gradient: string;
};

export type DomainEntityActionId = string;
export type DomainEntityId = string;
export type DomainVerbId = string;
export type DomainViewId = string;
export type DomainSurfaceId = string;

export type DomainEntityDefinition = {
	id: DomainEntityId;
	label: string;
	pluralLabel: string;
	actions: DomainEntityActionId[];
	inspector?: {
		enabled: boolean;
	};
};

export type DomainVerbDefinition = {
	id: DomainVerbId;
	label: string;
	scope: "domain" | "entity";
	entityIds?: DomainEntityId[];
};

export type DomainShellSurfaceLayoutId =
	| "default"
	| "role-manager"
	| "developer-studio"
	| "agent-manager"
	| "crm-manager";

export type DomainConversationFooterDefinition = {
	disclaimer?: string;
	hint?: string;
};

export type DomainLocalAssistantDefinition = {
	introTemplate?: string;
	capabilities?: string;
};

export type DomainExecutionDefinition = {
	signalType: string;
	autoStart?: boolean;
	policyId?: string;
};

export type DomainShellSurfaceDefinition = {
	layoutId?: DomainShellSurfaceLayoutId;
	conversation?: DomainConversationFooterDefinition;
	localAssistant?: DomainLocalAssistantDefinition;
};

export type DomainViewDefinition = {
	id: DomainViewId;
	title: string;
	kind:
		| "dashboard"
		| "table"
		| "board"
		| "analytics"
		| "list"
		| "detail"
		| "local";
	entityId?: DomainEntityId;
	specId?: string;
	shell?: DomainShellSurfaceDefinition;
	execution?: DomainExecutionDefinition;
};

export type SidebarAction = {
	id: string;
	label: string;
	icon: string;
	verbId: DomainVerbId;
	entityId?: DomainEntityId;
};

export type SidebarNavItem = {
	id: DomainSurfaceId;
	label: string;
	icon: string;
	viewId: DomainViewId;
};

export type SidebarConfig = {
	actions: SidebarAction[];
	navigation: SidebarNavItem[];
};

export type DomainLandingLayerId = "roles" | "business";

/** Lucide icon id for shell UI — resolved in `shell/icons/role-icon-registry`. */
export type ShellIconKey =
	| "shield"
	| "code"
	| "users"
	| "briefcase"
	| "megaphone"
	| "wallet"
	| "eye"
	| "puzzle";

export type LandingFlowPoint = { x: number; y: number; s: number };

export type DomainLandingRoleCard = {
	caption: string;
	label: string;
	position: string;
	background: string;
};

export type DomainLandingBusinessCard = {
	label: string;
	position: string;
	background: string;
};

/** Landing 3D preview: roles-layer cards and/or business-layer path + cards (declared per domain). */
export type DomainLandingSceneConfig = {
	flowWaypoints?: {
		spawn: LandingFlowPoint;
		descend: LandingFlowPoint;
		center: LandingFlowPoint;
		midway: LandingFlowPoint;
		department: LandingFlowPoint;
	};
	roleCard?: DomainLandingRoleCard;
	businessCard?: DomainLandingBusinessCard;
};

export type DomainDefinition = {
	id: string;
	title: string;
	icon: string;
	accent: DomainAccent;
	/** Lucide icon for dock / RoleIcon when `roleId` is this domain’s id. */
	shellIconKey: ShellIconKey;
	/** Landing page dock layer (roles vs business); drives dock grouping without heuristics. */
	landingLayer: DomainLandingLayerId;
	/**
	 * Landing preview: `roleCard` for `landingLayer === 'roles'`;
	 * `flowWaypoints` + `businessCard` for `landingLayer === 'business'`.
	 */
	landingScene?: DomainLandingSceneConfig;
	entities: Record<DomainEntityId, DomainEntityDefinition>;
	verbs: Record<DomainVerbId, DomainVerbDefinition>;
	views: Record<DomainViewId, DomainViewDefinition>;
	surfaces: {
		defaultViewId: DomainViewId;
		localOnlyViewIds: DomainViewId[];
		actions: SidebarAction[];
		navigation: SidebarNavItem[];
	};
	specs: Partial<Record<DomainViewId, unknown>>;
	/**
	 * Optional Semantic Protocol action cards (`docs/spec/semantic-protocol.md`).
	 * Use {@link validateDomainActionCards} after `defineDomain` when this is set.
	 */
	actionCards?: readonly ActionCardAuthoring[];
};
