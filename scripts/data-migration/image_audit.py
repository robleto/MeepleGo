#!/usr/bin/env python3
"""Audit game images and provenance.

Outputs CSV with:
  id, name, year_published, image_url, source, source_url, source_notes

Usage:
  python3 scripts/data-migration/image_audit.py --output data/image_audit.csv
"""

import argparse
import csv
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
  }


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--output", required=True, help="Path to CSV file")
  parser.add_argument("--limit", type=int, default=2000)
  args = parser.parse_args()

  load_env()
  supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

  if not supabase_url or not supabase_key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

  headers = build_headers(supabase_key)
  url = (
    f"{supabase_url}/rest/v1/games?select=id,name,year_published,image_url,source,source_url,source_notes"
    f"&limit={args.limit}"
  )

  response = requests.get(url, headers=headers, timeout=60)
  if response.status_code >= 400:
    print(f"Failed to fetch games ({response.status_code}): {response.text}")
    sys.exit(1)

  data = response.json()

  with open(args.output, "w", newline="", encoding="utf-8") as handle:
    writer = csv.DictWriter(
      handle,
      fieldnames=[
        "id",
        "name",
        "year_published",
        "image_url",
        "source",
        "source_url",
        "source_notes",
      ],
    )
    writer.writeheader()
    for row in data:
      writer.writerow(
        {
          "id": row.get("id"),
          "name": row.get("name"),
          "year_published": row.get("year_published"),
          "image_url": row.get("image_url"),
          "source": row.get("source"),
          "source_url": row.get("source_url"),
          "source_notes": row.get("source_notes"),
        }
      )

  print(f"Wrote {len(data)} rows to {args.output}")


if __name__ == "__main__":
  main()
