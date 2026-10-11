# MessageStore: Anti Memory Leak & Tiered Storage

`MessageStore` adalah subsistem penyimpanan riwayat pesan bertingkat (*Tiered Storage*) di Leaves Guardian yang memecahkan masalah klasik kebocoran memori RAM (*heap out of memory*) pada bot WhatsApp yang berjalan 24/7.

---

## 🔍 Latar Belakang & Masalah In-Memory Store

Pada bot WhatsApp berbasis Baileys konvensional, riwayat pesan biasanya disimpan menggunakan `makeInMemoryStore`. Pola ini menyimpan seluruh objek pesan ke dalam array atau Map JavaScript di memori RAM.

### Mengapa In-Memory Store Membahayakan Server?
1. **Ukuran Objek Pesan Baileys:** Setiap pesan bukan hanya teks ringkas, melainkan objek Protobuf bersarang (`WebMessageInfo`) yang memuat data konteks percakapan, quoting, daftar mention, dan buffer thumbnail biner.
2. **Volume Pesan Grup Aktif:** Bot yang bergabung di 10 sampai 20 grup aktif dapat menerima 50.000 hingga 200.000 pesan per hari.
3. **Bencana Out-of-Memory (OOM):** Akumulasi pesan di RAM menyebabkan heap memori V8 membengkak dari 100 MB hingga melampaui 1.5 GB. Begitu batas heap terlampaui, Node.js mengalami crash seketika (`JavaScript heap out of memory`), atau dimatikan paksa oleh Linux OOM Killer pada VPS berspesifikasi 512 MB sampai 1 GB RAM.

---

## 🏛️ Arsitektur Tiered Storage Leaves Guardian

Untuk meniadakan kebocoran memori tanpa mengorbankan kecepatan akses data, Leaves Guardian menerapkan arsitektur dua tingkat (*L1 Hot Cache + L2 Cold Storage*):

```
                     Incoming / Outgoing Message
                                  │
                                  ▼
                        MessageStore Engine
                         /              \
                        /                \
        [L1: Hot Cache (RAM)]       [L2: Cold Storage (Disk)]
      • LRU Map (50-100 pesan)    • Partisi file disk tersanitasi
      • Penggunaan RAM: ~2-5 MB   • Asynchronous non-blocking
      • Akses O(1) super cepat    • Retensi otomatis (cth: 3 hari)
                        \                /
                         \              /
                          ▼            ▼
                   getMessage(key) Lookup Flow:
                   1. Cek L1 RAM (Hit -> Return)
                   2. Jika Miss -> Baca L2 Disk -> Return
```

### Keuntungan Utama
* **Penghematan RAM >95%:** RAM yang terpakai untuk riwayat pesan terpangkas dari ratusan megabyte menjadi hanya sekitar 2-5 MB.
* **Handshake Retry E2EE Tetap Aman:** Pesan yang tergeser dari RAM tidak hilang karena tersimpan di disk. Saat WhatsApp meminta retry dekripsi, `getMessage(key)` otomatis membaca dari disk.
* **Buffer Sanitization:** Sebelum disimpan ke disk, payload pesan dibersihkan dari buffer biner besar yang tidak diperlukan untuk replay E2EE, menjaga ukuran file disk tetap ramping.
* **Auto-Pruning:** File yang usianya melampaui batas retensi (default 3 hari) akan dihapus secara otomatis di latar belakang.

---

## ⚙️ Opsi Konfigurasi

Saat menginisialisasi `LeavesClient`, konfigurasi MessageStore dapat ditentukan pada opsi `messages`:

```javascript
import { LeavesClient, MESSAGE_STORE_MODE } from 'leaves-guardian';

const client = new LeavesClient({
  auth: {
    directory: './session',
    method: 'pairing',
    phoneNumber: '628123456789'
  },
  messages: {
    // Mode penyimpanan: 'hybrid' (default), 'disk', 'memory', atau 'none'
    mode: MESSAGE_STORE_MODE.HYBRID,

    // Direktori penyimpanan file disk
    directory: './data/messages',

    // Batas maksimal pesan yang dipertahankan di RAM (L1 Cache)
    maxMemoryItems: 100,

    // Masa retensi pesan di disk sebelum dihapus otomatis (dalam hari)
    retentionDays: 3,

    // Interval eksekusi auto-prune di latar belakang (default: 1 jam)
    autoPruneIntervalMs: 3600000,

    // Bersihkan buffer biner besar sebelum menulis ke disk
    sanitizeBuffers: true
  }
});
```

### Pilihan Mode Penyimpanan (`MESSAGE_STORE_MODE`)

| Mode | Perilaku L1 (RAM) | Perilaku L2 (Disk) | Kebutuhan Penggunaan |
| :--- | :--- | :--- | :--- |
| `hybrid` (Default) | LRU Cache (50-100 pesan) | Tersimpan di disk | Rekomendasi utama untuk bot produksi 24/7. |
| `disk` | 0 item (0 MB RAM) | Tersimpan di disk | Lingkungan VPS dengan RAM sangat ketat (misal 256 MB). |
| `memory` | Bounded FIFO (RAM saja) | Tidak menulis disk | Lingkungan container ephemeral / serverless tanpa disk persistens. |
| `none` | Dinonaktifkan | Dinonaktifkan | Bot minimalis yang sama sekali tidak membutuhkan riwayat pesan. |

---

## 💻 Penggunaan Praktis

### 1. Mengambil Pesan untuk Re-Enkripsi atau Quoted Check
Fungsi `client.getMessage(key)` mendukung key Baileys standar maupun string canonical:

```javascript
// Mengambil pesan berdasarkan Baileys key object
const originalMsg = await client.getMessage({
  remoteJid: '628123456789@s.whatsapp.net',
  id: '3EB0ABC123XYZ'
});

if (originalMsg) {
  console.log('Isi pesan lama:', originalMsg.conversation || originalMsg.extendedTextMessage?.text);
}
```

### 2. Eviction Manual saat Memori Kritis
Anda dapat mengosongkan L1 RAM cache kapan saja tanpa menghapus data di disk:

```javascript
// Mengosongkan L1 RAM seketika (file di disk tetap utuh)
const count = client.messageStore.evictMemory();
console.log(`Berhasil mengosongkan ${count} pesan dari RAM.`);
```

### 3. Pembersihan Retensi Manual (Pruning)
```javascript
// Hapus pesan yang lebih tua dari 24 jam (86.400.000 ms)
const deleted = await client.messageStore.prune(86400000);
console.log(`Membersihkan ${deleted} file pesan usang dari disk.`);
```

---

## 🛡️ Integrasi Otomatis dengan MemoryGuard

Leaves Guardian menghubungkan `MessageStore` secara otomatis ke subsistem `MemoryGuard`. 

Jika bot mendeteksi bahwa total memori proses Node.js mencapai batas peringatan kritis (*Memory Threshold Warning*), `MemoryGuard` akan otomatis memicu hook mitigasi `messageStore.evictMemory()`. L1 RAM cache akan dikosongkan ke level 0 MB tanpa perlu me-restart bot, menjaga runtime tetap stabil dan mencegah crash OOM.
