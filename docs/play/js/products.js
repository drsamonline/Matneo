(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-navigation');
  if (menuButton && navigation) menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('[data-current-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });
  const container = document.querySelector('#product-list');
  if (!container) return;
  const createProductCard = (product) => {
    const card = document.createElement('article'); card.className = 'product-card';
    const title = document.createElement('h3'); title.textContent = product.title || 'MATNEO product';
    const category = document.createElement('p'); category.textContent = product.category || 'Digital product';
    const price = document.createElement('strong'); price.className = 'product-price'; price.textContent = product.price || 'Coming soon';
    const notice = document.createElement('p'); notice.textContent = 'Product details will be available soon.';
    card.append(title, category, price, notice); return card;
  };
  fetch('../data/products.json')
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
    .then((products) => container.replaceChildren(...products.map(createProductCard)))
    .catch(() => { container.innerHTML = '<p class="product-status">We could not load products right now. Please refresh and try again.</p>'; });
})();
