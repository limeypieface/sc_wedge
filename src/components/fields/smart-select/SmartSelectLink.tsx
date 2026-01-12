"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

/**
 * Presentational: Inline chevron link (revealed on hover via CSS)
 */
export function SmartSelectLink({ href, size }: { href: string; size: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9";
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200",
        "text-muted-foreground hover:text-foreground hover:bg-accent rounded-r-lg",
        sizeClass,
        // reveal on hover of the parent .group
        "opacity-0 translate-x-1 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto",
      )}
      title="Open related record"
    >
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}