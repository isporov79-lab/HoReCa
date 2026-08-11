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
         <div class="excel-product-vat">
          Цены указаны с НДС
        </div>
        
      <div class="excel-product-quantity">
  <button
    type="button"
    class="excel-product-qty-minus"
    data-product-id="${escapeHtml(product.id || product.name)}"
  >−</button>

  <span class="excel-product-qty-value">1</span>

  <span class="excel-product-qty-label">коробка</span>

  <button
    type="button"
    class="excel-product-qty-plus"
    data-product-id="${escapeHtml(product.id || product.name)}"
  >+</button>
</div>

<button
  class="excel-product-cart"
  type="button"
  data-product-id="${escapeHtml(product.id || product.name)}"
>
  В корзину
</button>
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
// ---------- Корзина ----------
const CART_KEY = 'horeca_cart';

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Изменение количества коробок
document.addEventListener('click', (e) => {
  const minus = e.target.closest('.excel-product-qty-minus');
  const plus = e.target.closest('.excel-product-qty-plus');

  if (minus || plus) {
    const button = minus || plus;
    const card = button.closest('.excel-product-card');

    if (!card) return;

    const value = card.querySelector('.excel-product-qty-value');

    let quantity = Number(value.textContent) || 1;

    if (minus) {
      quantity = Math.max(1, quantity - 1);
    }

    if (plus) {
      quantity += 1;
    }

    value.textContent = quantity;

    const label = card.querySelector('.excel-product-qty-label');

    if (label) {
      label.textContent =
        quantity === 1 ? 'коробка' :
        quantity < 5 ? 'коробки' :
        'коробок';
    }

    return;
  }

  // Добавление в корзину
  const btn = e.target.closest('.excel-product-cart');

  if (!btn) return;

  const card = btn.closest('.excel-product-card');

  if (!card) return;

  const id = btn.dataset.productId;

  const quantityElement =
    card.querySelector('.excel-product-qty-value');

  const quantity =
    Number(quantityElement?.textContent) || 1;

  const cart = getCart();

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: id,
      quantity: quantity
    });
  }

  saveCart(cart);

  btn.classList.add('in-cart');
  btn.textContent = '✓ В корзине';
});

// При загрузке страницы отмечаем уже добавленные товары
document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();

  document.querySelectorAll('.excel-product-cart').forEach(btn => {
    if (cart.includes(btn.dataset.productId)) {
      btn.classList.add('in-cart');
      btn.textContent = '✓ В корзине';
    }
  });
});
})();
