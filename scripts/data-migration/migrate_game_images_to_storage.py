#!/usr/bin/env python3
"""
Migrate external game images to Supabase Storage and update DB URLs.

Usage:
  python3 scripts/data-migration/migrate_game_images_to_storage.py --dry-run --limit 25
  python3 scripts/data-migration/migrate_game_images_to_storage.py --limit 200

Notes:
- Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Uploads to storage bucket (default: game-images)
"""

import argparse
import json
import os
import re
import sys
import time
from typing import Dict, Iterable, List, Optional, Tuple

import requests


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


def build_headers(api_key: str) -> Dict[str, str]:
  return {
    "apikey": api_key,
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  }


def build_storage_headers(api_key: str, content_type: str) -> Dict[str, str]:
  return {
    "apikey": api_key,
    "Authorization": f"Bearer {api_key}",
    "Content-Type": content_type,
    "x-upsert": "true",
  }


def is_supabase_public_url(url: str, supabase_url: str, bucket: str) -> bool:
  base = supabase_url.rstrip("/")
  return url.startswith(f"{base}/storage/v1/object/public/{bucket}/")

def is_placeholder_url(url: str) -> bool:
  return "via.placeholder.com" in url


def guess_extension(url: str, content_type: Optional[str]) -> str:
  if content_type:
    ct = content_type.split(";")[0].strip().lower()
    mapping = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    }
    if ct in mapping:
      return mapping[ct]
  match = re.search(r"\.(jpg|jpeg|png|webp|gif)(\?|$)", url, re.IGNORECASE)
  if match:
    ext = match.group(1).lower()
    return "jpg" if ext == "jpeg" else ext
  return "jpg"


def fetch_games(
  base_url: str, headers: Dict[str, str], limit: int, offset: int
) -> List[Dict]:
  url = (
    f"{base_url}/rest/v1/games"
    f"?select=id,name,image_url,thumbnail_url,source,source_url,source_notes"
    f"&limit={limit}&offset={offset}"
  )
  response = requests.get(url, headers=headers, timeout=60)
  if response.status_code >= 400:
    print(f"Failed to fetch games ({response.status_code}): {response.text}")
    sys.exit(1)
  return response.json()


def upload_image(
  supabase_url: str,
  api_key: str,
  bucket: str,
  path: str,
  data: bytes,
  content_type: str,
) -> str:
  url = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{path}"
  headers = build_storage_headers(api_key, content_type)
  response = requests.post(url, headers=headers, data=data, timeout=120)
  if response.status_code >= 400:
    raise RuntimeError(f"Upload failed ({response.status_code}): {response.text}")
  return f"{supabase_url.rstrip('/')}/storage/v1/object/public/{bucket}/{path}"


def update_game(
  base_url: str,
  headers: Dict[str, str],
  game_id: str,
  payload: Dict[str, str],
  dry_run: bool,
) -> None:
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
  parser.add_argument("--limit", type=int, default=2000)
  parser.add_argument("--page-size", type=int, default=200)
  parser.add_argument("--bucket", default="game-images")
  parser.add_argument("--prefix", default="games")
  parser.add_argument("--dry-run", action="store_true")
  args = parser.parse_args()

  load_env(".env")
  load_env(".env.local")
  supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

  if not supabase_url or not supabase_key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

  headers = build_headers(supabase_key)

  total_processed = 0
  offset = 0
  page_size = args.page_size

  while total_processed < args.limit:
    batch = fetch_games(supabase_url, headers, page_size, offset)
    if not batch:
      break
    offset += page_size
    for row in batch:
      if total_processed >= args.limit:
        break
      game_id = row.get("id")
      image_url = row.get("image_url") or row.get("thumbnail_url")
      name = row.get("name") or row.get("slug") or "game"
      if not game_id or not image_url:
        continue
      if is_supabase_public_url(image_url, supabase_url, args.bucket):
        continue
      if is_placeholder_url(image_url):
        print(f"⚠️  Skipping placeholder image for {game_id}")
        continue

      try:
        resp = requests.get(image_url, timeout=60)
        if resp.status_code >= 400:
          print(f"⚠️  Failed to download ({resp.status_code}): {image_url}")
          continue
        content_type = resp.headers.get("Content-Type") or "image/jpeg"
        ext = guess_extension(image_url, content_type)
        safe = re.sub(r"[^a-z0-9]+", "-", str(name).lower()).strip("-")
        if not safe:
          safe = "game"
        safe = safe[:60]
        path = f"{args.prefix}/{safe}-{game_id}.{ext}"

        if args.dry_run:
          new_url = f"{supabase_url.rstrip('/')}/storage/v1/object/public/{args.bucket}/{path}"
          print(f"DRY RUN: upload {image_url} -> {new_url}")
        else:
          new_url = upload_image(
            supabase_url, supabase_key, args.bucket, path, resp.content, content_type
          )

        payload = {
          "image_url": new_url,
          "thumbnail_url": new_url,
          "source_notes": f"image_migrated_from={image_url}",
        }
        update_game(supabase_url, headers, game_id, payload, args.dry_run)
        total_processed += 1
        time.sleep(0.1)
      except Exception as exc:
        print(f"⚠️  Error processing {game_id}: {exc}")

    if len(batch) < page_size:
      break

  print(f"✅ Done. Migrated {total_processed} images.")


if __name__ == "__main__":
  main()
