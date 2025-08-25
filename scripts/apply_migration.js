#!/usr/bin/env node
/** Apply a SQL migration file (simple, sequential). Usage:
 *  node scripts/apply_migration.js scripts/migrations/20250825_add_designers_weight_summary.sql
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Pass migration file path.'); process.exit(1); }
  if (!fs.existsSync(file)) { console.error('File not found', file); process.exit(1); }
  const sql = fs.readFileSync(file,'utf8');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,{ db: { schema: 'public' } });
  // Use pg via REST: no direct multi-statement runner; split on semicolons naive
  const statements = sql.split(/;\s*\n/).map(s=>s.trim()).filter(Boolean);
  for (const stmt of statements) {
    if (!stmt) continue;
    // Use an RPC free table call via http: create a temp function would be heavy; rely on a reserved table? Can't.
    // Alternative: create a minimal function is outside scope; instruct user to run manually if this fails.
    console.log('Please run this statement manually (no direct SQL exec available via client):\n', stmt);
  }
  console.log('NOTE: Supabase JS client cannot execute arbitrary SQL directly without a defined RPC. Run migration via psql or Supabase SQL editor.');
}

main();
