import { z } from "zod";
import type { ReactNode } from "react";

type EnumLike = { [k: string]: string };

type MetaItem = {
  label: string;
  icon?: ReactNode;
  // add any other UI metadata you want (color, badgeVariant, tooltip…)
};

export interface EnumMeta<E extends EnumLike> {
  enum: E;
  values: readonly E[keyof E][];
  schema: z.ZodType<E[keyof E]>;
  meta: Record<E[keyof E], MetaItem>;
  label: (v: E[keyof E]) => string;
  icon: (v: E[keyof E]) => ReactNode | undefined;
  options: () => Array<{ value: E[keyof E]; label: string; icon: ReactNode | undefined }>;
  isValid: (x: unknown) => x is E[keyof E];
}

export function createEnumMeta<E extends EnumLike>(
  enumObj: E,
  meta: Record<E[keyof E], MetaItem>,
  order?: readonly E[keyof E][]
): EnumMeta<E> {
  // runtime guard (dev)
  if (process.env.NODE_ENV !== "production") {
    const values = new Set(Object.values(enumObj));
    const keys = Object.keys(meta);
    for (const v of values) {
      if (!(v as string in meta)) {
        console.warn(`[enumMeta] Missing meta for ${String(v)}`);
      }
    }
    for (const k of keys) {
      if (!values.has(k)) {
        console.warn(`[enumMeta] Meta has extraneous key ${k}`);
      }
    }
    // Validate order array if provided
    if (order) {
      const orderSet = new Set(order);
      if (orderSet.size !== order.length) {
        console.warn(`[enumMeta] Order array contains duplicates`);
      }
      for (const v of values) {
        if (!orderSet.has(v as E[keyof E])) {
          console.warn(`[enumMeta] Order array missing enum value ${String(v)}`);
        }
      }
      for (const v of order) {
        if (!values.has(v)) {
          console.warn(`[enumMeta] Order array contains invalid value ${String(v)}`);
        }
      }
    }
  }

  // Use provided order or fall back to Object.values
  const values = order ? [...order] : (Object.values(enumObj) as (E[keyof E])[]);
  const schema = z.nativeEnum(enumObj); // perfect for TS enums

  const label = (v: E[keyof E]) => meta[v]?.label ?? String(v);
  const icon = (v: E[keyof E]) => meta[v]?.icon;

  const options = () =>
    values.map(v => ({ value: v, label: label(v), icon: icon(v) }));

  const isValid = (x: unknown): x is E[keyof E] => schema.safeParse(x).success;

  return { enum: enumObj, values, schema, meta, label, icon, options, isValid };
}

