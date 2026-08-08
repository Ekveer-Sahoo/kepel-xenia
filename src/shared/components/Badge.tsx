"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  default: "bg-black/5 dark:bg-white/10 text-text-muted",
  primary: "bg-primary/10 text-primary",
  success: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  warning: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  error: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  info: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const sizes = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

interface BadgeProps {
  children?: React.ReactNode;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            variant === "success" && "bg-gray-500",
            variant === "warning" && "bg-gray-500",
            variant === "error" && "bg-gray-500",
            variant === "info" && "bg-gray-500",
            variant === "primary" && "bg-primary",
            variant === "default" && "bg-gray-500"
          )}
        />
      )}
      {icon && (
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
