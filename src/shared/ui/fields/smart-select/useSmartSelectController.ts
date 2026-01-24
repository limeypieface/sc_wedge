import * as React from "react";
import { SmartSelectOption, SmartSelectProps } from "./types";
import { filterOptions } from "./utils";

/**
 * Controller hook: owns state + effects (search, debouncing, syncing props)
 */
export function useSmartSelectController({
  options = [],
  onSearch,
  searchable = true,
  debounceMs = 200,
}: Pick<SmartSelectProps, "options" | "onSearch" | "searchable" | "debounceMs">) {

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<SmartSelectOption[]>(options);
  const [busy, setBusy] = React.useState(false);

  // Keep local items in sync with props.options
  React.useEffect(() => {
    setItems(options);
  }, [options]);

  // Debounced async search when onSearch is provided
  React.useEffect(() => {
    if (!onSearch) return; // static list mode
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        setBusy(true);
        const res = await onSearch(query);
        if (!cancelled) setItems(res || []);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query, onSearch, debounceMs]);

  // Derived list when filtering client-side
  const filteredItems = React.useMemo(() => {
    if (onSearch) return items; // server-provided list already filtered
    if (!searchable) return items;
    return filterOptions(items, query);
  }, [items, query, onSearch, searchable]);

  return {
    open,
    setOpen,
    query,
    setQuery,
    busy,
    filteredItems,
  } as const;
}