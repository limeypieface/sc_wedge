"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChevronDown } from "lucide-react";
import { SmartSelectOption } from "./types";

/**
 * Presentational: Trigger button (with optional HoverCard preview)
 */
export function SmartSelectTrigger({
  value,
  placeholder,
  size,
  disabled,
  renderPreview,
  triggerRef,
  open,
}: {
  value: SmartSelectOption | null;
  placeholder: string;
  size: "sm" | "md" | "lg";
  disabled?: boolean;
  renderPreview?: (option: SmartSelectOption) => React.ReactNode;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  open?: boolean;
}) {
  const triggerSizes = {
    sm: "h-full px-3 py-1 text-sm",
    md: "h-full px-3 py-1 text-sm",
    lg: "h-full px-4 py-1",
  } as const;

  const ButtonInner = (
    <Button
      ref={triggerRef}
      type="button"
      variant="ghost"
      disabled={disabled}
      className={cn(
        "justify-between gap-2 border-0 hover:bg-accent rounded-lg",
        triggerSizes[size],
        "min-w-0 flex-1 w-full",
      )}
      aria-haspopup="listbox"
    >
      <span className="inline-flex items-center gap-2 truncate min-w-0 flex-1">
        {value?.icon}
        <span className="truncate min-w-0">
          {(value?.selectedLabel ?? value?.label) || <span className="text-muted-foreground">{placeholder}</span>}
        </span>
      </span>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </Button>
  );

  if (renderPreview && value) {
    return (
      <HoverCard openDelay={300} closeDelay={150}>
        <HoverCardTrigger asChild>
          <PopoverTrigger asChild>{ButtonInner}</PopoverTrigger>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" align="start" side="top">
          {renderPreview(value)}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return <PopoverTrigger asChild>{ButtonInner}</PopoverTrigger>;
}