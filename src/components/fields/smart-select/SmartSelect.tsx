"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { inputStyle } from "@/components/styles";
import { Popover } from "@/components/ui/popover";
import { SmartSelectTrigger } from "./SmartSelectTrigger";
import { SmartSelectMenu } from "./SmartSelectMenu";
import { SmartSelectLink } from "./SmartSelectLink";
import { useSmartSelectController } from "./useSmartSelectController";
import { SmartSelectProps, SmartSelectOption } from "./types";

/**
 * Wrapper: wires the controller + presentational pieces together
 */
export default function SmartSelect({
  value,
  options = [],
  onSearch,
  onChange,
  hrefFor,
  renderPreview,
  placeholder = "Select…",
  emptyText = "No results",
  className,
  size = "md",
  disabled,
  searchable = true,
  allowClear = true,
  onCreateNew,
  createLabel = "Create new",
  debounceMs = 200,
}: SmartSelectProps) {
  const {
    open,
    setOpen,
    query,
    setQuery,
    busy,
    filteredItems,
  } = useSmartSelectController({ options, onSearch, searchable, debounceMs });

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>();
  const currentHref = value && value.id && hrefFor ? hrefFor(value.id) : null;

  React.useEffect(() => {
    if (triggerRef.current) {
      setTriggerWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const handleSelect = React.useCallback(
    (opt: SmartSelectOption | null) => {
      onChange(opt);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange, setOpen],
  );

  return (
    <div
      className={cn(
        inputStyle(),
        // "group inline-flex items-stretch rounded-lg border bg-background text-foreground shadow-xs transition-all duration-200 h-9",
        "p-0 group inline-flex items-stretch w-full min-w-0 overflow-hidden",
        className,
      )}
    >
      <Popover modal={true} open={open} onOpenChange={setOpen}>
        <SmartSelectTrigger
          value={value}
          placeholder={placeholder}
          size={size}
          disabled={disabled}
          renderPreview={renderPreview}
          triggerRef={triggerRef}
          open={open}
        />

        <SmartSelectMenu
          value={value}
          query={query}
          setQuery={setQuery}
          searchable={searchable}
          onSearch={onSearch}
          busy={busy}
          filteredItems={filteredItems}
          allowClear={allowClear}
          emptyText={emptyText}
          onSelect={handleSelect}
          onCreateNew={onCreateNew}
          createLabel={createLabel}
          size={size}
          triggerWidth={triggerWidth}
        />
      </Popover>

      {currentHref && <SmartSelectLink href={currentHref} size={size} />}
    </div>
  );
}