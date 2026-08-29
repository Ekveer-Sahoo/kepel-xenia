import type { CompressionConfig, CompressionResult } from "./types.ts";
import type { CachingDetectionContext } from "./cachingAware.ts";
import type { RiskGateConfig } from "./riskGate/riskGate.ts";
import { resolveRiskGate, withRiskGate } from "./riskGate/strategyWrap.ts";
import { withLiveTurnGuard, withLiveTurnGuardAsync } from "./liveTurn.ts";
import {
  resolveQuantumLock,
  quantumCachingContext,
  withQuantumLock,
  withQuantumLockAsync,
} from "./quantumLock/index.ts";

export interface CompressionEntrypointOptions {
  config?: CompressionConfig;
  riskGate?: RiskGateConfig;
  cachingContext?: CachingDetectionContext;
}

export function withCompressionEntrypointGuards<T extends CompressionEntrypointOptions>(
  body: Record<string, unknown>,
  options: T | undefined,
  run: (body: Record<string, unknown>) => CompressionResult
): CompressionResult {
  // Outermost: whatever the engines do, the user's live instruction is restored
  // verbatim before the body leaves the gateway (see liveTurn.ts).
  return withLiveTurnGuard(body, (guardedBody) =>
    withQuantumLock(
      guardedBody,
      resolveQuantumLock(options),
      quantumCachingContext(guardedBody, options),
      (quantumBody) =>
        withRiskGate(quantumBody, resolveRiskGate(options), (riskBody) => run(riskBody))
    )
  );
}

export function withCompressionEntrypointGuardsAsync<T extends CompressionEntrypointOptions>(
  body: Record<string, unknown>,
  options: T | undefined,
  run: (body: Record<string, unknown>) => Promise<CompressionResult>
): Promise<CompressionResult> {
  return withLiveTurnGuardAsync(body, (guardedBody) =>
    withQuantumLockAsync(
      guardedBody,
      resolveQuantumLock(options),
      quantumCachingContext(guardedBody, options),
      run
    )
  );
}
