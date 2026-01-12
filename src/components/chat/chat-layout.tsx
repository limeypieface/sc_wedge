"use client";

import React, { useState } from 'react';
import { useChatContext } from '@/context/ChatContext';
import { useFeatureFlag } from '@/context/FeatureFlagsContext';
import { ChatInterface } from './chat-interface';
import { Button } from '@/components/ui/button';
import { ChevronsLeft, ChevronsRight, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const { isChatVisible, toggleChatVisibility } = useChatContext();
  const [chatWidth] = useState(400);
  const { open: sidebarIsOpen } = useSidebar();

  // Feature flag for AI assistant
  const isAIAssistantEnabled = useFeatureFlag("ai_assistant");

  // If AI assistant is disabled, don't show chat at all
  const showChat = isAIAssistantEnabled && isChatVisible;
  const canToggleChat = isAIAssistantEnabled;

  return (
    <div className="flex h-full">
      {/* Chat panel - only show if AI assistant is enabled */}
      <div
        className={cn(
          "flex-shrink-0 flex flex-col bg-background z-10 border-r border-border",
          showChat ? '' : 'w-0 transition-all duration-300 ease-in-out'
        )}
        style={showChat ? { width: chatWidth, position: 'relative' } : { width: 0 }}
      >
        {/* Header with buttons */}
        {showChat && (
          <div className="flex items-center px-4 py-3 h-16 border-b border-border">
            {!sidebarIsOpen && <SidebarTrigger />}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent"
              title="New Chat"
            >
              <SquarePen className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChatVisibility}
              className="ml-auto h-8 w-8 text-primary hover:text-primary/80 transition-colors"
            >
              <ChevronsLeft className="size-5" />
            </Button>
          </div>
        )}

        {/* Chat interface */}
        {showChat && (
          <div className="flex-1 min-h-0">
            <ChatInterface />
          </div>
        )}
      </div>

      {/* Resize handle */}
      {showChat && (
        <div
          className="group relative w-1 hover:w-1.5 bg-transparent hover:bg-primary/10 transition-all duration-150 z-20 flex items-center justify-center cursor-col-resize"
          style={{ height: '100%' }}
        >
          <div className="absolute inset-y-0 w-px bg-border group-hover:bg-primary/50 transition-colors duration-150" />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative min-w-0">
        <div className="flex flex-col h-full">
          {/* Header row with optional ChevronsRight button */}
          <div className="flex flex-row items-center w-full h-16 px-4 border-b border-border">
            {/* Show open chevron when chat is hidden but AI is enabled */}
            {canToggleChat && !isChatVisible && (
              <>
                {!sidebarIsOpen && <SidebarTrigger />}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChatVisibility}
                  className="mr-2 h-8 w-8 text-primary hover:text-primary/80 transition-colors"
                >
                  <ChevronsRight className="size-5" />
                </Button>
              </>
            )}
            {/* Show sidebar trigger even when AI is disabled */}
            {!canToggleChat && !sidebarIsOpen && <SidebarTrigger />}
            <div className="flex-1" />
          </div>

          {/* Main application content */}
          <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatLayout;
