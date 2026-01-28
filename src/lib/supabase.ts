// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Buat client Supabase yang aman untuk dipakai di browser
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default supabase