/**
 * app.js
 * Main application controller: router, global utilities,
 * toast notifications, starfield animation.
 * API key dikonfigurasi melalui config.js (bukan UI).
 */

// ──────────────────────────────────────────────────────
// GLOBAL UTILITY: escapeHtml (used by all page modules)
// ──────────────────────────────────────────────────────
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ──────────────────────────────────────────────────────
// APP CONTROLLER
// ──────────────────────────────────────────────────────
const App = (() => {
  let confirmCallback = null;

  // ── Router ──────────────────────────────────────────

  function navigate(page, param = null) {
    const hash = param ? `#${page}/${param}` : `#${page}`;
    history.pushState(null, '', hash);
    route();
  }

  function route() {
    const hash = window.location.hash || '#home';
    const [pagePart, param] = hash.slice(1).split('/');

    switch (pagePart) {
      case 'home':
      case '':
        HomePage.render();
        break;
      case 'character':
        CharacterPage.render(param || null);
        break;
      case 'persona':
        PersonaPage.render();
        break;
      case 'chat':
        if (!param) { navigate('home'); return; }
        ChatPage.render(param);
        break;
      default:
        navigate('home');
    }
  }

  // ── Confirm Modal ────────────────────────────────────

  function showConfirm({ icon, title, message, confirmText = 'OK', onConfirm }) {
    confirmCallback = onConfirm;
    document.getElementById('confirm-icon').textContent = icon || '⚠️';
    document.getElementById('confirm-title').textContent = title || 'Konfirmasi';
    document.getElementById('confirm-message').textContent = message || '';
    document.getElementById('confirm-ok-btn').textContent = confirmText;
    document.getElementById('confirm-modal')?.classList.remove('hidden');
  }

  function initConfirmModal() {
    document.getElementById('confirm-ok-btn')?.addEventListener('click', () => {
      document.getElementById('confirm-modal')?.classList.add('hidden');
      confirmCallback && confirmCallback();
      confirmCallback = null;
    });
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('confirm-modal')?.classList.add('hidden');
      confirmCallback = null;
    });
  }

  // ── Toast Notifications ──────────────────────────────

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span style="font-size:16px;flex-shrink:0;">${icons[type] || 'ℹ'}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ── Starfield Canvas ─────────────────────────────────

  function initStarfield() {
    const canvas = document.getElementById('stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [], width, height;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.004 + 0.001,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      stars.forEach(s => {
        const a = s.alpha * (0.6 + 0.4 * Math.sin(time * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 190, 255, ${a})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
  }

  // ── Init ─────────────────────────────────────────────

  function init() {
    initStarfield();
    initConfirmModal();
    window.addEventListener('popstate', route);

    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      // Tampilkan pesan error jika config.js belum diisi
      document.getElementById('app').innerHTML = `
        <div class="page-loading">
          <div style="font-size:40px;margin-bottom:16px;">⚠️</div>
          <p style="color:var(--text-secondary);text-align:center;max-width:400px;line-height:1.7;">
            API Key belum dikonfigurasi.<br>
            Buka file <code style="color:var(--primary-light);background:var(--bg-surface-2);padding:2px 8px;border-radius:4px;">config.js</code>
            dan isi <code style="color:var(--primary-light);background:var(--bg-surface-2);padding:2px 8px;border-radius:4px;">apiKey</code>
            dengan key Anda.
          </p>
        </div>
      `;
      return;
    }

    console.log(`✦ Aether ready — provider: ${Storage.getProvider()}, model: ${Storage.getModel()}`);
    route();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigate, route, showToast, showConfirm };
})();
