"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

export function InternalNotes() {
  const [notes, setNotes] = useState([
    {
      id: 1,
      author: "Sarah Johnson",
      date: "Jan 21, 11:30 AM",
      content: "Confirm remainder expected by Feb 5. Need to follow up with Daniel about PSW-102 quality hold.",
      avatar: "SJ",
    },
    {
      id: 2,
      author: "Michael Chen",
      date: "Jan 20, 02:15 PM",
      content: "Received CTL004 items successfully. One unit in PSW-102 required rework.",
      avatar: "MC",
    },
    {
      id: 3,
      author: "Sarah Johnson",
      date: "Jan 19, 09:00 AM",
      content: "Called vendor regarding MON-275. They mentioned potential stock constraints next month.",
      avatar: "SJ",
    },
  ])
  const [newNote, setNewNote] = useState("")

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([
        {
          id: notes.length + 1,
          author: "You",
          date: new Date().toLocaleString(),
          content: newNote,
          avatar: "YO",
        },
        ...notes,
      ])
      setNewNote("")
    }
  }

  return (
    <div className="space-y-4">
      {/* New Note Input */}
      <Card>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Add an internal note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button onClick={handleAddNote} size="sm" className="gap-2">
              <Send className="w-4 h-4" />
              Post Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Feed */}
      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {note.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-sm font-semibold">{note.author}</p>
                    <p className="text-xs text-muted-foreground">{note.date}</p>
                  </div>
                  <p className="text-sm text-foreground">{note.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
