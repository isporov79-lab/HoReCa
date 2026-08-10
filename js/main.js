(() => {
  function formatProductValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return String(value).trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getImageUrl(value) {
    const raw = formatProductValue(value);

    if (!raw) {
      return 'assets/img/products/placeholder.svg';
    }

    // Если это полноценная внешняя ссылка — оставляем её как есть.
    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    // Нормализуем разделители.
    let path = raw.replace(/\\/g, '/');

    // Если путь уже начинается с assets/,
    // ничего к нему не добавляем.
    if (path.startsWith('assets/')) {
      return path;
    }

    // Если в данных записано только имя файла.
    path = 'assets/img/products/' + path;

    return path;
  }

  async function loadProducts() {
    const container = document.querySelector('.products-container');

    if (!container) {
      console.warn('Не найден .products-container');
      return;
    }

    try {
      const response = await fetch('catalog.json', {
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(
          `Не удалось загрузить catalog.json: ${response.status}`
        );
      }

      const data = await response.json();

      const products = Array.isArray(data.products)
        ? data.products
        : [];

      console.log('Каталог загружен:', products.length, 'товаров');

      renderProductCards(products);

    } catch (error) {
      console.error('Ошибка загрузки каталога:', error);

      container.innerHTML = `
        <div style="
          padding: 20px;
          color: #b00020;
          background: #fff3f3;
          border-radius: 8px;
        ">
          Не удалось загрузить каталог товаров.
        </div>
      `;
    }
  }

  function renderProductCards(products) {
    const container = document.querySelector('.products-container');

    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!products.length) {
      container.innerHTML = `
        <div class="excel-empty">
          Товары не найдены.
        </div>
      `;
      return;
    }

    products.forEach((product) => {
      container.appendChild(createProductCard(product));
    });
  }

  function createProductCard(product) {
    const brand = formatProductValue(
      product.brand ||
      product.Brand ||
      product['Бренд'] ||
      ''
    );

    const name = formatProductValue(
      product.name ||
      product.Name ||
      product['Название'] ||
      ''
    );

    const volume = formatProductValue(
      product.volume ||
      product.Volume ||
      product['Объём'] ||
      ''
    );

    const packageType = formatProductValue(
      product.package ||
      product.Package ||
      product['Упаковка'] ||
      ''
    );

    const boxQty = formatProductValue(
      product.box_qty ||
      product['Количество в коробке'] ||
      ''
    );

    const priceUnit = formatProductValue(
      product.price_unit ||
      product.PriceUnit ||
      product['Цена за штуку'] ||
      product.price ||
      ''
    );

    const priceBox = formatProductValue(
      product.price_box ||
      product.PriceBox ||
      product['Цена за коробку'] ||
      product.box_price ||
      ''
    );

    const stock = formatProductValue(
      product.stock ||
      product.Stock ||
      product.status ||
      product['Наличие'] ||
      ''
    );

    const badge = formatProductValue(
      product.badge ||
      product.Badge ||
      product['Бейдж'] ||
      ''
    );

    const imageSource =
      product.image_url ||
      product.image ||
      product.Image ||
      '';

    const imageUrl = getImageUrl(imageSource);

    // Показываем в консоли настоящий адрес,
    // который браузер будет использовать.
    console.log(
      'Фото:',
      name,
      '→',
      new URL(imageUrl, document.baseURI).href
    );

    const badgeHtml =
      badge !== ''
        ? `
          <span class="badge badge-${badge
            .toLowerCase()
            .replace(/\s+/g, '-')}">
            ${escapeHtml(badge)}
          </span>
        `
        : '';

    const card = document.createElement('div');

    card.classList.add('product-card');

    card.innerHTML = `
      <div class="product-image">
        <img
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(name)}"
          class="product-img"
          loading="lazy"
        >
      </div>

      <div class="product-info">

        ${
          brand
            ? `<h3>${escapeHtml(brand)}</h3>`
            : ''
        }

        <p>
          ${escapeHtml(name)}
        </p>

        ${
          volume
            ? `<p>${escapeHtml(volume)}`
            : ''
        }

        ${
          packageType
            ? ` · ${escapeHtml(packageType)}</p>`
            : volume
              ? `</p>`
              : ''
        }

        ${
          boxQty
            ? `<p>${escapeHtml(boxQty)} шт. в коробке</p>`
            : ''
        }

        <div class="prices">

          ${
            priceUnit
              ? `
                <p>
                  ${escapeHtml(priceUnit)} / шт.
                </p>
              `
              : ''
          }

          ${
            priceBox
              ? `
                <p>
                  ${escapeHtml(priceBox)} / коробка
                </p>
              `
              : ''
          }

        </div>

        <div class="availability">

          <span class="stock-status">
            ${escapeHtml(stock)}
          </span>

          ${badgeHtml}

        </div>

        <button class="add-to-cart">
          Добавить в заявку
        </button>

      </div>
    `;

    const img = card.querySelector('.product-img');

    if (img) {
      img.addEventListener('error', () => {
        console.error(
          'ОШИБКА ЗАГРУЗКИ ФОТО:',
          name,
          '→',
          img.src
        );

        if (!img.dataset.fallback) {
          img.dataset.fallback = '1';
          img.src = 'assets/img/products/placeholder.svg';
        }
      });
    }

    return card;
  }

  document.addEventListener(
    'DOMContentLoaded',
    loadProducts
  );
})();
