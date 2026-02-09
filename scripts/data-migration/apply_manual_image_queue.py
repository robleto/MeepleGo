#!/usr/bin/env python3
"""Apply manual image replacements from CSV.

CSV columns:
  id, name, year_published, image_url, source, source_url, source_notes, source_confidence

Usage:
  python3 scripts/data-migration/apply_manual_image_queue.py --input data/manual_image_queue.csv --dry-run
  python3 scripts/data-migration/apply_manual_image_queue.py --input data/manual_image_queue.csv
"""

import argparse
import csv
import json
import os
import sys
from typing import Dict

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


def update_game(base_url: str, headers: Dict[str, str], game_id: str, payload: Dict[str, str], dry_run: bool) -> None:
  url = f"{base_url}/rest/v1/games?id=eq.{game_id}"
  if dry_run:
    print(f"DRY RUN: PATCH {url} -> {json.dumps(payload)}")
    return
  response = requests.patch(url, headers=headers, data=json.dumps(payload), timeout=30)
  if response.status_code >= 400:
    print(f"❌ Failed ({response.status_code}): {response.text}")
    return
  print(f"✅ Updated {game_id}")


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", required=True, help="Path to CSV file")
  parser.add_argument("--dry-run", action="store_true")
  args = parser.parse_args()

  load_env()
  supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

  if not supabase_url or not supabase_key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

  headers = build_headers(supabase_key)

  with open(args.input, newline='', encoding='utf-8') as handle:
    reader = csv.DictReader(handle)
    for row in reader:
      game_id = row.get("id")
      image_url = row.get("image_url")
      if not game_id or not image_url:
        print("⚠️  Skipping row with missing id or image_url")
        continue

      payload = {
        "image_url": image_url,
        "thumbnail_url": image_url,
        "source": row.get("source") or "manual",
        "source_url": row.get("source_url") or image_url,
        "source_notes": row.get("source_notes") or "manual image replacement",
        "source_confidence": float(row.get("source_confidence") or 0.8),
      }

      update_game(supabase_url, headers, game_id, payload, args.dry_run)


if __name__ == "__main__":
  main()
