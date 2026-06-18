// ============================================================
//  config.example.js — Template Konfigurasi
//  Salin file ini menjadi config.js, lalu isi API key Anda.
//  File ini AMAN untuk di-commit ke GitHub.
// ============================================================

const CONFIG = {

  // ── OPSI 1: Google Gemini ────────────────────────────────
  // API Key: https://aistudio.google.com/app/apikey
  // Format key bisa AIzaSy... atau AQ.Ab8... (keduanya valid)
  provider: 'gemini',
  apiKey: 'MASUKKAN_API_KEY_GEMINI_DI_SINI',
  model: 'gemini-2.0-flash',
  // model: 'gemini-2.5-flash-preview-05-20',

  // ── OPSI 2: DeepSeek ─────────────────────────────────────
  // API Key: https://platform.deepseek.com/api_keys (dimulai sk-...)
  // provider: 'deepseek',
  // apiKey: 'sk-...',
  // model: 'deepseek-chat',
  // model: 'deepseek-reasoner',

};
