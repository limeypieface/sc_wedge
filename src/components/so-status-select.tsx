"use client";

import { Label } from "@/components/ui/label";
import SmartSelect, { SmartSelectOption } from "@/components/fields/smart-select";
import { SalesOrderStatus, SalesOrderStatusMeta } from "@/types/sales-order-status";

interface SOStatusSelectProps {
  value: SalesOrderStatus;
  onChange: (value: SalesOrderStatus) => void;
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export function SOStatusSelect({
  value,
  onChange,
  label = "Status",
  showLabel = true,
  disabled = false,
}: SOStatusSelectProps) {
  const options: SmartSelectOption[] = SalesOrderStatusMeta.options().map(status => ({
    id: status.value,
    label: status.label,
    icon: status.icon,
  }));

  const selectedOption = options.find(opt => opt.id === value) || options[0] || null;

  const handleChange = (option: SmartSelectOption | null) => {
    if (option) {
      onChange(option.id as SalesOrderStatus);
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

// Display-only version for view mode
export function SOStatusDisplay({ value }: { value: SalesOrderStatus }) {
  const meta = SalesOrderStatusMeta.meta[value];

  return (
    <div className="flex items-center gap-2 text-sm text-foreground">
      {meta?.icon}
      <span>{meta?.label || value}</span>
    </div>
  );
}
