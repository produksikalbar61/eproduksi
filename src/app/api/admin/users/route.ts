import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseAdmin() {
  if (!SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

async function getRequesterEmail(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  try {
    const admin = getSupabaseAdmin()
    if (!admin) return null
    const { data, error } = await admin.auth.getUser(token)
    if (error) return null
    return data.user?.email ?? null
  } catch (e) {
    return null
  }
}

async function ensureSuperadmin(req: Request) {
  if (!SERVICE_ROLE_KEY) return false
  const email = await getRequesterEmail(req)
  if (!email) return false
  const admin = getSupabaseAdmin()
  if (!admin) return false
  const { data, error } = await admin.from('employees').select('role').eq('email', email).limit(1)
  if (error || !data || data.length === 0) return false
  return data[0].role === 'superadmin'
}

export async function GET(req: Request) {
  if (!SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const ok = await ensureSuperadmin(req)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await supabaseAdmin.from('employees').select('*')
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  if (!SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const ok = await ensureSuperadmin(req)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('employees').insert([body]).select()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  if (!SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const ok = await ensureSuperadmin(req)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const supabaseAdmin2 = getSupabaseAdmin()!
  const { error } = await supabaseAdmin2.from('employees').delete().eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  if (!SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const ok = await ensureSuperadmin(req)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const { id, ...patch } = body
  if (!id) return NextResponse.json({ error: 'missing id in body' }, { status: 400 })
  const supabaseAdmin2 = getSupabaseAdmin()!
  const { data, error } = await supabaseAdmin2.from('employees').update(patch).eq('id', id).select()
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
