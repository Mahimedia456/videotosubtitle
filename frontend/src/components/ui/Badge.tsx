import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-300/60 bg-brand-100/70 px-3 py-1.5 text-xs font-extrabold text-brand-800",
        className,
      )}
    >
      {children}
    </span>
  );
}