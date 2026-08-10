from pathlib import Path
from urllib.parse import quote
import hashlib
import mimetypes
import re
import shutil
import tempfile

import requests
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
SOURCE_XLSX = ROOT / "catalog.xlsx"
OUTPUT_XLSX = ROOT / "assets" / "files" / "products.xlsx"
IMAGE_DIR = ROOT / "assets" / "img" / "products"

API_URL = "https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key="

IMAGE_EXTS = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def is_yandex_public_link(value):
    return isinstance(value, str) and re.search(
        r"https?://(?:www\.)?disk\.yandex\.(?:ru|com|kz|uz|tr)/i/",
        value.strip(),
        re.I,
    )


def safe_name(text):
    text = re.sub(r"[^0-9A-Za-zА-Яа-яЁё_-]+", "_", str(text)).strip("_")
    return text[:80] or "product"


def yandex_download(public_url):
    r = requests.get(API_URL + quote(public_url, safe=""), timeout=30)
    r.raise_for_status()
    data = r.json()
    href = data.get("href")
    if not href:
        raise RuntimeError("Yandex API did not return download href")

    r = requests.get(href, timeout=60, stream=True)
    r.raise_for_status()

    content_type = (r.headers.get("Content-Type") or "").split(";")[0].lower()
    ext = IMAGE_EXTS.get(content_type)
    if not ext:
        ext = Path(href.split("?", 1)[0]).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        ext = ".jpg"

    return r, ext


def main():
    if not SOURCE_XLSX.exists():
        raise SystemExit(f"Не найден {SOURCE_XLSX}")

    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_XLSX.parent.mkdir(parents=True, exist_ok=True)

    wb = load_workbook(SOURCE_XLSX)
    ws = wb[wb.sheetnames[0]]

    headers = {str(cell.value).strip(): cell.column for cell in ws[1] if cell.value is not None}
    image_col = headers.get("image")
    if not image_col:
        raise SystemExit("В Excel не найдена колонка image")

    name_col = headers.get("name")
    brand_col = headers.get("brand")

    downloaded = 0
    failed = 0

    for row in range(2, ws.max_row + 1):
        value = ws.cell(row=row, column=image_col).value
        if not is_yandex_public_link(value):
            continue

        brand = ws.cell(row=row, column=brand_col).value if brand_col else ""
        name = ws.cell(row=row, column=name_col).value if name_col else ""
        key = f"{row}-{brand}-{name}-{value}".encode("utf-8", "ignore")
        stem = safe_name(f"{brand}_{name}") + "-" + hashlib.sha1(key).hexdigest()[:8]

        try:
            response, ext = yandex_download(value)
            filename = stem + ext
            target = IMAGE_DIR / filename

            with target.open("wb") as f:
                for chunk in response.iter_content(1024 * 64):
                    if chunk:
                        f.write(chunk)

            # The website's existing JS expects a filename in products.xlsx.
            ws.cell(row=row, column=image_col).value = filename
            downloaded += 1
            print(f"OK: {value} -> {filename}")
        except Exception as exc:
            failed += 1
            print(f"ERROR: {value}: {exc}")

    wb.save(OUTPUT_XLSX)

    print(f"Готово. Загружено фото: {downloaded}, ошибок: {failed}")
    print(f"Создан файл: {OUTPUT_XLSX}")


if __name__ == "__main__":
    main()
