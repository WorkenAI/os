import type { LandingFlowPoint } from "@worken/demo-data/domains/types";
import { useLayoutEffect, useRef, useState } from "react";
import { shellUiTokens } from "@/shell/layout/ui-tokens";
import { usePermissions } from "@/shell/permissions/context";
import { useShellTheme } from "@/shell/theme";
import {
	LANDING_BUSINESS_LAYER_CARDS,
	LANDING_FLOW_WAYPOINTS,
	LANDING_ROLE_LAYER_CARDS,
} from "@/visualization/landing/business-flow-scene-data";
import type {
	LandingDelivery,
	LandingDeliveryPhase,
	LandingSceneDomainId,
	LandingSceneLayerId,
	LandingSceneProps,
} from "@/visualization/landing/types";
import { getLandingSceneWindowStyle } from "@/visualization/landing/window-settings";

const FETCH_MS = 5_000;
const SPAWN_MS = 3_500;
const CARRY_MS = 7_000;
const ROBOT_HOOK_OFFSET_Y = -28;

type Pt = LandingFlowPoint;

function toTransform(p: Pt) {
	return { transform: `translate(${p.x}px, ${p.y}px) scale(${p.s})` };
}

function withYOffset(p: Pt, offsetY: number): Pt {
	return { ...p, y: p.y + offsetY };
}

function RobotVisual({
	accent,
	isLight,
}: {
	accent: string;
	isLight: boolean;
}) {
	return (
		<div
			className="relative flex h-8 w-8 items-center justify-center rounded-[10px] border"
			style={{
				borderColor: `${accent}66`,
				background: isLight
					? `linear-gradient(135deg, ${accent}26, rgba(250,246,241,0.92))`
					: `linear-gradient(135deg, ${accent}30, rgba(255,255,255,0.06))`,
				transform: "translate3d(-50%, -50%, 0)",
				transformStyle: "preserve-3d",
				boxShadow: `0 8px 16px rgba(0,0,0,0.10), 0 0 12px ${accent}26`,
			}}
		>
			<span
				className="absolute -top-5 left-[50%] -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.2em]"
				style={{
					border: isLight
						? "1px solid rgba(120, 80, 40, 0.12)"
						: "1px solid rgba(255, 255, 255, 0.1)",
					background: isLight
						? "rgba(250, 246, 241, 0.92)"
						: "rgba(0, 0, 0, 0.7)",
					color: isLight
						? "rgba(59, 35, 19, 0.75)"
						: "rgba(255, 255, 255, 0.75)",
				}}
			>
				AI
			</span>
			<div
				className="relative h-4 w-4 rounded-[6px] border"
				style={{
					borderColor: isLight
						? "rgba(120, 80, 40, 0.12)"
						: "rgba(255, 255, 255, 0.1)",
					background: isLight
						? "rgba(120, 80, 40, 0.05)"
						: "rgba(255, 255, 255, 0.05)",
					animation: "business-robot-hover 1.4s ease-in-out infinite",
				}}
			>
				<span
					className="absolute left-[3px] top-[4px] h-1.5 w-1.5 rounded-full"
					style={{ background: accent }}
				/>
				<span
					className="absolute right-[3px] top-[4px] h-1.5 w-1.5 rounded-full"
					style={{ background: accent }}
				/>
			</div>
		</div>
	);
}

function PacketVisual({
	label,
	accent,
	isLight,
	onSelect,
}: {
	label: string;
	accent: string;
	isLight: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onSelect}
			className="pointer-events-auto relative min-w-[92px] cursor-pointer rounded-xl border px-4 py-2 text-center text-[11px] font-medium text-white/90 in-data-[shell-theme='light']:text-[#3b2313]/90"
			style={{
				borderColor: `${accent}66`,
				background: isLight
					? `linear-gradient(135deg, ${accent}26, rgba(250,246,241,0.92))`
					: `linear-gradient(135deg, ${accent}30, rgba(255,255,255,0.06))`,
				transform: "translate3d(-50%, -50%, 0)",
				transformStyle: "preserve-3d",
				boxShadow: `0 16px 26px rgba(0,0,0,0.10), 0 0 18px ${accent}26`,
			}}
		>
			<div
				className="pointer-events-none absolute inset-0 rounded-xl border opacity-70"
				style={{
					borderColor: `${accent}30`,
					background: isLight
						? "rgba(250,246,241,0.18)"
						: "rgba(255,255,255,0.03)",
					transform: "translate3d(0, 8px, -14px)",
					boxShadow: "0 20px 24px rgba(0,0,0,0.08)",
				}}
			/>
			<div
				className="pointer-events-none absolute inset-px rounded-[10px] opacity-70"
				style={{
					background: `linear-gradient(180deg, ${accent}2a, transparent 62%)`,
					transform: "translate3d(0, -4px, 8px)",
				}}
			/>
			<span className="relative z-10">{label}</span>
		</button>
	);
}

function DomainScorePopup({
	delivery,
	accent,
}: {
	delivery: LandingDelivery | undefined;
	accent: string;
}) {
	if (!delivery || delivery.phase !== "scored") return null;
	return (
		<div
			key={delivery.animKey}
			className="pointer-events-none absolute -top-1 left-1/2 z-40 whitespace-nowrap font-extrabold"
			style={{
				animation: "business-score-arrive 1.6s ease-out 1 forwards",
				color: accent,
				fontSize: "20px",
				textShadow: `0 0 18px ${accent}90, 0 2px 8px rgba(0,0,0,0.5)`,
				letterSpacing: "0.02em",
			}}
		>
			+1 {delivery.scoreLabel}
		</div>
	);
}

function DomainDeliveryLayer({
	delivery,
	isLight,
	onPhaseEnd,
	onPacketSelect,
}: {
	delivery: LandingDelivery;
	isLight: boolean;
	onPhaseEnd: (
		domainId: LandingSceneDomainId,
		phase: LandingDeliveryPhase,
	) => void;
	onPacketSelect: (target: {
		domainId: LandingSceneDomainId;
		entityType: string;
		entityId: string;
	}) => void;
}) {
	const robotRef = useRef<HTMLDivElement>(null);
	const packetRef = useRef<HTMLDivElement>(null);
	const wp = LANDING_FLOW_WAYPOINTS[delivery.domainId]!;
	const showPacket =
		delivery.phase === "fetching" || delivery.phase === "delivering";
	const robotCenter = withYOffset(wp.center, ROBOT_HOOK_OFFSET_Y);
	const robotMidway = withYOffset(wp.midway, ROBOT_HOOK_OFFSET_Y);
	const robotDepartment = withYOffset(wp.department, ROBOT_HOOK_OFFSET_Y);

	useLayoutEffect(() => {
		const robot = robotRef.current;
		const packet = packetRef.current;
		const anims: Animation[] = [];

		if (delivery.phase === "fetching") {
			if (robot) {
				const a = robot.animate(
					[
						toTransform(wp.department),
						toTransform(robotMidway),
						toTransform(robotCenter),
					],
					{ duration: FETCH_MS, easing: "linear", fill: "forwards" },
				);
				a.onfinish = () => onPhaseEnd(delivery.domainId, "fetching");
				anims.push(a);
			}
			if (packet) {
				anims.push(
					packet.animate(
						[
							toTransform(wp.spawn),
							toTransform(wp.descend),
							toTransform(wp.center),
						],
						{
							duration: SPAWN_MS,
							easing: "ease-out",
							fill: "forwards",
						},
					),
				);
			}
		}

		if (delivery.phase === "delivering") {
			const robotKeyframes = [
				toTransform(robotCenter),
				toTransform(robotMidway),
				toTransform(robotDepartment),
			];
			const packetKeyframes = [
				toTransform(wp.center),
				toTransform(wp.midway),
				toTransform(wp.department),
			];
			const opts: KeyframeAnimationOptions = {
				duration: CARRY_MS,
				easing: "linear",
				fill: "forwards",
			};
			if (robot) {
				const a = robot.animate(robotKeyframes, opts);
				a.onfinish = () => onPhaseEnd(delivery.domainId, "delivering");
				anims.push(a);
			}
			if (packet) {
				anims.push(packet.animate(packetKeyframes, opts));
			}
		}

		return () => {
			for (const a of anims) a.cancel();
		};
	}, [delivery.phase, delivery.animKey, delivery.domainId, onPhaseEnd, wp]);

	return (
		<>
			{/* Robot — always visible */}
			<div
				ref={robotRef}
				className="absolute left-[50%] top-[50%] z-30 h-0 w-0"
				style={{
					transform:
						delivery.phase === "delivering"
							? `translate(${robotCenter.x}px, ${robotCenter.y}px) scale(${robotCenter.s})`
							: `translate(${wp.department.x}px, ${wp.department.y}px) scale(${wp.department.s})`,
				}}
			>
				<RobotVisual accent={delivery.accent} isLight={isLight} />
			</div>

			{/* Packet — visible during fetching + delivering */}
			{showPacket && (
				<div
					ref={packetRef}
					className="absolute left-[50%] top-[50%] z-20 h-0 w-0"
				>
					<PacketVisual
						label={delivery.item.label}
						accent={delivery.accent}
						isLight={isLight}
						onSelect={() =>
							onPacketSelect({
								domainId: delivery.domainId,
								entityType: delivery.item.entityType,
								entityId: delivery.item.entityId,
							})
						}
					/>
				</div>
			)}
		</>
	);
}

export default function BusinessFlowScene({
	activeDomainId,
	activeLayerId,
	isLayerSwitching,
	onDomainSelect,
	onPacketSelect,
	onDeliveryEnd,
	traffic,
	deliveries = [],
	windowPreset = "shell-open",
}: LandingSceneProps) {
	const { theme } = useShellTheme();
	const { canAccessDomain } = usePermissions();
	const isLight = theme === "light";
	const [hoveredDomainId, setHoveredDomainId] =
		useState<LandingSceneDomainId | null>(null);
	const windowStyle = getLandingSceneWindowStyle(windowPreset);
	const currentLayerId: LandingSceneLayerId = activeLayerId ?? "business";
	const isRoleLayerActive = currentLayerId === "roles";
	const rolePackets = traffic?.rolePackets ?? [];
	const deliveryByDomain = new Map(deliveries.map((d) => [d.domainId, d]));

	const roleLayerStyle = {
		opacity: isRoleLayerActive ? 1 : 0,
		transform: isRoleLayerActive
			? "translate3d(0, 0, 0) scale(1)"
			: "translate3d(-20px, 0, 0) scale(0.985)",
		transition: isLayerSwitching
			? "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)"
			: "opacity 320ms ease-out, transform 320ms ease-out",
	};
	const businessLayerStyle = {
		opacity: isRoleLayerActive ? 0 : 1,
		transform: isRoleLayerActive
			? "translate3d(20px, 0, 0) scale(0.985)"
			: "translate3d(0, 0, 0) scale(1)",
		transition: isLayerSwitching
			? "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), transform 420ms cubic-bezier(0.22, 1, 0.36, 1)"
			: "opacity 320ms ease-out, transform 320ms ease-out",
	};

	return (
		<div
			className="pointer-events-none relative flex w-full origin-top items-start justify-center overflow-visible"
			style={windowStyle}
		>
			<div
				className="relative h-[520px]"
				style={{
					width: `min(calc(100vw - 2rem), var(--shell-preview-width, ${shellUiTokens.previewWidthFallback}))`,
				}}
				aria-hidden
			>
				<div
					className="absolute inset-0 rounded-[40px] border backdrop-blur-[3px]"
					style={{
						borderColor: isLight
							? "rgba(120, 80, 40, 0.12)"
							: "rgba(255, 255, 255, 0.08)",
						background: isLight
							? "rgba(120, 80, 40, 0.04)"
							: "rgba(255, 255, 255, 0.025)",
					}}
				/>
				<div
					className="absolute inset-0 rounded-[40px] opacity-45"
					style={{
						backgroundImage: isLight
							? "linear-gradient(rgba(120,80,40,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(120,80,40,0.1) 1px, transparent 1px)"
							: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
						backgroundSize: "48px 48px",
					}}
				/>

				{/* Roles layer */}
				<div
					className="absolute inset-0"
					style={{
						...roleLayerStyle,
						pointerEvents: isRoleLayerActive ? "auto" : "none",
					}}
				>
					{LANDING_ROLE_LAYER_CARDS.map((app) => (
						<button
							type="button"
							key={app.id}
							aria-pressed={activeDomainId === app.id}
							disabled={!canAccessDomain(app.id)}
							onClick={() => onDomainSelect?.(app.id)}
							className={`pointer-events-auto absolute z-20 min-h-[92px] min-w-[170px] max-w-[260px] rounded-[24px] border px-4 py-4 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] ${app.position}`}
							onMouseEnter={() => setHoveredDomainId(app.id)}
							onMouseLeave={() => setHoveredDomainId(null)}
							style={{
								borderColor:
									activeDomainId === app.id
										? `${app.accent}90`
										: `${app.accent}55`,
								background: app.background,
								boxShadow:
									hoveredDomainId === app.id || activeDomainId === app.id
										? `0 0 36px ${app.accent}55, 0 12px 28px rgba(0,0,0,0.16)`
										: `0 0 28px ${app.accent}18`,
								opacity: canAccessDomain(app.id) ? 1 : 0.35,
							}}
						>
							<div className="mb-2 flex items-center justify-between">
								<span className="text-[11px] uppercase tracking-[0.28em] text-white/45 in-data-[shell-theme='light']:text-[#6b4f3f]/70">
									{app.caption}
								</span>
								<span
									className="h-2.5 w-2.5 rounded-full"
									style={{
										background: app.accent,
										boxShadow: `0 0 14px ${app.accent}`,
									}}
								/>
							</div>
							<div className="text-[21px] font-semibold text-white in-data-[shell-theme='light']:text-[#3b2313]">
								{app.name}
							</div>
							<div className="mt-1 text-sm text-white/55 in-data-[shell-theme='light']:text-[#6b4f3f]/80">
								{app.label}
							</div>
						</button>
					))}

					{rolePackets.map((item) => (
						<div
							key={item.id}
							className="absolute left-[50%] top-[50%] z-20 h-0 w-0"
							style={{
								animation: `${item.route} 20s linear infinite`,
								animationDelay: `${item.delayMs}ms`,
								willChange: "transform",
								transform: "translate3d(0, 0, 0)",
							}}
						>
							<div
								className="relative min-w-[110px] rounded-xl border px-4 py-2 text-center text-[11px] font-medium text-white/90 in-data-[shell-theme='light']:text-[#3b2313]/90"
								style={{
									borderColor: `${item.accent}66`,
									background: isLight
										? `linear-gradient(135deg, ${item.accent}26, rgba(250,246,241,0.92))`
										: `linear-gradient(135deg, ${item.accent}30, rgba(255,255,255,0.06))`,
									transform: "translate3d(-50%, -50%, 0)",
									transformStyle: "preserve-3d",
									boxShadow: `0 16px 26px rgba(0,0,0,0.10), 0 0 18px ${item.accent}26`,
								}}
							>
								<div
									className="pointer-events-none absolute inset-0 rounded-xl border opacity-70"
									style={{
										borderColor: `${item.accent}30`,
										background: isLight
											? "rgba(250,246,241,0.18)"
											: "rgba(255,255,255,0.03)",
										transform: "translate3d(0, 8px, -14px)",
										boxShadow: "0 20px 24px rgba(0,0,0,0.08)",
									}}
								/>
								<div
									className="pointer-events-none absolute inset-px rounded-[10px] opacity-70"
									style={{
										background: `linear-gradient(180deg, ${item.accent}2a, transparent 62%)`,
										transform: "translate3d(0, -4px, 8px)",
									}}
								/>
								<span className="relative z-10">{item.label}</span>
							</div>
						</div>
					))}
				</div>

				{/* Business layer */}
				<div
					className="absolute inset-0"
					style={{
						...businessLayerStyle,
						pointerEvents: isRoleLayerActive ? "none" : "auto",
					}}
				>
					{LANDING_BUSINESS_LAYER_CARDS.map((domain) => {
						const delivery = deliveryByDomain.get(domain.id);
						return (
							<button
								type="button"
								key={domain.id}
								aria-pressed={activeDomainId === domain.id}
								disabled={!canAccessDomain(domain.id)}
								onClick={() => onDomainSelect?.(domain.id)}
								className={`pointer-events-auto absolute h-[104px] w-[180px] rounded-[26px] border p-5 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] ${domain.position}`}
								onMouseEnter={() => setHoveredDomainId(domain.id)}
								onMouseLeave={() => setHoveredDomainId(null)}
								style={{
									borderColor:
										activeDomainId === domain.id
											? `${domain.accent}90`
											: `${domain.accent}55`,
									background: domain.background,
									boxShadow:
										hoveredDomainId === domain.id ||
										activeDomainId === domain.id
											? `0 0 36px ${domain.accent}55, 0 12px 28px rgba(0,0,0,0.16)`
											: `0 0 28px ${domain.accent}18`,
									opacity: canAccessDomain(domain.id) ? 1 : 0.35,
								}}
							>
								<DomainScorePopup delivery={delivery} accent={domain.accent} />
								<div className="mb-2 flex items-center justify-between">
									<span className="text-[11px] uppercase tracking-[0.28em] text-white/45 in-data-[shell-theme='light']:text-[#6b4f3f]/70">
										Decision Zone
									</span>
									<span
										className="h-2.5 w-2.5 rounded-full"
										style={{
											background: domain.accent,
											boxShadow: `0 0 14px ${domain.accent}`,
										}}
									/>
								</div>
								<div className="text-[22px] font-semibold text-white in-data-[shell-theme='light']:text-[#3b2313]">
									{domain.name}
								</div>
								<div className="mt-1 text-sm text-white/55 in-data-[shell-theme='light']:text-[#6b4f3f]/80">
									{domain.label}
								</div>
							</button>
						);
					})}

					{deliveries.map((delivery) => (
						<DomainDeliveryLayer
							key={delivery.domainId}
							delivery={delivery}
							isLight={isLight}
							onPhaseEnd={onDeliveryEnd!}
							onPacketSelect={onPacketSelect!}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
