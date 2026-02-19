#!/usr/bin/env python3
"""Build a manual image replacement queue CSV from the image audit.

Usage:
  python3 scripts/data-migration/build_manual_image_queue.py \
    --input data/image_audit_missing.csv \
    --output data/manual_image_queue.csv
"""

import argparse
import csv


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--input", required=True, help="Path to image audit CSV")
  parser.add_argument("--output", required=True, help="Path to output CSV")
  args = parser.parse_args()

  with open(args.input, newline='', encoding='utf-8') as handle:
    rows = list(csv.DictReader(handle))

  fieldnames = [
    "id",
    "name",
    "year_published",
    "image_url",
    "source",
    "source_url",
    "source_notes",
    "source_confidence",
  ]

  with open(args.output, 'w', newline='', encoding='utf-8') as handle:
    writer = csv.DictWriter(handle, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
      writer.writerow(
        {
          "id": row.get("id"),
          "name": row.get("name"),
          "year_published": row.get("year_published"),
          "image_url": "",
          "source": "manual",
          "source_url": "",
          "source_notes": "manual image replacement",
          "source_confidence": "0.8",
        }
      )

  print(f"Wrote {len(rows)} rows to {args.output}")


if __name__ == "__main__":
  main()
