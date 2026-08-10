/* ============================================================
   HoReCaDrinks — Интерактивность лендинга
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initBurgerMenu();
  initUpdatedBadge();
  initLeadForm();
  initRevealAnimations();
  initProductFeed();
  initActiveNav();
});

/* ============================================================
   1. ЗАГРУЗКА ТОВАРОВ ИЗ EXCEL
   ============================================================ */
async function loadProducts() {
    const container = document.querySelector('.products-container');
    if (!container) return;

    try {
        const response = await fetch('catalog.json');

        if (!response.ok) {
            throw new Error(`Не удалось загрузить catalog.json: ${response.status}`);
        }

        const data = await response.json();
        const products = Array.isArray(data.products) ? data.products : [];

        renderProductCards(products);

    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);

        container.innerHTML = `
            <div style="padding:20px;color:#b00020;">
                Не удалось загрузить каталог товаров.
            </div>
        `;
    }
}

function formatProductValue(value) {
  return value === undefined || value === null || value === '' ? 'по запросу' : value;
}

function renderProductCards(products) {
  const container = document.querySelector('.products-container');
  if (!container) return;

  container.innerHTML = '';

  products.forEach(product => {
    const card = createProductCard(product);
    container.appendChild(card);
  });
}

function createProductCard(product) {
  const brand = formatProductValue(product.brand || product.Brand || product['Бренд'] || '');
  const name = formatProductValue(product.name || product.Name || product['Название'] || '');
  const volume = formatProductValue(product.volume || product.Volume || product['Объём'] || '');
  const packageType = formatProductValue(product.package || product.Package || product['Упаковка'] || '');
  const boxQty = formatProductValue(product.box_qty || product.box_qty || product['Количество в коробке'] || '');
  const priceUnit = formatProductValue(product.price_unit || product.PriceUnit || product['Цена за штуку'] || '');
  const priceBox = formatProductValue(product.price_box || product.PriceBox || product['Цена за коробку'] || '');
  const stock = formatProductValue(product.stock || product.Stock || product['Наличие'] || '');
  const badge = formatProductValue(product.badge || product.Badge || product['Бейдж'] || '');
  const imageUrl = formatProductValue(product.image_url || product.image || product.Image || 'placeholder.jpg');

  const badgeHtml = badge && badge.toString().trim() !== ''
    ? `<span class="badge badge-${badge.toString().toLowerCase().replace(/\s+/g, '-')}">${badge}</span>`
    : '';

  const card = document.createElement('div');
  card.classList.add('product-card');

  card.innerHTML = `
    <div class="product-image">
      <img 
        src="${imageUrl}"
        alt="${name}" 
        class="product-img"
      >
    </div>
    <div class="product-info">
      <h3>${brand}</h3>
      <p>${name}</p>
      <p>${volume} · ${packageType}</p>
      <p>${boxQty} шт. в коробке</p>
      <div class="prices">
        <p>${priceUnit} / шт.</p>
        <p>${priceBox} / коробка</p>
      </div>
      <div class="availability">
        <span class="stock-status">${stock}</span>
        ${badgeHtml}
      </div>
      <button class="add-to-cart">Добавить в заявку</button>
    </div>
  `;

  return card;
}

function initProductFeed() {
  const container = document.querySelector('.products-container');
  if (!container) return;
  loadProducts();
}

/* ============================================================
   2. БУРГЕР-МЕНЮ (мобильная навигация)
   ============================================================ */
function initBurgerMenu() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    burger.classList.toggle('active', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });

  // Закрыть меню при клике на ссылку
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  // Закрыть меню при клике вне его
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================================
   2. БЕЙДЖ «ОБНОВЛЕНО» — подстановка текущей даты
   ============================================================ */
function initUpdatedBadge() {
  const badges = document.querySelectorAll('.updated-badge');

  if (!badges.length) return;

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  badges.forEach(el => {
    el.textContent = `Обновлено: ${day}.${month}.${year}`;
  });
}

function initLeadForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const submitButton = document.getElementById('lead-submit');
  const successMessage = document.getElementById('form-success');
  const generalError = document.getElementById('form-general-error');

  const params = new URLSearchParams(window.location.search);
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  utmFields.forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      input.value = params.get(field) || '';
    }
  });

  const formatPhone = value => {
    value = value.replace(/\D/g, '');

    if (value.startsWith('8')) {
      value = '7' + value.substring(1);
    }

    if (!value.startsWith('7')) {
      value = '7' + value;
    }

    value = value.substring(0, 11);

    let result = '+7';
    if (value.length > 1) {
      result += ' (' + value.substring(1, 4);
    }
    if (value.length >= 4) {
      result += ')';
    }
    if (value.length > 4) {
      result += ' ' + value.substring(4, 7);
    }
    if (value.length > 7) {
      result += '-' + value.substring(7, 9);
    }
    if (value.length > 9) {
      result += '-' + value.substring(9, 11);
    }
    return result;
  };

  const setError = (input, message) => {
    input.classList.add('is-invalid');
    const error = document.getElementById(`${input.id}-error`);
    if (error) {
      error.textContent = message;
    }
  };

  const clearError = input => {
    input.classList.remove('is-invalid');
    const error = document.getElementById(`${input.id}-error`);
    if (error) {
      error.textContent = '';
    }
  };

  nameInput.addEventListener('input', function () {
    clearError(this);
  });

  phoneInput.addEventListener('input', function () {
    this.value = formatPhone(this.value);
    clearError(this);
  });

  const validateName = () => {
    const value = nameInput.value.trim();
    if (value.length < 2) {
      setError(nameInput, 'Введите ваше имя.');
      return false;
    }
    clearError(nameInput);
    return true;
  };

  const validatePhone = () => {
    const digits = phoneInput.value.replace(/\D/g, '');
    if (digits.length !== 11 || !digits.startsWith('7')) {
      setError(phoneInput, 'Введите корректный номер телефона.');
      return false;
    }
    clearError(phoneInput);
    return true;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (generalError) {
      generalError.hidden = true;
    }

    const validName = validateName();
    const validPhone = validatePhone();

    if (!validName || !validPhone) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitButton.classList.add('is-loading');
    submitButton.disabled = true;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    console.log('Заявка:', data);

    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      if (successMessage) {
        successMessage.hidden = false;
      }
      form.reset();
      utmFields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
          input.value = params.get(field) || '';
        }
      });
      if (typeof ym === 'function') {
        ym(YOUR_YANDEX_METRIKA_ID, 'reachGoal', 'lead_submit');
      }
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead');
      }
      if (successMessage) {
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      if (generalError) {
        generalError.hidden = false;
      }
    } finally {
      submitButton.classList.remove('is-loading');
      submitButton.disabled = false;
    }
  });
}

function initRevealAnimations() {
  const elements = document.querySelectorAll('.advantage-card, .category-card, .segment-card, .how-step, .accounting-item, .condition-item, .doc-card, .faq-item');

  if (!elements.length) return;

  // Если браузер не поддерживает IntersectionObserver — показываем всё сразу
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach((el, index) => {
    el.classList.add('reveal');
    // Добавляем задержку для каскадного эффекта
    if (index % 3 === 1) el.classList.add('reveal-delay-1');
    if (index % 3 === 2) el.classList.add('reveal-delay-2');
    observer.observe(el);
  });
}

/* ============================================================
   6. ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ ПРИ СКРОЛЛЕ
   ============================================================ */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, {
    threshold: 0.3
  });

  sections.forEach(section => observer.observe(section));
}
