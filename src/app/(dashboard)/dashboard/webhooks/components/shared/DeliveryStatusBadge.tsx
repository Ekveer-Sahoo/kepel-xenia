"use client";

interface DeliveryStatusBadgeProps {
  status: string;
  httpStatus?: number | null;
}

export function DeliveryStatusBadge({ status, httpStatus }: DeliveryStatusBadgeProps) {
  const isSuccess = status === "success";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        isSuccess
          ? "border-gray-500/30 bg-gray-500/10 text-gray-600 dark:text-gray-300"
          : "border-gray-500/30 bg-gray-500/10 text-gray-600 dark:text-gray-300"
      }`}
    >
      <span className="material-symbols-outlined text-[12px]">
        {isSuccess ? "check_circle" : "error"}
      </span>
      {httpStatus ? httpStatus : isSuccess ? "OK" : "ERR"}
    </span>
  );
}
