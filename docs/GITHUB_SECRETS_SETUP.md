# GitHub Secrets & Automation Setup

Operational reference for configuring and rotating the secrets used by MeepleGo GitHub Actions (nightly metadata refresh + BGG trend sync) and hardening after key exposure.

---
## 1. Required Secrets (Actions > Repository Settings > Secrets and variables > Actions)
Add each with the exact name:

| Secret Name | Purpose | Source | Required For |
|-------------|---------|--------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) | Supabase settings | All workflows, build/runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS enforced) | Supabase API settings | Frontend build / SSR in Actions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS; use only in scripts) | Supabase API settings | Backfill & trend sync scripts |
| `BGG_LIST_OWNER_ID` | UUID of system account owning BGG public lists | `profiles.id` in DB | BGG trend sync list creation |

### Optional (add only if a workflow explicitly needs them)
| Secret Name | Purpose |
|-------------|---------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | For GitHub OAuth if a workflow ever tests auth flows |
| `MEEPLEGO_BASE_URL` | Force API base URL for import endpoint if deviating from default |

---
## 2. Creating / Updating Secrets
1. Open: Repository → Settings → Secrets and variables → Actions → New repository secret.
2. Paste value (no surrounding quotes). Save.
3. Repeat for each required secret.
4. (If rotating) Leave the old secret in Supabase until new workflows succeed, then revoke old.

---
## 3. Rotating Supabase Keys (After Leak or Policy)
1. In Supabase Dashboard → Project Settings → API.
2. Regenerate: first the anon key, then the service role key.
3. Immediately update GitHub secrets with new values.
4. Update local `.env.local` (never commit) to keep local scripts working.
5. Invalidate old keys (Supabase auto-revokes the replaced tokens).
6. Trigger a manual GitHub Action (see Section 6) to confirm success.

---
## 4. Removing Leaked Secrets From Repo
If any sensitive values were committed:
1. Add to `.gitignore` (if not already):
   ```
   .env
   .env.local
   ```
2. Commit removal of tracked env files: `git rm --cached .env .env.local`.
3. (Optional history purge) Use `git filter-repo` (or GitHub’s BFG guidance) to excise the sensitive lines if the repository will be public.
4. Force-push (only if acceptable for collaborators) and notify contributors to re-clone.

---
## 5. Workflow Files Using Secrets
| Workflow | File | Secrets Consumed |
|----------|------|------------------|
| Nightly Metadata Refresh | `.github/workflows/nightly-metadata-refresh.yml` | URL, ANON, SERVICE (now also `BGG_LIST_OWNER_ID` if appended) |
| BGG Trends Sync | `.github/workflows/weekly-bgg-trends.yml` | URL, ANON, SERVICE, BGG_LIST_OWNER_ID |

Confirm each file has an "Generate .env from secrets" step writing these values to `.env` (or exports environment vars directly).

---
## 6. Manual Trigger / Validation
### A. Trigger Run
1. GitHub → Actions → Select workflow (e.g. "BGG Trends Sync").
2. Click "Run workflow" (optional inputs: set `dryRun=true` first time after rotation).

### B. Inspect Logs
Look for lines:
```
Env summary: URL=set SERVICE_ROLE=set BGG_LIST_OWNER_ID=set
Updated list BGG Hotness: <n> items
```
If you see `BGG_LIST_OWNER_ID not set` fix the secret spelling / presence.

### C. Database Spot Check
In Supabase SQL Editor:
```sql
select name, list_type, updated_at from game_lists where list_type like 'bgg_%';
select count(*) from game_list_items gli join game_lists gl on gl.id = gli.list_id where gl.list_type = 'bgg_hotness';
```
Counts > 0 confirm list population.

---
## 7. Failure Diagnostics Quick Table
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `Missing Supabase env vars` | Secret not set or misspelled | Re-add secret, re-run |
| `BGG_LIST_OWNER_ID not set – skipping public list creation` | Secret absent | Add secret |
| `invalid input value for enum list_type` | Enum migration not applied to production DB | Apply migration `20250831_extend_list_type_enum.sql` |
| Lists exist but empty | Imports failed / game ids missing | Re-run without dry-run; check for `❌` errors |
| API import path always false | Dev server not running (local) or base URL unreachable | Start local server or set `MEEPLEGO_BASE_URL` |

---
## 8. Security Hardening
- Never commit `.env` / `.env.local`.
- Restrict who can edit Actions workflows (branch protection).
- Enable Secret Scanning & Dependabot alerts.
- Consider adding a lightweight script that verifies all required secrets exist before running critical steps (fail fast).
- Service role key: treat as confidential; rotate on role changes or incident.

---
## 9. Adding a New Secret Later
1. Add to GitHub Actions Secrets.
2. Reference it in the desired workflow `env:` block.
3. (If code reads from `.env`) Append an echo line in the "Generate .env" step.
4. Document in this file (update the Required/Optional tables).

---
## 10. Minimal Local `.env.local` Example (DO NOT COMMIT)
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
BGG_LIST_OWNER_ID=uuid-of-system-profile
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
(Exclude OAuth and cookies unless actively needed.)

---
## 11. Rotation Checklist (Copy/Paste)
- [ ] Regenerate anon key
- [ ] Regenerate service role key
- [ ] Update GitHub secrets
- [ ] Update local `.env.local`
- [ ] Trigger dry-run BGG Trends workflow
- [ ] Trigger full run
- [ ] Verify lists updated
- [ ] Revoke old keys (confirm not usable)
- [ ] Commit any workflow updates (no secrets)
- [ ] Update this doc if new secrets added

---
## 12. References
- Supabase API Keys: Project Settings → API
- GitHub Secret Scanning: Settings → Code security & analysis
- Migration file adding enum values: `database/migrations/20250831_extend_list_type_enum.sql`

---
Maintainer note: update this document whenever a workflow begins consuming a new secret or when a rotation policy changes.
