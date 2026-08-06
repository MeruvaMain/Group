/* ═══════════════════════════════════════
   VEMIL — Page JS
   Language switcher + Cart + B2B form
   ═══════════════════════════════════════ */

/* ─────────────────────────────────────
   LANGUAGE SYSTEM
   ───────────────────────────────────── */

var vemilCurrentLang = 'vi';

function vemilApplyLang(lang) {
  var L = window.VEMIL_LANG;
  if (!L || !L[lang]) return;
  vemilCurrentLang = lang;

  var t = L[lang];
  var d = L.drinks;
  var info = L.info[lang];

  /* data-vl → innerHTML */
  document.querySelectorAll('[data-vl]').forEach(function(el) {
    var key = el.getAttribute('data-vl');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  /* data-vl-ph → placeholder */
  document.querySelectorAll('[data-vl-ph]').forEach(function(el) {
    var key = el.getAttribute('data-vl-ph');
    if (t[key] !== undefined) el.setAttribute('placeholder', t[key]);
  });

  /* drink ingredients */
  document.querySelectorAll('[data-drink-ing]').forEach(function(el) {
    var id = el.getAttribute('data-drink-ing');
    var drink = d.find(function(dr) { return dr.id === id; });
    if (drink) el.textContent = drink.ing[lang] || drink.ing.vi;
  });

  /* info section blocks */
  document.querySelectorAll('[data-info]').forEach(function(el) {
    var key = el.getAttribute('data-info');
    if (info && info[key] !== undefined) el.textContent = info[key];
  });

  /* B2B form selects */
  var prodSel = document.getElementById('b2bProductSel');
  if (prodSel && t.form_product_opts) {
    var opts = prodSel.querySelectorAll('option');
    opts[0].textContent = t.form_product_default;
    t.form_product_opts.forEach(function(txt, i) {
      if (opts[i + 1]) opts[i + 1].textContent = txt;
    });
  }
  var volSel = document.getElementById('b2bVolumeSel');
  if (volSel && t.form_vol_opts) {
    var vopts = volSel.querySelectorAll('option');
    vopts[0].textContent = t.form_vol_default;
    t.form_vol_opts.forEach(function(txt, i) {
      if (vopts[i + 1]) vopts[i + 1].textContent = txt;
    });
  }

  /* lang switcher buttons */
  document.querySelectorAll('.vls-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  /* update cart UI text */
  vemilRenderCart();

  /* save preference */
  try { localStorage.setItem('vemil_lang', lang); } catch(e) {}
}

function vemilInitLang() {
  var saved = 'vi';
  try { saved = localStorage.getItem('vemil_lang') || 'vi'; } catch(e) {}
  if (!window.VEMIL_LANG || !window.VEMIL_LANG[saved]) saved = 'vi';
  vemilApplyLang(saved);

  document.querySelectorAll('.vls-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      vemilApplyLang(btn.getAttribute('data-lang'));
    });
  });
}

/* ─────────────────────────────────────
   CART SYSTEM
   ───────────────────────────────────── */

var vemilCart = [];

function vemilFindDrink(id) {
  var d = window.VEMIL_LANG && window.VEMIL_LANG.drinks;
  if (!d) return null;
  return d.find(function(dr) { return dr.id === id; }) || null;
}

function vemilAddToCart(id) {
  var drink = vemilFindDrink(id);
  if (!drink) return;

  var existing = vemilCart.find(function(i) { return i.id === id; });
  if (existing) {
    existing.qty++;
  } else {
    vemilCart.push({ id: drink.id, name: drink.name, price: drink.price, qty: 1 });
  }

  /* button feedback */
  var btn = document.querySelector('[data-drink="' + id + '"].vemil-btn-add-cart');
  if (btn) {
    var t = window.VEMIL_LANG && window.VEMIL_LANG[vemilCurrentLang];
    btn.querySelector('span').textContent = (t && t.btn_added) ? t.btn_added : 'Đã thêm ✓';
    btn.classList.add('added');
    setTimeout(function() {
      btn.classList.remove('added');
      if (t) btn.querySelector('span').textContent = t.btn_add_cart || 'Thêm vào giỏ';
    }, 1200);
  }

  /* badge pop */
  var badge = document.getElementById('vemilCartBadge');
  if (badge) {
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
    setTimeout(function() { badge.classList.remove('pop'); }, 400);
  }

  vemilRenderCart();
}

function vemilChangeQty(id, delta) {
  var item = vemilCart.find(function(i) { return i.id === id; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    vemilCart = vemilCart.filter(function(i) { return i.id !== id; });
  }
  vemilRenderCart();
}

function vemilCartTotal() {
  return vemilCart.reduce(function(sum, i) { return sum + i.price * i.qty; }, 0);
}

function vemilFmtPrice(n) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function vemilRenderCart() {
  var t = (window.VEMIL_LANG && window.VEMIL_LANG[vemilCurrentLang]) || {};
  var d = window.VEMIL_LANG && window.VEMIL_LANG.drinks;

  /* badge count */
  var totalQty = vemilCart.reduce(function(s, i) { return s + i.qty; }, 0);
  var badge = document.getElementById('vemilCartBadge');
  if (badge) badge.textContent = totalQty;

  /* items container */
  var container = document.getElementById('vcdItems');
  var empty = document.getElementById('vcdEmpty');
  var footer = document.getElementById('vcdFooter');
  var totalEl = document.getElementById('vcdTotal');
  if (!container) return;

  if (vemilCart.length === 0) {
    container.innerHTML = '';
    if (empty) { empty.style.display = ''; container.appendChild(empty); }
    if (footer) footer.style.display = 'none';
  } else {
    if (empty) empty.style.display = 'none';
    container.innerHTML = '';

    vemilCart.forEach(function(item) {
      /* get ingredient string in current lang */
      var drink = d ? d.find(function(dr) { return dr.id === item.id; }) : null;
      var ing = drink ? (drink.ing[vemilCurrentLang] || drink.ing.vi) : '';

      var row = document.createElement('div');
      row.className = 'vcd-item';
      row.innerHTML =
        '<div class="vcd-item-name">' + item.name +
          (ing ? '<br><small style="font-size:.72rem;color:var(--silver-soft);font-family:Inter,sans-serif;font-style:normal">' + ing + '</small>' : '') +
        '</div>' +
        '<div class="vcd-qty">' +
          '<button class="vcd-qty-btn" onclick="vemilChangeQty(\'' + item.id + '\',-1)">−</button>' +
          '<span class="vcd-qty-val">' + item.qty + '</span>' +
          '<button class="vcd-qty-btn" onclick="vemilChangeQty(\'' + item.id + '\',1)">+</button>' +
        '</div>' +
        '<div class="vcd-item-price">' + vemilFmtPrice(item.price * item.qty) + '</div>';
      container.appendChild(row);
    });

    if (footer) footer.style.display = '';
    if (totalEl) totalEl.textContent = vemilFmtPrice(vemilCartTotal());
  }
}

function vemilOpenCart() {
  document.getElementById('vemilCartDrawer').classList.add('open');
  document.getElementById('vemilCartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function vemilCloseCart() {
  document.getElementById('vemilCartDrawer').classList.remove('open');
  document.getElementById('vemilCartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function vemilBuildOrderText() {
  var t = (window.VEMIL_LANG && window.VEMIL_LANG[vemilCurrentLang]) || {};
  var lines = ['=== ' + (t.cart_title || 'Đơn hàng') + ' ==='];
  vemilCart.forEach(function(item) {
    lines.push(item.name + ' x' + item.qty + ' = ' + vemilFmtPrice(item.price * item.qty));
  });
  lines.push('---');
  lines.push((t.cart_total || 'Tổng') + ': ' + vemilFmtPrice(vemilCartTotal()));
  return lines.join('\n');
}

/* ─────────────────────────────────────
   B2B FORM
   ───────────────────────────────────── */

function vemilInitB2BForm() {
  var form = document.getElementById('vemilB2BForm');
  var btn  = document.getElementById('vemilB2BBtn');
  var thx  = document.getElementById('vemilB2BThanks');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var t = (window.VEMIL_LANG && window.VEMIL_LANG[vemilCurrentLang]) || {};

    var name  = form.querySelector('[name="business_name"]');
    var phone = form.querySelector('[name="phone"]');
    if (!name.value.trim() || !phone.value.trim()) { name.focus(); return; }

    /* Reply-To phai la email doi tac, khong phai hom thu cua minh.
       O day email la truong tuy chon — neu khach bo trong thi giu
       nguyen dia chi mac dinh chu khong gui Reply-To rong. */
    var em = form.querySelector('[name="email"]');
    var rt = form.querySelector('[name="replyto"]');
    if (rt && em && em.value.trim()) rt.value = em.value.trim();

    btn.disabled = true;
    btn.textContent = t.cart_sending || 'Đang gửi...';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: new FormData(form)
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          form.reset();
          btn.style.display = 'none';
          if (thx) thx.style.display = 'block';
        } else {
          alert('Có lỗi xảy ra. Vui lòng thử lại.');
          btn.disabled = false;
          btn.innerHTML = t.form_submit || 'Gửi yêu cầu hợp tác →';
        }
      })
      .catch(function() {
        alert('Không gửi được. Kiểm tra kết nối và thử lại.');
        btn.disabled = false;
        btn.innerHTML = t.form_submit || 'Gửi yêu cầu hợp tác →';
      });
  });
}

/* ─────────────────────────────────────
   ORDER SUCCESS OVERLAY
   ───────────────────────────────────── */

function vemilOrderSuccessShow() {
  var overlay = document.getElementById('vemilOrderSuccess');
  if (!overlay) return;
  /* apply current lang strings */
  var t = (window.VEMIL_LANG && window.VEMIL_LANG[vemilCurrentLang]) || {};
  var titleEl = overlay.querySelector('[data-vl="order_ok_title"]');
  var msgEl   = overlay.querySelector('[data-vl="order_ok_msg"]');
  var btnEl   = overlay.querySelector('[data-vl="order_ok_back"]');
  if (titleEl && t.order_ok_title) titleEl.textContent = t.order_ok_title;
  if (msgEl   && t.order_ok_msg)   msgEl.textContent   = t.order_ok_msg;
  if (btnEl   && t.order_ok_back)  btnEl.textContent   = t.order_ok_back;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function vemilOrderSuccessClose() {
  var overlay = document.getElementById('vemilOrderSuccess');
  if (overlay) overlay.classList.remove('open');
  vemilCloseCart();
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────
   CART ORDER FORM
   ───────────────────────────────────── */

function vemilInitCartForm() {
  var form   = document.getElementById('vcdOrderForm');
  var submit = document.getElementById('vcdSubmit');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var t = (window.VEMIL_LANG && window.VEMIL_LANG[vemilCurrentLang]) || {};

    if (vemilCart.length === 0) return;

    var nameEl  = document.getElementById('vcdName');
    var phoneEl = document.getElementById('vcdPhone');
    if (!nameEl.value.trim() || !phoneEl.value.trim()) { nameEl.focus(); return; }

    /* inject order text */
    var detailsEl = document.getElementById('vcdOrderDetails');
    if (detailsEl) detailsEl.value = vemilBuildOrderText();

    submit.disabled = true;
    submit.textContent = t.cart_sending || 'Đang gửi...';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: new FormData(form)
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.success) {
          vemilCart = [];
          vemilRenderCart();
          form.reset();
          /* reset submit button for next time */
          submit.disabled = false;
          submit.style.display = '';
          submit.innerHTML = t.cart_submit || 'Đặt hàng →';
          /* show full-screen success */
          vemilOrderSuccessShow();
        } else {
          alert('Có lỗi. Vui lòng thử lại.');
          submit.disabled = false;
          submit.innerHTML = t.cart_submit || 'Đặt hàng →';
        }
      })
      .catch(function() {
        alert('Không gửi được. Kiểm tra kết nối.');
        submit.disabled = false;
        submit.innerHTML = t.cart_submit || 'Đặt hàng →';
      });
  });
}

/* ─────────────────────────────────────
   INIT
   ───────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  if (typeof initReveal === 'function') initReveal();

  /* language */
  vemilInitLang();

  /* cart open/close */
  var fab = document.getElementById('vemilCartFab');
  if (fab) fab.addEventListener('click', vemilOpenCart);

  var closeBtn = document.getElementById('vcdClose');
  if (closeBtn) closeBtn.addEventListener('click', vemilCloseCart);

  var overlay = document.getElementById('vemilCartOverlay');
  if (overlay) overlay.addEventListener('click', vemilCloseCart);

  /* forms */
  vemilInitB2BForm();
  vemilInitCartForm();

  /* initial render */
  vemilRenderCart();
});
