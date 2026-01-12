"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, Plus } from "lucide-react";
import { SmartSelectOption } from "./types";

/**
 * Presentational: Popover content + list
 */
export function SmartSelectMenu({
  value,
  query,
  setQuery,
  searchable,
  onSearch,
  busy,
  filteredItems,
  allowClear,
  emptyText,
  onSelect,
  onCreateNew,
  createLabel,
  size, // eslint-disable-line @typescript-eslint/no-unused-vars
  triggerWidth,
}: {
  value: SmartSelectOption | null;
  query: string;
  setQuery: (q: string) => void;
  searchable: boolean;
  onSearch?: (query: string) => Promise<SmartSelectOption[]>;
  busy: boolean;
  filteredItems: SmartSelectOption[];
  allowClear?: boolean;
  emptyText: string;
  onSelect: (opt: SmartSelectOption | null) => void;
  onCreateNew?: (q: string) => void;
  createLabel: string;
  size: "sm" | "md" | "lg";
  triggerWidth?: number;
}) {
  return (
    <PopoverContent
      align="start"
      className={cn("p-0 bg-input")}
      style={triggerWidth ? { width: `${triggerWidth}px` } : undefined}
    >
      <Command shouldFilter={!onSearch && searchable} className="bg-input">
        {searchable && (
          <CommandInput placeholder="Search…" value={query} onValueChange={setQuery} autoFocus />
        )}
        <CommandList>
          <CommandEmpty>
            {busy ? (
              "Searching…"
            ) : onCreateNew && query.length >= 2 ? (
              <div
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                onClick={() => {
                  onCreateNew(query);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {createLabel}:&nbsp;<span className="text-muted-foreground">&quot;{query.length > 12 ? query.substring(0, 12) + '...' : query}&quot;</span>
              </div>
            ) : (
              emptyText
            )}
          </CommandEmpty>

          <CommandGroup>
            {allowClear && (
              <CommandItem value="__none__" onSelect={() => onSelect(null)}>
                <span className="text-muted-foreground">No value</span>
              </CommandItem>
            )}
            {filteredItems.map((opt) => (
              <CommandItem key={opt.id} value={opt.label} onSelect={() => onSelect(opt)}>
                {opt.icon && (
                  <div className="mr-2 flex h-5 w-5 items-center justify-center">{opt.icon}</div>
                )}
                <div className="flex min-w-0 flex-col flex-1">
                  <span className="truncate">{opt.label}</span>
                  {opt.meta && (
                    <span className="truncate text-xs text-muted-foreground">{opt.meta}</span>
                  )}
                </div>
                {value?.id === opt.id && (
                  <div className="ml-2 flex h-4 w-4 items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  );
}