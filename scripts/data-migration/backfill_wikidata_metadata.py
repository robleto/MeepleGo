#!/usr/bin/env python3
"""
Backfill games from Wikidata (BGG-free):
- title, year, publisher, min/max players, playtime
- mechanics (P4151)
- categories from genre/topic (P136, P921)
- image (P18) -> Wikimedia Commons FilePath URL

Usage:
  python3 scripts/data-migration/backfill_wikidata_metadata.py --input data/game_sources.csv --dry-run
  python3 scripts/data-migration/backfill_wikidata_metadata.py --input data/game_sources.csv --limit 50

Notes:
- Uses SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL from .env.local
- Updates by id from CSV, fills only null/empty fields
"""

import argparse
import csv
import json
import os
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

import requests

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "MeepleGo/1.0 (+https://meeplego.com) wikidata-backfill"


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


def pick_best_match(bindings: List[Dict[str, Any]], name: str, year: Optional[int]) -> Optional[str]:
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


def fetch_entity(qid: str) -> Dict[str, Any]:
  query = f"""
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX schema: <http://schema.org/>

SELECT ?item ?itemLabel ?itemDescription ?year ?publisherLabel ?minPlayers ?maxPlayers ?playtime ?image ?mechanicLabel ?genreLabel ?topicLabel WHERE {{
  BIND(wd:{qid} AS ?item)
  ?item wdt:P31/wdt:P279* wd:Q131436.
  OPTIONAL {{ ?item wdt:P577 ?publicationDate. BIND(YEAR(?publicationDate) AS ?year) }}
  OPTIONAL {{ ?item wdt:P123 ?publisher }}
  OPTIONAL {{ ?item wdt:P1872 ?minPlayers }}
  OPTIONAL {{ ?item wdt:P1873 ?maxPlayers }}
  OPTIONAL {{ ?item wdt:P2047 ?playtime }}
  OPTIONAL {{ ?item wdt:P18 ?image }}
  OPTIONAL {{ ?item wdt:P4151 ?mechanic }}
  OPTIONAL {{ ?item wdt:P136 ?genre }}
  OPTIONAL {{ ?item wdt:P921 ?topic }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
  OPTIONAL {{ ?item schema:description ?itemDescription FILTER (lang(?itemDescription) = "en") }}
}}
"""
  return sparql(query)


def commons_file_path(file_name: str, width: int = 600) -> str:
  # Use Special:FilePath for a safe CDN URL
  return f"https://commons.wikimedia.org/wiki/Special:FilePath/{requests.utils.quote(file_name)}?width={width}"


def reduce_entity(bindings: List[Dict[str, Any]]) -> Dict[str, Any]:
  result: Dict[str, Any] = {
    "name": None,
    "description": None,
    "year_published": None,
    "publisher": None,
    "min_players": None,
    "max_players": None,
    "playtime_minutes": None,
    "image_url": None,
    "mechanics": [],
    "categories": [],
  }

  mechanics_set = set()
  categories_set = set()
  image_file = None

  for binding in bindings:
    if not result["name"]:
      result["name"] = binding.get("itemLabel", {}).get("value")
    if not result["description"]:
      result["description"] = binding.get("itemDescription", {}).get("value")
    if not result["year_published"]:
      result["year_published"] = binding.get("year", {}).get("value")
    if not result["publisher"]:
      result["publisher"] = binding.get("publisherLabel", {}).get("value")
    if not result["min_players"]:
      result["min_players"] = binding.get("minPlayers", {}).get("value")
    if not result["max_players"]:
      result["max_players"] = binding.get("maxPlayers", {}).get("value")
    if not result["playtime_minutes"]:
      result["playtime_minutes"] = binding.get("playtime", {}).get("value")

    image_file = image_file or binding.get("image", {}).get("value")

    mechanic = binding.get("mechanicLabel", {}).get("value")
    if mechanic:
      mechanics_set.add(mechanic)

    genre = binding.get("genreLabel", {}).get("value")
    if genre:
      categories_set.add(genre)

    topic = binding.get("topicLabel", {}).get("value")
    if topic:
      categories_set.add(topic)

  if image_file:
    result["image_url"] = commons_file_path(image_file)

  result["mechanics"] = sorted(mechanics_set)
  result["categories"] = sorted(categories_set)

  return result


def update_game(
  base_url: str,
  headers: Dict[str, str],
  game_id: str,
  payload: Dict[str, Any],
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
  parser.add_argument("--input", required=True, help="Path to CSV file")
  parser.add_argument("--dry-run", action="store_true", help="Print actions without updating")
  parser.add_argument("--limit", type=int, default=0, help="Limit rows processed")
  parser.add_argument("--sleep", type=float, default=1.0, help="Sleep between Wikidata requests")
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
      year_int = None
      try:
        year_int = int(year) if year else None
      except Exception:
        year_int = None

      if not game_id or not name:
        continue

      if args.limit and processed >= args.limit:
        break

      qid = search_wikidata(name, year_int)
      if not qid:
        print(f"⚠️  No Wikidata match for {name}")
        processed += 1
        time.sleep(args.sleep)
        continue

      entity_data = fetch_entity(qid)
      bindings = entity_data.get("results", {}).get("bindings", [])
      if not bindings:
        print(f"⚠️  Empty Wikidata data for {name} ({qid})")
        processed += 1
        time.sleep(args.sleep)
        continue

      reduced = reduce_entity(bindings)

      update_payload: Dict[str, Any] = {
        "cached_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "is_active": True,
      }

      def fill_if_empty(field: str, value: Any, allow_legacy: bool = False) -> None:
        current = row.get(field)
        empty_array = current == "[]" or current == "{}"
        empty_string = isinstance(current, str) and current.strip() == ""
        legacy = allow_legacy and isinstance(current, str) and current == "legacy_unknown"
        if current in (None, "", "null") or empty_array or empty_string or legacy:
          if value is None:
            return
          update_payload[field] = value

      fill_if_empty("name", reduced.get("name"))
      fill_if_empty("year_published", reduced.get("year_published"))
      fill_if_empty("publisher", reduced.get("publisher"))
      fill_if_empty("min_players", reduced.get("min_players"))
      fill_if_empty("max_players", reduced.get("max_players"))
      fill_if_empty("playtime_minutes", reduced.get("playtime_minutes"))
      fill_if_empty("description", reduced.get("description"))
      fill_if_empty("image_url", reduced.get("image_url"))
      fill_if_empty("thumbnail_url", reduced.get("image_url"))
      if reduced.get("mechanics"):
        fill_if_empty("mechanics", reduced.get("mechanics"))
      if reduced.get("categories"):
        fill_if_empty("categories", reduced.get("categories"))

      # provenance
      fill_if_empty("source", "wikidata", True)
      fill_if_empty("source_url", f"https://www.wikidata.org/wiki/{qid}", True)
      fill_if_empty("source_confidence", 0.6, True)
      if reduced.get("image_url"):
        fill_if_empty("source_notes", f"image: {reduced.get('image_url')}")

      if len(update_payload.keys()) > 2:
        update_game(supabase_url, headers, game_id, update_payload, args.dry_run)
      else:
        print(f"ℹ️  No new fields for {name}")

      processed += 1
      time.sleep(args.sleep)

  print(f"Done. Processed {processed} rows.")


if __name__ == "__main__":
  main()
