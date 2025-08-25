#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error, count } = await supabase
    .from('games')
    .select('bgg_id,name', { count: 'exact' })
    .ilike('name', 'Golden Geek Best Print and Play Board Game%');
  if (error) throw error;
  console.log('Remaining placeholder-pattern rows:', count);
  if (data && data.length) {
    data.slice(0,10).forEach(r => console.log(r.bgg_id, r.name));
  }
})();
