"""Regenerate holdings.json — PS9 / Prompt 17E: 30+ funds, mid-cap & index variants."""
from __future__ import annotations

import json
from pathlib import Path

CORE_ISINS = [
    ("INE002A01018", "Reliance Industries"),
    ("INE040A01034", "HDFC Bank"),
    ("INE009A01021", "Infosys"),
    ("INE467B01029", "TCS"),
    ("INE062A01020", "ICICI Bank"),
    ("INE528G01035", "Kotak Mahindra Bank"),
    ("INE860A01027", "Axis Bank"),
    ("INE090A01021", "Bharti Airtel"),
    ("INE001A01036", "ITC"),
    ("INE154A01025", "HUL"),
    ("INE361B01024", "SBI"),
    ("INE030A01027", "L&T"),
    ("INE434A01013", "Wipro"),
]

BASE_W = [8.8, 8.2, 7.6, 7.0, 6.4, 5.2, 4.8, 4.4, 4.0, 3.6, 3.3, 3.0, 2.7]


def normalize_weights_to_100(rows: list) -> list:
    """
    Scale holdings weights so they sum to 100 (percentage points).
    Overlap/concentration logic assumes 0–100 weights per fund holdings block.
    """
    if not rows:
        return rows
    total = sum(float(r["weight"]) for r in rows)
    if total <= 0:
        return rows
    factor = 100.0 / total
    scaled = [{**r, "weight": round(float(r["weight"]) * factor, 2)} for r in rows]
    s = sum(float(r["weight"]) for r in scaled[:-1])
    scaled[-1]["weight"] = round(max(0.0, 100.0 - s), 2)
    return scaled


# Illustrative Nifty-heavy weights for index funds (not live index replication).
NIFTY50_TOP = [
    {"isin": "INE002A01018", "name": "Reliance Industries", "weight": 9.1},
    {"isin": "INE040A01034", "name": "HDFC Bank", "weight": 8.0},
    {"isin": "INE009A01021", "name": "Infosys", "weight": 5.8},
    {"isin": "INE467B01029", "name": "TCS", "weight": 5.2},
    {"isin": "INE062A01020", "name": "ICICI Bank", "weight": 4.6},
    {"isin": "INE528G01035", "name": "Kotak Mahindra Bank", "weight": 3.4},
    {"isin": "INE860A01027", "name": "Axis Bank", "weight": 3.1},
    {"isin": "INE090A01021", "name": "Bharti Airtel", "weight": 2.9},
    {"isin": "INE018A01030", "name": "Larsen & Toubro", "weight": 2.5},
    {"isin": "INE154A01025", "name": "HUL", "weight": 2.2},
    {"isin": "INE001A01036", "name": "ITC", "weight": 2.1},
    {"isin": "INE021A01026", "name": "Asian Paints", "weight": 1.9},
    {"isin": "INE296A01032", "name": "Maruti Suzuki", "weight": 1.8},
]


def block_large_cap(seed: int) -> list:
    out = []
    for i, (isin, name) in enumerate(CORE_ISINS):
        w = BASE_W[i] + ((seed * 3 + i * 7) % 10) * 0.07 - 0.25
        w = max(1.8, min(10.2, round(w, 2)))
        out.append({"isin": isin, "name": name, "weight": w})
    return normalize_weights_to_100(out)


def block_mid_cap(seed: int) -> list:
    out = []
    for i, (isin, name) in enumerate(CORE_ISINS):
        base = 1.5 + (i % 5) * 0.25
        w = base + ((seed + i) % 7) * 0.12
        w = max(1.2, min(3.2, round(w, 2)))
        out.append({"isin": isin, "name": name, "weight": w})
    return normalize_weights_to_100(out)


def block_index(_seed: int) -> list:
    raw = [
        {"isin": r["isin"], "name": r["name"], "weight": round(r["weight"], 2)}
        for r in NIFTY50_TOP
    ]
    return normalize_weights_to_100(raw)


MID_CAP = {"120503", "120505", "125494", "120837"}
INDEX_FUNDS = {"120716", "120684"}

CODES = sorted(
    {
        "118989",
        "100033",
        "119096",
        "112277",
        "118825",
        "112090",
        "120503",
        "120505",
        "125494",
        "120837",
        "122639",
        "118828",
        "120716",
        "120684",
        "118834",
        "100672",
        "119097",
        "100769",
        "119598",
        "148618",
        "135781",
        "125497",
        "118278",
        "101539",
        "119027",
        "103174",
        "120823",
        "146819",
        "112268",
        "100460",
        "135800",
        "147744",
        "118862",
        "102009",
        "115876",
        "148481",
        "101206",
        "105758",
    }
)


def main() -> None:
    backend = Path(__file__).resolve().parents[1]
    out_path = backend / "data" / "holdings.json"
    obj: dict = {}
    for j, code in enumerate(CODES):
        if code in INDEX_FUNDS:
            obj[code] = block_index(j)
        elif code in MID_CAP:
            obj[code] = block_mid_cap(j)
        else:
            obj[code] = block_large_cap(j)
    out_path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    print(len(obj), "funds ->", out_path)


if __name__ == "__main__":
    main()
