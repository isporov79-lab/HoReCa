#!/usr/bin/env python3
from pathlib import Path
import json, re
import pandas as pd

ROOT = Path(__file__).resolve().parent
EXCEL = ROOT / "catalog.xlsx"
JSON_OUT = ROOT / "catalog.json"
JS_OUT = ROOT / "js" / "catalog-data.js"

def clean(value):
    if pd.isna(value):
        return ""
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return re.sub(r"\s+", " ", str(value)).strip()

df = pd.read_excel(EXCEL, sheet_name="Товары")
df.columns = [str(c).strip() for c in df.columns]

products = []
for _, row in df.iterrows():
    p = {c: clean(row.get(c, "")) for c in df.columns}
    if not p.get("name"):
        continue

    for key in ("volume", "package", "price", "sort"):
        if p.get(key) != "":
            try:
                n = float(str(p[key]).replace(",", "."))
                p[key] = int(n) if n.is_integer() else n
            except Exception:
                pass

    try:
        p["box_price"] = round(float(p["price"]) * float(p["package"]), 2)
    except Exception:
        p["box_price"] = ""

    products.append(p)

data = {"version": 1, "products": products}
JSON_OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
JS_OUT.write_text(
    "window.HORECA_CATALOG = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8"
)
print(f"Готово: {len(products)} товаров")
