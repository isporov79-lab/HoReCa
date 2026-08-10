#!/usr/bin/env python3

from pathlib import Path
import json
import re

import pandas as pd


ROOT = Path(__file__).resolve().parent

EXCEL = ROOT / "assets" / "files" / "products.xlsx"
JSON_OUT = ROOT / "catalog.json"
JS_OUT = ROOT / "js" / "catalog-data.js"


def clean(value):
    if pd.isna(value):
        return ""

    if isinstance(value, float) and value.is_integer():
        return int(value)

    return re.sub(r"\s+", " ", str(value)).strip()


def normalize_image_path(value):
    """
    Приводим путь к фотографии к единому виду для сайта.
    """

    if not value:
        return ""

    value = str(value).strip()

    # Если вдруг осталась ссылка Яндекс.Диска — оставляем её.
    if value.startswith("http://") or value.startswith("https://"):
        return value

    # Windows-слеши -> обычные URL-слеши
    value = value.replace("\\", "/")

    # Убираем случайный ./ в начале
    value = re.sub(r"^\./+", "", value)

    # Если путь уже начинается с assets/, оставляем как есть
    if value.startswith("assets/"):
        return value

    # Если почему-то записали только имя файла
    if value.startswith("products/"):
        return "assets/img/" + value

    return value


if not EXCEL.exists():
    raise SystemExit(f"Не найден Excel-файл: {EXCEL}")


df = pd.read_excel(EXCEL, sheet_name="Товары")
df.columns = [str(c).strip() for c in df.columns]


if "name" not in df.columns:
    raise SystemExit("В Excel не найдена колонка name")


products = []


for _, row in df.iterrows():

    p = {
        c: clean(row.get(c, ""))
        for c in df.columns
    }

    if not p.get("name"):
        continue

    # Нормализуем фотографию
    if "image" in p:
        p["image"] = normalize_image_path(p["image"])

    # Числовые поля
    for key in ("volume", "package", "price", "sort"):
        if p.get(key) != "":
            try:
                n = float(str(p[key]).replace(",", "."))
                p[key] = int(n) if n.is_integer() else n
            except Exception:
                pass

    # Цена коробки
    try:
        p["box_price"] = round(
            float(p["price"]) * float(p["package"]),
            2
        )
    except Exception:
        p["box_price"] = ""

    products.append(p)


data = {
    "version": 1,
    "products": products
}


# catalog.json
JSON_OUT.write_text(
    json.dumps(
        data,
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)


# js/catalog-data.js
JS_OUT.parent.mkdir(parents=True, exist_ok=True)

JS_OUT.write_text(
    "window.HORECA_CATALOG = "
    + json.dumps(
        data,
        ensure_ascii=False,
        indent=2
    )
    + ";\n",
    encoding="utf-8"
)


print(f"Готово: {len(products)} товаров")
print(f"JSON: {JSON_OUT}")
print(f"JS: {JS_OUT}")
