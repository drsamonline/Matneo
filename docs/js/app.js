/* MATNEO — store home controller
   Loads the featured products and builds the category grid from the catalogue.

   The grid used to be six hand-written cards naming categories that no longer
   existed (HTML Apps, Homeopathy, Health Tools, Games, Utilities, Data), each
   reading "0 products", while the real catalogue — licences, the NTET course and
   the books — had no card at all. A hand-maintained list of categories is a list
   that goes stale the first time someone adds a product, so it is generated now:
   whatever is in data/products.json is what the home page offers. */
(function () {
  'use strict';
  var M = window.MATNEO;
  if (!M) return;

  M.init();

  /* Human copy for the categories we know about. Anything else still gets a card —
     with a plain fallback line — because a new category with no description is
     better than a category nobody can reach. */
  var COPY = {
    'Publication — Ebooks': 'Kindle editions of the books: clinical manuals, materia medica and poetry.',
    'Publication — Paperbacks': 'Print editions of the books, sold through Amazon.',
    'Licence': 'Personal, commercial and reseller licences for Forge.',
    'Education': 'Courses and exam preparation, priced in rupees.',
    'Printables': 'Planners and worksheets you print and use on paper.',
    'Templates': 'Ready-to-use documents and business templates.',
    'AI Resources': 'Prompt packs and AI-assisted workflows.',
    'HTML Apps': 'Offline tools that work directly in your browser.'
  };

  var featured = document.getElementById('featured-products');
  var catsWrap = document.getElementById('category-grid');
  var booksWrap = document.getElementById('books-grid');

  M.fetchProducts('data/products.json')
    .then(function (products) {
      /* The books are what this shop is: a book leads, a licence follows. The old
         rule took the first three featured products in file order, which put two
         Forge licences above every book the owner wrote. */
      if (featured) {
        var picks = products.filter(function (p) { return p.featured !== false; })
          .sort(function (a, b) {
            var ab = (a.category || '').indexOf('Publication') === 0 ? 0 : 1;
            var bb = (b.category || '').indexOf('Publication') === 0 ? 0 : 1;
            return ab - bb;
          })
          .slice(0, 3);
        if (!picks.length) picks = products.slice(0, 3);
        featured.replaceChildren.apply(featured, picks.map(function (p) {
          return M.productCard(p, 'product.html');
        }));
      }

      /* Every book in the catalogue, on the home page. Hand-written lists go stale
         (the six dead category cards proved it); this one cannot. */
      if (booksWrap) {
        var books = products.filter(function (p) {
          return (p.category || '').indexOf('Publication') === 0;
        });
        if (books.length) {
          booksWrap.replaceChildren.apply(booksWrap, books.map(function (p) {
            return M.productCard(p, 'product.html');
          }));
        } else {
          var booksSection = document.getElementById('books');
          if (booksSection) booksSection.hidden = true;
        }
      }

      if (catsWrap) {
        var order = [];
        var counts = {};
        products.forEach(function (p) {
          var c = p.category;
          if (!c) return;
          if (counts[c] === undefined) { counts[c] = 0; order.push(c); }
          counts[c] += 1;
        });

        /* biggest first, so the shop leads with what it actually sells */
        order.sort(function (a, b) { return counts[b] - counts[a]; });

        var frag = document.createDocumentFragment();
        order.forEach(function (cat) {
          var n = counts[cat];
          var a = document.createElement('a');
          a.className = 'cat-card reveal';
          a.href = 'products/?category=' + encodeURIComponent(cat);
          a.setAttribute('data-category', cat);

          var icon = document.createElement('span');
          icon.className = 'cat-card__icon';
          icon.innerHTML = M.categoryMeta(cat).icon;
          a.appendChild(icon);

          var h3 = document.createElement('h3');
          h3.textContent = cat;
          a.appendChild(h3);

          var p = document.createElement('p');
          p.textContent = COPY[cat] || ('Everything filed under ' + cat + '.');
          a.appendChild(p);

          var count = document.createElement('span');
          count.className = 'cat-card__count';
          count.textContent = n === 1 ? '1 product' : n + ' products';
          a.appendChild(count);

          frag.appendChild(a);
        });
        catsWrap.replaceChildren(frag);
      }

      var stat = document.querySelector('[data-stat="products"]');
      if (stat) stat.textContent = String(products.length);

      /* Titles, not entries: a book with a Kindle and a print edition is one book. */
      var bookStat = document.querySelector('[data-stat="books"]');
      if (bookStat) {
        var seen = {};
        products.forEach(function (p) {
          if (p.type === 'book') seen[p.asin || p.title] = 1;
        });
        bookStat.textContent = String(Object.keys(seen).length);
      }

      M.initReveal();
    })
    .catch(function () {
      if (featured) {
        featured.innerHTML = '<p class="product-status">Products are being prepared. Please check back soon.</p>';
      }
      if (catsWrap) {
        catsWrap.innerHTML = '<p class="product-status">The catalogue could not be loaded. ' +
          '<a class="text-link" href="products/">Open the shop directly</a>.</p>';
      }
    });
})();
