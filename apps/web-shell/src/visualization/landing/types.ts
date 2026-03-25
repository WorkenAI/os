import type { ShellDomainId } from "@worken/demo-data/shell-catalog";
import type { ComponentType, CSSProperties } from "react";

export type LandingSceneDomainId = ShellDomainId;
export type LandingSceneLayerId = "roles" | "business";
export type LandingMotionPreset =
	| "shell-open"
	| "shell-closed"
	| "shell-reopening";
export type LandingSceneWindowStyle = Pick<
	CSSProperties,
	| "contain"
	| "filter"
	| "perspective"
	| "transform"
	| "transformOrigin"
	| "transition"
>;
export type LandingShellPreviewStyle = Pick<
	CSSProperties,
	"height" | "opacity" | "pointerEvents" | "transform" | "transition"
>;

export type LandingSceneTrafficPacket = {
	id: string;
	label: string;
	route: string;
	delayMs: number;
	accent: string;
};

export type LandingDeliveryItem = {
	id: string;
	label: string;
	entityType: string;
	entityId: string;
};

export type LandingDeliveryPhase =
	| "idle"
	| "fetching"
	| "delivering"
	| "scored";

export type LandingDelivery = {
	domainId: LandingSceneDomainId;
	item: LandingDeliveryItem;
	phase: LandingDeliveryPhase;
	animKey: number;
	route: string;
	accent: string;
	scoreLabel: string;
};

export type LandingSceneTraffic = {
	rolePackets: LandingSceneTrafficPacket[];
};

export type LandingSceneProps = {
	activeDomainId?: LandingSceneDomainId;
	activeLayerId?: LandingSceneLayerId;
	isLayerSwitching?: boolean;
	onDomainSelect?: (domainId: LandingSceneDomainId) => void;
	onPacketSelect?: (target: {
		domainId: LandingSceneDomainId;
		entityType: string;
		entityId: string;
	}) => void;
	onDeliveryEnd?: (
		domainId: LandingSceneDomainId,
		phase: LandingDeliveryPhase,
	) => void;
	windowPreset?: LandingMotionPreset;
	traffic?: LandingSceneTraffic;
	deliveries?: LandingDelivery[];
};

export type LandingSceneDefinition = {
	id: string;
	title: string;
	Component: ComponentType<LandingSceneProps>;
};
