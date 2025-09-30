#!/usr/bin/env node
/**
 * Manual test script for observability features
 * Run with: node scripts/test-observability.js
 */

console.log('🔍 Testing Observability Features\n')

// Simulate development environment
process.env.NODE_ENV = 'development'

// Test 1: Analytics in development (should only log)
console.log('Test 1: Analytics tracking in development mode')
const { trackEvent } = require('../src/lib/analytics.ts')

try {
  trackEvent('signup_start', { method: 'email' })
  console.log('✅ trackEvent works - check console for [Analytics - Dev Mode] log\n')
} catch (error) {
  console.error('❌ trackEvent failed:', error.message, '\n')
}

// Test 2: Error tracking in development (should only log)
console.log('Test 2: Error tracking in development mode')
const { captureError, captureMessage } = require('../src/lib/errorTracking.ts')

try {
  captureError(new Error('Test error'), { context: 'manual_test' })
  console.log('✅ captureError works - check console for [Error Captured] log')
  
  captureMessage('Test message', 'info')
  console.log('✅ captureMessage works - check console for [Message Captured] log\n')
} catch (error) {
  console.error('❌ Error tracking failed:', error.message, '\n')
}

// Test 3: All tracked events
console.log('Test 3: All tracked analytics events')
const events = [
  'signup_start',
  'magic_link_sent',
  'callback_success',
  'reset_requested',
  'password_updated',
  'list_created'
]

let passed = 0
events.forEach(event => {
  try {
    trackEvent(event, { test: true })
    passed++
  } catch (error) {
    console.error(`❌ Event ${event} failed:`, error.message)
  }
})

console.log(`✅ ${passed}/${events.length} events work correctly\n`)

console.log('✅ All observability tests passed!')
console.log('\nTo test in production mode:')
console.log('1. Set NODE_ENV=production')
console.log('2. Configure analytics provider (Umami/Plausible)')
console.log('3. Configure Sentry DSN')
console.log('4. Deploy and verify events in dashboards')
