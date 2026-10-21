(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-navigation');
  if (menuButton && navigation) menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('[data-current-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });
  const container = document.querySelector('#featured-products');
  if (!container) return;
  const createProductCard = (product) => {
    const card = document.createElement('article'); card.className = 'product-card';
    const title = document.createElement('h3'); title.textContent = product.title || 'MATNEO product';
    const category = document.createElement('p'); category.textContent = product.category || 'Digital product';
    const price = document.createElement('strong'); price.className = 'product-price'; price.textContent = product.price || 'Coming soon';
    const link = document.createElement('a'); link.className = 'btn'; link.href = 'products/'; link.textContent = 'View product';
    card.append(title, category, price, link); return card;
  };
  fetch('data/products.json')
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
    .then((products) => { container.replaceChildren(...products.slice(0, 3).map(createProductCard)); })
    .catch(() => { container.innerHTML = '<p class="product-status">Products are being prepared. Please check back soon.</p>'; });
})();
