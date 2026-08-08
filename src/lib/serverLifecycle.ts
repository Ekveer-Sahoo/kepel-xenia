export type ServerLifecyclePhase = "starting" | "ready" | "stopping";

declare global {
  var __xeniaServerLifecycle: ServerLifecyclePhase | undefined;
}

export function getServerLifecyclePhase(): ServerLifecyclePhase {
  return globalThis.__xeniaServerLifecycle ?? "starting";
}

export function markServerStarting(): void {
  globalThis.__xeniaServerLifecycle = "starting";
}

export function markServerReady(): void {
  if (getServerLifecyclePhase() !== "stopping") {
    globalThis.__xeniaServerLifecycle = "ready";
  }
}

export function markServerStopping(): void {
  globalThis.__xeniaServerLifecycle = "stopping";
}
