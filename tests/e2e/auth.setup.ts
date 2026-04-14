import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const authDir = path.resolve('playwright/.auth')
const authFile = path.join(authDir, 'user.json')

function writeEmptyAuthState() {
  fs.mkdirSync(authDir, { recursive: true })
  fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
}

setup('authenticate test user', async ({ page, baseURL }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  writeEmptyAuthState()

  setup.skip(
    !email || !password,
    'Set TEST_USER_EMAIL + TEST_USER_PASSWORD to create authenticated storage state.'
  )

  await page.goto(`${baseURL ?? 'http://localhost:3001'}/login`, {
    waitUntil: 'domcontentloaded',
  })

  // MeepleGo login form has no IDs — use autocomplete attributes
  await page.locator('input[autocomplete="username"]').fill(email!)
  await page.locator('input[autocomplete="current-password"]').fill(password!)
  await page.click('button[type="submit"]')

  // After login, either stays on / or redirects to profile/homepage
  await expect
    .poll(async () => page.url(), { timeout: 30_000 })
    .toMatch(/\/$|\/profile|\/games/)

  await page.context().storageState({ path: authFile })
})
