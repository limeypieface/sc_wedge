"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRevision } from "@/context/RevisionContext"
import { User, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function UserSwitcher() {
  const { currentUser, setCurrentUser, availableUsers } = useRevision()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Simulating as:</span>
      <Select
        value={currentUser.id}
        onValueChange={(value) => {
          const user = availableUsers.find((u) => u.id === value)
          if (user) setCurrentUser(user)
        }}
      >
        <SelectTrigger className="w-[200px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center gap-2">
                {user.isApprover ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <User className="h-3.5 w-3.5 text-gray-500" />
                )}
                <span>{user.name}</span>
                {user.isApprover && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                    L{user.approverLevel}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
