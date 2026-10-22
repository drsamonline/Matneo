/* MATNEO — ratings
   A tiny, dependency-free star rating. Your rating is stored locally
   (no server, no account). The aggregate shown comes from data/products.json
   (rating.avg / rating.count), which the shop owner refreshes. To send a
   rating, it opens a prefilled GitHub issue. */
window.MATNEO_RATINGS = (function () {
  'use strict';
  var KEY = 'matneo:rating:';

  function yourRating(id) {
    try { var v = localStorage.getItem(KEY + id); return v ? parseInt(v, 10) : 0; } catch (e) { return 0; }
  }
  function saveRating(id, n) {
    try { localStorage.setItem(KEY + id, String(n)); } catch (e) {}
  }

  function stars(value, interactive, onPick) {
    var wrap = document.createElement('div');
    wrap.className = 'rating';
    wrap.setAttribute('role', interactive ? 'radiogroup' : 'img');
    if (!interactive) wrap.setAttribute('aria-label', value + ' out of 5');
    for (var i = 1; i <= 5; i++) {
      var b = document.createElement(interactive ? 'button' : 'span');
      if (interactive) { b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', i + ' star' + (i > 1 ? 's' : '')); }
      b.className = 'rating__star' + (i <= value ? ' is-on' : '');
      b.textContent = '\u2605';
      if (interactive) {
        (function (n) { b.addEventListener('click', function () { onPick(n); }); })(i);
      }
      wrap.appendChild(b);
    }
    return wrap;
  }

  function sendLink(product, n) {
    var title = encodeURIComponent('Rating: ' + product.title + ' — ' + n + '/5');
    var body = encodeURIComponent('Product: ' + product.title + ' (' + (product.id || '') + ')\nMy rating: ' + n + '/5\n\nComment (optional):\n');
    return 'https://github.com/drsamonline/Matneo/issues/new?title=' + title + '&body=' + body;
  }

  function mount(container, product) {
    var box = document.createElement('div');
    box.className = 'rating-box';

    var mine = yourRating(product.id);
    var label = document.createElement('span');
    label.className = 'rating__label';
    label.textContent = mine ? 'Your rating' : 'Rate this';
    box.appendChild(label);

    var interactive = stars(mine, true, function (n) {
      saveRating(product.id, n);
      mine = n;
      box.replaceChildren();
      mount(container, product); // re-render in place
    });
    box.appendChild(interactive);

    if (mine) {
      var a = document.createElement('a');
      a.className = 'rating__send';
      a.href = sendLink(product, mine);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Send your rating';
      box.appendChild(a);
    }

    var agg = product.rating || {};
    if (agg && agg.count) {
      var avg = document.createElement('span');
      avg.className = 'rating__avg';
      avg.textContent = '· ' + agg.avg + '/5 from ' + agg.count;
      box.appendChild(avg);
    }

    container.appendChild(box);
  }

  return { mount: mount, yourRating: yourRating, stars: stars };
})();
