import { DOMAIN_MANIFESTS } from "@worken/demo-data/domains/catalog";
import type {
	LandingSceneDomainId,
	LandingSceneLayerId,
} from "@/visualization/landing/types";

export type LandingDomainDescriptor = {
	id: LandingSceneDomainId;
	label: string;
	icon: string;
	color: string;
	layerId: LandingSceneLayerId;
};

/** Marketing landing dock rows — from domain manifests only. */
export function getLandingDomainDescriptors(): LandingDomainDescriptor[] {
	return DOMAIN_MANIFESTS.map((domain) => ({
		id: domain.id as LandingSceneDomainId,
		label: domain.title,
		icon: domain.icon,
		color: domain.accent.color,
		layerId: domain.landingLayer,
	}));
}
