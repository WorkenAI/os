import { defineDomain } from "../manifest";
import { developerSpecs } from "./specs";

const developer = defineDomain({
	id: "developer",
	title: "Developer",
	icon: "🧑‍💻",
	accent: {
		color: "#60a5fa",
		gradient:
			"linear-gradient(135deg, rgba(96, 165, 250, 0.18), rgba(96, 165, 250, 0.05))",
	},
	landingLayer: "roles",
	shellIconKey: "code",
	landingScene: {
		roleCard: {
			caption: "Builder app",
			label: "Docs + Code",
			position: "right-[13%] top-[33%]",
			background:
				"linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(96, 165, 250, 0.05))",
		},
	},
	entities: {
		primitive: {
			id: "primitive",
			label: "Primitive",
			pluralLabel: "Primitives",
			actions: ["create", "edit"],
			inspector: { enabled: true },
		},
	},
	verbs: {
		"explore-primitives": {
			id: "explore-primitives",
			label: "Explore primitives",
			scope: "domain",
		},
		"try-dispatch": {
			id: "try-dispatch",
			label: "Try dispatch loop",
			scope: "domain",
		},
		"add-domain": {
			id: "add-domain",
			label: "Add domain",
			scope: "domain",
		},
	},
	views: {
		primitives: {
			id: "primitives",
			title: "Primitives",
			kind: "list",
			specId: "primitives",
			shell: {
				conversation: {
					disclaimer: "Worken OS developer docs. Try it live.",
					hint: "Ask about any primitive or try the dispatch loop",
				},
			},
		},
		"dispatch-loop": {
			id: "dispatch-loop",
			title: "Dispatch Loop",
			kind: "detail",
			specId: "dispatch-loop",
			shell: {
				conversation: {
					disclaimer: "Interactive execution sandbox.",
					hint: "dispatch(session, objectId, verb)",
				},
			},
		},
		"getting-started": {
			id: "getting-started",
			title: "Getting Started",
			kind: "detail",
			specId: "getting-started",
			shell: {
				conversation: {
					disclaimer: "Step-by-step guide to building on Worken OS.",
					hint: "How do I add a new domain?",
				},
			},
		},
		"agent-anatomy": {
			id: "agent-anatomy",
			title: "Agent Anatomy",
			kind: "detail",
			specId: "agent-anatomy",
			shell: {
				conversation: {
					disclaimer: "Agent v2 architecture reference.",
					hint: "How does the agent get its tools?",
				},
			},
		},
		"event-bus": {
			id: "event-bus",
			title: "Event Bus",
			kind: "detail",
			specId: "event-bus",
			shell: {
				conversation: {
					disclaimer: "Universal rendering stream.",
					hint: "How do I connect a new surface?",
				},
			},
		},
		"dev-agent": {
			id: "dev-agent",
			title: "Dev Agent",
			kind: "local",
			specId: "dev-agent",
			shell: {
				conversation: {
					disclaimer:
						"Code agent scaffolds, validates, and registers domains live.",
					hint: "Add a support domain with tickets and escalation",
				},
				localAssistant: {
					introTemplate: "I am the Worken OS code agent in {viewLabel}.",
					capabilities:
						"I can scaffold new domains from your description, validate manifests, register them live, add policy rules, preview agent toolkits, and simulate dispatch — all from this chat.",
				},
			},
		},
	},
	surfaces: {
		defaultViewId: "primitives",
		localOnlyViewIds: ["dev-agent"],
		actions: [],
		navigation: [
			{
				id: "primitives",
				label: "Primitives",
				icon: "LayoutDashboard",
				viewId: "primitives",
			},
			{
				id: "dispatch-loop",
				label: "Dispatch Loop",
				icon: "Kanban",
				viewId: "dispatch-loop",
			},
			{
				id: "getting-started",
				label: "Getting Started",
				icon: "FileText",
				viewId: "getting-started",
			},
			{
				id: "agent-anatomy",
				label: "Agent",
				icon: "Bot",
				viewId: "agent-anatomy",
			},
			{
				id: "event-bus",
				label: "Event Bus",
				icon: "Radio",
				viewId: "event-bus",
			},
			{
				id: "dev-agent",
				label: "Dev Agent",
				icon: "TerminalSquare",
				viewId: "dev-agent",
			},
		],
	},
	specs: developerSpecs,
});

export default developer;
