import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser-safe client (RLS applies — anon role)
export const supabase = createClient(supabaseUrl, anonKey)

// Server-only client (service role — bypasses RLS). NEVER import from a client component.
export function serverClient() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

export type * from './types'
