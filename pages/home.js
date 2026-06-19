/**
 * pages/home.js
 * Halaman utama: tombol "Mulai Roleplay" global + daftar cast karakter.
 * Karakter bukan lagi lawan bicara langsung, tapi cast member dalam cerita.
 */

const HomePage = (() => {

  function getAvatarHtml(character, cls = 'character-avatar') {
    if (character.avatarUrl) {
      return `<div class="${cls}"><img src="${escapeHtml(character.avatarUrl)}" alt="${escapeHtml(character.name)}" onerror="this.parentElement.textContent='${escapeHtml(character.name.charAt(0).toUpperCase())}'"></div>`;
    }
    const initial = (character.name || '?').charAt(0).toUpperCase();
    const colors = [
      'linear-gradient(135deg,#7c3aed,#c084fc)',
      'linear-gradient(135deg,#0891b2,#2dd4bf)',
      'linear-gradient(135deg,#d97706,#f59e0b)',
      'linear-gradient(135deg,#dc2626,#f87171)',
      'linear-gradient(135deg,#059669,#34d399)',
      'linear-gradient(135deg,#7c3aed,#3b82f6)',
    ];
    const colorIndex = (character.name || '').charCodeAt(0) % colors.length;
    return `<div class="${cls}" style="background:${colors[colorIndex]};align-items:center;display:flex;justify-content:center;font-size:22px;">${initial}</div>`;
  }

  function renderCastCard(character) {
    const avatarHtml = getAvatarHtml(character);
    return `
      <div class="character-card cast-card" data-id="${character.id}">
        <div class="character-card-banner">
          ${character.bannerUrl ? `<img class="character-card-banner-img" src="${escapeHtml(character.bannerUrl)}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="character-card-banner-overlay"></div>
          <div class="character-avatar-wrap">${avatarHtml}</div>
        </div>
        <div class="character-card-body">
          <div class="character-card-name">${escapeHtml(character.name)}</div>
          <div class="character-card-tagline">${escapeHtml(character.tagline || character.personality?.slice(0, 80) || 'Karakter misterius...')}</div>
          <div class="character-card-actions">
            <button class="btn btn-ghost btn-sm" style="flex:1" onclick="App.navigate('character', '${character.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button class="btn btn-ghost btn-sm" onclick="HomePage.confirmDelete('${character.id}', '${escapeHtml(character.name).replace(/'/g,"&#39;")}')" title="Hapus karakter">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const characters = Storage.getCharacters();
    const hasSession = Storage.getMainSession().length > 0;

    const html = `
      <div class="page">
        <!-- Settings Bar -->
        <div class="settings-bar">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('persona')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Persona Saya
          </button>
        </div>

        <!-- Hero -->
        <div class="home-hero">
          <div class="home-logo" aria-hidden="true">✦</div>
          <h1 class="home-title">Aether</h1>
          <p class="home-subtitle">
            Satu panggung. Satu cerita. Semua karakter hidup bersama dalam satu dunia yang kamu ciptakan.
          </p>
          <div class="home-actions">
            <button class="btn btn-primary btn-lg" id="start-roleplay-btn" onclick="App.navigate('chat')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              ${hasSession ? 'Lanjutkan Roleplay' : 'Mulai Roleplay'}
            </button>
          </div>
          ${hasSession ? `
          <p style="font-size:12px;color:var(--text-muted);margin-top:8px;font-family:var(--font-narrative);font-style:italic;">
            Ada sesi yang sedang berjalan ✦
          </p>` : ''}
        </div>

        <!-- Cast Section -->
        <div class="container-lg" style="padding-bottom: 48px;">
          <div class="section-header">
            <span class="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Cast Karakter ${characters.length > 0 ? `(${characters.length})` : ''}
            </span>
            <span style="font-size:12px;color:var(--text-muted);font-family:var(--font-narrative);font-style:italic;">
              Semua karakter ini akan hadir dalam roleplay
            </span>
          </div>

          <div class="character-grid" id="character-grid">
            ${characters.map(renderCastCard).join('')}
            <!-- Tombol tambah karakter baru -->
            <div class="create-card" onclick="App.navigate('character')" role="button" tabindex="0" aria-label="Buat karakter baru">
              <div class="create-card-icon">✦</div>
              <div class="create-card-text">Tambah ke Cast</div>
              <div class="create-card-sub">Ciptakan karakter baru untuk cerita</div>
            </div>
          </div>

          ${characters.length === 0 ? `
          <div class="empty-state" style="margin-top:0">
            <div class="empty-state-icon">🎭</div>
            <h2 class="empty-state-title">Cast Masih Kosong</h2>
            <p class="empty-state-text">Roleplay bisa dimulai tanpa karakter — AI akan bebas berkreasi. Atau tambahkan karakter untuk menentukan tokoh-tokoh dalam ceritamu.</p>
          </div>` : ''}
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
  }

  function confirmDelete(id, name) {
    App.showConfirm({
      icon: '🗑️',
      title: 'Hapus Karakter dari Cast?',
      message: `Karakter "${name}" akan dihapus dari cast. Cerita yang sedang berjalan tidak terpengaruh, tapi karakter ini tidak akan lagi aktif di sesi berikutnya.`,
      confirmText: 'Hapus',
      onConfirm: () => {
        Storage.deleteCharacter(id);
        App.showToast(`Karakter "${name}" telah dihapus dari cast.`, 'info');
        render();
      }
    });
  }

  return { render, confirmDelete, getAvatarHtml };
})();
