# Panduan Cepat (Quick Start)

Selamat datang di **Leaves Guardian**! Panduan ini dirancang sebagai jalur tercepat bagi developer untuk membangun dan menjalankan bot WhatsApp pertama menggunakan library `leaves-guardian`.

---

## Prasyarat Lingkungan

Sebelum memulai, pastikan lingkungan pengembangan Anda memenuhi kriteria berikut:

- **Node.js**: Versi `>= 18.0.0` (disarankan LTS).
- **Module System**: ECMAScript Modules (ESM) diaktifkan (`"type": "module"` pada `package.json`).
- **Akses Terminal**: Terminal interaktif untuk menampilkan QR code saat proses login (atau nomor WhatsApp aktif jika menggunakan metode pairing code).

---

## Instalasi

Pasang package `leaves-guardian` ke dalam proyek Anda menggunakan package manager pilihan:

::: code-group

```bash [npm]
npm install leaves-guardian
```

```bash [pnpm]
pnpm add leaves-guardian
```

```bash [yarn]
yarn add leaves-guardian
```

:::

Pastikan file `package.json` Anda memiliki konfigurasi `"type": "module"`:

```json
{
  "name": "bot-whatsapp-saya",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "leaves-guardian": "^0.2.0"
  }
}
```

---

## Client Pertama Anda

Buat file utama bernama `index.js` dengan kode minimal yang siap dijalankan (*copy-paste-runnable*) berikut:

```javascript
import { LeavesClient } from 'leaves-guardian';

// 1. Inisialisasi instance client
const client = new LeavesClient({
  auth: {
    directory: './session', // Direktori tempat penyimpanan kredensial sesi multi-file
    method: 'qr'            // 'qr' (default) atau 'pairing'
  }
});

// 2. Tangani event kesiapan bot (socket open + identitas terotentikasi)
client.on('ready', ({ user }) => {
  console.log(`✅ Bot berhasil terhubung sebagai ${user?.id || user?.jid || 'WhatsApp Bot'}!`);
});

// 3. Tangani pesan masuk yang telah dinormalisasi
client.on('message', async (msg) => {
  // Abaikan pesan yang dikirim oleh akun bot sendiri
  if (msg.sender.isMe) return;

  // Respon perintah sederhana
  if (msg.text.trim() === '!ping') {
    await client.sendText(msg.chat.id, '🏓 Pong dari Leaves Guardian!');
  }
});

// 4. Buka koneksi ke WhatsApp
await client.connect();
```

Jalankan bot Anda dengan perintah:

```bash
node index.js
```

---

## Autentikasi

Leaves Guardian mendukung dua metode autentikasi bawaan secara langsung.

### 1. Autentikasi QR Code (Bawaan)

Secara default, opsi `auth.method` bernilai `'qr'`. Saat Anda memanggil `await client.connect()`, Leaves Guardian akan secara otomatis mencetak gambar QR code ASCII di terminal menggunakan `qrcode-terminal`.

```javascript
const client = new LeavesClient({
  auth: {
    directory: './session',
    method: 'qr'
  }
});
```

* **Cara Scan**: Buka WhatsApp di ponsel Anda, pilih **Perangkat Tertaut** > **Tautkan Perangkat**, lalu pindai QR code yang tampil di terminal.
* **Menonaktifkan Cetak QR di Terminal**: Jika Anda mengintegrasikan bot ke dalam dashboard custom atau GUI, atur `printQR: false` dan dengarkan event `qr`:
  ```javascript
  const client = new LeavesClient({
    printQR: false
  });

  client.on('qr', (qrString) => {
    // Tangani atau tampilkan raw QR string pada antarmuka kustom Anda
  });
  ```

### 2. Autentikasi Pairing Code

Jika bot dijalankan pada server *headless* tanpa dukungan rendering grafis terminal atau Anda lebih memilih autentikasi via nomor telepon, gunakan metode pairing code:

```javascript
const client = new LeavesClient({
  auth: {
    directory: './session',
    method: 'pairing',
    phoneNumber: '628123456789' // Kode negara + nomor telepon tanpa '+' atau spasi
  }
});

client.on('pairing_code', ({ code, phoneNumber }) => {
  console.log(`🔑 Pairing Code untuk ${phoneNumber}: ${code}`);
});
```

* **Tautkan di Ponsel**: Buka WhatsApp di ponsel Anda, masuk ke **Perangkat Tertaut** > **Tautkan Perangkat** > **Tautkan dengan nomor telepon saja**, lalu masukkan 8 digit kode yang muncul.

---

## Siklus Hidup Koneksi (Connection Lifecycle)

Leaves Guardian mengelola status koneksi melalui *state machine* yang terstruktur:

```text
IDLE
  └── INITIALIZING
        └── AUTHENTICATING
              └── CONNECTING
                    └── OPEN
                          └── READY
```

### Prinsip Penting: `OPEN !== READY`

Pada arsitektur WhatsApp, status socket yang mencapai `OPEN` **belum tentu** menandakan bot sudah siap mengirim atau memproses pesan.

- **`OPEN`**: Koneksi WebSocket mentah ke server WhatsApp telah terhubung.
- **`READY`**: Pipeline inisialisasi runtime telah memverifikasi kredensial terotentikasi (`sock.user` / identitas auth). Event `ready` baru akan dipicu ketika client benar-benar siap menerima dan memproses pesan.

---

## Menerima Pesan

Setiap pesan masuk dinormalisasi menjadi objek data `Message` yang bersifat *immutable* sebelum dipancarkan melalui event `message`:

```javascript
client.on('message', async (msg) => {
  console.log(`[${msg.type}] dari ${msg.sender.id} di ${msg.chat.id}: ${msg.text}`);
});
```

### Properti Utama Objek `Message`

| Properti | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `msg.id` | `string` | ID unik pesan WhatsApp. |
| `msg.chat.id` | `string` | JID percakapan tujuan (`xxx@s.whatsapp.net` untuk chat pribadi, `xxx@g.us` untuk grup). |
| `msg.chat.isGroup` | `boolean` | Bernilai `true` jika pesan berasal dari grup WhatsApp. |
| `msg.sender.id` | `string` | JID pengguna yang mengirim pesan. |
| `msg.sender.isMe` | `boolean` | Bernilai `true` jika pesan dikirim oleh akun bot sendiri. |
| `msg.text` | `string` | Konten teks pesan yang diekstrak secara otomatis. |
| `msg.type` | `string` | Kategori tipe pesan (misal: `TEXT`, `IMAGE`, `STICKER`). |

> **Catatan**: Objek `Message` adalah struktur data murni dan tidak memiliki method bawaan seperti `msg.reply()`. Pengiriman pesan keluar dilakukan secara eksplisit melalui instance `LeavesClient`.

---

## Mengirim Pesan

Untuk mengirim pesan balasan ke chat atau pengguna, gunakan method pengiriman resmi pada client:

### 1. Helper Teks Cepat: `sendText`

Gunakan untuk respon berbasis teks biasa:

```javascript
await client.sendText(msg.chat.id, 'Halo! Ini adalah balasan teks sederhana.');
```

### 2. Dispatcher Pesan Standar: `sendMessage`

Gunakan untuk payload terstruktur atau integrasi dengan message builder:

```javascript
await client.sendMessage(msg.chat.id, {
  text: 'Halo dari dispatcher standar Leaves Guardian!'
});
```

---

## Graceful Shutdown

Leaves Guardian secara otomatis mendaftarkan listener untuk sinyal proses `SIGINT` dan `SIGTERM`. Saat Anda menghentikan proses (misal menekan <kbd>Ctrl</kbd>+<kbd>C</kbd>), client akan secara otomatis:

1. Menghentikan timer internal dan monitor observabilitas.
2. Menyelesaikan operasi background yang sedang berjalan.
3. Menutup koneksi socket secara bersih.

Anda juga dapat memicu penutupan koneksi secara terprogram (*programmatically*):

```javascript
// Memutus koneksi dan melepaskan seluruh resource secara bersih
await client.disconnect();
```

---

## Contoh Output Terminal

Saat pertama kali menjalankan bot dengan autentikasi QR, Anda akan melihat log terminal yang serupa dengan berikut:

```text
[INIT] Initializing Leaves Guardian client...
[AUTH] Please scan the QR code below:

  ▄▄▄▄▄▄▄ ▄ ▄▄ ▄▄▄▄▄▄▄
  █ ▄▄▄ █ █▄██ █ ▄▄▄ █
  █ ███ █ ▄▄█  █ ███ █
  ... (QR code dirender di terminal) ...

[CONNECT] Connecting to WhatsApp...
[CONNECT] WhatsApp socket connection open
[READY] Client initialized and ready! Logged in as 628123456789@s.whatsapp.net
✅ Bot berhasil terhubung sebagai 628123456789@s.whatsapp.net!
```

---

## Troubleshooting Cepat

### `Cannot find package 'leaves-guardian'`
- **Penyebab**: Package belum terpasang di direktori proyek Anda.
- **Solusi**: Jalankan `npm install leaves-guardian` di direktori yang sama dengan `package.json`.

### `SyntaxError: Cannot use import statement outside a module`
- **Penyebab**: Node.js menganggap proyek sebagai CommonJS jika properti `"type": "module"` tidak ada.
- **Solusi**: Tambahkan `"type": "module"` ke dalam file `package.json` Anda.

### `Session directory locking issues`
- **Penyebab**: Ada proses bot lain yang masih aktif memegang file lock `.session.lock` di folder `./session`.
- **Solusi**: Pastikan hanya satu instance bot yang mengakses folder sesi yang sama pada satu waktu.

### `Invalid pairing phone number format`
- **Penyebab**: Memasukkan format nomor telepon dengan tanda `+`, spasi, atau tanda strip (misal: `+62 812-3456-789`).
- **Solusi**: Masukkan hanya angka beserta kode negara, contoh: `'628123456789'`.

---

## Langkah Selanjutnya

Setelah bot minimal Anda berjalan, Anda dapat mempelajari konsep dasar dan arsitektur Leaves Guardian lebih mendalam:

- **[Pengenalan & Filosofi](/id/quickstart/overview)**: Model mental, prinsip desain, dan batasan tanggung jawab library.
- **[Arsitektur & Siklus Hidup](/id/quickstart/architecture)**: Model arsitektur 5 layer, transisi status koneksi, dan graceful shutdown.
- **[Skema Normalisasi Pesan](/id/guides/schema)**: Format data pesan terpadu, struktur kutipan (quote), dan metadata media.
