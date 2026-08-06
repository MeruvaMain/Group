/* ═══════════════════════════════════════════════════
   MERUVA · SHARED JAVASCRIPT
   ═══════════════════════════════════════════════════ */

/* ── LANGUAGE SYSTEM ────────────────────────── */
var currentLang = localStorage.getItem('meruva_lang') || 'vi';

function setLang(lang) {
  if (lang === currentLang) return;
  const overlay = document.getElementById('lang-overlay');
  if (!overlay) return;
  overlay.classList.add('active');
  setTimeout(() => {
    applyLang(lang);
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.remove('active')));
  }, 180);
}

function applyLang(lang) {
  const L = window.MERUVA_LANG[lang] || window.MERUVA_LANG.vi;
  currentLang = lang;
  localStorage.setItem('meruva_lang', lang);
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = L[el.dataset.i18n];
    if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const v = L[el.dataset.i18nPlaceholder];
    if (v !== undefined) el.placeholder = v;
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('lang-active', btn.dataset.lang === lang);
  });
}

/* ── PAGE LOADER ──────────────────────────────
   Chỉ còn Vemil dùng màn chờ này (nhận diện riêng của đối tác).
   Các trang MERUVA đã chuyển sang <div class="ldr"> ở meruva-loader.css.
   Rút thời gian chờ 1600ms → 1250ms cho khớp nhịp 1,2–1,5s của màn mới. */
function initPageLoader() {
  const pageLoader = document.getElementById('page-loader');
  if (!pageLoader) return;
  const minWait = new Promise(r => setTimeout(r, 1250));
  const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.all([minWait, fontReady]).then(() => {
    pageLoader.classList.add('out');
    setTimeout(() => pageLoader.remove(), 400);
  });
}

/* ── LƯỚI AN TOÀN CHO MÀN CHỜ MỚI ─────────────
   Màn chờ .ldr tự tắt bằng CSS. Nhưng ở TAB NỀN, trình duyệt tạm dừng
   hoạt ảnh CSS nên nó sẽ đứng im. Hẹn giờ vẫn chạy trong tab nền, nên
   gỡ hẳn để không bao giờ kẹt che trang. (Bản sao của khối cùng tên
   trong meruva.js — trang hệ cũ không nạp file đó.) */
function initLoaderGuard() {
  const el = document.querySelector('.ldr');
  if (!el) return;
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1900);
}

/* ── CURSOR ───────────────────────────────── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  function animCursor() {
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    rx += (mx - rx) * .12; ry += (my - ry) * .12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  }
  if (window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    animCursor();
  }
}

/* ── PARTICLES ──────────────────────────── */
function initParticles() {
  const pContainer = document.getElementById('particles');
  if (!pContainer) return;
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const x = Math.random() * 100;
    const dur = 7 + Math.random() * 10;
    const delay = Math.random() * 12;
    const drift = (Math.random() - .5) * 120;
    p.style.cssText = `left:${x}%;--dur:${dur}s;--delay:-${delay}s;--drift:${drift}px`;
    pContainer.appendChild(p);
  }
}

/* ── NAV SCROLL ─────────────────────────── */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  });
}

/* ── REVEAL ANIMATIONS ──────────────────────── */
const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), i * 55);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px' });

function initReveal() {
  document.querySelectorAll('.reveal, .reveal-scale').forEach((el, i) => {
    observer.observe(el);
    // If element is already in viewport, trigger reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => el.classList.add('in'), i * 20);
    }
  });
}

/* ── MOBILE NAV ──────────────────────────── */
function initMobileNav() {
  const navBurger = document.getElementById('navBurger');
  const navLinksEl = document.getElementById('navLinks');
  if (!navBurger || !navLinksEl) return;

  navBurger.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('nav-open');
    navBurger.classList.toggle('is-open', isOpen);
    navBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    navBurger.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navLinksEl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinksEl.classList.remove('nav-open');
    navBurger.classList.remove('is-open');
    navBurger.setAttribute('aria-expanded', 'false');
    navBurger.setAttribute('aria-label', 'Mở menu');
    document.body.style.overflow = '';
  }));
}

/* ── FLOATING BACK BUTTON ────────────────── */
function initFloatingBack() {
  const btn = document.getElementById('floating-back');
  if (!btn) return;
  let lerpedScroll = window.scrollY;
  function tick() {
    lerpedScroll += (window.scrollY - lerpedScroll) * 0.055;
    const diff = window.scrollY - lerpedScroll;
    const dy = Math.max(-80, Math.min(80, diff * 0.7));
    btn.style.transform = 'translateY(' + dy + 'px)';
    requestAnimationFrame(tick);
  }
  tick();
}

/* ── INIT ALL ─────────────────────────────── */
function initShared() {
  initPageLoader();
  initLoaderGuard();
  initCursor();
  initParticles();
  initNavScroll();
  initMobileNav();
  initReveal();
  initFloatingBack();
  applyLang(currentLang);
}

document.addEventListener('DOMContentLoaded', initShared);
