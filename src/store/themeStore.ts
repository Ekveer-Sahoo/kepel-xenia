"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME_CONFIG } from "@/shared/constants/appConfig";

interface ThemeState {
  theme: string;
  colorTheme: string;
  customColor: string;
  setTheme: (theme: string) => void;
  setColorTheme: (colorTheme: string) => void;
  setCustomColorTheme: (color: string) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: THEME_CONFIG.defaultTheme,
      colorTheme: "coral",
      customColor: "#0a0a0a",

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
        applyColorTheme(get().colorTheme, get().customColor, theme);
      },

      setColorTheme: (colorTheme) => {
        set({ colorTheme });
        applyColorTheme(colorTheme, get().customColor, get().theme);
      },

      setCustomColorTheme: (color) => {
        const normalized = normalizeHexColor(color);
        set({ colorTheme: "custom", customColor: normalized });
        applyColorTheme("custom", normalized, get().theme);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        set({ theme: newTheme });
        applyTheme(newTheme);
        applyColorTheme(get().colorTheme, get().customColor, newTheme);
      },

      initTheme: () => {
        const { theme, colorTheme, customColor } = get();
        applyTheme(theme);
        applyColorTheme(colorTheme, customColor, theme);
      },
    }),
    {
      name: THEME_CONFIG.storageKey,
    }
  )
);

// Monochrome-only swatches — a grayscale ramp from pure black to a light gray.
// Keys are kept stable (existing i18n labels/persisted user prefs reference them).
export const COLOR_THEMES: Record<string, string> = {
  coral: "#0a0a0a",
  blue: "#262626",
  red: "#404040",
  green: "#525252",
  violet: "#737373",
  orange: "#a3a3a3",
  cyan: "#d4d4d4",
};

function getEffectiveTheme(theme: string) {
  if (typeof window === "undefined") return "light";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return theme === "system" ? systemTheme : theme;
}

// Apply light/dark theme to document
function applyTheme(theme: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  if (getEffectiveTheme(theme) === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function applyColorTheme(colorTheme: string, customColor: string, theme: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  let baseColor =
    colorTheme === "custom"
      ? normalizeHexColor(customColor)
      : COLOR_THEMES[colorTheme] || COLOR_THEMES.coral;

  // The swatches are a black→light-gray ramp tuned for a light background. Applied
  // as-is in dark mode they pin --color-primary to a near-black inline style (higher
  // specificity than the .dark stylesheet rule), making text-primary/bg-primary
  // elements nearly invisible against the black background. Invert the ramp so the
  // accent stays legible while keeping the same relative position on the gray scale.
  if (getEffectiveTheme(theme) === "dark") {
    baseColor = invertGrayHex(baseColor);
  }

  const hoverColor = shadeHexColor(baseColor, -0.14);

  root.style.setProperty("--color-primary", baseColor);
  root.style.setProperty("--color-primary-hover", hoverColor);
}

function invertGrayHex(hex: string) {
  const normalized = normalizeHexColor(hex).slice(1);
  const invertChannel = (channelHex: string) =>
    (255 - parseInt(channelHex, 16)).toString(16).padStart(2, "0");
  return `#${invertChannel(normalized.slice(0, 2))}${invertChannel(normalized.slice(2, 4))}${invertChannel(normalized.slice(4, 6))}`;
}

function normalizeHexColor(color: string) {
  const value = (color || "").trim();
  const hex = value.startsWith("#") ? value : `#${value}`;
  const valid = /^#([0-9a-fA-F]{6})$/.test(hex);
  return valid ? hex.toLowerCase() : "#0a0a0a";
}

function shadeHexColor(hex: string, percent: number) {
  const normalized = normalizeHexColor(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const shade = (channel: number) => {
    const target = percent < 0 ? 0 : 255;
    const amount = Math.round((target - channel) * Math.abs(percent));
    const next = percent < 0 ? channel - amount : channel + amount;
    return Math.max(0, Math.min(255, next));
  };

  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(shade(r))}${toHex(shade(g))}${toHex(shade(b))}`;
}

export default useThemeStore;
