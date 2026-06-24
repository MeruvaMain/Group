/* ════════════════════════════════════════════════
   MERUVA NEWS · Báo — page script (Main_news.js)
   1) Thanh tiến trình đọc
   2) Đọc bài từ HTML tĩnh (#posts) → render timeline + popup kính mờ
   ════════════════════════════════════════════════
   ➜ KHÔNG sửa file này để thêm bài.
     Viết / sửa bài ngay trong Main_news.html (khối #posts).
════════════════════════════════════════════════ */

/* ── 1. Thanh tiến trình đọc ───────────────────── */
(function () {
  var bar = document.getElementById('read-progress');
  if (!bar) return;
  function update() {
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight) || 1;
    var top = h.scrollTop || document.body.scrollTop;
    bar.style.width = (top / max * 100) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();


/* ── 2. HỆ THỐNG BÀI ĐĂNG ──────────────────────── */
(function () {
  'use strict';

  /* Màu nhấn theo nhánh (khớp :root trong Main_news.css) */
  var AC = {
    service: '#3B7BC4', '3d': '#7EB8C8', bakery: '#C8A040',
    coffee: '#D4A437', stay: '#3D9E8C', card: '#B0B0C0',
    news: '#D4A437', promo: '#D4A437'
  };

  function esc(s){ return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* Đọc bài viết từ HTML tĩnh (#posts) — nguồn dữ liệu duy nhất */
  var store = document.getElementById('posts');
  var timeline = document.getElementById('jrTimeline');
  if (!store || !timeline) return;

  var POSTS = Array.prototype.map.call(store.querySelectorAll('.post'), function (el) {
    var titleEl = el.querySelector('.post-title');
    var exEl    = el.querySelector('.post-excerpt');
    var bodyEl  = el.querySelector('.post-body');
    var d = el.dataset;
    return {
      id: el.id,
      accent: d.accent || 'news',
      brand: d.brand || 'MERUVA',
      brandSub: d.brandsub || '',
      date: d.date || '',
      week: d.week || '',
      dateISO: d.dateiso || '',
      tag: d.tag || '',
      link: d.link || '',
      title: titleEl ? titleEl.textContent.trim() : '',
      excerpt: exEl ? exEl.textContent.trim() : '',
      body: bodyEl ? bodyEl.innerHTML : ''
    };
  });

  /* ── Render timeline (nhóm theo ngày) ─────────── */
  var html = '';
  var lastDate = null;
  POSTS.forEach(function (a) {
    if (a.date !== lastDate) {
      if (lastDate !== null) html += '</div>';
      html += '<div class="date-group">' +
                '<div class="date-bar"><div class="d">' + esc(a.date) +
                  (a.week ? ' <small>' + esc(a.week) + '</small>' : '') +
                '</div><div class="line"></div></div>';
      lastDate = a.date;
    }
    html +=
      '<article class="entry" style="--ac:' + (AC[a.accent] || AC.news) + '" ' +
        'data-id="' + esc(a.id) + '" tabindex="0" role="button" ' +
        'aria-label="Mở bài: ' + esc(a.title) + '">' +
        '<div class="brand">' + esc(a.brand) +
          (a.brandSub ? '<small>' + esc(a.brandSub) + '</small>' : '') + '</div>' +
        '<div class="body">' +
          (a.tag ? '<span class="tag">' + esc(a.tag) + '</span>' : '') +
          '<div class="et">' + esc(a.title) + '</div>' +
          '<div class="ex">' + esc(a.excerpt) + '</div>' +
        '</div>' +
        '<div class="go">→</div>' +
      '</article>';
  });
  if (lastDate !== null) html += '</div>';
  timeline.innerHTML = html;

  /* ── Popup kính mờ ────────────────────────────── */
  var overlay   = document.getElementById('article-overlay');
  var elAccent  = document.getElementById('artAccent');
  var elKicker  = document.getElementById('artKicker');
  var elTitle   = document.getElementById('artTitle');
  var elContent = document.getElementById('artContent');
  var elFoot    = document.getElementById('artFoot');
  var elClose   = overlay ? overlay.querySelector('.art-close') : null;
  var scroller  = overlay ? overlay.querySelector('.art-scroll') : null;
  var lastFocus = null;

  function byId(id){ for (var i=0;i<POSTS.length;i++) if (POSTS[i].id===id) return POSTS[i]; return null; }

  function openArticle(id, push) {
    var a = byId(id);
    if (!a || !overlay) return;
    var color = AC[a.accent] || AC.news;

    elAccent.style.background = color;
    elKicker.innerHTML = '<span style="color:' + color + '">' + esc(a.brand) + '</span>' +
      ' · ' + esc(a.date) + (a.week ? ' · ' + esc(a.week) : '');
    elTitle.textContent = a.title;
    elContent.innerHTML = a.body || '';
    elContent.querySelectorAll('img[data-src]').forEach(function(img){
      img.src = img.dataset.src;
    });

    var foot = '';
    if (a.link) {
      foot += '<a class="art-brandlink" style="--ac:' + color + '" href="' + a.link + '">' +
                'Khám phá ' + esc(a.brand) + ' <span>→</span></a>';
    }
    foot += '<button class="art-share" type="button" data-share>Chia sẻ bài này</button>';
    elFoot.innerHTML = foot;

    lastFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('art-lock');
    if (scroller) scroller.scrollTop = 0;
    if (elClose) elClose.focus();

    if (push !== false && location.hash !== '#' + a.id) {
      history.replaceState(null, '', '#' + a.id);   // chia sẻ được, KHÔNG đổi trang
    }
  }

  function closeArticle() {
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('art-lock');
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* mở khi click / Enter / Space trên entry */
  timeline.addEventListener('click', function (e) {
    var entry = e.target.closest('.entry');
    if (entry) openArticle(entry.getAttribute('data-id'));
  });
  timeline.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var entry = e.target.closest('.entry');
    if (entry) { e.preventDefault(); openArticle(entry.getAttribute('data-id')); }
  });

  /* đóng: nút X, click nền, Esc */
  if (elClose) elClose.addEventListener('click', closeArticle);
  if (overlay) overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeArticle();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeArticle();
  });

  /* nút chia sẻ trong chân popup */
  if (elFoot) elFoot.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-share]');
    if (!btn) return;
    var url = location.href;
    if (navigator.share) {
      navigator.share({ title: elTitle.textContent, url: url }).catch(function(){});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function(){
        btn.textContent = 'Đã copy link ✓';
        setTimeout(function(){ btn.textContent = 'Chia sẻ bài này'; }, 1800);
      });
    }
  });

  /* deep-link: mở thẳng bài nếu URL có #id */
  if (location.hash) {
    var hid = location.hash.slice(1);
    if (byId(hid)) openArticle(hid, false);
  }

  /* JSON-LD (BlogPosting) được sinh TĨNH bởi build.js — không chèn ở runtime. */

})();
