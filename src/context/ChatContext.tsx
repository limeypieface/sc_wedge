"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  type?: "text" | "po-summary";
  metadata?: {
    poNumber?: string;
    insights?: POInsightsData;
  };
}

export interface POInsightsData {
  summary: string;
  metrics: {
    fulfillmentRate: number;
    totalLines: number;
    linesReceived: number;
    qualityHolds: number;
    openIssues: number;
  };
  issues: Array<{
    title: string;
    description: string;
    severity: "critical" | "warning" | "info";
    affectedItem: string;
  }>;
  recommendedActions: Array<{
    action: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }>;
  nextSteps: string;
}

interface ChatContextType {
  isChatVisible: boolean;
  toggleChatVisibility: () => void;
  setChatVisible: (visible: boolean) => void;
  messages: Message[];
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  requestPOSummary: (poData: PODataForSummary) => void;
  isGeneratingSummary: boolean;
}

export interface PODataForSummary {
  poNumber: string;
  status: string;
  supplier: string;
  orderDate: string;
  totalAmount: number;
  lineItems: Array<{
    id: number;
    sku: string;
    name: string;
    quantity: number;
    status: string;
    quantityOrdered?: number;
    quantityReceived?: number;
    quantityInQualityHold?: number;
    promisedDate?: string;
  }>;
  urgency: string;
  tasks?: Array<{
    id: number;
    title: string;
    status: string;
    reason?: string;
    createdBy?: string;
    suggestedAction?: string;
  }>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you today with your purchase orders or inventory?",
      timestamp: new Date(),
      type: "text",
    },
  ]);

  const toggleChatVisibility = () => {
    setIsChatVisible(prev => !prev);
  };

  const setChatVisible = (visible: boolean) => {
    setIsChatVisible(visible);
  };

  const addMessage = useCallback((message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const requestPOSummary = useCallback(async (poData: PODataForSummary) => {
    // Make sure chat is visible
    setIsChatVisible(true);
    setIsGeneratingSummary(true);

    // Add a loading message
    const loadingId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: "assistant",
      content: `Analyzing ${poData.poNumber}...`,
      timestamp: new Date(),
      type: "text",
    }]);

    try {
      // Import and call the server action
      const { generatePOInsights } = await import("@/app/actions/po-insights");
      const insights = await generatePOInsights(poData);

      // Remove loading message and add the summary
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        return [...filtered, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: insights.summary,
          timestamp: new Date(),
          type: "po-summary",
          metadata: {
            poNumber: poData.poNumber,
            insights,
          },
        }];
      });
    } catch (error) {
      console.error("Error generating PO summary:", error);
      // Remove loading message and add error
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        return [...filtered, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I encountered an error while analyzing the purchase order. Please try again.",
          timestamp: new Date(),
          type: "text",
        }];
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      isChatVisible,
      toggleChatVisibility,
      setChatVisible,
      messages,
      addMessage,
      requestPOSummary,
      isGeneratingSummary,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
