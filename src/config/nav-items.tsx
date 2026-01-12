import { Home, Inbox, Warehouse, Truck, Factory, Settings, ShoppingBag, Box, Scale, ArrowRightLeft, ShoppingCart, DollarSign, Store, Users, Boxes, Wrench } from "lucide-react";
import { ReactNode } from "react";

export interface NavItem {
  label: string;
  icon: ReactNode;
  href?: string;
  badge?: number;
  children?: NavItem[];
}

export function getNavItems(unreadCount: number = 0): NavItem[] {
  return [
    { label: "Home", icon: <Home className="w-4 h-4" />, href: "/" },
    {
      label: "Inbox",
      icon: <Inbox className="w-4 h-4" />,
      href: "/inbox",
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      label: "Inventory",
      icon: <Warehouse className="w-4 h-4" />,
      children: [
        {
          label: "Items",
          icon: <Box className="w-4 h-4" />,
          href: "/inventory/items"
        },
        {
          label: "Stock Balances",
          icon: <Scale className="w-4 h-4" />,
          href: "/inventory/balances"
        },
        {
          label: "Transfers",
          icon: <ArrowRightLeft className="w-4 h-4" />,
          href: "/inventory/transfers"
        },
      ]
    },
    {
      label: "Supply",
      icon: <Truck className="w-4 h-4" />,
      children: [
        {
          label: "Purchase Orders",
          icon: <ShoppingCart className="w-4 h-4" />,
          href: "/supply/purchase-orders"
        },
        {
          label: "Suppliers",
          icon: <Store className="w-4 h-4" />,
          href: "/supply/suppliers"
        },
      ]
    },
    {
      label: "Sales",
      icon: <ShoppingBag className="w-4 h-4" />,
      children: [
        {
          label: "Sales Orders",
          icon: <DollarSign className="w-4 h-4" />,
          href: "/sales/sales-orders"
        },
        {
          label: "Customers",
          icon: <Users className="w-4 h-4" />,
          href: "/sales/customers"
        },
      ]
    },
    { label: "MRP Planner", icon: <Factory className="w-4 h-4" />, href: "/planning/mrp" },
    {
      label: "Production",
      icon: <Boxes className="w-4 h-4" />,
      children: [
        {
          label: "Manufacturing Orders",
          icon: <Wrench className="w-4 h-4" />,
          href: "/production/manufacturing-orders"
        },
      ]
    },
    { label: "Settings", icon: <Settings className="w-4 h-4" />, href: "/settings" },
  ];
}
