/**
 * Filter for @orpc/server's experimental RethrowHandlerPlugin.
 *
 * Load-bearing: this selects which errors oRPC re-throws to NestJS so
 * OrpcErrorFilter can normalize them to the typed ApiError wire shape vs
 * which errors oRPC serializes in its own format.
 *
 * Contract:
 * - `defined: true` → oRPC's contract-level typed errors → oRPC handles them
 *   natively, do NOT rethrow.
 * - Everything else (raw Error, ad-hoc ORPCError like SERVICE_UNAVAILABLE
 *   thrown from /health) → rethrow so OrpcErrorFilter owns the shape.
 *
 * WARNING: the ad-hoc branch depends on oRPC's current convention that
 * `new ORPCError(...)` outside a typed contract declaration carries
 * `defined=false`. If an oRPC upgrade flips that, SERVICE_UNAVAILABLE
 * responses would silently stop reaching OrpcErrorFilter. @orpc/nest and
 * @orpc/server are pinned with `~` (minor drift blocked) to mitigate.
 */
export function rethrowAdHocErrors(error: unknown): boolean {
  const candidate = error as { defined?: unknown } | null;
  return !(candidate?.defined === true);
}
