import type { ShellDomainId } from "../shell-catalog";
import { SHELL_DOMAIN_IDS } from "../shell-catalog";
import admin from "./admin";
import developer from "./developer";
import hr from "./hr";
import marketing from "./marketing";
import sales from "./sales";
import type { DomainDefinition } from "./types";

/**
 * Maps {@link SHELL_DOMAIN_IDS} from `../shell-catalog.ts` to domain modules.
 * To add a shell: extend `../shell-catalog.ts`, add `./<id>/` here, and add the import + key in `DOMAIN_BY_ID`.
 */
const DOMAIN_BY_ID = {
	admin,
	developer,
	hr,
	sales,
	marketing,
} satisfies Record<ShellDomainId, DomainDefinition>;

export const DOMAIN_MANIFESTS: readonly DomainDefinition[] =
	SHELL_DOMAIN_IDS.map((id) => DOMAIN_BY_ID[id]);

/** Same order as {@link DOMAIN_MANIFESTS} — avoids importing the full `shell-contract` barrel on the client. */
export const DOMAIN_IDS: readonly ShellDomainId[] = SHELL_DOMAIN_IDS;
