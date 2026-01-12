import { cn } from "@/lib/utils";

interface StatusBadgeProps<T> {
  status: T;
  meta: {
    label: (value: T) => string;
    icon: (value: T) => React.ReactNode;
  };
  className?: string;
}

export function StatusBadge<T>({ status, meta, className }: StatusBadgeProps<T>) {
  const label = meta.label(status);
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span aria-hidden="true">{meta.icon(status)}</span>
      <span>{label}</span>
    </div>
  );
}