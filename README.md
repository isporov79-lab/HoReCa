# HoReCaDrinks — каталог из Excel

Эта версия собрана заново на основе переданного HTML-файла.

## Как работает

`catalog.xlsx` → `convert_catalog.py` → `catalog.json` + `js/catalog-data.js` → страницы категорий.

`js/catalog-data.js` нужен для того, чтобы каталог работал даже при локальном открытии HTML-файла через `file://`.

На GitHub после изменения `catalog.xlsx` GitHub Actions автоматически пересоздаёт JSON и JS.

## Что добавлено

- `water.html`
- `juice.html`
- `lemonade.html`
- `energy.html`
- `catalog.xlsx`
- `catalog.json`
- `js/catalog-data.js`
- `js/catalog.js`
- `css/catalog.css`
- `convert_catalog.py`
- `.github/workflows/update-catalog.yml`

Главная `index.html` взята из переданного файла без изменения.

## Excel

Используется лист `Товары`.

Колонки:
`category`, `name`, `brand`, `volume`, `package`, `price`, `image`, `status`, `hit`, `premium`, `sort`, `description`.

Лишние пробелы и переносы строк очищаются автоматически.

## Фото

В `image` можно указывать:
- прямой URL;
- публичную ссылку Яндекс Диска вида `https://disk.yandex.ru/i/...`;
- имя файла в `assets/img/products/`.

Если фото не указано, показывается заглушка.

## Обновление товаров

1. Измени `catalog.xlsx`.
2. На GitHub загрузи новый `catalog.xlsx`.
3. GitHub Actions автоматически обновит каталог.

