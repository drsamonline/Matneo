/* MATNEO — shared store utilities
   Small, dependency-free helpers used by every page: navigation, the
   reveal animation, category metadata and the product-card renderer.
   The product catalogue itself lives in data/products.json. */
window.MATNEO = (function () {
  'use strict';

  var CATEGORIES = {
    'Printables': {
      thumb: 'thumb--printables',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="6" y="13" width="12" height="8" rx="1.5"/><path d="M6 13H4.5A1.5 1.5 0 0 1 3 11.5v-1A1.5 1.5 0 0 1 4.5 9h15A1.5 1.5 0 0 1 21 10.5v1A1.5 1.5 0 0 1 19.5 13H18"/></svg>'
    },
    'AI Resources': {
      thumb: 'thumb--ai',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/></svg>'
    },
    'Templates': {
      thumb: 'thumb--templates',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'
    },
    'Books': {
      thumb: 'thumb--books',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
    },
    'HTML Apps': {
      thumb: 'thumb--apps',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
    }
  };

  var DEFAULT_META = {
    thumb: 'thumb--default',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>'
  };

  function categoryMeta(category) {
    return CATEGORIES[category] || DEFAULT_META;
  }

  /* Product detail URLs are relative, so the base differs per page. */
  function detailHref(base, product) {
    if (product.link && product.link !== '#' && /^https?:/.test(product.link)) return product.link;
    var id = product.id || product.slug || encodeURIComponent((product.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    return base + '?id=' + encodeURIComponent(id);
  }

  function productCard(product, detailBase) {
    var meta = categoryMeta(product.category);
    var card = document.createElement('article');
    card.className = 'product-card reveal';

    var thumb = document.createElement('div');
    thumb.className = 'product-card__thumb ' + meta.thumb;
    if (product.badge) {
      var badge = document.createElement('span');
      badge.className = 'product-card__badge';
      badge.textContent = product.badge;
      thumb.appendChild(badge);
    }
    if (product.image) {
      var img = document.createElement('img');
      img.src = product.image;
      img.alt = product.title || 'MATNEO product';
      img.loading = 'lazy';
      // If the image is missing (a new repo the hub has not captured yet),
      // fall back to the category icon instead of a broken image.
      img.onerror = function () { img.remove(); thumb.innerHTML += meta.icon; };
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = meta.icon;
    }

    var body = document.createElement('div');
    body.className = 'product-card__body';

    var cat = document.createElement('span');
    cat.className = 'product-card__cat';
    cat.textContent = product.category || 'Digital product';

    var title = document.createElement('h3');
    title.className = 'product-card__title';
    var link = document.createElement('a');
    link.href = detailHref(detailBase, product);
    link.textContent = product.title || 'MATNEO product';
    title.appendChild(link);

    body.append(cat, title);

    if (product.tagline) {
      var desc = document.createElement('p');
      desc.className = 'product-card__desc';
      desc.textContent = product.tagline;
      body.appendChild(desc);
    }

    var foot = document.createElement('div');
    foot.className = 'product-card__foot';
    var price = document.createElement('strong');
    price.className = 'product-price';
    price.textContent = product.price || 'Coming soon';
    var cta = document.createElement('a');
    cta.className = 'btn btn--primary btn--sm';
    cta.href = detailHref(detailBase, product);
    cta.textContent = 'View product';
    foot.append(price, cta);

    body.appendChild(foot);

    // A rating on EVERY card (aggregate + your own), via the shared ratings module.
    var ratingRow = document.createElement('div');
    ratingRow.className = 'product-card__rating';
    if (window.MATNEO_RATINGS && window.MATNEO_RATINGS.mount) {
      window.MATNEO_RATINGS.mount(ratingRow, product);
    } else {
      var agg = product.rating || {};
      var avg = document.createElement('span');
      avg.className = 'rating__avg';
      avg.textContent = agg.count ? (agg.avg + '/5 from ' + agg.count) : 'Not rated yet';
      ratingRow.appendChild(avg);
    }
    body.appendChild(ratingRow);

    card.append(thumb, body);
    return card;
  }

  function fetchProducts(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function initNav() {
    var toggle = document.querySelector('.nav__toggle');
    var links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && links.classList.contains('open')) {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  function initYear() {
    var y = document.querySelector('[data-current-year]') || document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function initReveal() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = document.querySelectorAll('.reveal:not(.in)');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  function init() {
    initNav();
    initYear();
    initReveal();
  }

  return {
    CATEGORIES: CATEGORIES,
    categoryMeta: categoryMeta,
    productCard: productCard,
    detailHref: detailHref,
    fetchProducts: fetchProducts,
    initNav: initNav,
    initYear: initYear,
    initReveal: initReveal,
    init: init
  };
})();
