(() => {
  const PLACEHOLDER = 'assets/img/products/placeholder.svg';

  function normalize(value) {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function number(value) {
    const n = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  function money(value) {
    const n = number(value);

    if (!Number.isFinite(n)) {
      return 'по запросу';
    }

    return n.toLocaleString('ru-RU', {
      maximumFractionDigits: 2
    }) + ' ₽';
  }

  function volume(value) {
    const n = number(value);

    if (!Number.isFinite(n)) {
      return String(value ?? '');
    }

    return String(n).replace('.', ',') + ' л';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function isYes(value) {
    return [
      'да',
      'yes',
      'true',
      '1',
      'есть'
    ].includes(normalize(value));
  }

  /*
   * В catalog-data.js путь уже указан полностью:
   *
   * assets/img/products/имя-файла.png
   *
   * Поэтому НЕ добавляем assets/img/products/ повторно
   * и НЕ используем encodeURIComponent().
   */
  function getImageUrl(value) {
    const image = String(value || '').trim();

    if (!image) {
      return PLACEHOLDER;
    }

    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    return image;
  }

  function createCard(product) {
    const article = document.createElement('article');

    article.className = 'excel-product-card';

    let badges = '';

    if (isYes(product.hit)) {
      badges +=
        '<span class="excel-badge excel-badge-hit">Хит</span>';
    }

    if (isYes(product.premium)) {
      badges +=
        '<span class="excel-badge excel-badge-premium">Premium</span>';
    }

    const imageUrl = getImageUrl(product.image);

    article.innerHTML = `
      <div class="excel-product-image">
        <img
          class="excel-product-img"
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
        >
      </div>

      <div class="excel-product-body">

        ${
          product.brand
            ? `
              <div class="excel-product-brand">
                ${escapeHtml(product.brand)}
              </div>
            `
            : ''
        }

        <h3>
          ${escapeHtml(product.name)}
        </h3>

        ${
          product.volume !== '' &&
          product.volume !== null &&
          product.volume !== undefined
            ? `
              <div class="excel-product-meta">
                Объём: ${escapeHtml(volume(product.volume))}
              </div>
            `
            : ''
        }

        ${
          product.package !== '' &&
          product.package !== null &&
          product.package !== undefined
            ? `
              <div class="excel-product-meta">
                В коробке: ${escapeHtml(product.package)} шт.
              </div>
            `
            : ''
        }

        ${
          product.description
            ? `
              <p class="excel-product-description">
                ${escapeHtml(product.description)}
              </p>
            `
            : ''
        }

        <div class="excel-product-prices">

          <div>
            <span>За штуку</span>
            <strong>${money(product.price)}</strong>
          </div>

          ${
            product.box_price !== '' &&
            product.box_price !== null &&
            product.box_price !== undefined
              ? `
                <div>
                  <span>За коробку</span>
                  <strong>${money(product.box_price)}</strong>
                </div>
              `
              : ''
          }

        </div>

        <div class="excel-product-bottom">

          <span class="excel-product-status">
            ${escapeHtml(product.status || '')}
          </span>

          <span class="excel-product-badges">
            ${badges}
          </span>

        </div>

      </div>
    `;

    /*
     * Если фотография не загрузилась,
     * показываем placeholder.
     */
    const img = article.querySelector('.excel-product-img');

    if (img) {
      img.addEventListener('error', function () {
        console.error(
          'Ошибка загрузки изображения:',
          imageUrl
        );

        if (!img.dataset.placeholder) {
          img.dataset.placeholder = '1';
          img.src = PLACEHOLDER;
        }
      });
    }

    return article;
  }

  function renderProducts() {
    console.log('catalog.js: renderProducts запущен');

    const container =
      document.querySelector('[data-excel-products]');

    if (!container) {
      console.error(
        'catalog.js: контейнер [data-excel-products] не найден'
      );
      return;
    }

    const category =
      container.dataset.excelCategory || '';

    const catalog =
      window.HORECA_CATALOG || {};

    const products =
      Array.isArray(catalog.products)
        ? catalog.products
        : [];

    console.log(
      'catalog.js: товаров в каталоге:',
      products.length
    );

    const filtered = products
      .filter(product => {
        if (!category) {
          return true;
        }

        return normalize(product.category) ===
          normalize(category);
      })
      .sort((a, b) => {
        return number(a.sort) - number(b.sort);
      });

    console.log(
      'catalog.js: товаров категории "' +
      category +
      '":',
      filtered.length
    );

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="excel-empty">
          В этой категории пока нет товаров.
        </div>
      `;

      return;
    }

    filtered.forEach(product => {
      container.appendChild(
        createCard(product)
      );
    });
  }

  /*
   * Запускаем после загрузки HTML.
   */
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      renderProducts
    );
  } else {
    renderProducts();
  }

})();
