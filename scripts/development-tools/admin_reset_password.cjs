#!/usr/bin/env node
/**
 * Admin password reset using service role key (Option 2 workflow).
 * Usage:
 *   npm run admin:reset -- <user-id> <newPassword>
 * Env vars required:
 *   SUPABASE_URL (defaults http://localhost:54321)
 *   SUPABASE_SERVICE_ROLE_KEY
 */
require('dotenv/config')

const [, , userIdArg, newPasswordArg] = process.argv
const userId = userIdArg || process.env.SUPABASE_TEST_USER
const newPassword = newPasswordArg || process.env.SUPABASE_TEST_PASSWORD

if (!userId || !newPassword) {
  console.error('Usage: npm run admin:reset -- <user-id> <newPassword>')
  process.exit(1)
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Support either SUPABASE_URL (preferred for scripts) or NEXT_PUBLIC_SUPABASE_URL (frontend var)
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

async function run() {
  const endpoint = `${url}/auth/v1/admin/users/${userId}`
  console.log('[admin:reset] Target URL:', endpoint)
  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: newPassword })
  })
  if (!res.ok) {
    let text
    try { text = await res.text() } catch { text = '<no body>' }
    console.error('Failed', res.status, text)
    process.exit(1)
  }
  const json = await res.json()
  console.log('Password updated for user:', json.id || userId)
}

run().catch(err => { console.error(err); process.exit(1) })
