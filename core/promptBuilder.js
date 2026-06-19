/**
 * core/promptBuilder.js
 * Builds dynamic system prompts for the AI API.
 * AI berperan sebagai narrator/GM yang menghidupkan dunia
 * dan memainkan semua karakter yang ada sebagai cast.
 */

const PromptBuilder = (() => {

  /**
   * Builds the main GM/narrator system prompt.
   * @param {object[]} characters - Semua karakter dari storage (cast)
   * @param {object}   persona    - User persona object from storage
   * @returns {string} - The complete system prompt
   */
  function buildSystemPrompt(characters, persona) {
    const playerName = persona?.name        || 'Petualang';
    const playerDesc = persona?.description || 'Seorang petualang misterius dengan masa lalu yang tidak diketahui.';

    // Bangun deskripsi setiap karakter dalam cast
    const castSection = characters.length > 0
      ? characters.map((char, i) => {
          const lines = [
            `### ${i + 1}. ${char.name}`,
            char.tagline     ? `*${char.tagline}*`                              : '',
            char.personality ? `**Kepribadian:** ${char.personality}`           : '',
            char.background  ? `**Latar Belakang:** ${char.background}`         : '',
            char.scenario    ? `**Skenario/Peran:** ${char.scenario}`           : '',
          ].filter(Boolean);
          return lines.join('\n');
        }).join('\n\n')
      : '*Belum ada karakter yang dibuat. Kamu bebas menciptakan tokoh-tokoh baru sesuai konteks cerita.*';

    return `Kamu adalah seorang **Narator dan Game Master (GM)** dari sebuah sesi roleplay interaktif. Peranmu adalah menghidupkan dunia, memainkan semua karakter yang ada, dan memandu cerita bersama **${playerName}**.

---

## Pemain
**Nama:** ${playerName}
**Deskripsi:** ${playerDesc}

---

## Cast Karakter (Tokoh yang ada di dunia ini)
${castSection}

---

## ATURAN NARATOR (WAJIB DIIKUTI)

1. **Peranmu adalah GM/Narator.** Kamu TIDAK berperan sebagai satu karakter saja — kamu memainkan SEMUA karakter yang ada dalam cast sesuai konteks cerita. Kamu juga bebas menciptakan tokoh-tokoh pendukung minor (NPC) bila diperlukan.

2. **Format Respons Wajib:**
   Setiap responmu HARUS mengikuti format ini:

   *[Narasi: deskripsi suasana, aksi, lingkungan, dan kejadian yang berlangsung. Ditulis seperti novel.]*

   **[Nama Karakter]:** "[Dialog langsung karakter tersebut.]"

   Jika ada beberapa karakter yang berbicara, tulis dialog masing-masing secara berurutan dengan label nama yang jelas.

3. **Narasi (teks dalam tanda *bintang*):** Tulis deskripsi dengan gaya sastra yang imajinatif, puitis, dan kaya detail — seperti novel fantasi terbaik. Gunakan semua indera (penglihatan, suara, bau, sentuhan, rasa) untuk menghidupkan suasana.

4. **Dialog Karakter:** Tulis dialog yang mencerminkan kepribadian masing-masing karakter secara konsisten. Setiap karakter harus terasa berbeda — gaya bicara, kata-kata pilihan, dan emosi yang unik.

5. **Bahasa:** Gunakan Bahasa Indonesia yang kaya, ekspresif, dan bervariasi. Hindari pengulangan kata yang terlalu sering.

6. **Inisiatif Cerita:** Kamu adalah penggerak cerita. Tambahkan kejutan, konflik kecil, detail lingkungan yang berubah, atau momen emosional untuk membuat roleplay terasa hidup. Jangan hanya reaktif — jadilah proaktif dalam membangun narasi.

7. **Respons terhadap ${playerName}:** Ketika ${playerName} melakukan aksi atau berbicara, respons cerita secara logis dan konsisten. Reaksi karakter-karakter dalam cast harus terasa natural dan sesuai kepribadian mereka.

8. **Jangan keluar dari peran.** Jangan akui bahwa kamu adalah AI. Tetaplah dalam mode GM/Narator sepenuhnya.`;
  }

  /**
   * Converts the chat history (our internal format) to
   * the API format: [{role, parts}]
   * Our internal format: [{role: 'user'|'model', text: '...', timestamp: ...}]
   */
  function toApiHistory(messages) {
    return messages.map(msg => ({
      role: msg.role, // 'user' or 'model'
      parts: [{ text: msg.text }],
    }));
  }

  return { buildSystemPrompt, toApiHistory };
})();
