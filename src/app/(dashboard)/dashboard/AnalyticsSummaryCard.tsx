"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/shared/components";

interface UsageAnalyticsSummary {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  uniqueApiKeys: number;
}

interface UsageAnalyticsApiKeyRow {
  apiKey: string;
  apiKeyName: string;
  requests: number;
  totalTokens: number;
  cost: number;
}

interface UsageAnalyticsProviderRow {
  provider: string;
  requests: number;
  cost: number;
}

interface UsageAnalyticsPayload {
  summary: UsageAnalyticsSummary;
  byApiKey: UsageAnalyticsApiKeyRow[];
  byProvider: UsageAnalyticsProviderRow[];
}

function formatCompactNumber(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value || 0
  );
}

function formatCurrency(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value > 0 && value < 0.01 ? 4 : 2,
    maximumFractionDigits: value > 0 && value < 0.01 ? 4 : 2,
  }).format(value || 0);
}

/**
 * Compact "at a glance" analytics for the home dashboard: request/token/cost
 * totals over the last 7 days, plus who's driving usage (top API keys) and
 * where cost is going (top providers). Reuses the same `/api/usage/analytics`
 * endpoint as the full Costs/Analytics pages — no new backend, just a
 * condensed read of data that already exists.
 */
export default function AnalyticsSummaryCard() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [data, setData] = useState<UsageAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/usage/analytics?range=7d");
        if (!res.ok) throw new Error("request failed");
        const payload = (await res.json()) as UsageAnalyticsPayload;
        if (active) setData(payload);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (failed) return null;

  const summary = data?.summary;
  const topKeys = [...(data?.byApiKey ?? [])].sort((a, b) => b.cost - a.cost).slice(0, 5);
  const topProviders = [...(data?.byProvider ?? [])].sort((a, b) => b.cost - a.cost).slice(0, 5);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-main">{t("analyticsTitle")}</h2>
        <span className="text-xs text-text-muted">{t("analyticsRangeLabel")}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: t("analyticsRequests"),
            value: loading ? "…" : formatCompactNumber(locale, summary?.totalRequests ?? 0),
          },
          {
            label: t("analyticsTokens"),
            value: loading ? "…" : formatCompactNumber(locale, summary?.totalTokens ?? 0),
          },
          {
            label: t("analyticsCost"),
            value: loading ? "…" : formatCurrency(locale, summary?.totalCost ?? 0),
          },
          {
            label: t("analyticsActiveKeys"),
            value: loading ? "…" : String(summary?.uniqueApiKeys ?? 0),
          },
        ].map((tile) => (
          <div key={tile.label} className="rounded-lg border border-border/60 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted/70">
              {tile.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-text-main">{tile.value}</p>
          </div>
        ))}
      </div>

      {!loading && (topKeys.length > 0 || topProviders.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {topKeys.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted/70">
                {t("analyticsTopKeys")}
              </p>
              <div className="space-y-1">
                {topKeys.map((row) => (
                  <div
                    key={row.apiKey}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface/50"
                  >
                    <span className="truncate text-text-main">{row.apiKeyName || row.apiKey}</span>
                    <span className="shrink-0 font-mono text-xs text-text-muted">
                      {formatCurrency(locale, row.cost)} ·{" "}
                      {formatCompactNumber(locale, row.requests)} req
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topProviders.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted/70">
                {t("analyticsTopProviders")}
              </p>
              <div className="space-y-1">
                {topProviders.map((row) => (
                  <div
                    key={row.provider}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface/50"
                  >
                    <span className="truncate text-text-main">{row.provider}</span>
                    <span className="shrink-0 font-mono text-xs text-text-muted">
                      {formatCurrency(locale, row.cost)} ·{" "}
                      {formatCompactNumber(locale, row.requests)} req
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
