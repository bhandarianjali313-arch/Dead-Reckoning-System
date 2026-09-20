"""
Exports static JSON scenario datasets, architecture, and benchmarks for GitHub Pages.
"""

import json
import os
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DOCS_DATA_DIR = BASE_DIR / "docs" / "data"
SCENARIOS_DIR = DOCS_DATA_DIR / "scenarios"
SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Scenarios metadata
try:
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/simulation/scenarios")
    scenarios_meta = json.loads(req.read().decode("utf-8"))
    with open(DOCS_DATA_DIR / "scenarios.json", "w", encoding="utf-8") as f:
        json.dump(scenarios_meta, f, indent=2)
    print("Exported scenarios.json")
except Exception as e:
    print(f"Error exporting scenarios: {e}")

# 2. Architecture
try:
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/solution/architecture")
    arch_data = json.loads(req.read().decode("utf-8"))
    with open(DOCS_DATA_DIR / "architecture.json", "w", encoding="utf-8") as f:
        json.dump(arch_data, f, indent=2)
    print("Exported architecture.json")
except Exception as e:
    print(f"Error exporting architecture: {e}")

# 3. Sample drives for all 7 scenarios
sc_list = [
    "mumbai_tunnel",
    "lucknow_bbd",
    "delhi_tunnel",
    "atal_tunnel",
    "bengaluru_airport",
    "pune_mumbai_expressway",
    "kashmir_chenani"
]
all_benchmarks = {}

for sc in sc_list:
    try:
        url = f"http://127.0.0.1:8000/api/simulation/sample-drive?scenario={sc}"
        r = urllib.request.urlopen(url)
        data = json.loads(r.read().decode("utf-8"))
        with open(SCENARIOS_DIR / f"{sc}.json", "w", encoding="utf-8") as f:
            json.dump(data, f)
        print(f"Exported scenario: {sc} ({len(data.get('steps', []))} steps)")

        # Benchmarks
        b_url = f"http://127.0.0.1:8000/api/benchmarks/summary?scenario={sc}"
        br = urllib.request.urlopen(b_url)
        bdata = json.loads(br.read().decode("utf-8"))
        all_benchmarks[sc] = bdata
    except Exception as e:
        print(f"Error processing {sc}: {e}")

with open(DOCS_DATA_DIR / "benchmarks.json", "w", encoding="utf-8") as f:
    json.dump(all_benchmarks, f, indent=2)
print("Exported benchmarks.json for all scenarios.")
