// Export main component as default
export { default } from "./SmartSelect";

// Export individual pieces for advanced usage
export { SmartSelectTrigger } from "./SmartSelectTrigger";
export { SmartSelectMenu } from "./SmartSelectMenu";
export { SmartSelectLink } from "./SmartSelectLink";
export { useSmartSelectController } from "./useSmartSelectController";

// Export types and utilities
export type { SmartSelectOption, SmartSelectProps } from "./types";
export { filterOptions } from "./utils";