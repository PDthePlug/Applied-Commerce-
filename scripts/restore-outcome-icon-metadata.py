"""Extract presentation-only outcome symbols from the original, icon-bearing books.

Usage: python scripts/restore-outcome-icon-metadata.py <original-books-directory>
Never recompiles curriculum, changes source books, or derives a learning level.
"""
from pathlib import Path
import base64
import gzip
import hashlib
import json
import re
import sys
from docx import Document

root = Path(__file__).resolve().parent.parent
source_dir = Path(sys.argv[1])
index = json.loads((root / "public/curriculum/index.json").read_text())
symbols_by_unit = {}
sources = []
unmatched = []
for grade in index["grades"]:
    number = grade["grade"]
    candidates = [p for p in source_dir.glob("*.docx")
                  if re.search(rf"Grade[ -]{number}\.docx$", p.name)]
    if len(candidates) != 1:
        raise ValueError(f"Expected one original Grade {number} book")
    source = candidates[0]
    authored = {}
    lesson = None
    for paragraph in Document(source).paragraphs:
        text = " ".join(paragraph.text.split())
        # One original heading has an editorial prefix; match its final lesson heading.
        heading = re.search(r"\bLESSONS?\s+(\d+)(?:[-–—](\d+))?\s*:\s*(.+)$", text)
        if heading:
            lesson = int(heading[1])
        if "By the end of this lesson" not in text:
            continue
        symbols = "".join(re.findall(r"🔍|💡|🛠️?|🔬|⚖️?|🌟", text.split("By the end")[0]))
        if lesson is None or lesson in authored or not symbols:
            raise ValueError(f"Missing or ambiguous symbols in Grade {number}, Lesson {lesson}")
        authored[lesson] = symbols
    sources.append({"grade": number, "sha256": hashlib.sha256(source.read_bytes()).hexdigest()})
    encoded = "".join((root / f"public/curriculum/grade-{number}.part-{part}.b64").read_text().strip()
                      for part in range(1, grade["bundleParts"] + 1))
    bundle = json.loads(gzip.decompress(base64.b64decode(encoded)))
    for term in bundle["terms"]:
        for unit in term["units"]:
            if unit["type"] != "lesson" or not any("By the end of this lesson" in b.get("text", "") for b in unit["blocks"]):
                continue
            symbols = authored.get(unit["startLesson"])
            if symbols:
                symbols_by_unit[unit["id"]] = symbols
            else:
                unmatched.append(unit["id"])

output = {"version": 1, "sources": sources, "symbolsByUnit": symbols_by_unit,
          "unmatchedIntroductions": unmatched}
target = root / "lib/lesson-outcome-icons.json"
target.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"restored": len(symbols_by_unit), "unmatched": len(unmatched)}))
