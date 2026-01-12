"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface SmartSelectOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SmartSelectProps {
  value: SmartSelectOption | null;
  onChange: (option: SmartSelectOption | null) => void;
  options: SmartSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  allowClear?: boolean;
  className?: string;
}

export default function SmartSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  searchable = true,
  allowClear = false,
  className,
}: SmartSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleSelect = (option: SmartSelectOption) => {
    onChange(option);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex items-center justify-between gap-2 w-full min-w-[140px] px-3 py-2 text-sm",
            "border border-input rounded-md bg-background",
            "hover:bg-muted/50 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {value?.icon && (
              <span className="flex-shrink-0 text-foreground">
                {value.icon}
              </span>
            )}
            <span className={cn(!value && "text-muted-foreground")}>
              {value?.label || placeholder}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] p-0"
        align="start"
        sideOffset={4}
      >
        {searchable && (
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        )}
        <div className="max-h-[240px] overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = value?.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md",
                    "hover:bg-muted transition-colors text-left",
                    isSelected && "bg-muted/50"
                  )}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-foreground">
                    {option.icon}
                  </span>
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
