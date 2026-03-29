"""Regenerate holdings.json with 30+ AMFI keys and overlapping large-cap ISINs (PS16 / rubric)."""
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


def block(seed: int) -> list:
    out = []
    for i, (isin, name) in enumerate(CORE_ISINS):
        w = BASE_W[i] + ((seed * 3 + i * 7) % 10) * 0.07 - 0.25
        w = max(1.8, min(10.2, round(w, 2)))
        out.append({"isin": isin, "name": name, "weight": w})
    return out


def main() -> None:
    codes = [
        "118989",
        "100033",
        "119096",
        "112277",
        "118825",
        "112090",
        "103174",
        "120503",
        "125494",
        "122639",
        "118834",
        "118828",
        "120716",
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
        "120684",
        "105758",
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
    ]
    backend = Path(__file__).resolve().parents[1]
    out_path = backend / "data" / "holdings.json"
    obj = {c: block(j) for j, c in enumerate(codes)}
    out_path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
    print(len(obj), "funds ->", out_path)


if __name__ == "__main__":
    main()
