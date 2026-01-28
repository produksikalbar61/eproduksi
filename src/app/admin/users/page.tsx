"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '../../../lib/supabase'
import { AuthGuard } from '@/components/AuthGuard'

export default function AdminUsersPage() {
  return (
    <AuthGuard>
      <AdminUsers />
    </AuthGuard>
  )
}

function AdminUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token
    const res = await fetch('/api/admin/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const data = await res.json()
    setUsers(data || [])
    setLoading(false)
  }

  async function addUser() {
    if (!name) return
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    await fetch('/api/admin/users', {
      method: 'POST',
      headers,
      body: JSON.stringify({ nama: name }),
    })
    setName('')
    fetchUsers()
  }

  async function deleteUser(id: string) {
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    fetchUsers()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Users</h1>
      <p className="mb-4">Signed in as: {user?.email ?? user?.user_metadata?.email}</p>
      <div className="mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama pegawai" className="border p-2 mr-2" />
        <button onClick={addUser} className="px-3 py-1 bg-primary text-white">Add</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-left">Nama</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id}>
                <td className="border p-2">{u.nama}</td>
                <td className="border p-2 text-center">
                  <button onClick={() => deleteUser(u.id)} className="text-destructive">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
