/**
 * Admin password reset using service role key (Option 2 workflow).
 * Usage:
 *   npm run admin:reset -- <user-id> <newPassword>
 * If omitted, falls back to env SUPABASE_TEST_USER and SUPABASE_TEST_PASSWORD.
 */
import 'dotenv/config'

const [, , userIdArg, newPasswordArg] = process.argv

const userId = userIdArg || process.env.SUPABASE_TEST_USER
const newPassword = newPasswordArg || process.env.SUPABASE_TEST_PASSWORD

if (!userId || !newPassword) {
  console.error('Usage: npm run admin:reset -- <user-id> <newPassword>')
  process.exit(1)
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const url = process.env.SUPABASE_URL || 'http://localhost:54321'

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

async function run() {
  const endpoint = `${url}/auth/v1/admin/users/${userId}`
  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    } as any,
    body: JSON.stringify({ password: newPassword }),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('Failed:', res.status, text)
    process.exit(1)
  }
  const json = await res.json()
  console.log('Password updated for user:', json.id || userId)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
