# ✦ Aether — AI Roleplay Visual Novel

> Masuki dunia fantasi tak terbatas. Ciptakan karakter AI, bangun persona Anda, dan mulailah petualangan roleplay yang mendalam bersama kecerdasan buatan Google Gemini.

![Aether Preview](https://via.placeholder.com/900x400/0e0e1c/a78bfa?text=✦+Aether+AI+Roleplay)

---

## ✨ Fitur

- 🎭 **Buat Karakter AI** — Nama, kepribadian, latar belakang, skenario, dan avatar kustom
- 👤 **Persona Pemain** — AI mengenali siapa kamu dalam cerita
- 💬 **Streaming Real-time** — Respons AI muncul karakter per karakter (efek typewriter)
- 📖 **Format Narasi + Dialog** — Narasi aksi `*dalam bintang*` dirender berbeda dari dialog
- 🧠 **Memori Panjang** — Seluruh chat history dikirim ke Gemini 1.5 Pro (hingga 2 juta token!)
- 🔄 **Regenerate** — Buat ulang respons terakhir AI kapan saja
- 💾 **Semua Data Lokal** — API key & riwayat chat tersimpan di browser Anda saja

---

## 🚀 Cara Pakai

### Prasyarat
- Google AI Studio API Key (gratis): [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Jalankan Lokal

**Opsi 1 — Python (paling mudah):**
```bash
cd aether
python -m http.server 8000
```
Buka: `http://localhost:8000`

**Opsi 2 — Node.js:**
```bash
npx serve .
```

**Opsi 3 — Langsung buka file:**
Buka `index.html` langsung di browser (beberapa fitur mungkin terbatas karena CORS).

### Langkah Pertama
1. Buka `http://localhost:8000`
2. Masukkan **Google AI Studio API Key** di modal yang muncul
3. Pilih model (disarankan: **Gemini 1.5 Pro**)
4. Klik **"Buat Karakter Baru"** dan isi detail karakter
5. Klik **"Mulai Roleplay"** — selamat berimajinasi! ✦

---

## 📁 Struktur Proyek

```
aether/
├── index.html              # Entry point aplikasi
├── style.css               # Design system (dark fantasy, glassmorphism)
├── app.js                  # Router + utilitas global
├── core/
│   ├── storage.js          # Manajemen data localStorage
│   ├── api.js              # Integrasi Gemini API (streaming SSE)
│   └── promptBuilder.js    # Pembangun system prompt dinamis
└── pages/
    ├── home.js             # Halaman beranda — galeri karakter
    ├── character.js        # Halaman buat/edit karakter
    ├── persona.js          # Halaman edit persona pemain
    └── chat.js             # Antarmuka roleplay utama
```

---

## 🔒 Keamanan & Privasi

> **API Key Anda TIDAK pernah dikirim ke server manapun selain Google.**
> Semua data (API key, karakter, riwayat chat) tersimpan hanya di `localStorage` browser Anda secara lokal.

---

## 📝 Format Roleplay

AI akan selalu merespons dalam dua bagian:

```
*Narasi aksi dan suasana ditulis di dalam tanda bintang — 
dirender dalam gaya sastra yang imajinatif dan puitis.*

Dialog langsung karakter yang berbicara kepada Anda.
```

---

## 🛠️ Teknologi

- **Frontend:** HTML5 + Vanilla CSS + Vanilla JavaScript (tanpa framework)
- **AI:** Google Gemini API (via Google AI Studio)
- **Font:** Cinzel (judul) + Lora (narasi) + Inter (UI) — via Google Fonts
- **Storage:** Browser localStorage
- **Streaming:** Server-Sent Events (SSE) via Fetch API

---

## 📜 Lisensi

MIT License — bebas digunakan dan dimodifikasi.

---

*Dibuat dengan ✦ dan sedikit sihir.*
