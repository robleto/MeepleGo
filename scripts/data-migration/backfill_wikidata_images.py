#!/usr/bin/env python3
"""
Backfill only images from Wikidata/Commons (BGG-free).

Usage:
  python3 scripts/data-migration/backfill_wikidata_images.py --input data/game_sources.csv --limit 100
"""

import argparse
import csv
import json
import os
import re
import sys
import time
from typing import Any, Dict, Optional

import requests

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "MeepleGo/1.0 (+https://meeplego.com) wikidata-images"


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


def sparql(query: str) -> Dict[str, Any]:
  url = f"{SPARQL_ENDPOINT}?format=json&query={requests.utils.quote(query)}"
  headers = {
    "Accept": "application/sparql-results+json",
    "User-Agent": USER_AGENT,
  }
  response = requests.get(url, headers=headers, timeout=60)
  response.raise_for_status()
  return response.json()


def extract_qid(value: str) -> Optional[str]:
  match = re.search(r"Q\d+$", value)
  return match.group(0) if match else None


def normalize_title(value: str) -> str:
  return re.sub(r"\s+", " ", value.strip()).lower()


def pick_best_match(bindings, name: str, year: Optional[int]) -> Optional[str]:
  if not bindings:
    return None
  target = normalize_title(name)

  exact = []
  for binding in bindings:
    label = binding.get("itemLabel", {}).get("value")
    if not label:
      continue
    if normalize_title(label) == target:
      exact.append(binding)

  if year and exact:
    for binding in exact:
      year_val = binding.get("year", {}).get("value")
      if year_val and str(year_val) == str(year):
        return extract_qid(binding.get("item", {}).get("value", ""))

  if exact:
    return extract_qid(exact[0].get("item", {}).get("value", ""))

  if year:
    for binding in bindings:
      year_val = binding.get("year", {}).get("value")
      if year_val and str(year_val) == str(year):
        return extract_qid(binding.get("item", {}).get("value", ""))

  return extract_qid(bindings[0].get("item", {}).get("value", ""))


def search_wikidata(name: str, year: Optional[int]) -> Optional[str]:
  query = f"""
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX mwapi: <https://www.mediawiki.org/ontology#API/>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT ?item ?itemLabel ?year WHERE {{
  SERVICE wikibase:mwapi {{
    bd:serviceParam wikibase:endpoint "www.wikidata.org";
                    wikibase:api "EntitySearch";
                    mwapi:search "{name.replace('"', '')}";
                    mwapi:language "en".
    ?item wikibase:apiOutputItem mwapi:item.
  }}
  ?item wdt:P31/wdt:P279* wd:Q131436.
  OPTIONAL {{ ?item wdt:P577 ?publicationDate. BIND(YEAR(?publicationDate) AS ?year) }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
LIMIT 10
"""
  data = sparql(query)
  bindings = data.get("results", {}).get("bindings", [])
  return pick_best_match(bindings, name, year)


def fetch_image(qid: str) -> Optional[str]:
  query = f"""
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT ?image WHERE {{
  wd:{qid} wdt:P18 ?image .
}}
LIMIT 1
"""
  data = sparql(query)
  bindings = data.get("results", {}).get("bindings", [])
  if not bindings:
    return None
  return bindings[0].get("image", {}).get("value")


def commons_file_path(file_name: str, width: int = 600) -> str:
  return f"https://commons.wikimedia.org/wiki/Special:FilePath/{requests.utils.quote(file_name)}?width={width}"


def update_game(base_url: str, headers: Dict[str, str], game_id: str, payload: Dict[str, Any]) -> None:
  url = f"{base_url}/rest/v1/games?id=eq.{game_id}"
  response = requests.patch(url, headers=headers, data=json.dumps(payload), timeout=30)
  if response.status_code >= 400:
    print(f"❌ Failed ({response.status_code}): {response.text}")
    return
  print(f"✅ Updated {game_id}")


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", required=True, help="Path to CSV file")
  parser.add_argument("--limit", type=int, default=0)
  parser.add_argument("--sleep", type=float, default=1.0)
  args = parser.parse_args()

  load_env()
  supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
  supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

  if not supabase_url or not supabase_key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

  headers = build_headers(supabase_key)

  processed = 0
  with open(args.input, "r", encoding="utf-8") as handle:
    reader = csv.DictReader(handle)
    for row in reader:
      game_id = row.get("id")
      name = row.get("name")
      year = row.get("year_published")
      current_image = row.get("image_url")

      if not game_id or not name:
        continue

      if current_image and current_image.strip():
        continue

      if args.limit and processed >= args.limit:
        break

      year_int = None
      try:
        year_int = int(year) if year else None
      except Exception:
        year_int = None

      qid = search_wikidata(name, year_int)
      if not qid:
        print(f"⚠️  No Wikidata match for {name}")
        processed += 1
        time.sleep(args.sleep)
        continue

      image_file = fetch_image(qid)
      if not image_file:
        print(f"⚠️  No image for {name} ({qid})")
        processed += 1
        time.sleep(args.sleep)
        continue

      image_url = commons_file_path(image_file)

      payload = {
        "image_url": image_url,
        "thumbnail_url": image_url,
        "source_notes": f"image: {image_url}",
        "cached_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "is_active": True,
      }

      current_source = row.get("source")
      if current_source in (None, "", "legacy_unknown"):
        payload["source"] = "wikidata"
        payload["source_url"] = f"https://www.wikidata.org/wiki/{qid}"
        payload["source_confidence"] = 0.6

      update_game(supabase_url, headers, game_id, payload)

      processed += 1
      time.sleep(args.sleep)

  print(f"Done. Processed {processed} rows.")


if __name__ == "__main__":
  main()
