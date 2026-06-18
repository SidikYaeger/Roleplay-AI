/**
 * pages/home.js
 * Renders the main home page: character gallery, hero, navigation.
 */

const HomePage = (() => {

  function getAvatarHtml(character, size = 'card') {
    const cls = size === 'card' ? 'character-avatar' : 'chat-header-avatar';
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

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1)    return 'Baru saja';
    if (mins < 60)   return `${mins} menit lalu`;
    if (hours < 24)  return `${hours} jam lalu`;
    if (days < 7)    return `${days} hari lalu`;
    return new Date(timestamp).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' });
  }

  function renderCharacterCard(character) {
    const preview = Storage.getLastSessionPreview(character.id);
    const lastSession = character.updatedAt ? formatDate(character.updatedAt) : '';
    const avatarHtml = getAvatarHtml(character);

    return `
      <div class="character-card" data-id="${character.id}">
        <div class="character-card-banner">
          ${character.bannerUrl ? `<img class="character-card-banner-img" src="${escapeHtml(character.bannerUrl)}" alt="" onerror="this.style.display='none'">` : ''}
          <div class="character-card-banner-overlay"></div>
          <div class="character-avatar-wrap">${avatarHtml}</div>
        </div>
        <div class="character-card-body">
          <div class="character-card-name">${escapeHtml(character.name)}</div>
          <div class="character-card-tagline">${escapeHtml(character.tagline || character.personality?.slice(0, 100) || 'Karakter misterius...')}</div>
          ${preview ? `<div class="character-card-last-session">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(preview)}...</span>
          </div>` : `<div class="character-card-last-session">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Sesi baru ${lastSession ? '· ' + lastSession : ''}</span>
          </div>`}
          <div class="character-card-actions">
            <button class="btn btn-gold btn-sm" style="flex:1" onclick="App.navigate('chat', '${character.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Mulai Roleplay
            </button>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('character', '${character.id}')" title="Edit karakter">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="HomePage.confirmDelete('${character.id}', '${escapeHtml(character.name)}')" title="Hapus karakter">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const characters = Storage.getCharacters();

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
            Masuki dunia fantasi tak terbatas. Ciptakan karakter, bangun persona, dan mulailah petualangan roleplay yang mendalam bersama kecerdasan buatan.
          </p>
          <div class="home-actions">
            <button class="btn btn-primary" onclick="App.navigate('character')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Buat Karakter Baru
            </button>
          </div>
        </div>

        <!-- Characters Grid -->
        <div class="container-lg" style="padding-bottom: 48px;">
          ${characters.length > 0 ? `
            <div class="section-header">
              <span class="section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Karakter Anda (${characters.length})
              </span>
            </div>
            <div class="character-grid" id="character-grid">
              ${characters.map(renderCharacterCard).join('')}
              <div class="create-card" onclick="App.navigate('character')" role="button" tabindex="0" aria-label="Buat karakter baru">
                <div class="create-card-icon">✦</div>
                <div class="create-card-text">Buat Karakter Baru</div>
                <div class="create-card-sub">Tambahkan karakter AI baru ke dalam koleksimu</div>
              </div>
            </div>
          ` : `
            <div class="character-grid">
              <div class="empty-state">
                <div class="empty-state-icon">🎭</div>
                <h2 class="empty-state-title">Belum Ada Karakter</h2>
                <p class="empty-state-text">Duniamu masih kosong. Ciptakan karakter pertamamu dan mulailah petualangan yang tak terlupakan.</p>
                <button class="btn btn-primary" onclick="App.navigate('character')">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ciptakan Karakter Pertama
                </button>
              </div>
              <div class="create-card" onclick="App.navigate('character')" role="button" tabindex="0">
                <div class="create-card-icon">✦</div>
                <div class="create-card-text">Buat Karakter Baru</div>
                <div class="create-card-sub">Klik di sini untuk mulai</div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
  }

  function confirmDelete(id, name) {
    App.showConfirm({
      icon: '🗑️',
      title: 'Hapus Karakter?',
      message: `Karakter "${name}" dan seluruh riwayat chatnya akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.`,
      confirmText: 'Hapus',
      onConfirm: () => {
        Storage.deleteCharacter(id);
        App.showToast(`Karakter "${name}" telah dihapus.`, 'info');
        render();
      }
    });
  }

  return { render, confirmDelete, getAvatarHtml };
})();
