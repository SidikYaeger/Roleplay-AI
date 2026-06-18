/**
 * app.js
 * Main application controller: router, global utilities,
 * modal management, toast notifications, starfield animation.
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
    // Build hash
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

  // ── API Modal ────────────────────────────────────────

  function openApiModal(isSettings = false) {
    const modal      = document.getElementById('api-modal');
    const cancelBtn  = document.getElementById('api-cancel-btn');
    const keyInput   = document.getElementById('api-key-input');
    const modelSel   = document.getElementById('model-select');

    // Pre-fill with saved values
    const settings = Storage.getSettings();
    if (keyInput) keyInput.value = settings.apiKey || '';
    if (modelSel) modelSel.value = settings.model  || 'gemini-1.5-pro';

    if (isSettings && cancelBtn) cancelBtn.style.display = 'inline-flex';
    else if (cancelBtn)          cancelBtn.style.display = 'none';

    modal?.classList.remove('hidden');
    setTimeout(() => keyInput?.focus(), 100);
  }

  function closeApiModal() {
    document.getElementById('api-modal')?.classList.add('hidden');
  }

  function initApiModal() {
    const saveBtn    = document.getElementById('api-save-btn');
    const cancelBtn  = document.getElementById('api-cancel-btn');
    const toggleBtn  = document.getElementById('toggle-api-visibility');
    const keyInput   = document.getElementById('api-key-input');

    saveBtn?.addEventListener('click', async () => {
      const key   = keyInput?.value?.trim();
      const model = document.getElementById('model-select')?.value || 'gemini-1.5-pro';

      if (!key) { showToast('Masukkan API Key terlebih dahulu!', 'error'); return; }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Memvalidasi...</span>';

      Storage.saveSettings({ apiKey: key, model });
      closeApiModal();
      showToast('Pengaturan berhasil disimpan! ✦', 'success');

      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Buka Portal</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

      // Re-route to ensure page reflects new settings
      route();
    });

    cancelBtn?.addEventListener('click', closeApiModal);

    toggleBtn?.addEventListener('click', () => {
      if (!keyInput) return;
      const isPassword = keyInput.type === 'password';
      keyInput.type = isPassword ? 'text' : 'password';
    });

    // Close on backdrop click
    document.getElementById('api-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'api-modal' && Storage.getApiKey()) closeApiModal();
    });
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

    let stars = [];
    let width, height;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      createStars();
    }

    function createStars() {
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
    initApiModal();
    initConfirmModal();

    // Handle browser back/forward
    window.addEventListener('popstate', route);

    // Check API key
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      openApiModal(false);
      // Set default model to gemini-1.5-pro
      const modelSel = document.getElementById('model-select');
      if (modelSel) modelSel.value = 'gemini-2.0-flash';
      // Show home in background after short delay
      setTimeout(() => HomePage.render(), 200);
    } else {
      route();
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { navigate, route, openApiModal, closeApiModal, showToast, showConfirm };
})();
