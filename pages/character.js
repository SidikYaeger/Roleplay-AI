/**
 * pages/character.js
 * Character creation and editing page.
 */

const CharacterPage = (() => {

  let currentCharId = null;

  function render(charId = null) {
    currentCharId = charId;
    const isEdit = !!charId;
    const char = isEdit ? Storage.getCharacterById(charId) : null;

    const v = (field, fallback = '') => escapeHtml(char?.[field] || fallback);

    const html = `
      <div class="page">
        <!-- Header -->
        <div class="page-header">
          <button class="btn-back" onclick="App.navigate('home')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Kembali
          </button>
        </div>

        <!-- Page Title -->
        <div class="char-page-hero">
          <h1 class="char-page-title">${isEdit ? '✏️ Edit Karakter' : '✦ Buat Karakter Baru'}</h1>
          <p class="char-page-subtitle">
            ${isEdit ? `Mengubah karakter "${v('name')}"` : 'Hidupkan imajinasi Anda — setiap detail membentuk dunia yang unik.'}
          </p>
        </div>

        <div class="container" style="padding-bottom: 48px;">

          <!-- Avatar & Identitas -->
          <div class="form-card">
            <div class="form-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              Identitas Karakter
            </div>

            <!-- Avatar Upload -->
            <div class="form-group">
              <label class="form-label">Avatar Karakter</label>
              <div class="avatar-upload-area">
                <div class="avatar-preview-container">
                  <div class="avatar-preview-large" id="avatar-preview">
                    ${char?.avatarUrl
                      ? `<img src="${v('avatarUrl')}" alt="Avatar" id="avatar-img" onerror="this.parentElement.textContent='${v('name', '?').charAt(0).toUpperCase()}'">` 
                      : `<span id="avatar-initial">${v('name', '?').charAt(0).toUpperCase() || '✦'}</span>`}
                  </div>
                </div>
                <div class="avatar-upload-inputs">
                  <div class="form-group" style="margin-bottom:12px;">
                    <label class="form-label">URL Gambar Avatar</label>
                    <input type="url" id="avatar-url" class="form-input" placeholder="https://..." value="${v('avatarUrl')}" oninput="CharacterPage.previewAvatar(this.value)">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Atau Upload dari Komputer</label>
                    <input type="file" id="avatar-file" class="form-input" accept="image/*" style="padding:8px;" onchange="CharacterPage.handleAvatarUpload(this)">
                  </div>
                  <p class="form-hint">Jika kosong, avatar akan dibuat otomatis dari inisial nama.</p>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="char-name" class="form-label">Nama Karakter <span>*</span></label>
                <input type="text" id="char-name" class="form-input" placeholder="Cth: Lyra Ashveil" value="${v('name')}" required oninput="CharacterPage.updateAvatarInitial(this.value)">
              </div>
              <div class="form-group">
                <label for="char-tagline" class="form-label">Tagline / Peran</label>
                <input type="text" id="char-tagline" class="form-input" placeholder="Cth: Elf penyihir penjaga hutan abadi" value="${v('tagline')}">
              </div>
            </div>
          </div>

          <!-- Kepribadian -->
          <div class="form-card">
            <div class="form-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Kepribadian & Cara Bicara
            </div>
            <div class="form-group">
              <label for="char-personality" class="form-label">Deskripsi Kepribadian <span>*</span></label>
              <textarea id="char-personality" class="form-textarea tall" placeholder="Deskripsikan watak, sifat, cara bicara, dan keunikan karakter ini. Semakin detail semakin baik.&#10;&#10;Contoh: Lyra adalah seorang elf yang dingin dan misterius namun sesungguhnya memiliki hati yang lembut. Ia berbicara dengan kata-kata yang puitis dan terukur, jarang memperlihatkan emosi secara langsung. Ia selalu memilih diksi yang elegant dan agak kuno...">${v('personality')}</textarea>
              <p class="form-hint">💡 Tip: Deskripsikan cara bicara, diksi favorit, kebiasaan, dan respons emosional karakter.</p>
            </div>
          </div>

          <!-- Latar Belakang -->
          <div class="form-card">
            <div class="form-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              Latar Belakang & Lore Dunia
            </div>
            <div class="form-group">
              <label for="char-background" class="form-label">Backstory & Lore</label>
              <textarea id="char-background" class="form-textarea tall" placeholder="Ceritakan asal-usul karakter, dunia tempat ia tinggal, peristiwa penting dalam hidupnya, dan motivasi terdalamnya.&#10;&#10;Contoh: Lyra tumbuh di dalam Hutan Elderwood yang sakral. Pada usianya yang ke-300 (masih muda untuk ukuran elf), ia menjadi penjaga Batu Purba — artefak yang memenjarakan iblis kuno...">${v('background')}</textarea>
            </div>
          </div>

          <!-- Skenario -->
          <div class="form-card">
            <div class="form-section-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Skenario & Pembuka Cerita
            </div>
            <div class="form-group">
              <label for="char-scenario" class="form-label">Skenario Awal</label>
              <textarea id="char-scenario" class="form-textarea" placeholder="Di mana dan bagaimana pertemuan pertama terjadi? Apa situasi yang sedang berlangsung?&#10;&#10;Contoh: Di batas selatan Hutan Elderwood, cahaya bulan menembus kanopi lebat saat seorang penjelajah asing memasuki wilayah terlarang...">${v('scenario')}</textarea>
            </div>
            <div class="form-group">
              <label for="char-opening" class="form-label">Pesan Pembuka Karakter</label>
              <textarea id="char-opening" class="form-textarea" placeholder="Pesan pertama yang akan dikirim karakter kepada pemain. Bisa berupa narasi + dialog sesuai format roleplay.&#10;&#10;Contoh: *Sosok ramping dengan telinga runcing muncul dari balik pohon ek raksasa, menatapmu dengan mata keperakan yang tajam. Sebuah busur sudah terentang, anak panah mengarah tepat ke dadamu.*&#10;&#10;Kau telah melangkahi batas yang tak boleh dilanggar. Berikan alasanmu sebelum aku memutuskan nasibmu, pengembara.">${v('openingMessage')}</textarea>
              <p class="form-hint">💡 Tip: Gunakan *tanda bintang* untuk narasi dan teks biasa untuk dialog.</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button class="btn btn-ghost" onclick="App.navigate('home')">Batal</button>
            ${isEdit ? `
              <button class="btn btn-danger" onclick="CharacterPage.confirmDelete('${charId}', '${v('name')}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                Hapus Karakter
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="CharacterPage.save()">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              ${isEdit ? 'Simpan Perubahan' : 'Buat Karakter'}
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = html;
  }

  let uploadedAvatarBase64 = null;

  function previewAvatar(url) {
    uploadedAvatarBase64 = null;
    const preview = document.getElementById('avatar-preview');
    if (!preview) return;
    if (url) {
      preview.innerHTML = `<img src="${escapeHtml(url)}" alt="Preview" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='❌'">`;
    } else {
      const name = document.getElementById('char-name')?.value || '';
      preview.innerHTML = `<span>${name.charAt(0).toUpperCase() || '✦'}</span>`;
    }
  }

  function handleAvatarUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedAvatarBase64 = e.target.result;
      document.getElementById('avatar-url').value = '';
      const preview = document.getElementById('avatar-preview');
      if (preview) {
        preview.innerHTML = `<img src="${uploadedAvatarBase64}" alt="Preview" style="width:100%;height:100%;object-fit:cover;">`;
      }
    };
    reader.readAsDataURL(file);
  }

  function updateAvatarInitial(name) {
    const urlInput = document.getElementById('avatar-url');
    if (urlInput?.value || uploadedAvatarBase64) return;
    const preview = document.getElementById('avatar-preview');
    const initial = document.getElementById('avatar-initial');
    if (initial) initial.textContent = name.charAt(0).toUpperCase() || '✦';
  }

  function save() {
    const name = document.getElementById('char-name')?.value?.trim();
    const personality = document.getElementById('char-personality')?.value?.trim();

    if (!name) { App.showToast('Nama karakter wajib diisi!', 'error'); return; }
    if (!personality) { App.showToast('Kepribadian karakter wajib diisi!', 'error'); return; }

    let avatarUrl = document.getElementById('avatar-url')?.value?.trim() || '';
    if (uploadedAvatarBase64) avatarUrl = uploadedAvatarBase64;

    const charData = {
      id: currentCharId || undefined,
      name,
      tagline:        document.getElementById('char-tagline')?.value?.trim()     || '',
      personality,
      background:     document.getElementById('char-background')?.value?.trim()  || '',
      scenario:       document.getElementById('char-scenario')?.value?.trim()    || '',
      openingMessage: document.getElementById('char-opening')?.value?.trim()     || '',
      avatarUrl,
    };

    const saved = Storage.saveCharacter(charData);
    App.showToast(currentCharId ? 'Karakter berhasil diperbarui! ✦' : 'Karakter baru telah diciptakan! ✦', 'success');
    App.navigate('home');
  }

  function confirmDelete(id, name) {
    App.showConfirm({
      icon: '🗑️',
      title: 'Hapus Karakter?',
      message: `Karakter "${name}" dan seluruh riwayat chatnya akan dihapus permanen.`,
      confirmText: 'Hapus',
      onConfirm: () => {
        Storage.deleteCharacter(id);
        App.showToast(`Karakter "${name}" telah dihapus.`, 'info');
        App.navigate('home');
      }
    });
  }

  return { render, save, previewAvatar, handleAvatarUpload, updateAvatarInitial, confirmDelete };
})();
