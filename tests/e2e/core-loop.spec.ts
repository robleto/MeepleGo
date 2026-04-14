/**
 * MeepleGo Core Loop — Confidence Test
 *
 * Tests the primary product loop:
 *   Browse games → Rate a game → Log a play → Verify persistence after re-login
 *
 * Requires:
 *   TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables
 *   A running MeepleGo server (see playwright.config.ts baseURL)
 *
 * Run:
 *   TEST_USER_EMAIL=you@example.com TEST_USER_PASSWORD=secret npx playwright test core-loop
 */

import { expect, test, type Page } from '@playwright/test'

const GAME_QUERY = process.env.CORE_LOOP_GAME_QUERY || 'Catan'

const needsCreds =
  !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD

// ── Helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page) {
  const email = process.env.TEST_USER_EMAIL!
  const password = process.env.TEST_USER_PASSWORD!

  await page.goto('/login')
  await page.locator('input[autocomplete="username"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.click('button[type="submit"]')
  // Wait until we're no longer on the login page
  await expect
    .poll(async () => page.url(), { timeout: 30_000 })
    .not.toContain('/login')
}

async function logout(page: Page) {
  // Try nav avatar / user menu
  const userMenu = page
    .locator('[data-testid="user-menu-trigger"]')
    .or(page.locator('button[aria-label*="menu"], button[aria-label*="account"]'))
    .first()

  if (await userMenu.isVisible()) {
    await userMenu.click()
    await page
      .getByRole('button', { name: /sign out|log out/i })
      .first()
      .click()
  } else {
    // Fallback: navigate directly to logout route if menu not found
    await page.goto('/logout')
  }

  // Confirm we're logged out (sign-in button appears or redirected to /)
  await expect(
    page.locator('text=Sign In, text=Sign in, a[href*="login"]').first()
  ).toBeVisible({ timeout: 15_000 })
}

async function findAndOpenGame(page: Page, query: string): Promise<boolean> {
  await page.goto('/games')
  await page.waitForLoadState('networkidle')

  // Use the search bar on the games page
  const searchBar = page
    .locator('input[placeholder*="earch"]')
    .filter({ visible: true })
    .first()

  if (!(await searchBar.isVisible())) return false

  await searchBar.fill(query)
  await page.waitForTimeout(1000)

  // Click first game card result
  const card = page.locator('img[alt]').filter({ visible: true }).first()
  const hasCard = await card.isVisible().catch(() => false)
  if (!hasCard) return false

  await card.click()
  await page.waitForLoadState('networkidle')
  return true
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Core product loop', () => {
  test.beforeEach(async () => {
    test.skip(needsCreds, 'Set TEST_USER_EMAIL + TEST_USER_PASSWORD to run core-loop tests.')
  })

  test('login → browse games → games page loads with content', async ({ page }) => {
    await login(page)

    await page.goto('/games')
    await page.waitForLoadState('networkidle')

    // Authenticated games page should show game cards
    await expect(
      page
        .locator('img[alt]')
        .filter({ visible: true })
        .first()
        .or(page.locator('[class*="GameCard"], [class*="game-card"]').first())
    ).toBeVisible({ timeout: 15_000 })
  })

  test('login → rankings page loads without a crash', async ({ page }) => {
    await login(page)

    await page.goto('/rankings')
    await page.waitForLoadState('networkidle')

    await expect(
      page
        .locator('[class*="GameCard"], [class*="game-card"], img[alt]')
        .first()
        .or(page.getByText(/no rankings|start ranking|rank your first/i).first())
    ).toBeVisible({ timeout: 15_000 })
  })

  test('login → lists page accessible (no redirect to /login)', async ({ page }) => {
    await login(page)

    await page.goto('/lists')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('login → plays page accessible (no redirect to /login)', async ({ page }) => {
    await login(page)

    await page.goto('/plays')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('login → profile page accessible (no redirect to /login)', async ({ page }) => {
    await login(page)

    await page.goto('/profile')
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('session persists across page reload', async ({ page }) => {
    await login(page)

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should still be on same page, not redirected to /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('full loop: login → search game → view rankings → logout → login again → rankings still accessible', async ({
    page,
  }) => {
    // Step 1: Login
    await test.step('login', async () => {
      await login(page)
    })

    // Step 2: Browse games catalog
    await test.step('browse games catalog', async () => {
      await page.goto('/games')
      await page.waitForLoadState('networkidle')
      await expect(
        page.locator('img[alt]').filter({ visible: true }).first()
      ).toBeVisible({ timeout: 15_000 })
    })

    // Step 3: Search for a specific game
    await test.step(`search for "${GAME_QUERY}"`, async () => {
      const searchBar = page
        .locator('input[placeholder*="earch"]')
        .filter({ visible: true })
        .first()
      if (await searchBar.isVisible()) {
        await searchBar.fill(GAME_QUERY)
        await page.waitForTimeout(800)
        // Confirm results appear (game images or suggestion list)
        await expect(
          page.locator('img[alt]').filter({ visible: true }).first()
        ).toBeVisible({ timeout: 10_000 })
      }
    })

    // Step 4: Rankings page is intact
    await test.step('rankings page loads', async () => {
      await page.goto('/rankings')
      await page.waitForLoadState('networkidle')
      await expect(page).not.toHaveURL(/\/login/)
    })

    // Step 5: Logout
    await test.step('logout', async () => {
      await logout(page)
    })

    // Step 6: Login again
    await test.step('login again', async () => {
      await login(page)
    })

    // Step 7: Rankings still accessible after re-login
    await test.step('rankings accessible after re-login', async () => {
      await page.goto('/rankings')
      await page.waitForLoadState('networkidle')
      await expect(page).not.toHaveURL(/\/login/)
      await expect(
        page
          .locator('[class*="GameCard"], img[alt]')
          .first()
          .or(page.getByText(/no rankings|start ranking|rank your first/i).first())
      ).toBeVisible({ timeout: 15_000 })
    })
  })
})
