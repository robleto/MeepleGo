# MeepleGo RLS Architecture

This document provides a visual overview of the Row Level Security architecture in MeepleGo.

## Table Access Patterns

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER-PRIVATE TABLES                               │
│                    (Users own and access only their data)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐                    │
│  │ profiles │  │ rankings │  │ awards │  │ play_logs │                    │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └─────┬─────┘                    │
│       │             │             │              │                          │
│       └─────────────┴─────────────┴──────────────┘                          │
│                           │                                                 │
│                    RLS: user_id = auth.uid()                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    PUBLIC VIEW / PRIVATE OWNERSHIP                          │
│           (Users own data, but others can view public items)                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐         ┌─────────────────┐                             │
│  │  game_lists   │────────▶│ game_list_items │                             │
│  │  (is_public)  │         │  (via list_id)  │                             │
│  └───────┬───────┘         └────────┬────────┘                             │
│          │                          │                                       │
│   SELECT: is_public=true      SELECT: parent list                           │
│           OR user_id=me              is_public=true                         │
│                                      OR user_id=me                           │
│   MODIFY: user_id=me          MODIFY: parent list                           │
│                                      user_id=me                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC READ-ONLY TAXONOMY                           │
│              (All users read, only service role writes)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐  ┌───────────┐  ┌────────────┐                             │
│  │ categories │  │ mechanics │  │ publishers │                             │
│  └──────┬─────┘  └─────┬─────┘  └──────┬─────┘                             │
│         │              │                │                                   │
│         └──────────────┴────────────────┘                                   │
│                        │                                                    │
│                 RLS: SELECT for all                                         │
│                      (no INSERT/UPDATE/DELETE)                              │
│                                                                             │
│  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐          │
│  │ game_categories  │  │ game_mechanics  │  │ game_publishers  │          │
│  └────────┬─────────┘  └────────┬────────┘  └────────┬─────────┘          │
│           │                     │                     │                     │
│           └─────────────────────┴─────────────────────┘                     │
│                                 │                                           │
│                          RLS: SELECT for all                                │
│                               (read-only)                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTENTIONALLY PUBLIC                               │
│                      (No RLS, public catalog data)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌────────────────┐                                  │
│                         │     games      │                                  │
│                         │  (no RLS!)     │                                  │
│                         └────────────────┘                                  │
│                                                                             │
│            All users can SELECT, service role can MODIFY                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Policy Patterns

### Pattern 1: User Ownership
**Used by:** profiles, rankings, awards, play_logs (private mode)

```sql
-- SELECT: Can only view own records
CREATE POLICY "..." ON table_name
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: Can only create records for self
CREATE POLICY "..." ON table_name
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: Can only modify own records
CREATE POLICY "..." ON table_name
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE: Can only delete own records
CREATE POLICY "..." ON table_name
  FOR DELETE USING (user_id = auth.uid());
```

### Pattern 2: Public + Owner
**Used by:** game_lists, play_logs (public mode)

```sql
-- SELECT: Can view public records OR own records
CREATE POLICY "..." ON table_name
  FOR SELECT USING (
    is_public = true OR user_id = auth.uid()
  );

-- MODIFY: Only owner can modify
CREATE POLICY "..." ON table_name
  FOR UPDATE USING (user_id = auth.uid());
```

### Pattern 3: Cascading Permissions
**Used by:** game_list_items (inherits from parent list)

```sql
-- SELECT: Can view if parent allows viewing
CREATE POLICY "..." ON game_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM game_lists 
      WHERE game_lists.id = game_list_items.list_id 
      AND (game_lists.is_public = true OR game_lists.user_id = auth.uid())
    )
  );

-- MODIFY: Can modify if you own parent
CREATE POLICY "..." ON game_list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM game_lists 
      WHERE game_lists.id = game_list_items.list_id 
      AND game_lists.user_id = auth.uid()
    )
  );
```

### Pattern 4: Public Read-Only
**Used by:** taxonomy tables (categories, mechanics, publishers)

```sql
-- SELECT: Everyone can read
CREATE POLICY "..." ON table_name
  FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE policies = service role only
```

## Security Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION                        │
│                                                              │
│  ┌────────────┐                                              │
│  │ auth.users │  Supabase Auth                               │
│  └─────┬──────┘                                              │
│        │                                                     │
│        ├──▶ auth.uid() returns current user's UUID          │
│        │                                                     │
│        └──▶ Used in all RLS policies                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      ROW LEVEL SECURITY                      │
│                                                              │
│  Every query is filtered by:                                 │
│  • User's identity (auth.uid())                              │
│  • Table's RLS policies                                      │
│  • Data ownership rules                                      │
│                                                              │
│  Enforced at database level (cannot be bypassed)             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│                                                              │
│  API Routes (Next.js):                                       │
│  • GET /api/play-logs  ─────▶ RLS filters results           │
│  • POST /api/play-logs ─────▶ RLS validates ownership       │
│  • PATCH /api/play-logs ────▶ RLS enforces permissions      │
│  • DELETE /api/play-logs ───▶ RLS prevents unauthorized     │
│                                                              │
│  RLS is PRIMARY security, API is secondary validation        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Creating a Play Log

```
┌─────────────┐
│   User A    │
│ (logged in) │
└──────┬──────┘
       │
       │ POST /api/play-logs
       │ { game_id: "...", notes: "..." }
       │
       ▼
┌──────────────────────────────────────┐
│     API Route Handler                │
│  • Gets user from session            │
│  • Sets user_id = session.user.id    │
└──────┬───────────────────────────────┘
       │
       │ INSERT INTO play_logs
       │ VALUES (user_id: "user-a", ...)
       │
       ▼
┌──────────────────────────────────────┐
│     RLS Policy Check                 │
│  • Policy: user_id = auth.uid()      │
│  • Check: "user-a" = "user-a" ✓      │
│  • ALLOW insert                      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│     Database                         │
│  • Row inserted successfully         │
│  • Only User A can see this row      │
└──────────────────────────────────────┘
```

## Attempted Attack Example: Unauthorized Access

```
┌─────────────┐
│   User B    │
│ (logged in) │
└──────┬──────┘
       │
       │ GET /api/play-logs
       │ ?userId=user-a (trying to see User A's logs)
       │
       ▼
┌──────────────────────────────────────┐
│     API Route Handler                │
│  • Recognizes userId parameter       │
│  • Applies filter: userId = "user-a" │
└──────┬───────────────────────────────┘
       │
       │ SELECT * FROM play_logs
       │ WHERE user_id = "user-a"
       │
       ▼
┌──────────────────────────────────────┐
│     RLS Policy Check                 │
│  • Policy: user_id = auth.uid()      │
│          OR is_public = true         │
│  • Check: "user-a" = "user-b" ✗      │
│  • Only returns rows where:          │
│    - user_id = "user-b" OR           │
│    - is_public = true                │
│  • FILTER applied automatically      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│     Result                           │
│  • User B only sees:                 │
│    - Their own logs                  │
│    - User A's PUBLIC logs            │
│  • User A's private logs HIDDEN      │
│  • Security enforced at DB level     │
└──────────────────────────────────────┘
```

## Key Takeaways

1. **RLS is enforced at the database level** - Application code cannot bypass it
2. **Every query is automatically filtered** - No need to add WHERE clauses in app code
3. **auth.uid() is the source of truth** - Supabase Auth provides user context
4. **Policies are evaluated with OR logic** - Multiple policies for same operation
5. **Service role bypasses RLS** - Use carefully and only in admin operations

## Related Documentation

- [RLS_VALIDATION_REPORT.md](./RLS_VALIDATION_REPORT.md) - Detailed policy analysis
- [RLS_MIGRATION_GUIDE.md](./RLS_MIGRATION_GUIDE.md) - How to apply migrations
- [RLS_VALIDATION_TESTS.sql](./RLS_VALIDATION_TESTS.sql) - Test queries

---

**Last Updated:** 2024-09-30
