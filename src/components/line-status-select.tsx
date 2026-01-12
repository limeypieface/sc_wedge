"use client";

import { Label } from "@/components/ui/label";
import SmartSelect, { SmartSelectOption } from "@/components/fields/smart-select";
import { LineItemStatus, LineItemStatusMeta } from "@/types/line-item-status";

interface LineStatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export function LineStatusSelect({
  value,
  onChange,
  label = "Status",
  showLabel = true,
  disabled = false,
}: LineStatusSelectProps) {
  const options: SmartSelectOption[] = LineItemStatusMeta.options().map(status => ({
    id: status.value,
    label: status.label,
    icon: status.icon,
  }));

  // Normalize value to match enum (lowercase)
  const normalizedValue = value.toLowerCase();
  const selectedOption = options.find(opt => opt.id === normalizedValue) || options[0] || null;

  const handleChange = (option: SmartSelectOption | null) => {
    if (option) {
      onChange(option.id);
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
        searchable={true}
        allowClear={false}
      />
    </div>
  );
}
