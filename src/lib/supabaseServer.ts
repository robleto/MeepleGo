import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { cookies as nextCookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Updated to async: Next 15 requires awaiting cookies()
export async function getSupabaseServerClient() {
  const cookieStore = await (nextCookies() as any)
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: any) {
        try { cookieStore.delete({ name, ...options }) } catch {}
      }
    },
  })
}
