/* ═══════════════════════════════════════════════════════════════
   MERUVA · JS  —  MỘT FILE DUY NHẤT cho toàn bộ giao diện mới.

   Gộp từ meruva-v2.js + home.js (hai file này đã bỏ). Trước đây phần
   dùng chung (hiện dần, header, menu, đếm số, form) bị viết hai lần
   và đã lệch nhau.

   Mọi khối đều tự kiểm tra markup trước khi chạy: trang nào không có
   phần tử tương ứng thì khối đó lặng lẽ bỏ qua. Nhờ vậy cùng một file
   dùng được cho cả trang chủ lẫn trang nhánh.

   Giữ nguyên hợp đồng i18n cũ:  data-i18n · data-i18n-placeholder
   · .lang-btn[data-lang] · localStorage 'meruva_lang'
   nên các trang cũ chưa chuyển đổi vẫn chạy bình thường.

   ─────────────────────────────────────────────────────────────
   1. Dùng chung   · ngôn ngữ, hiện dần, header, menu, accordion,
                     đếm số, Supabase, biểu mẫu
   2. Trang chủ    · sơ đồ, sản phẩm, bộ câu hỏi, checklist, lộ trình
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Đọc màu từ meruva-tokens.css để JS không giữ bản sao bảng màu.
     Tham số thứ hai là giá trị dự phòng khi token chưa nạp kịp. */
  function token(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }


  /* ═════════════════════════════════════════════════════════════
     1 · DÙNG CHUNG
     ═════════════════════════════════════════════════════════════ */

  /* ── NGÔN NGỮ ────────────────────────────────── */
  var SUPPORTED = ['vi', 'en', 'ja'];
  var currentLang = localStorage.getItem('meruva_lang') || 'vi';
  if (SUPPORTED.indexOf(currentLang) === -1) currentLang = 'vi';

  function dict(lang) {
    var D = window.MERUVA_T || {};
    return D[lang] || D.vi || {};
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'vi';
    var L = dict(lang);
    currentLang = lang;
    localStorage.setItem('meruva_lang', lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = L[el.dataset.i18n];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var v = L[el.dataset.i18nPlaceholder];
      if (v !== undefined) el.placeholder = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      /* dạng "content:meta_desc" hoặc "aria-label:nav_label" */
      el.dataset.i18nAttr.split(',').forEach(function (pair) {
        var p = pair.split(':');
        var v = L[(p[1] || '').trim()];
        if (v !== undefined) el.setAttribute(p[0].trim(), v);
      });
    });
    if (L.page_title) document.title = L.page_title;

    document.querySelectorAll('.lang-btn').forEach(function (b) {
      var on = b.dataset.lang === lang;
      b.classList.toggle('lang-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('meruva:lang', { detail: { lang: lang } }));
  }

  function setLang(lang) {
    if (lang === currentLang) return;
    var ov = document.getElementById('lang-overlay');
    if (!ov) { applyLang(lang); return; }
    ov.classList.add('active');
    setTimeout(function () {
      applyLang(lang);
      var daTat = false;
      function tat() { if (daTat) return; daTat = true; ov.classList.remove('active'); }
      /* Cho sang khung hinh ke tiep roi moi mo lop phu, de khong thay
         khoanh khac chu dang doi. */
      requestAnimationFrame(function () { requestAnimationFrame(tat); });
      /* Luoi an toan: requestAnimationFrame NGUNG chay khi tab bi an.
         Neu khach doi ngon ngu roi chuyen tab ngay, khong co dong duoi
         day thi lop phu ket lai vinh vien — trong suot nhung mang
         pointer-events:all nen chan het moi thao tac cho toi khi tai lai. */
      setTimeout(tat, 400);
    }, 170);
  }

  /* ── HIỆN DẦN ────────────────────────────────── */
  function initReveal() {
    var all = document.querySelectorAll('.rv:not(.in)');
    if (!all.length) return;
    if (!('IntersectionObserver' in window)) {
      all.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .1, rootMargin: '0px 0px -6% 0px' });
    all.forEach(function (el) { io.observe(el); });
  }

  /* ── THANH TIẾN ĐỘ + ĐẦU TRANG ───────────────── */
  function initHeader() {
    var bar = document.getElementById('bar'), hdr = document.getElementById('hdr'), tick = false;
    if (!bar && !hdr) return;
    function upd() {
      if (bar) {
        var h = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
      }
      if (hdr) hdr.classList.toggle('on', scrollY > 16);
      tick = false;
    }
    addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(upd); }
    }, { passive: true });
    upd();
  }

  /* ── MENU DI ĐỘNG ────────────────────────────── */
  function initNav() {
    var b = document.getElementById('burger'), n = document.getElementById('nav');
    if (!b || !n) return;
    b.addEventListener('click', function () {
      var o = n.classList.toggle('open');
      b.classList.toggle('on', o);
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
    n.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        n.classList.remove('open'); b.classList.remove('on');
        b.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── ACCORDION (bảng giá / danh mục) ─────────── */
  function initRows() {
    document.querySelectorAll('[data-toggle]').forEach(function (row) {
      row.addEventListener('click', function (e) {
        if (e.target.closest('[data-book],a,button[data-skip]')) return;
        row.parentElement.classList.toggle('open');
      });
    });
  }

  /* ── ĐẾM SỐ ──────────────────────────────────── */
  function initCount() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var to = +e.target.dataset.count, t0 = null;
        function run(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 900);
          e.target.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(run);
        }
        requestAnimationFrame(run);
      });
    }, { threshold: .6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── SUPABASE: chỉ nạp khi thật sự cần ───────── */
  var SB_URL = 'https://ztqyojsyafhpkmhrawtd.supabase.co';
  var SB_KEY = 'sb_publishable_fDQp-ygVduxkor0ocVqQLQ_flK6v-qv';
  var sbPromise = null;
  function supa() {
    if (sbPromise) return sbPromise;
    sbPromise = new Promise(function (res, rej) {
      if (window.supabase) return res();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.2';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    }).then(function () {
      return window.supabase.createClient(SB_URL, SB_KEY);
    });
    return sbPromise;
  }

  /* ── NHÃN VỊ TRÍ FORM CHO GA4 ─────────────────
     Dùng đường dẫn trang vì meruva.js dùng chung cho nhiều trang
     (trang chủ, Kitchen, 3D…) nên không có một hằng số cố định. */
  function formLocation() {
    var p = location.pathname;
    if (/MeruvaKitchen/i.test(p)) return 'kitchen_booking';
    if (/Meruva3D/i.test(p)) return 'design_booking';
    if (/MeruvaB2B/i.test(p)) return 'b2b_booking';
    return 'home_booking';
  }

  /* ── BIỂU MẪU ĐẶT LỊCH / LIÊN HỆ ─────────────── */
  function initForm() {
    var form = document.querySelector('[data-appt-form]');
    if (!form) return;
    var btn = form.querySelector('[type="submit"]');
    var ok = form.querySelector('.form-ok');
    var label = btn ? btn.innerHTML : '';

    /* nạp sẵn thư viện ngay khi khách đặt con trỏ vào ô đầu tiên —
       lúc bấm Gửi thì đã có sẵn, không phải chờ tải */
    form.addEventListener('focusin', supa, { once: true });

    function fail(msg) {
      alert(msg);
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bot = form.querySelector('[name="botcheck"]');
      if (bot && bot.checked) return;                    /* bẫy bot */
      var n = form.querySelector('[name="name"]');
      var p = form.querySelector('[name="phone"]');
      if (n && !n.value.trim()) { n.focus(); return; }
      if (p && !p.value.trim()) { p.focus(); return; }
      if (btn) { btn.disabled = true; btn.textContent = dict(currentLang).form_sending || 'Đang gửi...'; }

      var sel = form.querySelector('[name="service"]');
      var dt = form.querySelector('[name="appt_date"]');
      var note = form.querySelector('[name="note"]');

      supa().then(function (sb) {
        return sb.from('appointments').insert({
          name: n ? n.value.trim() : '—',
          phone: p ? p.value.trim() : '—',
          service: sel ? sel.value : (form.dataset.apptForm || 'Liên hệ'),
          appt_date: (dt && dt.value) || new Date().toISOString().slice(0, 10),
          note: (note && note.value.trim()) || '—',
          status: 'pending'
        });
      }).then(function (res) {
        if (res && !res.error) {
          if (typeof gtag === 'function') gtag('event', 'generate_lead', { form_location: formLocation() });
          form.reset();
          if (btn) btn.style.display = 'none';
          if (ok) ok.style.display = 'block';
        } else {
          fail(dict(currentLang).form_err || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }).catch(function () {
        fail(dict(currentLang).form_neterr || 'Không gửi được. Kiểm tra kết nối và thử lại.');
      });
    });
  }

  /* ── NÚT "ĐẶT LỊCH" TRONG BẢNG GIÁ ───────────
     Chọn sẵn gói tương ứng rồi cuộn xuống biểu mẫu.
     data-book khớp theo <option value="..."> cố định — KHÔNG so
     theo text hiển thị, vì text đổi theo ngôn ngữ còn value thì không. */
  function initBookButtons() {
    var btns = document.querySelectorAll('[data-book]');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var want = btn.getAttribute('data-book');
        var sel = document.querySelector('[data-appt-form] [name="service"]');
        if (sel) {
          for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === want) { sel.selectedIndex = i; break; }
          }
        }
        var target = document.getElementById('dat-lich');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        var first = document.querySelector('[data-appt-form] [name="name"]');
        if (first) setTimeout(function () { first.focus(); }, 600);
      });
    });
  }


  /* ═════════════════════════════════════════════════════════════
     2 · TRANG CHỦ
     Các khối dưới đây chỉ chạy khi index.html có markup tương ứng.
     ═════════════════════════════════════════════════════════════ */

  /* ── SƠ ĐỒ: "MUA RỜI RẠC → CÓ LỘ TRÌNH & ĐO ĐƯỢC" ── */
  function initDiagram() {
    var svg = document.getElementById('dgSvg'); if (!svg) return;
    var gLane = document.getElementById('dgLanes'), gEdge = document.getElementById('dgEdges'),
        gNode = document.getElementById('dgNodes'), range = document.getElementById('dgRange'),
        state = document.getElementById('dgState'), hint = document.getElementById('dgHint'),
        host = document.getElementById('diag'),
        NS = 'http://www.w3.org/2000/svg';
    if (!gLane || !gEdge || !gNode || !range || !state) return;

    /* màu lấy từ meruva-tokens.css — không giữ bản sao ở đây */
    var INK = token('--ink', '#111110'), SHU = token('--shu', '#D2402A'),
        PAPER = token('--white', '#FCFBF8'), FAINT = token('--ink-faint', '#6B685F'),
        SHU_D = token('--shu-d', '#B33320');

    var LANE_X = [104, 260, 416], ROW_Y = [96, 168, 240, 312];
    var nodes = [
      { ax: 62, ay: 88, t: 'ChatGPT' }, { ax: 188, ay: 44, t: 'Chatbot' }, { ax: 340, ay: 92, t: '' }, { ax: 462, ay: 58, t: 'Copilot' },
      { ax: 126, ay: 196, i18n: 'dg_node_you', hub: true }, { ax: 276, ay: 152, t: '' }, { ax: 404, ay: 210, t: '' }, { ax: 54, ay: 300, i18n: 'dg_node_trial' },
      { ax: 212, ay: 262, t: '' }, { ax: 352, ay: 334, t: '' }, { ax: 470, ay: 288, i18n: 'dg_node_new' }, { ax: 150, ay: 366, t: '' }
    ];
    nodes.forEach(function (n, i) { n.lane = Math.floor(i / 4); n.bx = LANE_X[n.lane]; n.by = ROW_Y[i % 4]; });

    var keep = [[0, 4], [1, 5], [2, 6], [3, 7], [4, 8], [5, 9], [6, 10], [7, 11]];
    var mess = [[4, 0], [4, 1], [4, 2], [4, 3], [4, 9], [4, 10], [4, 11], [0, 7], [2, 11], [6, 9], [8, 3], [10, 1]];
    var edges = keep.map(function (e, i) { return { a: e[0], b: e[1], keep: true, c: ((i % 2 ? 1 : -1) * (0.3 + (i % 3) * 0.2)) }; })
      .concat(mess.map(function (e, i) { return { a: e[0], b: e[1], keep: false, c: ((i % 2 ? 1 : -1) * (0.35 + (i % 3) * 0.22)) }; }));

    var L0 = dict(currentLang);
    var laneEls = ['dg_lane1', 'dg_lane2', 'dg_lane3'].map(function (key, i) {
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', LANE_X[i]); t.setAttribute('y', 40);
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'dg-lane');
      t.setAttribute('fill', i === 2 ? INK : FAINT);
      t.textContent = L0[key]; gLane.appendChild(t);
      return t;
    });

    var paths = edges.map(function (e) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('stroke-width', e.keep ? 1.6 : 1.2);
      gEdge.appendChild(p); return p;
    });
    var dots = nodes.map(function (n) {
      var g = document.createElementNS(NS, 'g'), c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', n.hub ? 11 : 6); c.setAttribute('stroke-width', 1.6); g.appendChild(c);
      var lab = null, txt = n.i18n ? L0[n.i18n] : n.t;
      if (txt) {
        lab = document.createElementNS(NS, 'text'); lab.setAttribute('class', 'dg-tag');
        lab.setAttribute('text-anchor', 'middle'); lab.textContent = txt; g.appendChild(lab);
      }
      gNode.appendChild(g); return { g: g, c: c, lab: lab, n: n };
    });

    function relabel() {
      var L = dict(currentLang);
      laneEls.forEach(function (t, i) { t.textContent = L[['dg_lane1', 'dg_lane2', 'dg_lane3'][i]]; });
      dots.forEach(function (d) { if (d.n.i18n && d.lab) d.lab.textContent = L[d.n.i18n]; });
      var t = +range.value / 100, e2 = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      state.textContent = e2 < .35 ? L.dg_state_a : (e2 < .8 ? L.dg_state_b : L.dg_state_c);
    }
    document.addEventListener('meruva:lang', relabel);

    function lerp(a, b, t) { return a + (b - a) * t; }
    var arrowsOn = null;

    function draw(t) {
      var e2 = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      var pos = nodes.map(function (n) { return { x: lerp(n.ax, n.bx, e2), y: lerp(n.ay, n.by, e2) }; });
      var want = e2 > 0.6;
      if (want !== arrowsOn) {
        arrowsOn = want;
        paths.forEach(function (p, i) {
          if (!edges[i].keep) return;
          if (want) p.setAttribute('marker-end', 'url(#dgArrow)'); else p.removeAttribute('marker-end');
        });
      }
      paths.forEach(function (p, i) {
        var e = edges[i], A = pos[e.a], B = pos[e.b];
        var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, off = (1 - e2) * e.c * 130;
        var cx = mx - (B.y - A.y) * off / 260, cy = my + (B.x - A.x) * off / 260;
        p.setAttribute('d', 'M' + A.x.toFixed(1) + ' ' + A.y.toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + B.x.toFixed(1) + ' ' + B.y.toFixed(1));
        if (e.keep) { p.setAttribute('stroke', INK); p.setAttribute('opacity', (0.14 + 0.62 * e2).toFixed(3)); }
        else { p.setAttribute('stroke', SHU); p.setAttribute('opacity', (0.48 * (1 - e2)).toFixed(3)); }
      });
      dots.forEach(function (d, i) {
        var P = pos[i], ordered = e2 > .5;
        d.g.setAttribute('transform', 'translate(' + P.x.toFixed(1) + ',' + P.y.toFixed(1) + ')');
        if (d.n.hub) {
          d.c.setAttribute('r', lerp(11, 6, e2).toFixed(2));
          d.c.setAttribute('fill', ordered ? PAPER : SHU);
          d.c.setAttribute('stroke', ordered ? INK : SHU_D);
        } else if (d.n.lane === 2) {
          /* làn cuối tô đặc = phần đã đo được */
          d.c.setAttribute('fill', ordered ? INK : PAPER);
          d.c.setAttribute('stroke', ordered ? INK : FAINT);
        } else {
          d.c.setAttribute('fill', PAPER);
          d.c.setAttribute('stroke', ordered ? INK : FAINT);
        }
        if (d.lab) {
          d.lab.setAttribute('y', d.n.hub ? -17 : -13);
          d.lab.setAttribute('opacity', d.n.hub ? 1 : (1 - e2 * 0.78).toFixed(2));
        }
      });
      gLane.setAttribute('opacity', Math.max(0, (e2 - 0.45) / 0.55).toFixed(3));
      var Ld = dict(currentLang);
      state.textContent = e2 < .35 ? Ld.dg_state_a : (e2 < .8 ? Ld.dg_state_b : Ld.dg_state_c);
      state.classList.toggle('done', e2 >= .8);
    }

    range.addEventListener('input', function () {
      draw(+range.value / 100);
      if (hint) hint.style.opacity = .3;
    });
    draw(0);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      range.value = 100; draw(1); return;
    }
    if (!host || !('IntersectionObserver' in window)) return;

    var played = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || played) return;
        played = true;
        var t0 = null, DUR = 1900;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / DUR);
          range.value = Math.round(k * 100); draw(k);
          if (k < 1) requestAnimationFrame(step);
        }
        setTimeout(function () { requestAnimationFrame(step); }, 420);
      });
    }, { threshold: .4 });
    io.observe(host);
  }

  /* ── SẢN PHẨM THẬT (gallery bản xem trước) ── */
  function initWorks() {
    var host = document.getElementById('works'); if (!host) return;
    var WORKS = [
      { name: 'Aurora CRM', file: 'demo/crm_product_demo.html',
        url: 'aurora-crm.app / dashboard', w: 1440, h: 900, dKey: 'work1_d' },
      { name: 'Personal OS', file: 'demo/notions.so.html',
        url: 'notion.so / Personal OS · MERUVA', w: 1440, h: 900, dKey: 'work2_d' },
      { name: 'Energy Flow Tracker', file: 'demo/energy_flow_tracker.html',
        url: 'energy-flow.app — daily energy', w: 430, h: 900, dKey: 'work3_d' },
      { name: 'ÉLYSÉE', file: 'demo/trackingcaloNu.html',
        url: 'élysée.app — health &amp; cycle', w: 430, h: 900, dKey: 'work4_d' },
      { name: 'FORGE', file: 'demo/trackingcaloNam.html',
        url: 'forge.app — fitness', w: 430, h: 900, dKey: 'work5_d' }
    ];
    var L0 = dict(currentLang);
    WORKS.forEach(function (w) {
      var a = document.createElement('a');
      a.className = 'work'; a.href = w.file; a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML =
        '<div class="work-frame" data-src="' + w.file + '" data-w="' + w.w + '" data-h="' + w.h + '">' +
          '<div class="work-skel" data-i18n="work_skel">' + L0.work_skel + '</div>' +
          '<div class="work-veil"><span data-i18n="work_open">' + L0.work_open + '</span></div>' +
        '</div>' +
        '<div class="work-meta"><h3>' + w.name + '</h3>' +
          '<div class="work-url">' + w.url + '</div><div class="work-d" data-i18n="' + w.dKey + '">' + L0[w.dKey] + '</div></div>';
      host.appendChild(a);
    });
    /* Không cần listener 'meruva:lang' riêng ở đây: applyLang() đã quét
       toàn document theo [data-i18n] bằng innerHTML, kể cả các thẻ vừa
       tạo ở trên — tự thêm một vòng textContent nữa chỉ gây escape kép
       (&amp; -> &amp;amp;). */

    /* Luôn khớp theo chiều rộng rồi cắt bớt phần dưới — như một ảnh chụp sản phẩm */
    function mount(frame) {
      var W = +frame.dataset.w, H = +frame.dataset.h, box = frame.getBoundingClientRect();
      if (!box.width) return;
      var ifr = document.createElement('iframe');
      ifr.setAttribute('loading', 'lazy'); ifr.setAttribute('tabindex', '-1');
      ifr.setAttribute('aria-hidden', 'true'); ifr.setAttribute('scrolling', 'no');
      ifr.style.width = W + 'px'; ifr.style.height = H + 'px';
      ifr.style.transform = 'scale(' + (box.width / W) + ')';
      ifr.src = frame.dataset.src;
      ifr.addEventListener('load', function () { frame.classList.add('on'); });
      frame.insertBefore(ifr, frame.firstChild);
    }
    var frames = host.querySelectorAll('.work-frame');
    if (!('IntersectionObserver' in window)) { frames.forEach(mount); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } });
    }, { rootMargin: '300px' });
    frames.forEach(function (f) { io.observe(f); });
  }

  /* ── BỘ CÂU HỎI TÍCH LUỸ ── */
  function initQuestionBank() {
    var list = document.getElementById('qbList'), bar = document.getElementById('qbBar'),
        cnt = document.getElementById('qbCount');
    if (!list) return;

    var CAT_KEY = { start: 'qb_start', money: 'qb_money', data: 'qb_data', team: 'qb_team', tool: 'qb_tool' };
    var Q_META = [
      { c: 'start' }, { c: 'start' }, { c: 'start' }, { c: 'start' }, { c: 'start' },
      { c: 'money' }, { c: 'money' }, { c: 'money' }, { c: 'money' },
      { c: 'data' }, { c: 'data' }, { c: 'data' }, { c: 'data' },
      { c: 'team' }, { c: 'team' }, { c: 'team' }, { c: 'team' },
      { c: 'tool' }, { c: 'tool' }, { c: 'tool' }
    ]; /* thứ tự khớp q1..q20 trong home-lang.js */

    var curFilter = 'all';

    function render() {
      var L = dict(currentLang);
      list.innerHTML = Q_META.map(function (m, i) {
        var n = i + 1;
        return '<details class="qb-i" data-c="' + m.c + '">' +
          '<summary><span class="qb-cat">' + L[CAT_KEY[m.c]] + '</span><span class="qb-q">' + L['q' + n + '_q'] + '</span></summary>' +
          '<div class="qb-a">' + L['q' + n + '_a'] + '</div></details>';
      }).join('') + '<div class="qb-empty" id="qbEmpty" hidden>' + L.qb_empty + '</div>';

      var items = [].slice.call(list.querySelectorAll('.qb-i')),
          empty = document.getElementById('qbEmpty');

      function apply(f) {
        curFilter = f;
        var n = 0;
        items.forEach(function (el) {
          var show = (f === 'all' || el.dataset.c === f);
          el.hidden = !show;
          if (!show) el.open = false;
          if (show) n++;
        });
        empty.hidden = n > 0;
        if (cnt) cnt.textContent = n + (f === 'all' ? L.qb_n_all : L.qb_n_one);
      }
      apply(curFilter);

      if (bar) {
        bar.querySelectorAll('.qb-chip').forEach(function (c) { c.classList.toggle('on', c.dataset.f === curFilter); });
      }
      list._apply = apply;
    }
    render();
    document.addEventListener('meruva:lang', render);

    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.qb-chip'); if (!b) return;
      bar.querySelectorAll('.qb-chip').forEach(function (c) { c.classList.toggle('on', c === b); });
      if (list._apply) list._apply(b.dataset.f);
    });
  }

  /* ── CHECKLIST DẤU HIỆU ── */
  function initSignals() {
    var sigs = document.querySelectorAll('#sigList .sig'),
        out = document.getElementById('sigOut'), msg = document.getElementById('sigMsg');
    if (!sigs.length || !out || !msg) return;
    function upd() {
      var L = dict(currentLang), n = 0;
      sigs.forEach(function (s) { if (s.getAttribute('aria-pressed') === 'true') n++; });
      msg.innerHTML = L['sig_m' + n];
      out.classList.toggle('hot', n >= 2);
    }
    sigs.forEach(function (s) {
      s.addEventListener('click', function () {
        s.setAttribute('aria-pressed', s.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        upd();
      });
    });
    upd();
    document.addEventListener('meruva:lang', upd);
  }

  /* ── RAIL LỘ TRÌNH ── */
  function initRoad() {
    var links = document.querySelectorAll('#roadProg a'), steps = document.querySelectorAll('#steps .step');
    if (!links.length || !steps.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = [].indexOf.call(steps, e.target);
        links.forEach(function (l, j) { l.classList.toggle('act', j === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }


  /* ── LƯỚI AN TOÀN CHO MÀN CHỜ ─────────────────
     Màn chờ (.ldr) vốn tự tắt bằng CSS. Nhưng khi trang được mở ở
     TAB NỀN, trình duyệt tạm dừng hoạt ảnh CSS — màn chờ sẽ đứng
     im cho tới lúc khách bấm sang tab đó. Hẹn giờ dưới đây vẫn chạy
     trong tab nền, nên gỡ hẳn màn chờ để không bao giờ kẹt che trang. */
  function initLoaderGuard() {
    var el = document.querySelector('.ldr');
    if (!el) return;
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1900);
  }

  /* ═════════════════════════════════════════════════════════════
     KHỞI ĐỘNG
     ═════════════════════════════════════════════════════════════ */
  function boot() {
    initLoaderGuard();
    applyLang(currentLang);
    /* dùng chung */
    initReveal(); initHeader(); initNav(); initRows(); initCount();
    initForm(); initBookButtons();
    /* trang chủ — tự bỏ qua nếu không có markup */
    initDiagram(); initWorks(); initQuestionBank(); initSignals(); initRoad();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* xuất ra ngoài cho các trang cần dùng riêng */
  window.MERUVA = {
    setLang: setLang, applyLang: applyLang, initReveal: initReveal,
    supa: supa, get lang() { return currentLang; }
  };
  window.setLang = setLang;   /* tương thích nút onclick="setLang('en')" của trang cũ */
})();
