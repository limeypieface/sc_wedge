"use client";

import Link from "next/link";
import { HelpCircle, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarFooter } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LeftNavFooter() {
  const companyName = "Acme Corp";
  const companyInitials = "AC";

  return (
    <SidebarFooter className="">
      <div className="flex items-center gap-3 p-4">
        <Avatar className="rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">{companyInitials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 group-data-[state=collapsed]:hidden">
          <div className="text-sm font-medium text-sidebar-foreground">{companyName}</div>
        </div>
        <div className="flex items-center gap-1 group-data-[state=collapsed]:hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings?section=features"
                  className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Settings & Feature Flags</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </SidebarFooter>
  );
}
