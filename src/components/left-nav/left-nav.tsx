"use client";

import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { LeftNavHeader } from "./left-nav-header";
import { LeftNavMenu } from "./left-nav-menu";
import { LeftNavFooter } from "./left-nav-footer";

export function LeftNav() {
  return (
    <Sidebar collapsible="offcanvas">
      <LeftNavHeader />

      <SidebarContent className="pl-1">
        <LeftNavMenu />
      </SidebarContent>

      <LeftNavFooter />
    </Sidebar>
  );
}
