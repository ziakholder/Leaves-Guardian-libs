# Catatan Update Patch Leaves Guardian

Dokumentasi riwayat pembaruan dan rilis versi Leaves Guardian.

---

## 🚀 Versi 0.3.6: GroupCache (Caching Metadata Grup & Sinkronisasi Real-Time)

Pembaruan keandalan dan performa penanganan grup WhatsApp untuk meniadakan pemanggilan `sock.groupMetadata()` berulang kali yang memicu rate limit WhatsApp (IQ 429), latensi jaringan tinggi, dan kerumitan deteksi hak admin.

### 1. Masalah yang Diselesaikan
* **WhatsApp IQ Rate Limit (Error 429):** Panggilan `sock.groupMetadata()` berulang kali di grup ramai membuat socket diblokir sementara oleh WhatsApp.
* **Latensi Perintah Grup Tinggi:** Respon bot lambat (300ms - 2000ms) akibat setiap perintah grup harus melakukan query jaringan ulang ke server WhatsApp.
* **Kode Deteksi Admin yang Rumit:** Variasi format JID pengirim (nomor biasa, device suffix, atau LID) menyulitkan validasi hak akses admin bot.
* **Cache Kedaluwarsa Tanpa Sadar:** Cache bot manual tidak memperbarui data saat member keluar, masuk, atau di-promote sampai bot di-restart.

### 2. Fitur & Peningkatan
* **GroupCache Bounded In-Memory Store:** Cache metadata grup dengan TTL cerdas (default 5 menit) dan batas kapasitas (default 250 grup).
* **Singleflight Request Coalescing:** Permintaan metadata grup secara bersamaan digabungkan ke dalam 1 request jaringan tunggal.
* **Sinkronisasi Event Real-Time:** Menangkap event socket `groups.update` dan `group-participants.update` (`add`, `remove`, `promote`, `demote`) secara otomatis untuk memutasi data peserta di memori tanpa query ulang.
* **Helper Methods Tingkat Klien:**
  * `client.groupMetadata(jid, forceRefresh)`
  * `client.isGroupAdmin(groupJid, userJid)`
  * `client.isBotAdmin(groupJid)`
  * `client.getGroupAdmins(groupJid)`
  * `client.getGroupParticipants(groupJid)`
  * `client.getAllCachedGroupMetadata()`
* **Integrasi MemoryGuard:** Mendaftarkan hook mitigasi `groupCache.clear` untuk mengosongkan cache secara otomatis saat terdeteksi tekanan memori tinggi.

---

## 🚀 Versi 0.3.5: Tiered MessageStore & Anti Memory Leak

Pembaruan arsitektur penyimpanan pesan untuk menyelesaikan isu kebocoran memori RAM (*heap out of memory*) pada bot WhatsApp yang berjalan 24/7 di grup aktif.

### 1. Masalah yang Diselesaikan
* Kebocoran memori RAM klasik Baileys akibat penyimpanan ratusan ribu pesan di RAM tanpa batas.
* Kerentanan crash proses Node.js (`JavaScript heap out of memory`) pada runtime panjang di VPS dengan RAM terbatas.
* Kehilangan data retry E2EE (`getMessage`) saat pesan tergeser dari antrean memori.

### 2. Fitur & Peningkatan
* **Tiered Storage (L1 RAM + L2 Disk):** Membatasi L1 RAM hanya pada 50-100 pesan aktif (~2-5 MB RAM, penghematan >95%), sementara riwayat lengkap dipersistensikan ke disk secara asynchronous.
* **Fallback Otomatis `getMessage(key)`:** Pencarian pesan memeriksa L1 RAM lebih dulu; jika miss, membaca dari L2 Disk secara instan untuk handshake retry Baileys.
* **Sanitasi Buffer Biner:** Membersihkan buffer media berukuran besar sebelum disimpan ke disk agar ukuran file tetap ringkas.
* **Auto-Pruning:** Pembersihan otomatis file pesan yang melampaui batas retensi (default 3 hari).
* **Integrasi MemoryGuard:** Mendaftarkan hook mitigasi `messageStore.evictMemory()` untuk mengosongkan L1 RAM secara otomatis saat server mengalami lonjakan beban memori kritis.

---

## 🛡️ Versi 0.3.4: Solusi Native Flow & Silent Drop

## 🔍 Diagnosis Masalah: Silent Drop pada Nomor Penerima

### Gejala yang Terjadi:
1. Bot mengeksekusi perintah (misalnya `.menu`) dengan sukses di console (`[REPLY_SENT]`).
2. Pesan list menu atau tombol interaktif **terlihat jelas di aplikasi WhatsApp milik nomor bot**.
3. Namun di WhatsApp milik pengguna/penerima (nomor utama), **bubble pesan sama sekali tidak muncul (kosong/invisible)** tanpa ada notifikasi error.

---

## 🧠 Penyebab Teknis (Root Cause)

### 1. Protokol Multi-Device & Ketiadaan `messageContextInfo`
Aplikasi WhatsApp pengirim (bot) merender pesan dari *local memory cache* saat paket selesai dibuat. Sebaliknya, aplikasi WhatsApp penerima mendekripsi paket E2EE dan memvalidasi struktur protobuf.

Pada pembaruan WhatsApp 2025/2026, setiap pesan bertipe `InteractiveMessage` (baik `single_select` maupun `quick_reply`) **WAJIB** menyertakan node **`messageContextInfo`** dengan metadata `deviceListMetadataVersion: 2`. Jika node ini hilang, WhatsApp penerima akan **mengabaikan payload tersebut secara diam-diam (*silent drop*)**.

### 2. Penyerahan Class Instance ke `ctx.reply()`
Fungsi `ctx.reply()` standar bot umumnya hanya menerima `string` atau objek Baileys sederhana. Jika instance `ListMessage` dioper ke `ctx.reply()`, Baileys mengirimkan objek mentah tanpa membungkusnya ke dalam struktur `relayMessage` dengan node `biz/interactive`.

### 3. Path Media Lokal Bukan Berupa Buffer
Ketika banner gambar lokal diberikan sebagai string path (contoh: `'./assets/images/Banner.jpg'`), Baileys memperlakukannya sebagai URL HTTP sehingga gagal diunggah ke server WhatsApp.

---

## ⚡ Solusi & Perubahan pada Patch Ini

### 1. Injeksi Otomatis `messageContextInfo` pada Builders
Semua builder pesan interaktif (`ListMessage`, `ButtonMessage`, `CarouselMessage`) di Leaves Guardian kini secara otomatis melampirkan metadata Device List:

```javascript
viewOnceMessage: {
  message: {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
    },
    interactiveMessage: {
      header: { ... },
      body: { text: '...' },
      nativeFlowMessage: { ... }
    }
  }
}
```

### 2. Binary Node Injection (`biz` & `bot biz_bot="1"`)
WhatsApp menerapkan aturan ketat pada chat pribadi (1:1 / PC): jika pesan interaktif dikirim dari nomor non-official tanpa atribut bot, WhatsApp penerima menolak menampilkan tombol.
Leaves Guardian kini otomatis menambahkan binary stanza:
- **Private Chat (1:1):** Menyertakan node `<biz><interactive ... /></biz>` serta `<bot biz_bot="1" />`.
- **Group Chat:** Menyertakan node `<biz><interactive ... /></biz>`.

### 3. Socket Hook `patchMessageBeforeSending`
Pada `ConnectionManager`, Leaves Guardian kini mendaftarkan hook `patchMessageBeforeSending` pada level Baileys socket untuk menjamin semua pesan berkategori interactive diproteksi dengan `deviceListMetadataVersion: 2` sebelum dienkripsi ke Signal protocol.

### 4. Direct Dispatching via `builder.send(targetJid)`
Leaves Guardian menyediakan pipeline pengiriman mandiri yang langsung merakit `generateWAMessageFromContent` dan `relayMessage` dengan binary nodes yang tepat.

---

## 🛠️ Panduan Implementasi untuk Pengembang Bot

### ❌ Cara Lama (Sering Mengalami Silent Drop):
```javascript
// JANGAN lakukan ini untuk List / Button
const list = new ListMessage(client)
  .setImage('./assets/banner.jpg') // String path lokal
  .setTitle('Menu')
  .addSection('Kategori', [...]);

return await ctx.reply(list); // ctx.reply belum tentu mendukung Builder
```

### ✅ Cara Baru (100% Muncul di Penerima):
```javascript
import fs from 'node:fs';
import path from 'node:path';
import { ListMessage } from 'leaves-guardian';

// 1. Baca gambar lokal menjadi Buffer
const bannerBuffer = fs.readFileSync(path.resolve('./assets/banner.jpg'));

// 2. Bangun ListMessage
const list = new ListMessage(client)
  .setImage(bannerBuffer) // Gunakan Buffer murni
  .setTitle('Menu Utama')
  .setBody('Silakan pilih menu:')
  .setButtonText('📑 Buka Menu')
  .addSection('Layanan', [
    { id: '.ping', title: 'Ping', description: 'Cek latensi' }
  ]);

// 3. Kirim langsung via method .send()
await list.send(targetJid);
```

---

## 🚀 Update v0.3.1: Solusi Centang 1, TC-Token LID, & Signal PreKey Retries

Pembaruan v0.3.1 menyelesaikan masalah pengiriman pesan yang **hanya centang 1** pada nomor tertentu atau pengguna baru (stranger):

### 1. Preservasi JID `@lid` & TC-Token (`tctoken-xxx@lid.json`)
- **Masalah:** WhatsApp 2025/2026 mengirimkan pesan 1-on-1 dengan format LID (misal: `35120501268714:0@lid`). Jika dipaksa dikonversi ke `@s.whatsapp.net`, Baileys tidak akan menyertakan TC-Token (*Trusted Contact Token*), menyebabkan server WhatsApp menolak pesan dengan kode **463 (NackCallerReachoutTimelocked)**.
- **Solusi Leaves Guardian:** Sanitasi JID di `LeavesClient` kini hanya membersihkan indeks device (`:0`, `:49` dengan regex `/:\d+@/gi`), tanpa memodifikasi domain `@lid`. Token keamanan terkirim utuh.

### 2. Signal PreKey Retry Cache (`msgRetryCounterCache` & `getMessage`)
- **Masalah:** Saat nomor penerima baru/berganti device, WhatsApp meminta pengiriman ulang kunci enkripsi. Tanpa retry cache, Baileys mengabaikan permintaan ini dan pesan terjebak di *Waiting for this message* / centang 1.
- **Solusi Leaves Guardian:** `ConnectionManager` kini dilengkapi `MemoryRetryCache` (TTL 5 menit) dan handler `getMessage` otomatis dari buffer pesan `rawMessageHistory`.

### 3. Human Emulation & Anti-Ban Protection
- Pengaturan default socket kini menggunakan `Browsers.macOS('Safari')`, `generateHighQualityLinkPreview: false`, serta rekomendasi simulasi tanda baca (`readMessages`) dan status `composing`.

---

## 📊 Status Kompatibilitas

| Tipe Pesan | WhatsApp Android | WhatsApp iOS | WhatsApp Web |
|---|---|---|---|
| **`ListMessage` (Single Select)** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |
| **`ButtonMessage` (Quick Reply)** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |
| **`CarouselMessage` (Slider)** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |
| **`TextMessage`** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |

