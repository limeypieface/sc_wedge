"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChatContext, type Message, type POInsightsData } from "@/context/ChatContext";

function POSummaryMessage({ insights, poNumber }: { insights: POInsightsData; poNumber: string }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-xs font-medium text-primary">Assistant</span>
        <Badge variant="outline" className="text-xs">{poNumber}</Badge>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-3 border">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold">Summary</span>
        </div>
        <p className="text-sm leading-relaxed">{insights.summary}</p>
      </div>

      {/* Key Metrics */}
      <div>
        <span className="text-xs font-semibold mb-2 block">Key Metrics</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/30 rounded p-2 border">
            <div className="text-xs text-muted-foreground">Fulfillment</div>
            <div className="text-base font-semibold">{insights.metrics.fulfillmentRate}%</div>
          </div>
          <div className="bg-muted/30 rounded p-2 border">
            <div className="text-xs text-muted-foreground">Lines</div>
            <div className="text-base font-semibold">
              {insights.metrics.linesReceived}/{insights.metrics.totalLines}
            </div>
          </div>
          <div className="bg-muted/30 rounded p-2 border">
            <div className="text-xs text-muted-foreground">Quality Holds</div>
            <div className="text-base font-semibold">{insights.metrics.qualityHolds}</div>
          </div>
          <div className="bg-muted/30 rounded p-2 border">
            <div className="text-xs text-muted-foreground">Open Issues</div>
            <div className="text-base font-semibold">{insights.metrics.openIssues}</div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {insights.issues.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold">Issues ({insights.issues.length})</span>
          </div>
          <div className="space-y-2">
            {insights.issues.slice(0, 3).map((issue, idx) => (
              <div
                key={idx}
                className={`rounded p-2 border ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{issue.title}</p>
                    <p className="text-xs mt-0.5 opacity-80 line-clamp-2">{issue.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {issue.affectedItem}
                  </Badge>
                </div>
              </div>
            ))}
            {insights.issues.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{insights.issues.length - 3} more issues
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {insights.recommendedActions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold">Recommended Actions</span>
          </div>
          <div className="space-y-2">
            {insights.recommendedActions.slice(0, 3).map((action, idx) => (
              <div
                key={idx}
                className="rounded p-2 border bg-background"
              >
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium">{action.action}</p>
                      <Badge className={`text-xs py-0 ${getPriorityColor(action.priority)}`}>
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{action.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {insights.nextSteps && (
        <div className="bg-primary/5 rounded p-3 border border-primary/20">
          <span className="text-xs font-semibold block mb-1">Next Steps</span>
          <p className="text-xs leading-relaxed">{insights.nextSteps}</p>
        </div>
      )}
    </div>
  );
}

export function ChatInterface() {
  const { messages, addMessage, isGeneratingSummary } = useChatContext();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    addMessage({
      role: "user",
      content: input,
      type: "text",
    });
    setInput("");

    // Simulate assistant response
    setTimeout(() => {
      addMessage({
        role: "assistant",
        content: "I understand you're asking about that. Let me help you with your request. Is there anything specific you'd like me to look into?",
        type: "text",
      });
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: Message) => {
    if (message.type === "po-summary" && message.metadata?.insights) {
      return (
        <POSummaryMessage
          insights={message.metadata.insights}
          poNumber={message.metadata.poNumber || "Unknown"}
        />
      );
    }

    // Check if this is a loading message
    const isLoading = message.content.includes("Analyzing") && message.content.includes("...");

    return (
      <>
        {message.role === "assistant" && (
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">Assistant</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[95%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {renderMessage(message)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your purchase orders..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isGeneratingSummary}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="shrink-0"
            disabled={isGeneratingSummary || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
