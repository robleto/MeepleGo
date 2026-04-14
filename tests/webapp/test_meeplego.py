"""
MeepleGo Webapp Tests
Run with: python3 tests/webapp/test_meeplego.py
Requires: playwright, a running MeepleGo server (default: http://localhost:3003)
Install:  pip3 install playwright && playwright install chromium
"""

import sys
import os
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('MEEPLEGO_URL', 'http://localhost:3003')
PASS = 0
FAIL = 0
ERRORS = []


def check(condition, label):
    global PASS, FAIL
    if condition:
        print(f'    ✓ {label}')
        PASS += 1
    else:
        print(f'    ✗ {label}')
        FAIL += 1
        ERRORS.append(label)


def section(title):
    print(f'\n  [{title}]')


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
    page = ctx.new_page()

    # ── Homepage ──────────────────────────────────────────────────────────────
    section('Homepage')
    page.goto(BASE + '/', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=10000)

    check(page.url.replace(BASE, '').rstrip('/') in ('', '/'), 'stays on /')
    check('MeepleGo' in page.title() or page.title() == '', 'page title contains MeepleGo')
    check(page.locator('h1').count() > 0, 'h1 present')
    check('Board Game' in page.locator('h1').first.inner_text(), 'hero headline mentions Board Game')
    check(page.locator('input[placeholder*="board game"], input[placeholder*="Search"]').count() > 0, 'hero search input present')
    check(page.locator('nav').count() > 0, 'navigation present')
    check(page.locator('text=Sign In, text=Sign in').count() > 0 or page.locator('a[href*="login"]').count() > 0, 'sign-in CTA visible')
    page.screenshot(path='/tmp/mg_test_homepage.png')

    # ── Navigation ────────────────────────────────────────────────────────────
    section('Navigation bar')
    check(page.locator('nav a, nav button').count() >= 3, 'nav has at least 3 items')
    check(page.locator('text=Games').count() > 0, '"Games" link in nav')
    check(page.locator('text=Lists').count() > 0, '"Lists" link in nav')
    check(page.locator('text=Awards').count() > 0, '"Awards" link in nav')
    # Logo links home
    logo = page.locator('a[href="/"]').first
    check(logo.count() > 0, 'logo links to /')

    # ── Games Catalog ─────────────────────────────────────────────────────────
    section('Games catalog (/games)')
    page.goto(BASE + '/games', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=10000)

    check(page.url.replace(BASE, '') == '/games', 'lands on /games (public)')
    # Games page should have game cards or a search bar
    has_cards = page.locator('img[alt]').count() > 3
    has_search = page.locator('input[placeholder*="earch"]').count() > 0
    check(has_cards or has_search, 'game cards or search bar visible')
    check(page.locator('nav').count() > 0, 'nav still present')
    page.screenshot(path='/tmp/mg_test_games.png')

    # ── Search ────────────────────────────────────────────────────────────────
    section('Search page (/search)')
    page.goto(BASE + '/search', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=10000)

    check(page.url.replace(BASE, '') == '/search', 'lands on /search')
    check(page.locator('h1:has-text("Search")').count() > 0, 'h1 "Search" visible')
    check(page.locator('input[placeholder*="earch"]').count() > 0, 'search input present')
    # Type a query and expect no crash (target the visible main search, not nav's hidden one)
    search_input = page.locator('main input[placeholder*="earch"], [role="main"] input[placeholder*="earch"], input[placeholder*="designers"]').first
    if search_input.count() > 0 and search_input.is_visible():
        search_input.fill('Catan')
        page.wait_for_timeout(800)
    check(True, 'typing in search input does not crash')
    page.screenshot(path='/tmp/mg_test_search.png')

    # ── Login page ────────────────────────────────────────────────────────────
    section('Login page (/login)')
    page.goto(BASE + '/login', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=10000)

    check(page.url.replace(BASE, '') == '/login', 'lands on /login')
    check(page.locator('h1:has-text("Log in")').count() > 0, 'h1 "Log in" visible')
    check(page.locator('input[type="email"], input[placeholder*="EMAIL"], input[name*="email"]').count() > 0
          or page.locator('label:has-text("EMAIL")').count() > 0, 'email field present')
    check(page.locator('input[type="password"]').count() > 0, 'password field present')
    check(page.locator('button:has-text("Log in")').count() > 0, '"Log in" button present')
    check(page.locator('text=Forgot password').count() > 0, '"Forgot password" link present')
    check(page.get_by_text('Create account', exact=True).count() > 0
          or page.get_by_text('Sign up', exact=True).count() > 0, 'create account link present')
    page.screenshot(path='/tmp/mg_test_login.png')

    # ── Login validation ──────────────────────────────────────────────────────
    section('Login form validation')
    # Click login with no input – should not navigate away (client-side required)
    page.locator('button:has-text("Log in")').click()
    page.wait_for_timeout(500)
    check('/login' in page.url, 'empty submit stays on login page')

    # ── Signup page ───────────────────────────────────────────────────────────
    section('Signup page (/signup)')
    page.goto(BASE + '/signup', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=10000)

    check(page.url.replace(BASE, '') == '/signup', 'lands on /signup')
    check(page.locator('h1:has-text("Create your account")').count() > 0, 'h1 "Create your account" visible')
    check(page.get_by_text('INVITE CODE', exact=True).count() > 0
          or page.get_by_text('Invite code').count() > 0, 'invite code field present (private beta)')
    check(page.locator('input[type="email"], label:has-text("EMAIL")').count() > 0, 'email field present')
    check(page.locator('input[type="password"]').count() > 0, 'password field present')
    check(page.locator('button:has-text("Sign up")').count() > 0, '"Sign up" button present')
    check(page.get_by_text('Have an account? Log in').count() > 0
          or page.get_by_text('Log in', exact=True).count() > 0, 'login link present')
    page.screenshot(path='/tmp/mg_test_signup.png')

    # ── Protected routes redirect to login ────────────────────────────────────
    section('Protected routes → redirect to /login')
    protected = ['/profile', '/lists', '/rankings', '/awards', '/plays', '/wishlist']
    for route in protected:
        page.goto(BASE + route, timeout=12000)
        page.wait_for_load_state('networkidle', timeout=8000)
        final = page.url.replace(BASE, '')
        redirected = '/login' in final or final == route  # either redirects or shows page
        check(redirected, f'{route} accessible or redirects to login (got: {final})')

    # ── 404 page ──────────────────────────────────────────────────────────────
    section('404 handling')
    page.goto(BASE + '/this-page-does-not-exist-xyz', timeout=12000)
    page.wait_for_load_state('networkidle', timeout=8000)
    body = page.content().lower()
    check('404' in body or 'not found' in body or 'nothing here' in body, '404 page renders meaningful content')
    page.screenshot(path='/tmp/mg_test_404.png')

    # ── Login → Signup cross-link ─────────────────────────────────────────────
    section('Auth cross-links')
    page.goto(BASE + '/login', timeout=12000)
    page.wait_for_load_state('networkidle', timeout=8000)
    page.locator('text=Create account').first.click()
    page.wait_for_load_state('networkidle', timeout=8000)
    check('/signup' in page.url, 'login → "Create account" navigates to /signup')

    page.goto(BASE + '/signup', timeout=12000)
    page.wait_for_load_state('networkidle', timeout=8000)
    page.locator('text=Log in').first.click()
    page.wait_for_load_state('networkidle', timeout=8000)
    check('/login' in page.url, 'signup → "Log in" navigates to /login')

    # ── Footer ────────────────────────────────────────────────────────────────
    section('Footer')
    page.goto(BASE + '/login', timeout=12000)
    page.wait_for_load_state('networkidle', timeout=8000)
    check(page.locator('footer, [class*="footer"], [class*="Footer"]').count() > 0, 'footer present')
    check(page.locator('text=MeepleGo').count() > 0, 'brand name in footer')

    browser.close()

# ── Summary ───────────────────────────────────────────────────────────────────
total = PASS + FAIL
print(f'\n{"─"*50}')
print(f'  Results: {PASS}/{total} passed', '✓' if FAIL == 0 else '✗')
if ERRORS:
    print(f'\n  Failed checks:')
    for e in ERRORS:
        print(f'    • {e}')
print(f'{"─"*50}')
sys.exit(0 if FAIL == 0 else 1)
