"use client";
import { useTranslations } from "next-intl";

const FEATURES = [
  {
    icon: "link",
    titleKey: "featureUnifiedEndpointTitle",
    descKey: "featureUnifiedEndpointDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "bolt",
    titleKey: "featureEasySetupTitle",
    descKey: "featureEasySetupDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "shield_with_heart",
    titleKey: "featureModelFallbackTitle",
    descKey: "featureModelFallbackDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "swap_horiz",
    titleKey: "featureAutoFailoverTitle",
    descKey: "featureAutoFailoverDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "monitoring",
    titleKey: "featureUsageTrackingTitle",
    descKey: "featureUsageTrackingDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "key",
    titleKey: "featureOAuthApiKeysTitle",
    descKey: "featureOAuthApiKeysDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "cloud_sync",
    titleKey: "featureCloudSyncTitle",
    descKey: "featureCloudSyncDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "terminal",
    titleKey: "featureCliSupportTitle",
    descKey: "featureCliSupportDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
  {
    icon: "dashboard",
    titleKey: "featureDashboardTitle",
    descKey: "featureDashboardDesc",
    colors: {
      border: "hover:border-gray-500/50",
      bg: "hover:bg-gray-500/5",
      iconBg: "bg-gray-500/10",
      iconText: "text-gray-500",
      titleHover: "group-hover:text-gray-400",
    },
  },
];

export default function Features() {
  const t = useTranslations("landing");

  return (
    <section className="py-24 px-6" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("powerfulFeatures")}</h2>
          <p className="text-gray-400 max-w-xl text-lg">{t("featuresSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className={`p-6 rounded-xl bg-[#1a1a1a] border border-[#313131] ${feature.colors.border} ${feature.colors.bg} transition-all duration-300 group`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${feature.colors.iconBg} flex items-center justify-center mb-4 ${feature.colors.iconText} group-hover:scale-110 transition-transform duration-300`}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {feature.icon}
                </span>
              </div>
              <h3
                className={`text-lg font-bold mb-2 break-words ${feature.colors.titleHover} transition-colors`}
              >
                {t(feature.titleKey)}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed break-words">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
