// Reusable UI Components
// Import from "@/components/ui" to use these components

// Stat Cards - for summary stat grids
export { StatCard, StatGrid, type StatCardProps, type StatGridProps } from "./stat-card"

// Expandable Cards - for collapsible panels
export {
  ExpandableCard,
  ExpandableCardGroup,
  type ExpandableCardProps,
  type ExpandableCardGroupProps,
} from "./expandable-card"

// Line Item Cards - for list items with icons, metadata, and actions
export {
  LineItemCard,
  LineItemMetadata,
  LineItemList,
  type LineItemCardProps,
  type LineItemMetadataProps,
  type LineItemListProps,
} from "./line-item-card"

// Status Badges - for status and priority indicators
export {
  StatusBadge,
  PriorityBadge,
  StatusIndicator,
  type StatusBadgeProps,
  type StatusVariant,
  type PriorityBadgeProps,
  type StatusIndicatorProps,
} from "./status-badge"

// Metadata Grid - for label/value pair displays
export {
  MetadataGrid,
  MetadataRow,
  MetadataList,
  MetadataSection,
  type MetadataItem,
  type MetadataGridProps,
  type MetadataRowProps,
  type MetadataListProps,
  type MetadataSectionProps,
} from "./metadata-grid"

// Alert Box - for alerts and variance displays
export {
  AlertBox,
  VarianceAlert,
  StatusAlert,
  type AlertBoxProps,
  type AlertVariant,
  type VarianceAlertProps,
  type StatusAlertProps,
} from "./alert-box"

// Slide Panel - for slide-out sidebars
export {
  SlidePanel,
  SlidePanelSection,
  type SlidePanelProps,
  type SlidePanelSectionProps,
} from "./slide-panel"

// Status Pill - generic status indicator
export {
  StatusPill,
  createStatusPillConfig,
  getStatusColorClasses,
  getStatusBorderClass,
  type StatusPillProps,
  type StatusPillConfig,
  type StatusItemConfig,
  type StatusPillColor,
  type StatusPillSize,
} from "./status-pill"

// Base UI components
export { Button, type ButtonProps } from "./button"
export { Badge, type BadgeProps } from "./badge"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card"
export { Separator } from "./separator"
export { Input } from "./input"
export { Label } from "./label"
export { Switch } from "./switch"
export { Progress } from "./progress"

// Feature flag components
export { Feature, FeatureGate, FeatureDebug, withFeatureFlag } from "./feature"
