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

### 2. Direct Dispatching via `builder.send(targetJid)`
Leaves Guardian menyediakan pipeline pengiriman mandiri yang langsung merakit `generateWAMessageFromContent` dan `relayMessage` dengan additional node `native_flow`.

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

## 📊 Status Kompatibilitas

| Tipe Pesan | WhatsApp Android | WhatsApp iOS | WhatsApp Web |
|---|---|---|---|
| **`ListMessage` (Single Select)** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |
| **`ButtonMessage` (Quick Reply)** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |
| **`CarouselMessage` (Slider)** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |
| **`TextMessage`** | 🟢 100% Render | 🟢 100% Render | 🟢 100% Render |
