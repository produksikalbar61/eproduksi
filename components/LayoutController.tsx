"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { AppSidebar } from './app-sidebar'
import { SidebarProvider } from './ui/sidebar'

export function LayoutController({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const debug = searchParams?.get('debug') === '1'

  if (loading) return <div>Loading...</div>

  if (user) {
    return (
      <SidebarProvider>
        <div className={`flex w-full min-h-screen ${debug ? 'debug-layout' : ''}`}>
          <AppSidebar />
          <main className="flex-1 overflow-x-auto min-w-0 w-full max-w-none app-main">{children}</main>
        </div>
      </SidebarProvider>
    )
  }

  // Not authenticated: render children (e.g., login page) without sidebar
  return <>{children}</>
}
