(() => {
  // --- Состояние корзины ---
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  const cartSidebar = document.getElementById('cart-sidebar');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalPrice = document.getElementById('cart-total-price');

  // Управление открытием корзины
  document.getElementById('cart-button').addEventListener('click', () => {
    renderCart();
    cartSidebar.classList.add('open');
  });

  const closeCart = () => cartSidebar.classList.remove('open');
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  const cartClear = document.getElementById('cart-clear');
  if (cartClear) {
    cartClear.addEventListener('click', () => {
      clearCart();
      closeCart();
    });
  }

  function updateCopyrightYear() {
    const yearElements = document.querySelectorAll('.copyright-year');
    const year = new Date().getFullYear();
    yearElements.forEach(el => el.textContent = year);
  }

  updateCopyrightYear();

  // Валидация формы заказа
  const orderForm = document.getElementById('order-form');
  const orderFeedback = document.getElementById('order-feedback');

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = orderForm.name.value.trim();
    const phone = orderForm.phone.value.trim();

    if (!name || !phone) {
      orderFeedback.textContent = 'Пожалуйста, заполните все поля.';
      orderFeedback.className = 'order-feedback error';
      return;
    }

    if (cart.length === 0) {
        orderFeedback.textContent = 'Корзина пуста.';
        orderFeedback.className = 'order-feedback error';
        return;
    }

    // Имитация отправки
    orderFeedback.textContent = 'Заказ успешно отправлен!';
    orderFeedback.className = 'order-feedback success';
    orderForm.reset();
    cart = [];
    saveAndRender();
  });

  function syncCart() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
  }

  function updateCartBadge() {
    syncCart();
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = cart.length;
    }
  }

  function saveAndRender() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push(product);
    }
    saveAndRender();
  }

  function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveAndRender();
  }

  function clearCart() {
    cart = [];
    saveAndRender();
  }

  function changeQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      saveAndRender();
    }
  }

  function renderCart() {
    syncCart();
    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
      const itemPrice = item.box_price > 0 ? item.box_price : (parseFloat(item.price) || 0);
      total += itemPrice * item.quantity;
      const div = document.createElement('div');
      div.classList.add('cart-item');
      div.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">${itemPrice * item.quantity} ₽</div>
          <div class="cart-item-vat">Цена с НДС</div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
            <span>${item.quantity} ${getPackLabel(item.quantity)}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
            <button class="remove-btn" onclick="remove('${item.id}')">Удалить</button>
          </div>
        </div>
      `;
      cartItemsContainer.appendChild(div);
    });

    cartTotalPrice.textContent = `${total} ₽`;
  }

  // Делаем функции доступными глобально для onclick
  window.changeQty = changeQuantity;
  window.remove = removeFromCart;

  // Обновляем бейдж при загрузке
  document.addEventListener('DOMContentLoaded', updateCartBadge);

  // Синхронизируем корзину при обновлении из других скриптов
  document.addEventListener('cart-updated', updateCartBadge);

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

  function getPackLabel(quantity) {
    const q = Number(quantity) || 0;
    return q === 1 ? 'упаковка' : q < 5 ? 'упаковки' : 'упаковок';
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
    // --- Получение данных для объекта ---
    // Преобразуем productId в строку, чтобы избежать проблем с btoa
    const rawId = product.id || product.Id || product['ID'] || (product.name + product.brand);
    const productId = btoa(unescape(encodeURIComponent(rawId)));
    
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
    
    const category = formatProductValue(
      product.category ||
      product.Category ||
      product['Категория'] ||
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
      '0'
    );

    const imageSource =
      product.image_url ||
      product.image ||
      product.Image ||
      '';

    const imageUrl = getImageUrl(imageSource);

    const badge = formatProductValue(
      product.badge ||
      product.Badge ||
      product['Бейдж'] ||
      ''
    );

    const stock = formatProductValue(
      product.stock ||
      product.Stock ||
      product.status ||
      product['Наличие'] ||
      ''
    );

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
            ? `<p>${escapeHtml(boxQty)} шт. в упаковке</p>`
            : ''
        }

        <div class="prices">
           <p>${escapeHtml(priceUnit)} / шт.</p>
        </div>

        <div class="availability">

          <span class="stock-status">
            ${escapeHtml(stock)}
          </span>

        </div>

        <button class="add-to-cart btn-cart" data-id="${escapeHtml(productId)}">
          <i class="fas fa-shopping-basket"></i> Добавить в корзину
        </button>

      </div>
    `;

    // --- Обработчик кнопки ---
    const btn = card.querySelector('.add-to-cart');
    btn.addEventListener('click', () => {
      const productObj = {
        id: productId,
        name: name,
        category: category,
        image: imageUrl,
        price: parseFloat(priceUnit) || 0,
        quantity: 1
      };

      addToCart(productObj);
      
      // UI изменения
      btn.textContent = '✓ В корзине';
      btn.classList.add('in-cart', 'added');
      
      // Сброс анимации
      setTimeout(() => btn.classList.remove('added'), 300);
    });

    const img = card.querySelector('.product-img');

    if (img) {
      img.addEventListener('error', () => {
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
