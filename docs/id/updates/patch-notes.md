# Catatan Update Patch: Solusi Native Flow & Silent Drop

Halaman ini mendokumentasikan pembaruan teknis terkait protokol **WhatsApp Multi-Device Native Flow** di Leaves Guardian untuk menyelesaikan kendala pesan interaktif (*List Menu & Button*) yang **hanya tampak di nomor bot (pengirim) namun tidak muncul di nomor pengguna (penerima)**.

---

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

