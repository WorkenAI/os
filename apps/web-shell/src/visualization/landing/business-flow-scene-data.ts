import { DOMAIN_MANIFESTS } from "@worken/demo-data/domains/catalog";
import type { LandingFlowPoint } from "@worken/demo-data/domains/types";
import { DOMAIN_PRIMARY_COLORS } from "@/shell/domain-colors";
import type { LandingSceneDomainId } from "@/visualization/landing/types";

export type LandingRoleLayerCard = {
	id: LandingSceneDomainId;
	name: string;
	caption: string;
	label: string;
	position: string;
	accent: string;
	background: string;
};

export type LandingBusinessLayerCard = {
	id: LandingSceneDomainId;
	name: string;
	label: string;
	position: string;
	accent: string;
	background: string;
};

export const LANDING_ROLE_LAYER_CARDS: LandingRoleLayerCard[] =
	DOMAIN_MANIFESTS.filter((d) => d.landingLayer === "roles").map((d) => {
		const rc = d.landingScene?.roleCard;
		if (!rc) {
			throw new Error(
				`Domain "${d.id}" (roles layer) is missing landingScene.roleCard`,
			);
		}
		return {
			id: d.id as LandingSceneDomainId,
			name: d.title,
			caption: rc.caption,
			label: rc.label,
			position: rc.position,
			accent: DOMAIN_PRIMARY_COLORS[d.id] ?? d.accent.color,
			background: rc.background,
		};
	});

export const LANDING_BUSINESS_LAYER_CARDS: LandingBusinessLayerCard[] =
	DOMAIN_MANIFESTS.filter((d) => d.landingLayer === "business").map((d) => {
		const bc = d.landingScene?.businessCard;
		if (!bc) {
			throw new Error(
				`Domain "${d.id}" (business layer) is missing landingScene.businessCard`,
			);
		}
		return {
			id: d.id as LandingSceneDomainId,
			name: d.title,
			label: bc.label,
			position: bc.position,
			accent: DOMAIN_PRIMARY_COLORS[d.id] ?? d.accent.color,
			background: bc.background,
		};
	});

/** Waypoints for delivery animation — keyed by domain id. */
export const LANDING_FLOW_WAYPOINTS: Record<
	string,
	{
		spawn: LandingFlowPoint;
		descend: LandingFlowPoint;
		center: LandingFlowPoint;
		midway: LandingFlowPoint;
		department: LandingFlowPoint;
	}
> = Object.fromEntries(
	DOMAIN_MANIFESTS.filter((d) => d.landingLayer === "business").map((d) => {
		const w = d.landingScene?.flowWaypoints;
		if (!w) {
			throw new Error(
				`Domain "${d.id}" (business layer) is missing landingScene.flowWaypoints`,
			);
		}
		return [d.id, w] as const;
	}),
);
