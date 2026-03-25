import { defineDomain } from "../manifest";
import { hrSpecs } from "./specs";

const hr = defineDomain({
	id: "hr",
	title: "HR",
	icon: "👥",
	accent: {
		color: "#22d3ee",
		gradient:
			"linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(34, 211, 238, 0.05))",
	},
	landingLayer: "business",
	shellIconKey: "users",
	landingScene: {
		flowWaypoints: {
			spawn: { x: 0, y: -290, s: 0.86 },
			descend: { x: 0, y: -170, s: 0.94 },
			center: { x: -86, y: -14, s: 1 },
			midway: { x: -140, y: -82, s: 1 },
			department: { x: -270, y: -152, s: 0.95 },
		},
		businessCard: {
			label: "Candidates",
			position: "left-[7%] top-[10%]",
			background:
				"linear-gradient(135deg, rgba(34, 211, 238, 0.18), rgba(34, 211, 238, 0.05))",
		},
	},
	entities: {
		candidate: {
			id: "candidate",
			label: "Candidate",
			pluralLabel: "Candidates",
			actions: ["create", "edit", "delete", "approve"],
			inspector: { enabled: true },
		},
		vacancy: {
			id: "vacancy",
			label: "Job opening",
			pluralLabel: "Job openings",
			actions: ["create", "edit", "delete", "approve"],
			inspector: { enabled: true },
		},
		interview: {
			id: "interview",
			label: "Interview",
			pluralLabel: "Interviews",
			actions: ["create", "edit", "delete", "approve"],
			inspector: { enabled: true },
		},
	},
	verbs: {
		create: {
			id: "create",
			label: "Create",
			scope: "entity",
			entityIds: ["candidate", "vacancy"],
		},
		source: { id: "source", label: "Sourcing", scope: "domain" },
		screen: { id: "screen", label: "Screening", scope: "domain" },
		schedule: { id: "schedule", label: "Schedule", scope: "domain" },
		hire: { id: "hire", label: "Hire", scope: "domain" },
		reject: { id: "reject", label: "Reject", scope: "domain" },
	},
	views: {
		dashboard: {
			id: "dashboard",
			title: "Dashboard",
			kind: "dashboard",
			entityId: "candidate",
			specId: "dashboard",
		},
		"candidates-table": {
			id: "candidates-table",
			title: "Candidates",
			kind: "table",
			entityId: "candidate",
			specId: "candidates-table",
		},
		"pipeline-board": {
			id: "pipeline-board",
			title: "Pipeline",
			kind: "board",
			entityId: "candidate",
			specId: "pipeline-board",
		},
		interviews: {
			id: "interviews",
			title: "Interviews",
			kind: "list",
			entityId: "interview",
			specId: "interviews",
		},
		analytics: {
			id: "analytics",
			title: "Analytics",
			kind: "analytics",
			entityId: "candidate",
			specId: "analytics",
		},
	},
	surfaces: {
		defaultViewId: "dashboard",
		localOnlyViewIds: [],
		actions: [
			{
				id: "create-candidate",
				label: "Candidate",
				icon: "UserPlus",
				verbId: "create",
				entityId: "candidate",
			},
			{
				id: "create-vacancy",
				label: "Job opening",
				icon: "Briefcase",
				verbId: "create",
				entityId: "vacancy",
			},
		],
		navigation: [
			{
				id: "dashboard",
				label: "Dashboard",
				icon: "LayoutDashboard",
				viewId: "dashboard",
			},
			{
				id: "candidates",
				label: "Candidates",
				icon: "Users",
				viewId: "candidates-table",
			},
			{
				id: "pipeline",
				label: "Pipeline",
				icon: "Kanban",
				viewId: "pipeline-board",
			},
			{
				id: "interviews",
				label: "Interviews",
				icon: "Calendar",
				viewId: "interviews",
			},
			{
				id: "analytics",
				label: "Analytics",
				icon: "BarChart3",
				viewId: "analytics",
			},
		],
	},
	specs: hrSpecs,
});

export default hr;
