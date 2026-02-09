#!/usr/bin/env python3
"""Generate a source coverage report for games."""

import argparse
import os
import sys
from collections import Counter
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
  parser.add_argument("--limit", type=int, default=2000)
  args = parser.parse_args()

  load_env()
  supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

  if not supabase_url or not supabase_key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

  headers = build_headers(supabase_key)
  url = f"{supabase_url}/rest/v1/games?select=id,source,source_confidence,image_url,mechanics,categories&limit={args.limit}"

  response = requests.get(url, headers=headers, timeout=60)
  if response.status_code >= 400:
    print(f"Failed to fetch games ({response.status_code}): {response.text}")
    sys.exit(1)

  data = response.json()

  source_counts = Counter()
  images = 0
  mechanics = 0
  categories = 0

  confidence_missing = 0
  for row in data:
    source_counts[row.get("source") or "(null)"] += 1
    if row.get("image_url"):
      images += 1
    if row.get("mechanics"):
      mechanics += 1
    if row.get("categories"):
      categories += 1
    if row.get("source_confidence") is None:
      confidence_missing += 1

  total = len(data)
  print(f"Total rows: {total}")
  print("Sources:")
  for source, count in source_counts.most_common():
    print(f"  {source}: {count}")
  print(f"With images: {images}")
  print(f"With mechanics: {mechanics}")
  print(f"With categories: {categories}")
  print(f"Missing source_confidence: {confidence_missing}")


if __name__ == "__main__":
  main()
