"use client";

import { Label } from "@/components/ui/label";
import SmartSelect, { SmartSelectOption } from "./smart-select";
import { Control, FieldValues, Path, useController } from "react-hook-form";

interface StatusOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface StatusMetaInterface {
  options(): StatusOption[];
}

interface StatusBadgeProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  editable?: boolean;
  showLabel?: boolean;
  error?: string;
  statusMeta: StatusMetaInterface;
  defaultStatus?: string;
}

export function StatusBadge({
  label = "Status",
  value,
  onChange,
  editable = true,
  showLabel = true,
  error,
  statusMeta,
  defaultStatus,
}: StatusBadgeProps) {
  const smartSelectOptions: SmartSelectOption[] = statusMeta.options().map(status => ({
    id: status.value,
    label: status.label,
    icon: status.icon,
  }));

  const effectiveDefault = defaultStatus || smartSelectOptions[0]?.id || "";
  const effectiveValue = value || effectiveDefault;

  const selectedOption = smartSelectOptions.find(opt => opt.id === effectiveValue) ||
    smartSelectOptions.find(opt => opt.id === effectiveDefault) ||
    smartSelectOptions[0] ||
    null;

  const handleChange = (option: SmartSelectOption | null) => {
    if (onChange) {
      onChange(option?.id || effectiveDefault);
    }
  };

  if (!editable) {
    return (
      <div className="space-y-2">
        {showLabel && <Label className="text-sm text-muted-foreground font-normal">{label}</Label>}
        <div className="flex items-center gap-2 text-sm text-foreground">
          {selectedOption?.icon}
          <span>{selectedOption?.label}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && <Label>{label}</Label>}
      <SmartSelect
        value={selectedOption}
        onChange={handleChange}
        options={smartSelectOptions}
        disabled={!editable}
        placeholder="Select status"
        className={error ? "border-destructive" : ""}
        searchable={true}
        allowClear={false}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

/** RHF-aware wrapper (use this in forms) */
export function StatusBadgeField<T extends FieldValues>({
  name,
  control,
  label = "Status",
  editable = true,
  showLabel = true,
  statusMeta,
  defaultStatus,
  mode = 'edit',
}: {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  editable?: boolean;
  showLabel?: boolean;
  statusMeta: StatusMetaInterface;
  defaultStatus?: string;
  mode?: 'create' | 'view' | 'edit';
}) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error },
  } = useController<T>({ name, control });

  // In view mode, force editable to false
  const isEditable = mode === 'view' ? false : editable;

  return (
    <div onBlur={onBlur}>
      <StatusBadge
        label={label}
        value={value as string | undefined}
        onChange={onChange}
        editable={isEditable}
        showLabel={showLabel}
        error={error?.message}
        statusMeta={statusMeta}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}