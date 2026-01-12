"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type VendorContact } from "@/lib/mock-data"

interface TranscriptEntry {
  id: string
  speaker: "vendor" | "user" | "system"
  text: string
  timestamp: Date
}

interface AIMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type OrderVariant = "po" | "so"

const TERMINOLOGY = {
  po: {
    connectingMessage: "Connecting to vendor...",
    speakerLabel: "vendor",
    placeholder: "Ask about the PO...",
  },
  so: {
    connectingMessage: "Connecting to customer...",
    speakerLabel: "customer",
    placeholder: "Ask about the SO...",
  },
}

interface VoipCallModalProps {
  isOpen: boolean
  onClose: () => void
  vendorContact: VendorContact
  poNumber: string
  variant?: OrderVariant
}

export function VoipCallModal({ isOpen, onClose, vendorContact, poNumber, variant = "po" }: VoipCallModalProps) {
  const terms = TERMINOLOGY[variant]
  const [callStatus, setCallStatus] = useState<"connecting" | "ringing" | "connected" | "ended">("connecting")
  const [isMuted, setIsMuted] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)

  // Simulate call connection
  useEffect(() => {
    if (!isOpen) {
      setCallStatus("connecting")
      setCallDuration(0)
      setTranscript([])
      setAiMessages([])
      return
    }

    // Connecting -> Ringing
    const connectTimer = setTimeout(() => {
      setCallStatus("ringing")
      setTranscript([{
        id: "1",
        speaker: "system",
        text: terms.connectingMessage,
        timestamp: new Date(),
      }])
    }, 1500)

    // Ringing -> Connected
    const ringTimer = setTimeout(() => {
      setCallStatus("connected")
      setTranscript(prev => [...prev, {
        id: "2",
        speaker: "system",
        text: "Call connected",
        timestamp: new Date(),
      }])
      // Simulate vendor greeting
      setTimeout(() => {
        setTranscript(prev => [...prev, {
          id: "3",
          speaker: "vendor",
          text: `Hello, this is ${vendorContact.name} from ${vendorContact.company}. How can I help you today?`,
          timestamp: new Date(),
        }])
      }, 1000)
    }, 4000)

    return () => {
      clearTimeout(connectTimer)
      clearTimeout(ringTimer)
    }
  }, [isOpen, vendorContact])

  // Call duration timer
  useEffect(() => {
    if (callStatus !== "connected") return

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [callStatus])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

  // Auto-scroll AI messages
  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [aiMessages])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleEndCall = () => {
    setCallStatus("ended")
    setTranscript(prev => [...prev, {
      id: Date.now().toString(),
      speaker: "system",
      text: "Call ended",
      timestamp: new Date(),
    }])
    setTimeout(onClose, 1500)
  }

  const handleAskAI = async () => {
    if (!aiInput.trim()) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: aiInput,
      timestamp: new Date(),
    }
    setAiMessages(prev => [...prev, userMessage])
    setAiInput("")
    setIsAiLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `Based on ${poNumber}, line 2 (PSW-102) has 1 unit in quality hold due to a failed continuity test. You may want to ask about a replacement.`,
        `The remaining 6 units of CTL004 are currently in transit via shipment SHP-003, expected to arrive Jan 28, 2026.`,
        `According to the PO terms, payment is Net 30 from receipt. The first shipment was received on Jan 17, so payment would be due around Feb 16.`,
        `There are 4 MON-275 monitors expected in shipment SHP-004, scheduled for Feb 10, 2026. No tracking number has been assigned yet.`,
      ]
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }
      setAiMessages(prev => [...prev, assistantMessage])
      setIsAiLoading(false)
    }, 1500)
  }

  // Simulate ongoing conversation with periodic vendor messages
  useEffect(() => {
    if (callStatus !== "connected") return

    const vendorPhrases = [
      "Let me check that for you...",
      "Yes, I can confirm that shipment went out on the 25th.",
      "The tracking number should be updated in your system shortly.",
      "We're still waiting on stock for the monitors, but we're on track for the February delivery.",
      "I'll send you an updated acknowledgment after this call.",
    ]

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setTranscript(prev => [...prev, {
          id: Date.now().toString(),
          speaker: "vendor",
          text: vendorPhrases[Math.floor(Math.random() * vendorPhrases.length)],
          timestamp: new Date(),
        }])
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [callStatus])

  if (!isOpen) return null

  // Minimized view - floating pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-600 text-white rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-sm font-medium">{vendorContact.name}</span>
          <span className="text-sm">{formatDuration(callDuration)}</span>
          <div className="flex gap-1 ml-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white hover:bg-green-700"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-white hover:bg-red-600"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[420px] bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center justify-between",
        callStatus === "connected" ? "bg-green-600" : "bg-primary"
      )}>
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">{vendorContact.name}</div>
            <div className="text-xs text-white/80">
              {callStatus === "connecting" && "Connecting..."}
              {callStatus === "ringing" && "Ringing..."}
              {callStatus === "connected" && formatDuration(callDuration)}
              {callStatus === "ended" && "Call ended"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Call status indicator */}
      {(callStatus === "connecting" || callStatus === "ringing") && (
        <div className="p-8 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            {callStatus === "ringing" && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping" style={{ animationDelay: "0.5s" }} />
              </>
            )}
          </div>
          <div className="text-center">
            <div className="font-medium">{vendorContact.name}</div>
            <div className="text-sm text-muted-foreground">{vendorContact.company}</div>
            <div className="text-xs text-muted-foreground mt-1">{vendorContact.phone}</div>
          </div>
          <Badge variant="outline" className="text-xs">
            {callStatus === "connecting" ? "Connecting..." : "Ringing..."}
          </Badge>
        </div>
      )}

      {/* Connected view with transcript and AI */}
      {callStatus === "connected" && (
        <div className="flex flex-col" style={{ height: "400px" }}>
          {/* Tabs for Transcript and AI Assistant */}
          <div className="flex border-b border-border">
            <button className="flex-1 px-4 py-2 text-xs font-medium border-b-2 border-primary text-primary">
              Live Transcript
            </button>
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "text-xs rounded-lg px-3 py-2",
                  entry.speaker === "vendor" && "bg-background border ml-4",
                  entry.speaker === "user" && "bg-primary text-primary-foreground mr-4",
                  entry.speaker === "system" && "text-center text-muted-foreground italic"
                )}
              >
                {entry.speaker !== "system" && (
                  <div className="font-medium mb-0.5">
                    {entry.speaker === "vendor" ? vendorContact.name : "You"}
                  </div>
                )}
                {entry.text}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {/* AI Assistant Section */}
          <div className="border-t border-border bg-background">
            <div className="px-3 py-2 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary" />
                Ask AI for help during the call
              </div>
            </div>

            {/* AI Messages */}
            {aiMessages.length > 0 && (
              <div className="max-h-24 overflow-y-auto p-2 space-y-2 bg-muted/20">
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "text-xs rounded px-2 py-1.5",
                      msg.role === "user" ? "bg-primary/10 text-primary ml-4" : "bg-background border mr-4"
                    )}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {msg.role === "assistant" ? (
                        <Bot className="w-3 h-3 text-primary" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      <span className="font-medium">{msg.role === "assistant" ? "AI" : "You"}</span>
                    </div>
                    {msg.content}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Thinking...
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>
            )}

            {/* AI Input */}
            <div className="p-2 flex gap-2">
              <Textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder={terms.placeholder}
                className="min-h-[36px] max-h-[36px] text-xs resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAskAI()
                  }
                }}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleAskAI}
                disabled={!aiInput.trim() || isAiLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Call controls */}
      {callStatus !== "ended" && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-center gap-4 bg-muted/30">
          <Button
            size="icon"
            variant={isMuted ? "destructive" : "outline"}
            className="h-12 w-12 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-14 w-14 rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  )
}
