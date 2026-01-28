"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { AuthGuard } from '@/components/AuthGuard'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default function EmployeesPage() {
  return (
    <AuthGuard>
      <Employees />
    </AuthGuard>
  )
}

function Employees() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nama: '', email: '', nip_bps: '', nip: '', username: '', role: 'user' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    setLoading(true)
    setErrorMsg(null)
    try {
      const session = await supabase.auth.getSession()
      const token = session?.data?.session?.access_token
      const res = await fetch('/api/admin/users', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      const data = await res.json()
      if (Array.isArray(data)) setEmployees(data)
      else {
        console.error('Admin users response', data)
        setEmployees([])
        setErrorMsg(data?.error?.message ?? String(data))
      }
    } catch (e: any) {
      console.error(e)
      setErrorMsg(String(e))
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit() {
    setErrorMsg(null)
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    try {
      if (editingId) {
        await fetch('/api/admin/users', { method: 'PATCH', headers, body: JSON.stringify({ id: editingId, ...form }) })
        setEditingId(null)
      } else {
        await fetch('/api/admin/users', { method: 'POST', headers, body: JSON.stringify(form) })
      }
      setForm({ nama: '', email: '', nip_bps: '', nip: '', username: '', role: 'user' })
      fetchEmployees()
    } catch (e: any) {
      setErrorMsg(String(e))
    }
  }

  function edit(e: any) {
    setEditingId(e.id)
    setForm({ nama: e.nama ?? '', email: e.email ?? '', nip_bps: e.nip_bps ?? '', nip: e.nip ?? '', username: e.username ?? '', role: e.role ?? 'user' })
  }

  async function remove(id: string) {
    setErrorMsg(null)
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      fetchEmployees()
    } catch (e: any) {
      setErrorMsg(String(e))
    }
  }

  return (
    <div className="p-6 w-full h-full overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Data Pegawai</h1>
      <div className="mb-4" />

      <div className="mb-6">
        <Button onClick={() => { setEditingId(null); setForm({ nama: '', email: '', nip_bps: '', nip: '', username: '', role: 'user' }); setDialogOpen(true) }}>
          Tambah Pegawai
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditingId(null); setForm({ nama: '', email: '', nip_bps: '', nip: '', username: '', role: 'user' }) } setDialogOpen(open) }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Pegawai' : 'Tambah Pegawai'}</DialogTitle>
                <DialogDescription>Isi data pegawai lalu simpan.</DialogDescription>
              </DialogHeader>

              <FieldGroup>
                <div className="grid grid-cols-1 gap-3 w-full">
                  <Field>
                    <FieldLabel htmlFor="nama">Nama</FieldLabel>
                    <Input id="nama" name="nama" value={form.nama} onChange={onChange} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" value={form.email} onChange={onChange} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="nip_bps">NIP BPS</FieldLabel>
                    <Input id="nip_bps" name="nip_bps" value={form.nip_bps} onChange={onChange} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="nip">NIP</FieldLabel>
                    <Input id="nip" name="nip" value={form.nip} onChange={onChange} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input id="username" name="username" value={form.username} onChange={onChange} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="role">Role</FieldLabel>
                    <select name="role" id="role" value={form.role} onChange={onChange} className="border p-2 rounded w-full">
                      <option value="user">User</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </Field>
                </div>
              </FieldGroup>

              <DialogFooter>
                <Button onClick={async () => { await submit(); setDialogOpen(false) }}>{editingId ? 'Update' : 'Add Pegawai'}</Button>
                <Button variant="ghost" onClick={() => { setDialogOpen(false); setEditingId(null); setForm({ nama: '', email: '', nip_bps: '', nip: '', username: '', role: 'user' }) }}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation dialog */}
          <Dialog open={confirmOpen} onOpenChange={(open) => setConfirmOpen(open)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus Pegawai</DialogTitle>
                <DialogDescription>Apakah Anda yakin ingin menghapus pegawai ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={async () => {
                  if (!confirmDeleteId) return
                  try {
                    const session = await supabase.auth.getSession()
                    const token = session?.data?.session?.access_token
                    await fetch(`/api/admin/users?id=${confirmDeleteId}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                    setConfirmDeleteId(null)
                    setConfirmOpen(false)
                    fetchEmployees()
                  } catch (e: any) {
                    setErrorMsg(String(e))
                  }
                }}>Hapus</Button>
                <Button variant="ghost" onClick={() => { setConfirmOpen(false); setConfirmDeleteId(null) }}>Batal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      

      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : errorMsg ? (
        <div className="text-destructive">{errorMsg}</div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>NIP BPS</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(employees) && employees.map((e) => (
                  <TableRow key={e.id} className="odd:bg-muted">
                    <TableCell className="border">{e.nama}</TableCell>
                    <TableCell className="border">{e.email}</TableCell>
                    <TableCell className="border">{e.nip_bps}</TableCell>
                    <TableCell className="border">{e.nip}</TableCell>
                    <TableCell className="border">{e.username}</TableCell>
                    <TableCell className="border">{e.role}</TableCell>
                    <TableCell className="border text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { edit(e); setDialogOpen(true) }} aria-label="Edit">
                          <Edit2 className="size-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => { setConfirmDeleteId(e.id); setConfirmOpen(true); }} aria-label="Hapus">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
