"""Check exported private classroom PDFs without printing their text.

Requires Poppler's pdftotext. Run after the desktop classroom browser export.
The report contains page bounds and counts only, never teaching prose.
"""
import argparse
import json
import pathlib
import subprocess
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument("--pdf-dir", required=True, type=pathlib.Path)
parser.add_argument("--suffix", default="")
parser.add_argument("--report", required=True, type=pathlib.Path)
args = parser.parse_args()
manifest = json.loads(pathlib.Path("content/instructional/teaching-manifest.v2.json").read_text())
results = []
namespace = "{http://www.w3.org/1999/xhtml}"
for plan in manifest["plans"]:
    pdf = args.pdf_dir / (plan["lessonId"] + args.suffix + ".pdf")
    raw = subprocess.run(["pdftotext", "-bbox", str(pdf), "-"],
                         check=True, capture_output=True).stdout
    pages = []
    for index, page in enumerate(ET.fromstring(raw).iter(namespace + "page")):
        words = list(page.iter(namespace + "word"))
        bounds = {key: operation(float(word.attrib[key]) for word in words)
                  for key, operation in [("xMin", min), ("yMin", min),
                                         ("xMax", max), ("yMax", max)]} if words else None
        inside = bool(bounds and bounds["xMin"] >= 32 and bounds["yMin"] >= 32
                      and bounds["xMax"] <= float(page.attrib["width"]) - 32
                      and bounds["yMax"] <= float(page.attrib["height"]) - 32)
        pages.append({"page": index + 1, "words": len(words), "bounds": bounds,
                      "inside12mmWithTolerance": inside})
    results.append({"lessonId": plan["lessonId"], "pages": len(pages),
                    "allPagesHaveText": bool(pages) and all(p["words"] for p in pages),
                    "marginsPass": bool(pages) and all(p["inside12mmWithTolerance"] for p in pages),
                    "pageBounds": pages})
passed = sum(row["marginsPass"] for row in results)
report = {"guides": len(results), "guidesPassing": passed,
          "check": "Text stays within 12 mm A4 margins, allowing 2 pt measurement tolerance; all pages contain text.",
          "results": results}
args.report.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"guides": len(results), "guidesPassing": passed,
                  "pages": sum(row["pages"] for row in results)}))
raise SystemExit(0 if passed == len(manifest["plans"]) else 1)
