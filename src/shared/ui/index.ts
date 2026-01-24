// Reusable UI Components
// Import from "@/shared/ui" to use these components

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
export { Button, buttonVariants } from "./button"
export { Badge, badgeVariants } from "./badge"
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
export { Checkbox } from "./checkbox"
export { Textarea } from "./textarea"
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog"
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select"
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table"
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip"
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu"
export { Popover, PopoverTrigger, PopoverContent } from "./popover"
export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose } from "./sheet"
export { Avatar, AvatarImage, AvatarFallback } from "./avatar"
export { Skeleton } from "./skeleton"
export { RadioGroup, RadioGroupItem } from "./radio-group"
export { Toggle, toggleVariants } from "./toggle"
export { ToggleGroup, ToggleGroupItem } from "./toggle-group"
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog"
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./command"
export { Calendar } from "./calendar"
export { HoverCard, HoverCardTrigger, HoverCardContent } from "./hover-card"
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "./navigation-menu"
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./breadcrumb"
export { Alert, AlertTitle, AlertDescription } from "./alert"
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
} from "./form"

// Feature flag components
export { Feature, FeatureGate, FeatureDebug, withFeatureFlag } from "./feature"

// Custom components
export { LoadingModal } from "./loading-modal"
export { IronflowSpinner } from "./ironflow-spinner"
export { SpinnerIcon } from "./spinner-icon"
export { SearchButton } from "./search-button"
export { SearchCombobox } from "./search-combobox"
export { SQLDropdown } from "./sql-dropdown"
