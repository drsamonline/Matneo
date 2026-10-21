/* MATNEO — store home controller
   Loads the featured products and fills in the category counts.
   All catalogue data comes from data/products.json. */
(function () {
  'use strict';
  var M = window.MATNEO;
  if (!M) return;

  M.init();

  var featured = document.getElementById('featured-products');
  var catsWrap = document.getElementById('category-grid');

  M.fetchProducts('data/products.json')
    .then(function (products) {
      if (featured) {
        var picks = products.filter(function (p) { return p.featured !== false; }).slice(0, 3);
        if (!picks.length) picks = products.slice(0, 3);
        featured.replaceChildren.apply(featured, picks.map(function (p) {
          return M.productCard(p, 'product.html');
        }));
        M.initReveal();
      }
      if (catsWrap) {
        var counts = {};
        products.forEach(function (p) {
          counts[p.category] = (counts[p.category] || 0) + 1;
        });
        catsWrap.querySelectorAll('[data-category]').forEach(function (el) {
          var c = el.getAttribute('data-category');
          var n = counts[c] || 0;
          var badge = el.querySelector('.cat-card__count');
          if (badge) badge.textContent = n === 1 ? '1 product' : n + ' products';
        });
      }
    })
    .catch(function () {
      if (featured) {
        featured.innerHTML = '<p class="product-status">Products are being prepared. Please check back soon.</p>';
      }
    });
})();
