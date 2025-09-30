import { test, expect } from '@playwright/test'

function buildCallbackUrl(base: string, search: string, hash: string) {
  const sParam = search
    ? search.startsWith('?')
      ? search.slice(1)
      : search
    : ''
  const sWithFlag = sParam ? `?${sParam}&e2e=1` : '?e2e=1'
  const s = sWithFlag
  const h = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : ''
  return `${base}/auth/callback${s}${h}`
}

// This suite validates that the server handler forwards to the client page
// and that the client page hydrates the session redirect flows. We do not
// need a real Supabase token to validate routing behavior; we assert the
// intermediate handoff to /auth/callback/handle and the final path.

test.describe('Auth callback routing', () => {
  test('forwards to handle and then to /update-password on recovery-ish hash', async ({
    page,
    context,
    baseURL,
  }) => {
    const base = baseURL || 'http://localhost:3001'
    // Simulate recovery with tokens present
    const url = buildCallbackUrl(
      base,
      '',
      'type=recovery&access_token=fake&refresh_token=fake'
    )

    const responses: string[] = []
    page.on('framenavigated', (frame) => {
      const u = frame.url()
      if (u.startsWith(base)) responses.push(new URL(u).pathname)
    })

    await page.goto(url)

    // We expect the first hop to /auth/callback/handle due to the server redirect
    await expect
      .poll(() => responses.includes('/auth/callback/handle'))
      .toBeTruthy()

    // The handle page should then redirect to /update-password
    await page.waitForURL('**/update-password')
    await expect(page).toHaveURL(
      new RegExp(`${base.replace(/\//g, '\\/')}/update-password`)
    )
  })

  test('forwards to handle and then to / for normal login with next missing (tokens without type)', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL || 'http://localhost:3001'
    const url = buildCallbackUrl(
      base,
      '',
      'access_token=fake&refresh_token=fake'
    )

    const paths: string[] = []
    page.on('framenavigated', (frame) => {
      const u = frame.url()
      if (u.startsWith(base)) paths.push(new URL(u).pathname)
    })

    await page.goto(url)

    await expect
      .poll(() => paths.includes('/auth/callback/handle'))
      .toBeTruthy()

    await page.waitForURL(base + '/')
    await expect(page).toHaveURL(base + '/')
  })

  test('respects next param for normal login', async ({ page, baseURL }) => {
    const base = baseURL || 'http://localhost:3001'
    const next = '/games'
    const url = buildCallbackUrl(
      base,
      `next=${encodeURIComponent(next)}`,
      'access_token=fake&refresh_token=fake'
    )

    await page.goto(url)

    await page.waitForURL(base + next)
    await expect(page).toHaveURL(base + next)
  })

  test('handles error in hash (otp_expired) and redirects to login', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL || 'http://localhost:3001'
    const url = buildCallbackUrl(
      base,
      '',
      'error=access_denied&error_description=otp_expired'
    )

    await page.goto(url)

    await page.waitForURL('**/login?**')
    const current = new URL(page.url())
    expect(current.pathname).toBe('/login')
    expect(current.searchParams.get('error')).toBe('otp_expired')
  })
})
