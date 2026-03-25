import { defineDomain } from "../manifest";
import { validateDomainActionCards } from "../semantic/validate-domain-cards";
import { SALES_ACTION_CARDS } from "./action-cards";
import { salesSpecs } from "./specs";

const sales = defineDomain({
	id: "sales",
	title: "Sales",
	icon: "💼",
	accent: {
		color: "#a78bfa",
		gradient:
			"linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.05))",
	},
	landingLayer: "business",
	shellIconKey: "briefcase",
	landingScene: {
		flowWaypoints: {
			spawn: { x: 0, y: -290, s: 0.86 },
			descend: { x: 0, y: -170, s: 0.94 },
			center: { x: 86, y: -14, s: 1 },
			midway: { x: 150, y: -82, s: 1 },
			department: { x: 282, y: -152, s: 0.95 },
		},
		businessCard: {
			label: "Deals",
			position: "right-[7%] top-[10%]",
			background:
				"linear-gradient(135deg, rgba(167, 139, 250, 0.18), rgba(167, 139, 250, 0.05))",
		},
	},
	entities: {
		lead: {
			id: "lead",
			label: "Lead",
			pluralLabel: "Leads",
			actions: ["create", "edit", "delete", "approve"],
			inspector: { enabled: true },
		},
		deal: {
			id: "deal",
			label: "Deal",
			pluralLabel: "Deals",
			actions: ["create", "edit", "delete", "approve"],
			inspector: { enabled: true },
		},
		contact: {
			id: "contact",
			label: "Contact",
			pluralLabel: "Contacts",
			actions: ["create", "edit", "delete", "approve"],
			inspector: { enabled: true },
		},
	},
	verbs: {
		create: {
			id: "create",
			label: "Create",
			scope: "entity",
			entityIds: ["lead", "deal", "contact"],
		},
		qualify: { id: "qualify", label: "Qualify", scope: "domain" },
		"follow-up": { id: "follow-up", label: "Follow-up", scope: "domain" },
		propose: { id: "propose", label: "Proposal", scope: "domain" },
		close: { id: "close", label: "Close", scope: "domain" },
		reject: { id: "reject", label: "Reject", scope: "domain" },
	},
	views: {
		dashboard: {
			id: "dashboard",
			title: "Dashboard",
			kind: "dashboard",
			entityId: "deal",
			specId: "dashboard",
		},
		"leads-table": {
			id: "leads-table",
			title: "Leads",
			kind: "table",
			entityId: "lead",
			specId: "leads-table",
		},
		"pipeline-board": {
			id: "pipeline-board",
			title: "Pipeline",
			kind: "board",
			entityId: "deal",
			specId: "pipeline-board",
			execution: {
				signalType: "lead.created",
				autoStart: true,
			},
		},
		deals: {
			id: "deals",
			title: "Deals",
			kind: "list",
			entityId: "deal",
			specId: "deals",
		},
		analytics: {
			id: "analytics",
			title: "Analytics",
			kind: "analytics",
			entityId: "deal",
			specId: "analytics",
		},
	},
	surfaces: {
		defaultViewId: "dashboard",
		localOnlyViewIds: [],
		actions: [
			{
				id: "create-lead",
				label: "Lead",
				icon: "UserPlus",
				verbId: "create",
				entityId: "lead",
			},
			{
				id: "create-deal",
				label: "Deal",
				icon: "Handshake",
				verbId: "create",
				entityId: "deal",
			},
		],
		navigation: [
			{
				id: "dashboard",
				label: "Dashboard",
				icon: "LayoutDashboard",
				viewId: "dashboard",
			},
			{ id: "leads", label: "Leads", icon: "Users", viewId: "leads-table" },
			{
				id: "pipeline",
				label: "Pipeline",
				icon: "Kanban",
				viewId: "pipeline-board",
			},
			{ id: "deals", label: "Deals", icon: "Handshake", viewId: "deals" },
			{
				id: "analytics",
				label: "Analytics",
				icon: "BarChart3",
				viewId: "analytics",
			},
		],
	},
	specs: salesSpecs,
	actionCards: SALES_ACTION_CARDS,
});

validateDomainActionCards(sales);

export default sales;
