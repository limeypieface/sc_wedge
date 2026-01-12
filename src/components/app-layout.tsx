"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { FeatureFlagsProvider } from "@/context/FeatureFlagsContext";
import { ChatProvider } from "@/context/ChatContext";
import { EmailProvider } from "@/context/EmailContext";
import { IssuePanelProvider } from "@/context/IssuePanelContext";
import { RMAProvider } from "@/context/RMAContext";
import { LeftNav } from "@/components/left-nav/left-nav";
import { ChatLayout } from "@/components/chat/chat-layout";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { GlobalEmailModal } from "@/components/email-compose-modal";
import { sampleRMAs } from "@/lib/mock-data";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FeatureFlagsProvider>
        <ChatProvider>
          <EmailProvider>
            <IssuePanelProvider>
              <RMAProvider initialRMAs={sampleRMAs}>
                <Toaster position="top-right" richColors />
                <GlobalEmailModal />
                <SidebarProvider>
                  <div className="flex h-screen w-full">
                    <LeftNav />
                    <SidebarInset className="flex flex-col flex-1 min-w-0">
                      <div className="flex-1 min-h-0">
                        <ChatLayout>{children}</ChatLayout>
                      </div>
                    </SidebarInset>
                  </div>
                </SidebarProvider>
              </RMAProvider>
            </IssuePanelProvider>
          </EmailProvider>
        </ChatProvider>
      </FeatureFlagsProvider>
    </ThemeProvider>
  );
}
