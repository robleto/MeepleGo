import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { cookies as nextCookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>

type CookieStore = Awaited<ReturnType<typeof nextCookies>>

async function getCookieStore(): Promise<CookieStore> {
  // Next.js 15: cookies() must be awaited before using its value
  return await nextCookies()
}

export async function getSupabaseServerClient(): Promise<SupabaseServerClient> {
  const cookieStore = await getCookieStore()
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (err) {
          if (process.env.NODE_ENV === 'development')
            console.warn('Cookie set failed', err)
        }
      },
    },
  })
}

// Variant that injects an Authorization bearer token so PostgREST & RLS have auth.uid()
export async function getSupabaseServerClientWithAccessToken(
  accessToken: string
): Promise<SupabaseServerClient> {
  const cookieStore = await getCookieStore()
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (err) {
          if (process.env.NODE_ENV === 'development')
            console.warn('Cookie set failed', err)
        }
      },
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
