"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../src/lib/supabase"

type User = any

type AuthContextValue = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(currentUser ?? null)
      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const res = await supabase.auth.signInWithPassword({ email, password })
    if (res.error) return { error: res.error }
    setUser(res.data.user ?? null)
    return {}
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
