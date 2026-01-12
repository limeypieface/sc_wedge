"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getNavItems } from "@/config/nav-items";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";

export function LeftNavMenu() {
  const [expandedNavItems, setExpandedNavItems] = useState<string[]>(['Supply']);
  const pathname = usePathname();

  const toggleNavItem = (label: string) => {
    setExpandedNavItems(prev => {
      if (prev.includes(label)) {
        return prev.filter(item => item !== label);
      } else {
        return [...prev, label];
      }
    });
  };

  const isNavItemExpanded = (label: string) => expandedNavItems.includes(label);

  const navItems = getNavItems(3); // Mock unread count

  return (
    <SidebarGroup>
      <SidebarMenu>
        {navItems.map((item) => {
          // Check if item has children (is a parent)
          if (item.children) {
            const isExpanded = isNavItemExpanded(item.label);

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  onClick={() => toggleNavItem(item.label)}
                  tooltip={item.label}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <ChevronRight className={`ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </SidebarMenuButton>

                {isExpanded && (
                  <SidebarMenuSub>
                    {item.children.map((child) => {
                      const isChildActive = child.href && pathname === child.href;

                      return (
                        <SidebarMenuSubItem key={child.label}>
                          <SidebarMenuSubButton asChild isActive={!!isChildActive}>
                            <Link href={child.href || '#'}>
                              {child.icon}
                              <span>{child.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            );
          }

          // Regular item (not a parent)
          const isActive = item.href && (pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href)));

          return (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={!!isActive} tooltip={item.label}>
                <Link href={item.href || '#'}>
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
