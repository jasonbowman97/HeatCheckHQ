// ============================================================
// components/bet-board/member-bar.tsx — Member avatars with roles
// ============================================================
// Horizontal row of member avatars/initials with role badges.

"use client"

import { Users } from "lucide-react"
import type { BetBoardMember } from "@/types/innovation-playbook"

interface MemberBarProps {
  members: BetBoardMember[]
}

export function MemberBar({ members }: MemberBarProps) {
  if (members.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex -space-x-1.5">
        {members.slice(0, 8).map(member => (
          <MemberAvatar key={member.userId} member={member} />
        ))}
        {members.length > 8 && (
          <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
            <span className="text-[9px] font-bold text-muted-foreground">+{members.length - 8}</span>
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground">
        {members.length} member{members.length !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

function MemberAvatar({ member }: { member: BetBoardMember }) {
  const initials = member.displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleBorderColor = member.role === 'owner' ? 'border-primary' :
    member.role === 'editor' ? 'border-blue-400' : 'border-border'

  return (
    <div
      className={`w-7 h-7 rounded-full border-2 ${roleBorderColor} bg-muted flex items-center justify-center cursor-default`}
      title={`${member.displayName} (${member.role})`}
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatarUrl} alt={member.displayName} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span className="text-[9px] font-bold text-muted-foreground">{initials}</span>
      )}
    </div>
  )
}
