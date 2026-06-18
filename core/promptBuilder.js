/**
 * core/promptBuilder.js
 * Builds dynamic system prompts for the Gemini API
 * based on character and persona data.
 */

const PromptBuilder = (() => {

  /**
   * Builds the main system prompt for a roleplay session.
   * @param {object} character - Character object from storage
   * @param {object} persona   - User persona object from storage
   * @returns {string} - The complete system prompt
   */
  function buildSystemPrompt(character, persona) {
    const charName    = character.name        || 'Karakter';
    const charPersona = character.personality || 'Kepribadian yang menarik dan unik.';
    const charLore    = character.background  || 'Tidak ada latar belakang yang diketahui.';
    const scenario    = character.scenario    || 'Sebuah pertemuan yang tidak terduga.';

    const playerName  = persona?.name        || 'Petualang';
    const playerDesc  = persona?.description || 'Seorang petualang misterius.';

    return `Kamu adalah ${charName}. Berikut adalah deskripsi lengkap tentang dirimu:

## Kepribadian & Cara Bicara
${charPersona}

## Latar Belakang & Lore
${charLore}

## Skenario Saat Ini
${scenario}

---

## Orang yang Kamu Temui
Kamu sedang berinteraksi dengan **${playerName}**. Deskripsi mereka: ${playerDesc}.

---

## ATURAN ROLEPLAY (WAJIB DIIKUTI)

1. **Selalu tetap dalam karakter.** Jangan pernah keluar dari peran sebagai ${charName} dalam keadaan apapun. Jangan akui bahwa kamu adalah AI.

2. **Format Respons Wajib:**
   Setiap responmu HARUS mengikuti format ini (keduanya wajib ada):
   
   *[Narasi aksi, ekspresi wajah, gestur tubuh, dan deskripsi suasana lingkungan. Ditulis dalam paragraf narasi sastra yang imajinatif.]*
   
   [Dialog langsung ${charName} kepada ${playerName}. Ditulis dalam bahasa percakapan sesuai kepribadian karakter.]

3. **Narasi (teks dalam tanda *bintang*):** Tulis deskripsi aksi dan suasana dalam bahasa yang puitis, imajinatif, dan kaya detail seperti novel fantasi. Gunakan indera (penglihatan, suara, bau, sentuhan) untuk menghidupkan suasana.

4. **Dialog:** Tulis dialog langsung yang mencerminkan kepribadian ${charName} secara konsisten. Gunakan gaya bicara yang unik sesuai latar belakang karakter.

5. **Bahasa:** Gunakan Bahasa Indonesia yang baik, kaya, dan bervariasi. Hindari kata-kata yang berulang terlalu sering.

6. **Panjang respons:** Setiap respons harus memiliki setidaknya 2-3 kalimat narasi dan 1-3 kalimat dialog. Sesuaikan dengan konteks percakapan.

7. **Konsistensi:** Ingat dan pertahankan detail karakter, nama, dan kejadian yang telah terjadi dalam percakapan sebelumnya.

8. **Inisiatif cerita:** Sesekali tambahkan elemen cerita yang menarik — kejutan kecil, detail lingkungan yang berubah, atau reaksi emosional yang mendalam — untuk membuat roleplay terasa hidup dan tidak monoton.`;
  }

  /**
   * Builds the opening message content to inject as first AI message.
   * @param {object} character
   * @returns {string | null}
   */
  function buildOpeningMessage(character) {
    if (!character.openingMessage) return null;
    return character.openingMessage;
  }

  /**
   * Converts the chat history (our internal format) to
   * the Gemini API format: [{role, parts}]
   * Our internal format: [{role: 'user'|'model', text: '...', timestamp: ...}]
   */
  function toApiHistory(messages) {
    return messages.map(msg => ({
      role: msg.role, // 'user' or 'model'
      parts: [{ text: msg.text }],
    }));
  }

  return { buildSystemPrompt, buildOpeningMessage, toApiHistory };
})();
