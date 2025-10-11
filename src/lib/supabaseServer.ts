import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { cookies as nextCookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Types for the minimal subset of Next.js cookies API we rely on.
interface MinimalCookieStore {
  get: (name: string) => { name: string; value: string } | undefined
  set: (
    options: { name: string; value: string } & Partial<CookieOptions>
  ) => void
  delete: (options: { name: string } & Partial<CookieOptions>) => void
}

type SupabaseServerClient = ReturnType<typeof createServerClient<Database>>

async function getCookieStore(): Promise<MinimalCookieStore> {
  // Next.js 15: cookies() must be awaited before using its value
  const store = await (nextCookies() as unknown as Promise<MinimalCookieStore>)
  return store
}

export async function getSupabaseServerClient(): Promise<SupabaseServerClient> {
  const cookieStore = await getCookieStore()
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...(options ?? {}) })
        } catch (err) {
          if (process.env.NODE_ENV === 'development')
            console.warn('Cookie set failed', err)
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore.delete({ name, ...(options ?? {}) })
        } catch (err) {
          if (process.env.NODE_ENV === 'development')
            console.warn('Cookie delete failed', err)
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
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...(options ?? {}) })
        } catch (err) {
          if (process.env.NODE_ENV === 'development')
            console.warn('Cookie set failed', err)
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore.delete({ name, ...(options ?? {}) })
        } catch (err) {
          if (process.env.NODE_ENV === 'development')
            console.warn('Cookie delete failed', err)
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
