import { SmartSelectOption } from "./types";

export function filterOptions(items: SmartSelectOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((o) => [o.label, o.meta].some((t) => (t || "").toLowerCase().includes(q)));
}