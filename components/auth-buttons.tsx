"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function AuthButtons() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-14 animate-pulse rounded-md bg-secondary" />
        <div className="h-8 w-20 animate-pulse rounded-md bg-secondary" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/account">Account</Link>
        </Button>
        <form action="/auth/signout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Sign out
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/auth/login">Log in</Link>
      </Button>
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        asChild
      >
        <Link href="/auth/sign-up">Sign up free</Link>
      </Button>
    </div>
  )
}

export function MobileAuthButtons() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  if (user) {
    return (
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start text-muted-foreground"
          asChild
        >
          <Link href="/account">Account</Link>
        </Button>
        <form action="/auth/signout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground w-full"
          >
            Sign out
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-border">
      <Button
        variant="ghost"
        size="sm"
        className="justify-start text-muted-foreground"
        asChild
      >
        <Link href="/auth/login">Log in</Link>
      </Button>
      <Button
        size="sm"
        className="bg-primary text-primary-foreground"
        asChild
      >
        <Link href="/auth/sign-up">Sign up free</Link>
      </Button>
    </div>
  )
}
