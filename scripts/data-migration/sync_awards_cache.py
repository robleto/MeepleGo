#!/usr/bin/env python3
"""
Sync AwardsAPI data into Supabase awards_cache.

Usage:
  python3 scripts/data-migration/sync_awards_cache.py --dry-run
  python3 scripts/data-migration/sync_awards_cache.py --award-set "Spiel des Jahres"
  python3 scripts/data-migration/sync_awards_cache.py --limit 3

Env (from .env.local):
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  AWARDS_API_URL (optional, defaults to https://awardsapi.com/api/)
  AWARDS_API_KEY (optional)
"""

import argparse
import json
import os
import sys
import time
import re
from typing import Dict, List, Optional

import requests


DEFAULT_AWARDS_API = "https://awardsapi.com/api/"


def load_env(path: str) -> None:
  if not os.path.exists(path):
    return
  with open(path, "r", encoding="utf-8") as handle:
    for line in handle:
      line = line.strip()
      if not line or line.startswith("#") or "=" not in line:
        continue
      key, value = line.split("=", 1)
      if key and key not in os.environ:
        os.environ[key] = value.strip().strip('"').strip("'")


def build_headers(api_key: str, prefer: Optional[str] = None) -> Dict[str, str]:
  headers = {
    "apikey": api_key,
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
  }
  if prefer:
    headers["Prefer"] = prefer
  return headers


def awards_api_base() -> str:
  base = os.environ.get("AWARDS_API_BASE_URL") or os.environ.get("AWARDS_API_URL") or DEFAULT_AWARDS_API
  return base if base.endswith("/") else f"{base}/"


def build_awards_api_url(path: str = "") -> str:
  base = awards_api_base()
  if not path:
    return base.rstrip("/")
  clean_path = path.lstrip("/")
  return f"{base.rstrip('/')}/{clean_path}"


def awards_api_key() -> Optional[str]:
  return os.environ.get("AWARDS_API_KEY") or os.environ.get("NEXT_PUBLIC_AWARDS_API_KEY")


def build_headers_for_awards_api() -> Dict[str, str]:
  api_key = awards_api_key()
  headers = {}
  if api_key:
    headers["x-api-key"] = api_key
  return headers


def fetch_awards_search(
  award_set: Optional[str],
  debug: bool = False,
  year: Optional[int] = None,
  page: int = 1,
  limit: int = 200,
) -> List[Dict]:
  url = build_awards_api_url()
  params = {}
  if award_set:
    params["s"] = award_set
    params["award_set"] = award_set
  else:
    params["s"] = ""
  if year:
    params["year"] = year
  params["page"] = page
  params["limit"] = limit
  api_key = awards_api_key()
  headers = build_headers_for_awards_api()
  if api_key:
    params["apikey"] = api_key

  def request(params_override: Dict[str, any]) -> Dict:
    response = requests.get(url, params=params_override, headers=headers, timeout=60)
    response.raise_for_status()
    return response.json()

  def extract_awards(payload: Dict) -> List[Dict]:
    if isinstance(payload, list):
      return payload
    for key in ["awards", "results", "data", "items"]:
      val = payload.get(key)
      if isinstance(val, list):
        return val
    return []

  payload = request(params)
  awards = extract_awards(payload)

  if payload.get("Response") == "True" and not awards and payload.get("totalResults"):
    # Try pagination hints if API requires page params.
    fallback_params = [
      {**params, "page": page, "limit": limit},
      {**params, "page": page, "per_page": limit},
      {**params, "page": page, "page_size": limit},
    ]
    for fp in fallback_params:
      payload = request(fp)
      awards = extract_awards(payload)
      if awards:
        break

  if debug:
    print(f"ℹ️  AwardsAPI response for '{award_set}': {payload.get('Response')} ({payload.get('Error') or 'ok'})")
    print(f"ℹ️  AwardsAPI response for '{award_set}': totalResults={payload.get('totalResults')} awards={len(awards)}")
    if awards:
      print(f"ℹ️  AwardsAPI response for '{award_set}': sample keys = {sorted(awards[0].keys())}")
    else:
      try:
        print(f"ℹ️  AwardsAPI response for '{award_set}': payload keys = {sorted(payload.keys())}")
      except Exception:
        pass

  if payload.get("Response") != "True":
    return []
  return awards


def fetch_awards_by_year(year: int, debug: bool = False) -> List[Dict]:
  # Deprecated when using DB-backed /api endpoint; handled via search paging.
  return []


def load_award_sets() -> List[str]:
  root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
  awards_path = os.path.join(root, "src", "data", "awards.json")
  with open(awards_path, "r", encoding="utf-8") as handle:
    data = json.load(handle)
  award_type_map = data.get("awardTypeMap") or {}
  values = sorted(set(award_type_map.values()))
  return values


def load_year_range() -> List[int]:
  current_year = time.gmtime().tm_year
  start_year = 1970
  return list(range(start_year, current_year + 1))


def normalize_bool(value: Optional[bool], position: Optional[str], token: str) -> Optional[bool]:
  if value is True or value is False:
    return value
  if not position:
    return None
  return token.lower() in position.lower()


def normalize_award_set(value: Optional[str]) -> Optional[str]:
  if not value:
    return value
  return re.sub(r"^\s*\d{4}(?:\s*-\s*\d{4})?\s+", "", value).strip()


def build_rows(
  awards: List[Dict],
  game_id_by_name: Dict[str, str],
) -> List[Dict]:
  rows = []
  for award in awards:
    award_set_raw = award.get("awardSet") or award.get("awardSetRaw")
    award_set = normalize_award_set(award_set_raw)
    award_id = award.get("id")
    boardgames = award.get("boardgames") or []
    for game in boardgames:
      name = game.get("name")
      game_id = None
      if not game_id and name:
        key = name.strip().lower()
        game_id = game_id_by_name.get(key)
      if not award_id or not name:
        continue
      rows.append(
        {
          "award_id": award_id,
          "award_slug": award.get("slug"),
          "award_url": award.get("url"),
          "award_set": award_set or award_set_raw,
          "year": award.get("year"),
          "title": award.get("title"),
          "position": award.get("position"),
          "is_winner": normalize_bool(award.get("isWinner"), award.get("position"), "winner"),
          "is_nominee": normalize_bool(award.get("isNominee"), award.get("position"), "nominee"),
          "game_name": name,
          "game_id": game_id,
          "source": "awardsapi",
          "source_url": award.get("url"),
          "source_confidence": 0.8,
        }
      )
  return rows


def fetch_games_name_map(base_url: str, headers: Dict[str, str]) -> Dict[str, str]:
  url = f"{base_url}/rest/v1/games"
  limit = 1000
  offset = 0
  mapping: Dict[str, str] = {}
  counts: Dict[str, int] = {}
  ids_by_name: Dict[str, List[str]] = {}

  while True:
    params = {
      "select": "id,name",
      "limit": limit,
      "offset": offset,
    }
    response = requests.get(url, headers=headers, params=params, timeout=60)
    response.raise_for_status()
    data = response.json()
    if not data:
      break
    for row in data:
      name = row.get("name")
      game_id = row.get("id")
      if not name or not game_id:
        continue
      key = name.strip().lower()
      counts[key] = counts.get(key, 0) + 1
      ids_by_name.setdefault(key, []).append(game_id)
    if len(data) < limit:
      break
    offset += limit

  # Only map unique names to avoid collisions (name-only matching is risky)
  for key, count in counts.items():
    if count == 1:
      mapping[key] = ids_by_name[key][0]

  collisions = sum(1 for c in counts.values() if c > 1)
  if collisions:
    print(f"⚠️  Skipping {collisions} duplicate game names (name-only match avoided).")

  return mapping


def upsert_rows(base_url: str, headers: Dict[str, str], rows: List[Dict], dry_run: bool) -> None:
  if not rows:
    return

  url = f"{base_url}/rest/v1/awards_cache?on_conflict=award_id,game_name"
  batch_size = 200
  for i in range(0, len(rows), batch_size):
    batch = rows[i : i + batch_size]
    if dry_run:
      print(f"DRY RUN: upsert {len(batch)} rows")
      continue
    response = requests.post(url, headers=headers, data=json.dumps(batch), timeout=60)
    if response.status_code >= 400:
      print(f"❌ Failed ({response.status_code}): {response.text}")
    else:
      print(f"✅ Upserted {len(batch)} rows")
    time.sleep(0.2)


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--award-set", help="Sync only this award set (search endpoint)")
  parser.add_argument("--limit", type=int, help="Limit number of award sets processed")
  parser.add_argument("--year", type=int, help="Sync a single year via /years/{year}")
  parser.add_argument("--year-limit", type=int, help="Limit number of years processed")
  parser.add_argument(
    "--force-search-by-year",
    action="store_true",
    help="Force search endpoint paging for year sync",
  )
  parser.add_argument("--dry-run", action="store_true")
  parser.add_argument("--debug", action="store_true")
  args = parser.parse_args()

  load_env(".env")
  load_env(".env.local")
  supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
  if args.debug:
    key_present = "yes" if awards_api_key() else "no"
    print(f"ℹ️  AwardsAPI key loaded: {key_present}")

  if not supabase_url or not supabase_key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

  headers = build_headers(supabase_key, "resolution=merge-duplicates,return=minimal")
  base_url = supabase_url.rstrip("/")
  game_id_by_name = fetch_games_name_map(base_url, headers)

  total_rows = 0

  if args.year:
    years = [args.year]
  else:
    years = load_year_range()
    if args.year_limit:
      years = years[: args.year_limit]

  if args.award_set:
    award_sets = [args.award_set]
    if args.limit:
      award_sets = award_sets[: args.limit]
    for award_set in award_sets:
      print(f"🔎 Fetching {award_set}...")
      awards = fetch_awards_search(award_set, debug=args.debug)
      rows = build_rows(awards, game_id_by_name)
      total_rows += len(rows)
      upsert_rows(base_url, headers, rows, args.dry_run)
    print(f"✅ Done. Processed {len(award_sets)} award set(s), {total_rows} rows.")
    return

  for year in years:
    print(f"🗓️  Fetching year {year}...")
    page = 1
    while True:
      awards = fetch_awards_search(
        None,
        debug=args.debug,
        year=year,
        page=page,
        limit=200,
      )
      if not awards:
        break
      rows = build_rows(awards, game_id_by_name)
      total_rows += len(rows)
      upsert_rows(base_url, headers, rows, args.dry_run)
      page += 1
      time.sleep(0.15)

  print(f"✅ Done. Processed {len(years)} year(s), {total_rows} rows.")


if __name__ == "__main__":
  main()
