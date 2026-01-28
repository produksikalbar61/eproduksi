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

export async function POST(req: Request) {
  if (!SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })

  const requesterEmail = await getRequesterEmail(req)
  if (!requesterEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if requester is superadmin in employees table
  const { data: admins, error: adminErr } = await supabaseAdmin.from('employees').select('role,email').eq('email', requesterEmail).limit(1)
  if (adminErr) return NextResponse.json({ error: adminErr }, { status: 500 })
  const isSuper = admins && admins[0] && admins[0].role === 'superadmin'
  if (!isSuper) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { email, password, nama, nip_bps, nip, username, role = 'user' } = body
  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })

  // Create auth user via service role
  const createRes = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createRes.error) return NextResponse.json({ error: createRes.error }, { status: 500 })

  // Insert into employees table
  const insert = await supabaseAdmin.from('employees').insert([{ email, nama, nip_bps, nip, username, role }]).select()
  if (insert.error) return NextResponse.json({ error: insert.error }, { status: 500 })

  return NextResponse.json({ ok: true, user: createRes.data.user, employee: insert.data })
}
