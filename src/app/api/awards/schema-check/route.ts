import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabaseServer'

// GET /api/awards/schema-check
// Introspects awards table & policies to detect migration drift.
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth
      .getSession()
      .catch(() => ({ data: { session: null } }))

    // columns
    let cols: any = null
    let colErr: any = null
    try {
      const resp: any = await (supabase as any).rpc('introspect_awards_columns')
      cols = resp.data
      colErr = resp.error
    } catch {}
    // If no RPC, fallback to direct query via sql() isn't available in client; so use a regular select from information_schema through REST? Not directly.
    // Workaround: attempt selecting * limit 0 from awards to infer keys from first row.
    // If cols failed, fetch one row.
    let columnNames: string[] = []
    if (!colErr && Array.isArray(cols)) {
      columnNames = cols as string[]
    } else {
      const { data: one } = await supabase.from('awards').select('*').limit(1)
      if (one && one[0]) columnNames = Object.keys(one[0])
    }

    const expected = [
      'id',
      'user_id',
      'year',
      'category',
      'nominees',
      'winner_id',
      'created_at',
      'updated_at',
      'manual_override',
      'threshold_used',
      'refreshed_at',
      'stale',
    ]
    const missing = expected.filter((c) => !columnNames.includes(c))
    const legacy = ['profile_id', 'nominee_ids'].filter((c) =>
      columnNames.includes(c)
    )

    // Policies: we cannot query pg_policies via anon key unless service role or elevated; attempt and tolerate failure.
    let policies: any[] = []
    try {
      const { data: pol } = await (supabase as any)
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'awards')
      policies = pol || []
    } catch {}

    const userIdPolicyPresent = policies.some((p) =>
      /user_id\s*=\s*auth\.uid\(\)/i.test(JSON.stringify(p))
    )
    const profileIdPolicyPresent = policies.some((p) =>
      /profile_id\s*=\s*auth\.uid\(\)/i.test(JSON.stringify(p))
    )

    const emptyDetected = columnNames.length === 0
    const authLikelyMissing = emptyDetected && !session
    return NextResponse.json({
      ok: true,
      sessionUserId: session?.user?.id || null,
      columns: columnNames.sort(),
      missing,
      legacy,
      policyScan: {
        checked: policies.length > 0,
        userIdPolicyPresent,
        profileIdPolicyPresent,
        policyCount: policies.length,
      },
      hints: {
        authLikelyMissing,
        emptyTable: emptyDetected && !!session && legacy.length === 0,
        message: authLikelyMissing
          ? 'No server session detected; RLS returned 0 rows so columns could not be inferred.'
          : emptyDetected
            ? 'Awards table has no rows yet; generate awards to confirm columns.'
            : null,
      },
      needsAction:
        missing.length > 0 ||
        legacy.length > 0 ||
        profileIdPolicyPresent ||
        !userIdPolicyPresent,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message, stack: e.stack },
      { status: 500 }
    )
  }
}
