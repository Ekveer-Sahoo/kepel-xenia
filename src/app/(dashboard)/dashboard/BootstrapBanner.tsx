"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Shown when Xenia was started with auto-generated secrets (zero-config mode).
 * The banner is dismissable and persists only for the current session.
 */
export default function BootstrapBanner() {
  const t = useTranslations("common");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Determine default data dir hint based on platform hint from user-agent
  const dataDir =
    typeof navigator !== "undefined" && navigator.platform?.startsWith("Win")
      ? "%APPDATA%\\xenia\\server.env"
      : "~/.xenia/server.env";

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-gray-300 dark:border-gray-500/30 bg-gray-50 dark:bg-gray-500/10 px-4 py-3 text-sm text-gray-900 dark:text-gray-200 mb-4"
    >
      <span className="text-gray-500 dark:text-gray-400 text-base shrink-0 mt-0.5">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-gray-300">
          Running in zero-config mode
        </p>
        <p className="mt-0.5 text-gray-800/80 dark:text-gray-200/80">
          Xenia auto-generated secure encryption keys on first launch. They are persisted to{" "}
          <code className="font-mono bg-gray-200/50 dark:bg-gray-500/20 px-1 rounded text-xs">
            {dataDir}
          </code>
          . No action is required — your data is encrypted and safe. To use custom keys, add{" "}
          <code className="font-mono bg-gray-200/50 dark:bg-gray-500/20 px-1 rounded text-xs">
            JWT_SECRET
          </code>{" "}
          and{" "}
          <code className="font-mono bg-gray-200/50 dark:bg-gray-500/20 px-1 rounded text-xs">
            STORAGE_ENCRYPTION_KEY
          </code>{" "}
          to that file.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-gray-600/60 hover:text-gray-700 dark:text-gray-400/60 dark:hover:text-gray-300 transition-colors ml-1"
        aria-label={t("bootstrapBannerDismiss")}
      >
        ✕
      </button>
    </div>
  );
}
