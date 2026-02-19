#!/usr/bin/env python3
"""
Backfill game provenance fields from a CSV file.

CSV columns (recommended):
  id, name, year_published, source, source_url, source_notes

Examples:
  python scripts/data-migration/backfill_game_sources.py --input data/game_sources.csv --dry-run
  python scripts/data-migration/backfill_game_sources.py --input data/game_sources.csv

Notes:
- Uses SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL from .env.local
- Updates by id if provided; otherwise matches by (name, year_published) or name only.
- Intended to gradually replace legacy_unknown with sourced material.
"""

import argparse
import csv
import json
import os
import sys
from typing import Dict, Optional

import requests


def load_env(path: str = ".env.local") -> None:
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


def build_headers(api_key: str) -> Dict[str, str]:
  return {
    "apikey": api_key,
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  }


def update_game(
  base_url: str,
  headers: Dict[str, str],
  payload: Dict[str, Optional[str]],
  game_id: Optional[str],
  name: Optional[str],
  year: Optional[str],
  dry_run: bool,
) -> None:
  if game_id:
    filter_query = f"id=eq.{game_id}"
  elif name and year:
    filter_query = f"name=eq.{requests.utils.quote(name)}&year_published=eq.{year}"
  elif name:
    filter_query = f"name=eq.{requests.utils.quote(name)}"
  else:
    print("⚠️  Skipping row with no id or name")
    return

  url = f"{base_url}/rest/v1/games?{filter_query}"

  if dry_run:
    print(f"DRY RUN: PATCH {url} -> {json.dumps(payload)}")
    return

  response = requests.patch(url, headers=headers, data=json.dumps(payload), timeout=30)
  if response.status_code >= 400:
    print(f"❌ Failed ({response.status_code}): {response.text}")
    return

  try:
    data = response.json()
  except Exception:
    data = []

  if isinstance(data, list) and len(data) != 1:
    print(f"⚠️  Updated {len(data)} rows for {name or game_id}")
  else:
    print(f"✅ Updated {name or game_id}")


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", required=True, help="Path to CSV file")
  parser.add_argument("--dry-run", action="store_true", help="Print actions without updating")
  args = parser.parse_args()

  load_env()
  supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

  if not supabase_url or not supabase_key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

  headers = build_headers(supabase_key)

  with open(args.input, "r", encoding="utf-8") as handle:
    reader = csv.DictReader(handle)
    for row in reader:
      payload = {
        "source": row.get("source") or None,
        "source_url": row.get("source_url") or None,
        "source_notes": row.get("source_notes") or None,
        "source_confidence": row.get("source_confidence") or None,
      }

      if not any(payload.values()):
        print("⚠️  Skipping row with no source data")
        continue

      update_game(
        supabase_url,
        headers,
        payload,
        row.get("id"),
        row.get("name"),
        row.get("year_published"),
        args.dry_run,
      )


if __name__ == "__main__":
  main()
