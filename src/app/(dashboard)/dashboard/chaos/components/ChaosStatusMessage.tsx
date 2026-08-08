"use client";

import type { ChaosPageMessage } from "../chaosPageTypes";

/**
 * Success/error status banner for the Chaos Mode config page. Extracted out
 * of ChaosConfigPageClient.tsx to keep the page component under the
 * complexity/size ratchet (config/quality/complexity-baseline.json).
 */
export function ChaosStatusMessage({ message }: { message: ChaosPageMessage }) {
  if (!message) return null;
  return (
    <div
      className={`p-3 rounded-lg text-sm font-medium ${
        message.type === "success"
          ? "bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20"
          : "bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20"
      }`}
    >
      {message.text}
    </div>
  );
}
