"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/components/AuthProvider"
import { useEffect, useState } from "react"
import { supabase } from "@/src/lib/supabase"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "",
    email: "",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
    projects: [
      {
        name: "Data Pegawai",
        url: "/admin/employees",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [sidebarUser, setSidebarUser] = useState(() => data.user)

  useEffect(() => {
    if (!user) {
      setSidebarUser(data.user)
      return
    }

    // derive initial display values from auth user
    const initial = {
      name: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '',
      email: user.email || '',
      avatar: (user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.avatar)) || data.user.avatar,
    }

    // If name is missing, try to fetch from `employees` table by email
    async function findEmployeeName() {
      try {
        if (initial.name) {
          setSidebarUser(initial)
          return
        }
        const { data: emp, error } = await supabase
          .from('employees')
          .select('nama, avatar')
          .eq('email', initial.email)
          .single()

        if (!error && emp) {
          setSidebarUser({ name: emp.nama || initial.email.split('@')[0], email: initial.email, avatar: emp.avatar || initial.avatar })
        } else {
          // fallback to email local-part
          setSidebarUser({ ...initial, name: initial.email ? initial.email.split('@')[0] : 'User' })
        }
      } catch (e) {
        setSidebarUser({ ...initial, name: initial.email ? initial.email.split('@')[0] : 'User' })
      }
    }

    findEmployeeName()
  }, [user])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
