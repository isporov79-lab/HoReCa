```javascript
(() => {
  const PLACEHOLDER = 'assets/img/products/placeholder.svg';

  function normalize(v) {
    return String(v ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function num(v) {
    const n = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  function money(v) {
    const n = num(v);

    return Number.isFinite(n)
      ? n.toLocaleString('ru-RU', {
          maximumFractionDigits: 2
        }) + ' ₽'
      : 'по запросу';
  }

  function volume(v) {
    const n = num(v);

    return Number.isFinite(n)
      ? String(n).replace('.', ',') + ' л'
      : String(v ?? '');
  }

  // Безопасный вывод текста в HTML
  function esc(v) {
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function yes(v) {
    return ['да', 'yes', 'true', '1', 'есть'].includes(normalize(v));
  }

  // Получение прямой ссылки на файл с Яндекс Диска
  async function yandexDirectUrl(url) {
    const share = String(url || '').trim();

    if (!/^https?:\/\/disk\.yandex\.(ru|com)\/i\//i.test(share)) {
      return share;
    }

    const api =
      'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=' +
      encodeURIComponent(share);

    try {
      const r = await fetch(api);

      if (!r.ok) {
        throw new Error('Yandex HTTP ' + r.status);
      }

      const data = await r.json();

      return data.href || '';
    } catch (e) {
      console.warn('Не удалось получить фото с Яндекс Диска', e);
      return '';
    }
  }

  // Формирование пути к локальному изображению
  function localImage(value) {
  const v = String(value || '').trim();

  if (!v) {
    return PLACEHOLDER;
  }

  // Если это полноценная ссылка
  if (/^https?:\/\//i.test(v)) {
    return v;
  }

  // В catalog-data.js уже хранится полный относительный путь.
  // Ничего дополнительно не кодируем.
  if (v.startsWith('assets/')) {
    return v;
  }

  // Если указано только имя файла
  return 'assets/img/products/' + v;
}

    // Если указано только имя файла
    return 'assets/img/products/' +
      v.split('/')
        .map(encodeURIComponent)
        .join('/');
  }

  function card(product) {
    const article = document.createElement('article');

    article.className = 'excel-product-card';

    const badges = [];

    if (yes(product.hit)) {
      badges.push(
        '<span class="excel-badge excel-badge-hit">Хит</span>'
      );
    }

    if (yes(product.premium)) {
      badges.push(
        '<span class="excel-badge excel-badge-premium">Premium</span>'
      );
    }

    article.innerHTML = `
      <div class="excel-product-image">
        <img
          class="excel-product-img"
          src="${esc(localImage(product.image))}"
          alt="${esc(product.name)}"
          loading="lazy"
        >
      </div>

      <div class="excel-product-body">

        ${
          product.brand
            ? `<div class="excel-product-brand">${esc(product.brand)}</div>`
            : ''
        }

        <h3>${esc(product.name)}</h3>

        ${
          product.volume !== '' && product.volume != null
            ? `<div class="excel-product-meta">
                Объём: ${esc(volume(product.volume))}
              </div>`
            : ''
        }

        ${
          product.package !== '' && product.package != null
            ? `<div class="excel-product-meta">
                В коробке: ${esc(product.package)} шт.
              </div>`
            : ''
        }

        ${
          product.description
            ? `<p class="excel-product-description">
                ${esc(product.description)}
              </p>`
            : ''
        }

        <div class="excel-product-prices">

          <div>
            <span>За штуку</span>
            <strong>${money(product.price)}</strong>
          </div>

          ${
            product.box_price !== '' && product.box_price != null
              ? `<div>
                  <span>За коробку</span>
                  <strong>${money(product.box_price)}</strong>
                </div>`
              : ''
          }

        </div>

        <div class="excel-product-bottom">

          <span class="excel-product-status">
            ${esc(product.status || '')}
          </span>

          <span class="excel-product-badges">
            ${badges.join('')}
          </span>

        </div>

      </div>
    `;

    const img = article.querySelector('.excel-product-img');

    // Если изображение не найдено — показываем placeholder
    img.addEventListener(
      'error',
      () => {
        if (img.src !== new URL(PLACEHOLDER, window.location.href).href) {
          img.src = PLACEHOLDER;
        }
      },
      { once: true }
    );

    // Поддержка Яндекс Диска
    if (
      /^https?:\/\/disk\.yandex\.(ru|com)\/i\//i.test(
        String(product.image || '')
      )
    ) {
      yandexDirectUrl(product.image).then(url => {
        if (url) {
          img.src = url;
        }
      });
    }

    return article;
  }

  function render() {
    const root = document.querySelector('[data-excel-products]');

    if (!root) {
      return;
    }

    const category = root.dataset.excelCategory || '';

    const data = window.HORECA_CATALOG || {
      products: []
    };

    const products = Array.isArray(data.products)
      ? data.products.slice()
      : [];

    const filtered = products
      .filter(
        p =>
          !category ||
          normalize(p.category) === normalize(category)
      )
      .sort(
        (a, b) =>
          num(a.sort) - num(b.sort)
      );

    root.innerHTML = '';

    if (!filtered.length) {
      root.innerHTML =
        '<div class="excel-empty">' +
        'В этой категории пока нет товаров в Excel-файле.' +
        '</div>';

      return;
    }

    filtered.forEach(product => {
      root.appendChild(card(product));
    });
  }

  document.addEventListener(
    'DOMContentLoaded',
    render
  );
})();
```
