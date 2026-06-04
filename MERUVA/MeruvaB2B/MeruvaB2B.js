/* ═══════════════════════════════════════
   MERUVA B2B — Hub JS
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
  /* Reveal animations are handled by meruva-shared.js via initReveal().
     We just make sure they run after DOM is ready. */
  if (typeof initReveal === 'function') initReveal();

  /* Active partner count — update this as more partners join */
  var activePartners = document.querySelectorAll('.b2b-card:not(.b2b-card--soon)').length;
  var countEl = document.getElementById('partnerCount');
  if (countEl) countEl.textContent = activePartners;

  /* Highlight active nav lang button */
  var lang = window.currentLang || 'vi';
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.classList.toggle('lang-active', btn.dataset.lang === lang);
  });
});
