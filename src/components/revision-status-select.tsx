"use client";

import { Label } from "@/components/ui/label";
import SmartSelect, { SmartSelectOption } from "@/components/fields/smart-select";
import { RevisionStatus, RevisionStatusMeta } from "@/types/revision-status";

interface RevisionStatusSelectProps {
  value: RevisionStatus;
  onChange?: (value: RevisionStatus) => void;
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export function RevisionStatusSelect({
  value,
  onChange,
  label = "Revision Status",
  showLabel = true,
  disabled = true, // Default to disabled since revision status is workflow-driven
}: RevisionStatusSelectProps) {
  const options: SmartSelectOption[] = RevisionStatusMeta.options().map(status => ({
    id: status.value,
    label: status.label,
    icon: status.icon,
  }));

  const selectedOption = options.find(opt => opt.id === value) || options[0] || null;

  const handleChange = (option: SmartSelectOption | null) => {
    if (option && onChange) {
      onChange(option.id as RevisionStatus);
    }
  };

  return (
    <div className="space-y-2">
      {showLabel && <Label className="text-sm text-muted-foreground font-normal">{label}</Label>}
      <SmartSelect
        value={selectedOption}
        onChange={handleChange}
        options={options}
        disabled={disabled}
        placeholder="Select status"
        searchable={false}
        allowClear={false}
      />
    </div>
  );
}

// Display-only version for view mode
export function RevisionStatusDisplay({ value }: { value: RevisionStatus }) {
  const meta = RevisionStatusMeta.meta[value];

  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      {meta?.icon}
      <span>{meta?.label || value}</span>
    </div>
  );
}
