"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Send, X, MessageSquare, CheckCircle, Calendar, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Note {
  id: number
  author: string
  avatar: string
  date: string
  content: string
  status: "open" | "resolved"
  mentions?: string[]
  dueDate?: string
  isActionItem?: boolean
  replies?: Reply[]
}

interface Reply {
  id: number
  author: string
  avatar: string
  date: string
  content: string
  mentions?: string[]
}

export function ActivityNoteSidebar() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      author: "Sarah Johnson",
      avatar: "SJ",
      date: "Jan 21, 11:30 AM",
      content: "@Michael Can you check on PSW-102 quality hold? Need resolution by end of week.",
      status: "open",
      mentions: ["Michael Chen"],
      dueDate: "Jan 24",
      isActionItem: true,
      replies: [
        {
          id: 1,
          author: "Michael Chen",
          avatar: "MC",
          date: "Jan 21, 12:00 PM",
          content: "On it - quality estimated resolution by Jan 24. Will follow up today.",
          mentions: [],
        },
      ],
    },
    {
      id: 2,
      author: "Michael Chen",
      avatar: "MC",
      date: "Jan 20, 02:15 PM",
      content: "MON-275 still on hold. @Sarah Need pricing confirmation from vendor.",
      status: "resolved",
      mentions: ["Sarah Johnson"],
      isActionItem: false,
      replies: [],
    },
  ])

  const [newNote, setNewNote] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [showActionOnly, setShowActionOnly] = useState(false)

  const teamMembers = ["Sarah Johnson", "Michael Chen", "John Smith", "Alex Rodriguez", "Lisa Park"]

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+\s\w+)/g
    const matches = text.match(mentionRegex) || []
    return matches.map((m) => m.slice(1)) // Remove @ symbol
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      const mentions = extractMentions(newNote)
      const hasActionIndicator = newNote.toLowerCase().includes("need") || newNote.toLowerCase().includes("please")

      setNotes([
        {
          id: notes.length + 1,
          author: "You",
          avatar: "YO",
          date: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          content: newNote,
          status: "open",
          mentions: mentions.length > 0 ? mentions : undefined,
          isActionItem: hasActionIndicator,
          replies: [],
        },
        ...notes,
      ])
      setNewNote("")
    }
  }

  const handleAddReply = (noteId: number) => {
    if (replyText.trim()) {
      const mentions = extractMentions(replyText)

      setNotes(
        notes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                replies: [
                  ...(note.replies || []),
                  {
                    id: (note.replies?.length || 0) + 1,
                    author: "You",
                    avatar: "YO",
                    date: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                    content: replyText,
                    mentions: mentions.length > 0 ? mentions : undefined,
                  },
                ],
              }
            : note,
        ),
      )
      setReplyText("")
      setReplyingTo(null)
    }
  }

  const toggleNoteStatus = (noteId: number) => {
    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, status: note.status === "open" ? "resolved" : "open" } : note,
      ),
    )
  }

  const displayNotes = showActionOnly ? notes.filter((n) => n.isActionItem && n.status === "open") : notes

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* New Note Input */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Internal Notes</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Use @name to mention teammates</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add a note... (use @name to mention: @Sarah @Michael @John"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="text-sm"
            rows={2}
          />
          <Button onClick={handleAddNote} size="sm" className="w-full gap-2" disabled={!newNote.trim()}>
            <Send className="w-3 h-3" />
            Post Note
          </Button>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setShowActionOnly(false)}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            !showActionOnly
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          }`}
        >
          All Notes
        </button>
        <button
          onClick={() => setShowActionOnly(true)}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            showActionOnly
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          }`}
        >
          Action Items
        </button>
      </div>

      {/* Notes Feed */}
      <div className="space-y-3 overflow-y-auto flex-1 px-1">
        {displayNotes.length > 0 ? (
          displayNotes.map((note) => (
            <Card key={note.id} className={note.status === "resolved" ? "opacity-60" : ""}>
              <CardContent className="p-3 space-y-2">
                {/* Note Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                      {note.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold truncate">{note.author}</p>
                        {note.isActionItem && note.status === "open" && (
                          <AlertCircle className="w-3 h-3 text-orange-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{note.date}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleNoteStatus(note.id)}
                    className="text-xs h-6 px-2 flex-shrink-0"
                    title={note.status === "open" ? "Mark resolved" : "Reopen"}
                  >
                    <CheckCircle
                      className={`w-4 h-4 ${note.status === "resolved" ? "fill-green-600 text-green-600" : "text-muted-foreground"}`}
                    />
                  </Button>
                </div>

                {/* Mentions & Due Date */}
                {(note.mentions?.length || 0 > 0 || note.dueDate) && (
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {note.mentions && note.mentions.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {note.mentions.map((mention, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs py-0.5">
                            @{mention}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {note.dueDate && (
                      <Badge className="bg-muted text-muted-foreground text-xs py-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {note.dueDate}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Note Content */}
                <p
                  className={`text-xs leading-relaxed ${note.status === "resolved" ? "line-through text-muted-foreground" : ""}`}
                >
                  {note.content}
                </p>

                {/* Replies */}
                {note.replies && note.replies.length > 0 && (
                  <div className="ml-4 pt-2 space-y-2 border-l border-border pl-3">
                    {note.replies.map((reply) => (
                      <div key={reply.id} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                            {reply.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{reply.author}</p>
                            <p className="text-xs text-muted-foreground">{reply.date}</p>
                            {reply.mentions && reply.mentions.length > 0 && (
                              <div className="flex gap-1 flex-wrap text-xs mt-1">
                                {reply.mentions.map((mention, idx) => (
                                  <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs py-0">
                                    @{mention}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <p className="text-xs mt-1 leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === note.id ? (
                  <div className="ml-4 space-y-2 pt-2 border-l border-border pl-3">
                    <textarea
                      placeholder="Reply... (@name to mention)"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="text-xs w-full px-2 py-1 rounded border border-border bg-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddReply(note.id)}
                        size="sm"
                        variant="default"
                        className="text-xs h-6"
                        disabled={!replyText.trim()}
                      >
                        Reply
                      </Button>
                      <Button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText("")
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setReplyingTo(note.id)}
                    size="sm"
                    variant="ghost"
                    className="text-xs h-6 w-full justify-start"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs">{showActionOnly ? "No action items" : "No notes yet"}</p>
          </div>
        )}
      </div>
    </div>
  )
}
