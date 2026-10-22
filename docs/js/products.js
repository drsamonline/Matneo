/* MATNEO — catalogue controller
   Powers two pages from the same data file:
     - products/index.html  (paid products; body[data-scope="paid"])
     - free/index.html      (free & open-source; body[data-scope="free"])
     - product.html?id=...  (a single product detail page)
   Everything is driven by data/products.json, so new products are added
   by editing that one file. */
(function () {
  'use strict';
  var M = window.MATNEO;
  if (!M) return;

  M.init();

  var listing = document.getElementById('product-list');
  var detail = document.getElementById('product-detail');

  /* ---------------- Product detail page ---------------- */
  if (detail) {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');

    M.fetchProducts('data/products.json')
      .then(function (products) {
        var key = (id || '').toLowerCase();
        var product = products.filter(function (p) {
          return (p.id || '').toLowerCase() === key ||
            (p.slug || '').toLowerCase() === key ||
            (p.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === key;
        })[0];

        if (!product) {
          detail.innerHTML = '<div class="product-status">We could not find that product. ' +
            '<a class="text-link" href="products/">Browse all products</a>.</div>';
          return;
        }

        document.title = product.title + ' | MATNEO';
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && product.tagline) metaDesc.setAttribute('content', product.tagline);

        var meta = M.categoryMeta(product.category);
        var crumb = document.getElementById('crumb-current');
        if (crumb) crumb.textContent = product.title;

        var gallery = document.createElement('div');
        gallery.className = 'pd__gallery ' + meta.thumb;
        if (product.badge) {
          var b = document.createElement('span');
          b.className = 'pd__badge';
          b.textContent = product.badge;
          gallery.appendChild(b);
        }
        if (product.image) {
          var im = document.createElement('img');
          im.src = product.image;
          im.alt = product.title;
          gallery.appendChild(im);
        } else {
          gallery.innerHTML += meta.icon;
        }

        var info = document.createElement('div');
        var cat = document.createElement('span');
        cat.className = 'pd__cat';
        cat.textContent = product.category || 'Digital product';
        var h1 = document.createElement('h1');
        h1.textContent = product.title || 'MATNEO product';
        info.append(cat, h1);

        var priceRow = document.createElement('div');
        priceRow.className = 'pd__price';
        var price = document.createElement('strong');
        price.textContent = product.price || 'Coming soon';
        var priceNote = document.createElement('span');
        priceNote.textContent = product.type === 'open-source'
          ? 'free · open source · direct download'
          : 'one-time · instant digital delivery';
        priceRow.append(price, priceNote);
        info.appendChild(priceRow);

        if (product.description) {
          var desc = document.createElement('p');
          desc.className = 'pd__desc';
          desc.textContent = product.description;
          info.appendChild(desc);
        }

        var actions = document.createElement('div');
        actions.className = 'pd__actions';

        var buyLinks = (product.buyLinks || []).filter(function (l) { return l && l.url; });
        if (buyLinks.length) {
          buyLinks.forEach(function (l) {
            var a = document.createElement('a');
            a.className = 'btn btn--primary';
            a.href = l.url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = 'Buy on ' + (l.store || 'store');
            actions.appendChild(a);
          });
        } else {
          var buy = document.createElement('a');
          buy.className = 'btn btn--primary';
          buy.href = (product.link && product.link !== '#') ? product.link : '#';
          buy.textContent = product.type === 'open-source' ? 'Open the app' : 'Get this product';
          actions.appendChild(buy);
        }

        if (product.sourceRepo) {
          var src = document.createElement('a');
          src.className = 'btn btn--ghost';
          src.href = 'https://github.com/' + product.sourceRepo;
          src.target = '_blank';
          src.rel = 'noopener';
          src.textContent = 'View source';
          actions.appendChild(src);
        }

        var back = document.createElement('a');
        back.className = 'btn btn--ghost';
        back.href = product.type === 'open-source' ? 'free/' : 'products/';
        back.textContent = product.type === 'open-source' ? 'All free apps' : 'Browse all products';
        actions.appendChild(back);
        info.appendChild(actions);

        if (product.features && product.features.length) {
          var ul = document.createElement('ul');
          ul.className = 'pd__meta';
          product.features.forEach(function (f) {
            var li = document.createElement('li');
            li.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
            var span = document.createElement('span');
            span.textContent = f;
            li.appendChild(span);
            ul.appendChild(li);
          });
          info.appendChild(ul);
        }

        if (product.tags && product.tags.length) {
          var tags = document.createElement('div');
          tags.className = 'pd__tags';
          product.tags.forEach(function (t) {
            var tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = t;
            tags.appendChild(tag);
          });
          info.appendChild(tags);
        }

        if (window.MATNEO_RATINGS) {
          window.MATNEO_RATINGS.mount(info, product);
        }

        var note = document.createElement('p');
        note.className = 'pd__note';
        note.textContent = product.type === 'open-source'
          ? 'Free and open source. Runs offline — no accounts, no telemetry.'
          : 'This is a digital product. You get access as soon as your order is confirmed.';
        info.appendChild(note);

        detail.replaceChildren(gallery, info);

        var related = document.getElementById('related');
        if (related) {
          var others = products.filter(function (p) { return p !== product; });
          var same = others.filter(function (p) { return p.category === product.category; });
          var picks = same.concat(others.filter(function (p) { return p.category !== product.category; })).slice(0, 3);
          if (picks.length) {
            related.replaceChildren.apply(related, picks.map(function (p) {
              return M.productCard(p, 'product.html');
            }));
            M.initReveal();
          } else {
            var sec = document.getElementById('related-section');
            if (sec) sec.hidden = true;
          }
        }
      })
      .catch(function () {
        detail.innerHTML = '<div class="product-status">We could not load this product right now. Please refresh and try again.</div>';
      });
    return;
  }

  /* ---------------- Listing pages (paid + free) ---------------- */
  if (!listing) return;

  var scope = document.body.getAttribute('data-scope') || 'all';
  function inScope(p) {
    if (scope === 'all') return true;
    if (scope === 'free') return p.type === 'open-source';
    if (scope === 'paid') return p.type !== 'open-source';
    return true;
  }

  var filterWrap = document.getElementById('category-filter');
  var countEl = document.getElementById('result-count');
  var all = [];
  var active = new URLSearchParams(window.location.search).get('category') || 'All';

  function render() {
    var items = active === 'All' ? all : all.filter(function (p) { return p.category === active; });
    if (!items.length) {
      listing.innerHTML = '<p class="product-status">Nothing in this category yet. Check back soon.</p>';
    } else {
      listing.replaceChildren.apply(listing, items.map(function (p) {
        return M.productCard(p, '../product.html');
      }));
    }
    if (countEl) {
      countEl.textContent = items.length === 1 ? '1 item' : items.length + ' items';
    }
    if (filterWrap) {
      filterWrap.querySelectorAll('button').forEach(function (b) {
        var on = b.getAttribute('data-filter') === active;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }
    M.initReveal();
  }

  M.fetchProducts('../data/products.json')
    .then(function (products) {
      all = products.filter(inScope);
      if (filterWrap) {
        var cats = ['All'];
        all.forEach(function (p) {
          if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
        });
        cats.forEach(function (c) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'filter-chip';
          b.setAttribute('data-filter', c);
          b.textContent = c;
          b.addEventListener('click', function () {
            active = c;
            var url = new URL(window.location.href);
            if (c === 'All') url.searchParams.delete('category');
            else url.searchParams.set('category', c);
            window.history.replaceState({}, '', url);
            render();
          });
          filterWrap.appendChild(b);
        });
      }
      render();
    })
    .catch(function () {
      listing.innerHTML = '<p class="product-status">We could not load products right now. Please refresh and try again.</p>';
    });
})();
