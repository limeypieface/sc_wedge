import * as React from "react";

export type SmartSelectOption = {
  id: string;
  label: string;
  selectedLabel?: string; // text displayed in trigger when selected; defaults to label if unset
  icon?: React.ReactNode; // e.g., an emoji or <Avatar/>
  meta?: string; // secondary text shown in list
};

export type SmartSelectProps = {
  value: SmartSelectOption | null;
  options?: SmartSelectOption[]; // optional static list
  onSearch?: (query: string) => Promise<SmartSelectOption[]>; // optional async search
  onChange: (next: SmartSelectOption | null) => void;
  hrefFor?: (id: string) => string | null; // optional link for current value
  renderPreview?: (option: SmartSelectOption) => React.ReactNode; // hover preview card
  placeholder?: string;
  emptyText?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  searchable?: boolean; // default: true
  allowClear?: boolean; // show a "No value" option
  onCreateNew?: (query: string) => void; // optional create-new callback
  createLabel?: string;
  debounceMs?: number; // default: 200ms
};