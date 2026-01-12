"use client";

import { useTheme } from "next-themes";
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function LeftNavHeader() {
  const { resolvedTheme } = useTheme();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarHeader className="h-16 p-0 gap-0">
      <div className={`relative flex items-center h-16 px-3 transition-all duration-300 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        {!collapsed && (
          <div className="w-8 h-8 rounded-[8px] bg-sidebar-accent flex items-center justify-center">
            <div className="w-6 h-6 rounded bg-primary" />
          </div>
        )}
        {!collapsed && (
          <span style={{ fontFamily: 'Conthrax, sans-serif' }} className="font-brand text-sidebar-foreground font-semibold text-lg leading-none">
            FLOW
          </span>
        )}
        {/* Collapse/Expand Button */}
        {!collapsed ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-sidebar-accent/50 transition-colors"
              onClick={toggleSidebar}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-5 h-5 text-sidebar-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center">
            <button
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-sidebar-accent/50 transition-colors"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="w-5 h-5 text-sidebar-foreground" />
            </button>
          </div>
        )}
      </div>
    </SidebarHeader>
  );
}
