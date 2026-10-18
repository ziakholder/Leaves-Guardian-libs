# Catatan Update Patch Leaves Guardian

Dokumentasi riwayat pembaruan dan rilis versi Leaves Guardian.

---

## 🚀 Versi 0.3.12: Peningkatan Ketajaman Thumbnail Lokasi (420x420 & High-Contrast Sharpening)

Pembaruan kejernihan dan resolusi visual untuk thumbnail kartu lokasi dan header interaktif, menaikkan kerapatan piksel sebesar 96% (dari 300x300 ke 420x420) dengan alokasi luminans MozJPEG penuh dan penajaman kontras mikro Sharp tanpa melampaui batas aman 30 KB.

### 1. Masalah yang Diselesaikan
* **Tampilan Masih Terasa Agak Buram (Soft) pada Layar High-DPI:** Pada v0.3.11, resolusi dibatasi ke 300x300 dengan penajaman yang diperlemah serta alokasi kroma 4:4:4 yang menyita bitrate luminans (Y). Akibatnya, pada layar smartphone AMOLED berdensitas tinggi, garis outline dan detail halus terlihat sedikit pudar atau kurang tajam.

### 2. Fitur & Peningkatan
* **Resolusi Ditingkatkan ke Standar 420x420:**
  * Meningkatkan luas piksel dari 90.000 menjadi 176.400 piksel (peningkatan kerapatan detail hampir dua kali lipat).
* **Luma-Priority Chroma Subsampling (4:2:0):**
  * Mengalokasikan bitrate maksimal pada kanal luminans (ketajaman garis mata, rambut, dan siluet kontras) sehingga gambar tampil tajam dan bebas buram.
* **Sharp Smart Sharpening Kernel:**
  * Menggunakan filter penajaman kontras penuh dari libvips/Sharp yang mengembalikan mikro-kontras pada garis anime dan foto beresolusi tinggi.
* **Adaptive 8-Step Byte-Budget Engine:**
  * Engine cerdas menguji ukuran byte secara iteratif untuk menjamin payload tetap di bawah 30.000 bytes (~27-28 KB) sehingga 100% aman dan tidak pernah di-drop oleh klien WhatsApp mobile.

---

## 🚀 Versi 0.3.11: Adaptive Byte-Budget Thumbnail (<= 30 KB) & Fix Gambar Blank di WhatsApp Mobile

Pembaruan kritis untuk mengatasi hilangnya gambar thumbnail kartu lokasi pada aplikasi WhatsApp Android dan iOS akibat ambang batas biner internal klien WhatsApp (32 KiB cap), serta memastikan ketajaman Retina HD dengan ukuran file adaptif yang selalu aman.

### 1. Masalah yang Diselesaikan
* **Gambar Thumbnail Hilang / Blank di Aplikasi WhatsApp:** WhatsApp mobile (Android & iOS) memberlakukan batas internal ketat sebesar 32 KiB (32.768 bytes) untuk stream data biner `jpegThumbnail`. Jika gambar thumbnail melebihi batas tersebut (seperti 500x500 pada v0.3.10 yang mencapai ~68 KB), klien WhatsApp langsung membuang gambar secara diam-diam sehingga kartu lokasi tampil polos tanpa avatar/gambar.
* **Perbedaan Penanganan Antara Klien Mobile dan Web:** WhatsApp Web/Desktop dan Android/iOS membaca thumbnail dari properti header Protobuf yang sedikit berbeda (`interactiveMessage.header.jpegThumbnail` vs `header.locationMessage.jpegThumbnail`).

### 2. Fitur & Peningkatan
* **Loop Kompresi Adaptif Byte-Budget (<= 30.000 Bytes):**
  * Memasang limit keamanan absolut `MAX_THUMB_BYTES = 30000` (di bawah limit 32.768 bytes WhatsApp).
  * Algoritma `thumbnail-processor.js` secara otomatis menguji hasil render Sharp (MozJPEG + Lanczos3 + Sharpen + Chroma 4:4:4). Jika output melebihi 30 KB, sistem secara dinamis menurunkan kualitas atau ukuran secara bertahap sampai ukuran berada di bawah 30 KB (~24-27 KB rata-rata).
* **Retina HD Sharpness Berstandar 300x300:**
  * Resolusi default diatur ke 300x300 (atau maksimal 320x320) dengan kualitas 85%, unsharp mask (`.sharpen({ sigma: 1.0, m1: 0.5, m2: 0.5 })`), dan `chromaSubsampling: '4:4:4'`.
  * Garis anime, detail rambut, dan teks tetap tajam dan beresolusi tinggi di layar AMOLED tanpa pernah melampaui batas byte WhatsApp.
* **Dual-Channel Insertion untuk Multi-Platform:**
  * Menyematkan `jpegThumbnail` secara ganda baik pada `header` utama maupun di dalam `header.locationMessage`, memastikan thumbnail tampil sempurna di Android, iOS, WhatsApp Web, dan Desktop.

---

## 🚀 Versi 0.3.10: Upgrade Thumbnail Retina HD (500x500, Sharpening & Chroma 4:4:4)

Pembaruan kejernihan grafis pada thumbnail lokasi dan header kartu interaktif untuk menghadirkan ketajaman visual tingkat tinggi (*Retina HD*) di layar smartphone modern tanpa membebani transmisi Protobuf socket.

### 1. Masalah yang Diselesaikan
* **Tampilan Thumbnail Kurang Tajam di Layar Ponsel Modern:** Ukuran default 300x300 pixel di layar smartphone modern (densitas 3x/4x dengan resolusi 1080p - 1440p) terasa agak lembut (*soft*) atau pecah jika dilihat dari dekat pada panel AMOLED.
* **Penurunan Kejernihan Warna (Chroma Bleed):** Subsampling warna bawaan 4:2:0 mengurangi resolusi kanal warna hingga separuh, membuat detail halus seperti rambut atau outline karakter anime tampak memudar.

### 2. Fitur & Peningkatan
* **Standar Resolusi 500x500 Retina HD:**
  * Meningkatkan resolusi default dari 300x300 ke 500x500 pixel (peningkatan kerapatan pixel sebesar 2,7 kali lipat) dengan ukuran payload tetap efisien dan aman (~50-68 KB).
* **Filter Unsharp Masking (`.sharpen()`):**
  * Menambahkan filter penajaman kontras mikro pada engine Sharp untuk memastikan tekstur dan detail terkecil tetap menonjol.
* **Full Chroma Subsampling 4:4:4:**
  * Mempertahankan saturasi dan ketajaman warna penuh tanpa kompresi warna pada kanal kroma.
* **Tingkat Kualitas Default Dinaikkan ke 88%:**
  * Mengeliminasi artifak blok JPEG pada seluruh kartu `LocationMessage`, `ButtonMessage`, dan `ListMessage`.

---

## 🚀 Versi 0.3.9: Kompresi Otomatis 300x300 Thumbnail Lokasi Multi-Engine (Sharp / Canvas / Jimp)

Pembaruan optimalisasi payload pesan lokasi dan header interaktif untuk mencegah *silent drop*, pembengkakan socket Protobuf, serta distorsi gambar avatar pada kartu lokasi WhatsApp.

### 1. Masalah yang Diselesaikan
* **Silent Drop Akibat Payload Protobuf Raksasa:** Pada protokol WhatsApp, `jpegThumbnail` untuk pesan lokasi dikirim secara langsung sebagai byte biner di dalam payload Protobuf (`bytes jpegThumbnail = 16`). Mengirim gambar asli tanpa kompresi (seperti file PNG 2-5 MB atau foto kamera resolusi tinggi) menyebabkan socket Baileys membengkak drastis dan pesan dijatuhkan diam-diam (*silent drop*) oleh WhatsApp di perangkat tujuan.
* **Distorsi Aspek Rasio Thumbnail Avatar:** Container avatar lokasi WhatsApp memiliki rasio 1:1 (persegi). Gambar dengan rasio lain (seperti 16:9 atau potret) sering kali gepeng atau terdistorsi jika tidak dipotong secara proporsional.
* **Ketergantungan Engine Tunggal:** Ketergantungan pada satu modul grafis tertentu sering memicu error jika runtime server tidak memiliki binary pendukung.

### 2. Fitur & Peningkatan
* **Pipeline Kompresi Otomatis Multi-Engine:**
  * Modul `thumbnail-processor.js` mengimplementasikan fallback berjenjang:
    1. **Sharp (Prioritas Pertama)**: Menggunakan MozJPEG dan Lanczos3 resampling untuk hasil kompresi tertajam dan ukuran file paling efisien (~15-25 KB).
    2. **@napi-rs/canvas (Fallback Pertama)**: Menggunakan canvas berbasis Rust Skia yang sudah terinstal langsung dengan Leaves Guardian.
    3. **Jimp (Fallback Murni JS)**: Fallback JavaScript murni tanpa ketergantungan library native.
    4. **Raw Buffer Fallback (Safety Net)**: Menjamin pesan tetap terkirim meskipun seluruh engine gambar gagal memproses.
* **Standarisasi Cover-Crop Persegi 300x300:**
  * Semua thumbnail kartu lokasi pada `LocationMessage`, `ButtonMessage.setLocationHeader()`, dan `ListMessage.setLocationHeader()` secara otomatis dipotong proporsional dari titik tengah (*center cover-crop*) ke resolusi standar 300x300 pixel dengan format JPEG 80% quality.
* **Kustomisasi Opsi Dimensi & Kualitas:**
  * Method `.setThumbnail(thumb, { width, height, quality })` dan `.setLocationHeader(name, address, thumb, { width, height, quality })` kini menerima opsi konfigurasi kustom.

---

## 🚀 Versi 0.3.8: LocationMessage, Header Kartu Lokasi & Dropdown List

Pembaruan interaktivitas pesan WhatsApp yang menghadirkan model pesan kartu lokasi interaktif modern, header lokasi dengan avatar thumbnail, serta integrasi tombol dropdown list menu langsung di dalam kartu tombol.

### 1. Masalah yang Diselesaikan
* **Kebutuhan Format Kartu Sambutan Elegan:** Bot memerlukan tampilan menu dan profil sambutan yang bersih, modern, dan tampak resmi seperti akun korporat tanpa terpotong banner ad-reply.
* **Risiko Silent Drop & 401 Unlink:** Pengiriman interactive buttons biasa pada beberapa jenis device terkadang terhambat validasi multi-device; format lokasi native lolos validasi WhatsApp secara aman.
* **Keterbatasan Tombol Tunggal:** Sebelumnya pengguna harus memilih antara mengirim tombol *quick reply* saja atau menu *list* saja secara terpisah.

### 2. Fitur & Peningkatan
* **Class `LocationMessage` Terdedikasi:**
  * Menghasilkan kartu lokasi WhatsApp asli dengan icon pin merah `📍`, nama/judul tebal, teks alamat, dan thumbnail avatar persegi resolusi tinggi di sebelah kanan.
  * Mendukung method: `.setName()`, `.setAddress()`, `.setThumbnail()`, dan `.setCoordinates()`.
  * Mewarisi seluruh kemampuan `ButtonMessage`: Quick Reply, CTA URL, CTA Copy, CTA Call, Galaxy banner, dan Limited offer.
* **Dropdown List Menus di Dalam Tombol (`addDropdown` / `addList`):**
  * Memungkinkan penggabungan tombol aksi langsung dan menu pilihan dropdown bertingkat sekaligus dalam satu pesan `ButtonMessage` atau `LocationMessage`.
* **Header Kartu Lokasi di Seluruh Pesan Interaktif (`setLocationHeader` / `setLocation`):**
  * Ditambahkan ke `ButtonMessage` dan `ListMessage` untuk menyematkan header lokasi dengan thumbnail avatar secara instan.

---

## 🛡️ Versi 0.3.7: Auto-Purge 401 Disconnect & Pemulihan Sesi Zero-Downtime

Pembaruan keandalan koneksi dan sesi auth untuk menangani disconnect 401 (*unlinked / logged out*) secara otomatis tanpa *crash-loop* dan tanpa intervensi manual.

### 1. Masalah yang Diselesaikan
* **Crash-Loop Sesi Putus (Error 401 / Logged Out):** Saat pengguna memutuskan tautan perangkat (*unlink device*) dari WhatsApp di ponsel, bot tradisional terus mencoba reconnect berulang-ulang menggunakan kredensial yang sudah tidak valid, menyebabkan crash loop tanpa henti.
* **File Kredensial Sampah:** Kredensial kedaluwarsa di folder sesi menumpuk dan mencegah pembuatan QR code baru secara bersih.

### 2. Fitur & Peningkatan
* **Deteksi Otomatis Disconnect 401:** `ConnectionManager` dan `SessionRecovery` secara otomatis mengenali kode pemutusan `401 Unauthorized` atau `DisconnectReason.loggedOut`.
* **Auto-Purge Direktori Sesi Kedaluwarsa:** Menghapus file auth lama yang rusak secara aman tanpa mengunci proses Node.js.
* **Transisi QR / Pairing Code Segar Tanpa Restart:** Bot secara otomatis mereset state internal auth dan langsung menampilkan QR code atau kode pairing baru tanpa perlu me-restart proses server secara manual.

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

