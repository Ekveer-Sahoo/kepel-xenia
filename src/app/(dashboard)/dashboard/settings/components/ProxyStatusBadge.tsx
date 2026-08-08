"use client";

interface ProxyStatusBadgeProps {
  status?: string;
}

export function ProxyStatusBadge({ status }: ProxyStatusBadgeProps) {
  const isInactive = status === "inactive";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
        isInactive
          ? "border-gray-500/30 bg-gray-500/10 text-gray-400"
          : "border-gray-500/30 bg-gray-500/10 text-gray-400"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? "bg-gray-400" : "bg-gray-400"}`} />
      {isInactive ? "Inactive" : "Active"}
    </span>
  );
}
