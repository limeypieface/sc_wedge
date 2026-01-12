"use client"

import { ChevronDown, Settings, Home, Mail, Package, Truck, ShoppingCart, TrendingUp, Factory } from "lucide-react"
import { useState } from "react"

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState({
    inventory: true,
    supply: false,
    sales: false,
    production: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <aside className="w-56 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sidebar-primary rounded flex items-center justify-center text-sidebar-primary-foreground text-sm font-bold">
            F
          </div>
          <span className="font-bold text-lg">FLOW</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-4 px-2">
        <div className="space-y-1">
          {/* Home */}
          <NavItem icon={Home} label="Home" />
          <NavItem icon={Mail} label="Inbox" />

          {/* Inventory Section */}
          <div>
            <button
              onClick={() => toggleSection("inventory")}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded-md text-sm text-sidebar-foreground"
            >
              <Package className="w-4 h-4" />
              <span className="flex-1 text-left">Inventory</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedSections.inventory ? "rotate-180" : ""}`}
              />
            </button>
            {expandedSections.inventory && (
              <div className="ml-4 mt-1 space-y-1">
                <SubNavItem label="Items" />
                <SubNavItem label="Stock Balances" />
                <SubNavItem label="Transfers" />
              </div>
            )}
          </div>

          {/* Supply Section */}
          <div>
            <button
              onClick={() => toggleSection("supply")}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded-md text-sm text-sidebar-foreground"
            >
              <Truck className="w-4 h-4" />
              <span className="flex-1 text-left">Supply</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.supply ? "rotate-180" : ""}`} />
            </button>
            {expandedSections.supply && (
              <div className="ml-4 mt-1 space-y-1">
                <SubNavItem label="Purchase Orders" active />
                <SubNavItem label="Suppliers" />
              </div>
            )}
          </div>

          {/* Sales Section */}
          <div>
            <button
              onClick={() => toggleSection("sales")}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded-md text-sm text-sidebar-foreground"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="flex-1 text-left">Sales</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.sales ? "rotate-180" : ""}`} />
            </button>
            {expandedSections.sales && (
              <div className="ml-4 mt-1 space-y-1">
                <SubNavItem label="Sales Orders" />
                <SubNavItem label="Customers" />
              </div>
            )}
          </div>

          {/* MRP Planner */}
          <NavItem icon={TrendingUp} label="MRP Planner" />

          {/* Production Section */}
          <div>
            <button
              onClick={() => toggleSection("production")}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded-md text-sm text-sidebar-foreground"
            >
              <Factory className="w-4 h-4" />
              <span className="flex-1 text-left">Production</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedSections.production ? "rotate-180" : ""}`}
              />
            </button>
            {expandedSections.production && (
              <div className="ml-4 mt-1 space-y-1">
                <SubNavItem label="Manufacturing Orders" />
              </div>
            )}
          </div>

          {/* Settings */}
          <NavItem icon={Settings} label="Settings" />
        </div>

        {/* Conversations Label */}
        <div className="mt-6 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Conversations</div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
            CN
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Company Name</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground"}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}

function SubNavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-start px-3 py-2 rounded text-xs font-medium ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
    >
      {label}
    </button>
  )
}
