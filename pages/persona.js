/**
 * pages/persona.js
 * User persona editing page.
 */

const PersonaPage = (() => {

  function render() {
    const persona = Storage.getPersona();

    const html = `
      <div class="page persona-page">
        <!-- Header -->
        <div class="page-header">
          <button class="btn-back" onclick="App.navigate('home')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Kembali
          </button>
        </div>

        <!-- Hero -->
        <div class="persona-hero">
          <span class="persona-hero-icon">👤</span>
          <h1 class="persona-hero-title">Persona Saya</h1>
          <p class="persona-hero-subtitle">Siapakah dirimu di dalam dunia ini? Definisikan karaktermu sebagai pemain.</p>
        </div>

        <div class="container" style="padding-bottom: 48px;">

          <div class="form-card">
            <div class="form-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              Identitas Pemain
            </div>

            <div class="form-group">
              <label for="persona-name" class="form-label">Nama Karaktermu <span>*</span></label>
              <input type="text" id="persona-name" class="form-input" placeholder="Cth: Kael, Aria, atau nama panggilan apa saja" value="${escapeHtml(persona.name || '')}">
              <p class="form-hint">Ini adalah nama yang akan digunakan karakter AI untuk memanggilmu dalam roleplay.</p>
            </div>

            <div class="form-group">
              <label for="persona-desc" class="form-label">Deskripsi Karaktermu</label>
              <textarea id="persona-desc" class="form-textarea tall" placeholder="Deskripsikan siapa dirimu dalam dunia cerita — penampilan, sifat, latar belakang, kemampuan, dan hal-hal yang membuat karaktermu unik.&#10;&#10;Contoh: Kael adalah seorang ksatria muda dari Kerajaan Nordheim yang melarikan diri dari istana setelah mengetahui sebuah rahasia gelap. Ia bertubuh tegap dengan rambut hitam dan scar di pipi kirinya. Meskipun terlihat kasar, ia sebenarnya pemikir yang cermat dan memiliki rasa keadilan yang kuat...">${escapeHtml(persona.description || '')}</textarea>
              <p class="form-hint">💡 Tip: Semakin detail deskripsimu, semakin baik AI akan berinteraksi denganmu secara personal.</p>
            </div>
          </div>

          <!-- Preview Box -->
          <div class="form-card" style="background: rgba(124,58,237,0.05); border-color: rgba(124,58,237,0.2);">
            <div class="form-section-title" style="color: var(--primary-light);">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Pratinjau Prompt
            </div>
            <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px; font-family:var(--font-narrative); font-style:italic;">
              Begini cara AI akan "mengenalmu" dalam setiap sesi roleplay:
            </p>
            <div id="persona-preview" style="font-size:13px; color:var(--text-secondary); background:var(--bg-base); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; font-family:monospace; line-height:1.7; white-space:pre-wrap; word-break:break-word;"></div>
          </div>

          <div class="form-actions">
            <button class="btn btn-ghost" onclick="App.navigate('home')">Batal</button>
            <button class="btn btn-primary" onclick="PersonaPage.save()">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Simpan Persona
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = html;

    // Live preview
    const nameInput = document.getElementById('persona-name');
    const descInput = document.getElementById('persona-desc');
    function updatePreview() {
      const name = nameInput.value.trim() || 'Petualang';
      const desc = descInput.value.trim() || 'Seorang petualang misterius.';
      document.getElementById('persona-preview').textContent =
        `Kamu sedang berinteraksi dengan ${name}.\nDeskripsi mereka: ${desc}`;
    }
    nameInput.addEventListener('input', updatePreview);
    descInput.addEventListener('input', updatePreview);
    updatePreview();
  }

  function save() {
    const name = document.getElementById('persona-name')?.value?.trim();
    const description = document.getElementById('persona-desc')?.value?.trim();

    if (!name) { App.showToast('Nama persona wajib diisi!', 'error'); return; }

    Storage.savePersona({ name, description: description || 'Seorang petualang misterius.' });
    App.showToast('Persona berhasil disimpan! ✦', 'success');
    App.navigate('home');
  }

  return { render, save };
})();
