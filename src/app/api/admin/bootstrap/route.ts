import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseAdmin() {
  if (!SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

export async function POST(req: Request) {
  if (!SERVICE_ROLE_KEY) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })

  const body = await req.json()
  const { email, password, nama = 'Super Admin', username } = body
  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })

  // Prevent creating more than one superadmin via this bootstrap
  const { data: existing, error: existErr } = await supabaseAdmin.from('employees').select('id').eq('role', 'superadmin').limit(1)
  if (existErr) return NextResponse.json({ error: existErr }, { status: 500 })
  if (existing && existing.length > 0) return NextResponse.json({ error: 'superadmin already exists' }, { status: 409 })

  // Create auth user via service role
  const createRes = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createRes.error) return NextResponse.json({ error: createRes.error }, { status: 500 })

  // Insert into employees table with role superadmin
  const insert = await supabaseAdmin.from('employees').insert([{ email, nama, username, role: 'superadmin' }]).select()
  if (insert.error) return NextResponse.json({ error: insert.error }, { status: 500 })

  return NextResponse.json({ ok: true, user: createRes.data.user, employee: insert.data })
}
