# Hierarki Error & Kode

Leaves Guardian menyediakan arsitektur penanganan exception terstruktur yang berakar pada base class `LeavesError`. Seluruh error yang dihasilkan oleh core client, message builders, utilitas interaktif, hingga subsistem keandalan mewarisi fondasi ini.

Dengan memadukan **kelas error semantik**, **kode error terstandar**, dan metadata kontekstual, aplikasi dapat menerapkan penanganan error yang presisi dan sesuai konteks kebutuhan operasional.

---

## 1. Arsitektur & Filosofi Error

Desain exception pada Leaves Guardian berpegang pada tiga prinsip utama:

1. **Pewarisan Eksplisit (Explicit Inheritance)**: Setiap domain dan subsistem menyediakan kelas error khusus yang mewarisi `LeavesError` (yang merupakan turunan dari `Error` bawaan Node.js).
2. **Kode Error Terstandar (Discriminated Codes)**: Setiap instance error memiliki properti string `code` yang mendeskripsikan kondisi kegagalan secara pasti.
3. **Metadata Kontekstual**: Instance error membawa dictionary `meta` yang berisi informasi diagnostik seperti ID target, JID penerima, ID task, ID step prompt, atau referensi `cause` asli.

```
Error (Bawaan Node.js)
   └── LeavesError (code = 'LEAVES_ERROR', meta = {})
         ├── ConnectionError
         ├── AuthenticationError
         ├── SessionError
         │     └── SessionRecoveryError
         ├── PromptError
         │     ├── PromptTimeoutError
         │     ├── PromptCancelledError
         │     └── PromptMaxRetriesError
         ├── TrafficError
         ├── MediaError
         └── ... (33 kelas error khusus)
```

---

## 2. Base Class: `LeavesError`

Seluruh custom error pada Leaves Guardian merupakan turunan dari `LeavesError`.

### Konstruktor & Signature

```javascript
export class LeavesError extends Error {
  constructor(message, code = 'LEAVES_ERROR', meta = {}) {
    super(message);
    this.name = 'LeavesError';
    this.code = code;
    this.meta = meta;
    if (meta && meta.cause) {
      this.cause = meta.cause;
    }
    Object.assign(this, meta);
  }
}
```

### Properti

| Properti | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `name` | `string` | Nama kelas error (misal `'LeavesError'`, `'TrafficError'`). |
| `message` | `string` | Penjelasan kondisi error yang mudah dibaca. |
| `code` | `string` | Kode error string yang dapat diproses mesin (misal `'TRAFFIC_QUEUE_FULL'`). |
| `meta` | `Object` | Objek dictionary metadata kontekstual. Default `{}`. |
| `cause` | `Error | undefined` | Jika `meta.cause` disertakan, `LeavesError` mengeksposnya sebagai `error.cause` untuk inspeksi rantai error. |

### Proyeksi Properti Metadata

Konstruktor mengeksekusi `Object.assign(this, meta)`. Properti yang disertakan dalam `meta` diproyeksikan langsung ke instance error, sehingga field konteks dapat diakses secara ergonomis jika disediakan oleh subsistem yang bersangkutan:

```javascript
try {
  await prompt.run('62812345678@s.whatsapp.net');
} catch (err) {
  if (err instanceof LeavesError) {
    console.error('Kode Error:', err.code);     // misal: 'PROMPT_STEP_TIMEOUT'
    console.error('Step ID:', err.stepId);       // Properti langsung hasil proyeksi meta
    console.error('Meta Utuh:', err.meta);      // { stepId: 'nama_input', timeoutMs: 30000 }
  }
}
```

---

## 3. Referensi Kelas Error

Leaves Guardian mengekspor **33 kelas error khusus** dari root package:

### A. Lapisan Core Client & Koneksi

| Kelas Error | Base Class | Default Code | Metadata / Konteks Terdokumentasi |
| :--- | :--- | :--- | :--- |
| `LeavesError` | `Error` | `'LEAVES_ERROR'` | Base class umum untuk seluruh error library. Menerima `meta`. |
| `ConnectionError` | `LeavesError` | `'CONNECTION_ERROR'` | Kegagalan koneksi socket, pemutusan jaringan, atau stream drop. |
| `AuthenticationError` | `LeavesError` | `'AUTHENTICATION_ERROR'` | Kegagalan pemindaian QR, kredensial rusak, atau error 401 unrecoverable. |
| `SessionError` | `LeavesError` | `'SESSION_ERROR'` | Kerusakan sesi, direktori kredensial tidak ditemukan, atau I/O auth gagal. |
| `SessionRecoveryError` | `SessionError` | `'SESSION_RECOVERY_ERROR'` | Error granular saat verifikasi dan pemulihan snapshot sesi (menggunakan `SESSION_RECOVERY_CODES`). |
| `PairingError` | `LeavesError` | `'PAIRING_ERROR'` | Kegagalan pembuatan pairing code, format nomor salah, atau timeout pairing. |
| `MessageNormalizationError` | `LeavesError` | `'MESSAGE_NORMALIZATION_ERROR'` | Kegagalan saat mengonversi raw Baileys proto menjadi instance `Message` ternormalisasi. |
| `ShutdownError` | `LeavesError` | `'SHUTDOWN_ERROR'` | Operasi dipanggil saat client atau subsistem telah memasuki state shutdown. |
| `StateError` | `LeavesError` | `'STATE_ERROR'` | Transisi state yang tidak valid pada lifecycle manager. |
| `LeavesValidationError` | `LeavesError` | `'VALIDATION_ERROR'` | Error validasi parameter umum pada opsi client dan utility helper. |

---

### B. Message Builders & Validasi Konten

| Kelas Error | Base Class | Default Code | Metadata / Konteks Terdokumentasi |
| :--- | :--- | :--- | :--- |
| `ItemNotFoundError` | `LeavesError` | `'ITEM_NOT_FOUND'` | Dilempar saat memodifikasi/menghapus item builder berdasarkan ID yang tidak ada. Meta: `{ id, availableIds }`. |
| `DuplicateIdError` | `LeavesError` | `'DUPLICATE_ID'` | Dilempar saat menambahkan item builder dengan ID yang bertabrakan. Meta: `{ id }`. |
| `InvalidTargetError` | `LeavesError` | `'INVALID_TARGET'` | Dilempar saat target JID kosong atau tidak valid untuk jenis pesan terkait. |
| `ContentValidationError` | `LeavesError` | `'CONTENT_VALIDATION'` | Dilempar saat konten builder melanggar batasan protokol WhatsApp (misal tombol kosong). |

---

### C. Utilitas Interaktif & Developer Tools

| Kelas Error | Base Class | Default Code | Metadata / Konteks Terdokumentasi |
| :--- | :--- | :--- | :--- |
| `CollectorError` | `LeavesError` | `'COLLECTOR_ERROR'` | Base error untuk kegagalan pada `MessageCollector`. |
| `CollectorTimeoutError` | `CollectorError` | `'COLLECTOR_TIMEOUT'` | Dilempar saat collector kedaluwarsa sebelum menerima pesan yang cocok. |
| `PromptError` | `LeavesError` | `'PROMPT_ERROR'` | Base error untuk wizard interaktif `Prompt`. |
| `PromptTimeoutError` | `PromptError` | `'PROMPT_TIMEOUT'` / `'PROMPT_STEP_TIMEOUT'` | Dilempar saat step atau seluruh alur prompt kedaluwarsa tanpa input user. Meta: `{ stepId, timeoutMs }`. |
| `PromptCancelledError` | `PromptError` | `'PROMPT_CANCELLED'` | Dilempar saat pengguna mengirim kata kunci pembatalan (misal "batal", "cancel"). Meta: `{ stepId }`. |
| `PromptMaxRetriesError` | `PromptError` | `'PROMPT_MAX_RETRIES'` | Dilempar saat pengguna melampaui batas percobaan validasi step. Meta: `{ stepId, attempts }`. |
| `PaginatorError` | `LeavesError` | `'PAGINATOR_ERROR'` | Base error untuk utilitas `Paginator`. |
| `PaginatorStateError` | `PaginatorError` | `'PAGINATOR_STATE_ERROR'` | Dilempar saat operasi state navigasi paginator tidak valid (misal navigasi saat stop). |
| `PaginatorTimeoutError` | `PaginatorError` | `'PAGINATOR_TIMEOUT'` / `'PAGINATOR_IDLE_TIMEOUT'` | Dilempar saat paginator interaktif kedaluwarsa karena batas waktu total atau idle. |
| `EphemeralError` | `LeavesError` | `'EPHEMERAL_ERROR'` | Dilempar saat konfigurasi timer pesan sementara atau message key tidak valid. |
| `AutoDeleteError` | `LeavesError` | `'AUTODELETE_ERROR'` | Dilempar saat penjadwalan auto-delete gagal atau key pesan tidak dapat dinormalisasi. |

---

### D. Subsistem Keandalan & Runtime

| Kelas Error | Base Class | Default Code | Metadata / Konteks Terdokumentasi |
| :--- | :--- | :--- | :--- |
| `SmartStoreError` | `LeavesError` | `'SMARTSTORE_ERROR'` | Error validasi key, isolasi namespace, serialisasi, atau pembersihan sweep. |
| `HealthError` | `LeavesError` | `'HEALTH_ERROR'` | Error registrasi probe atau validasi ambang batas kesehatan (menggunakan `HEALTH_ERROR_CODES`). |
| `WatchdogError` | `LeavesError` | `'WATCHDOG_ERROR'` | Error verifikasi responsivitas socket watchdog (menggunakan `WATCHDOG_ERROR_CODES`). |
| `MemoryError` | `LeavesError` | `'MEMORY_ERROR'` | Error validasi ambang batas memori atau eksekusi hook mitigasi (menggunakan `MEMORY_ERROR_CODES`). |

---

### E. Subsistem Trafik, Media, Limiter & Terminal

| Kelas Error | Base Class | Default Code | Metadata / Konteks Terdokumentasi |
| :--- | :--- | :--- | :--- |
| `TrafficError` | `LeavesError` | `'TRAFFIC_ERROR'` | Antrean penuh, prioritas tidak valid, atau pembatalan task (menggunakan `TRAFFIC_ERROR_CODES`). |
| `MediaError` | `LeavesError` | `'MEDIA_ERROR'` | Pemblokiran SSRF, ukuran melebihi batas, atau timeout media (menggunakan `MEDIA_ERROR_CODES`). |
| `RateLimitError` | `LeavesError` | `'RATE_LIMIT_ERROR'` | Opsi rate limiter tidak valid atau kegagalan ekstraksi key (menggunakan `RATE_LIMIT_ERROR_CODES`). |
| `DeduplicationError` | `LeavesError` | `'DEDUP_ERROR'` | Opsi deduplicator tidak valid atau kegagalan ekstraksi identity (menggunakan `DEDUP_ERROR_CODES`). |
| `TerminalError` | `LeavesError` | `'TERMINAL_ERROR'` | Opsi terminal tidak valid, event tidak valid, atau error penggantian renderer (menggunakan `TERMINAL_ERROR_CODES`). |

---

## 4. Konstanta Kode Error Subsistem

Selain kelas error, Leaves Guardian mengekspor **9 enum konstanta kode error ter-freeze**.

> [!NOTE]
> **Perbedaan Kelas Error vs. Konstanta Kode Error**:
> - **Kelas Error** (misal `MediaError`) membentuk hierarki pewarisan objek JavaScript.
> - **Konstanta Kode Error** (misal `MEDIA_ERROR_CODES.SIZE_EXCEEDED`) adalah dictionary string terstruktur yang dipassing ke `err.code` untuk diskriminasi kondisi error yang spesifik.

---

### `SESSION_RECOVERY_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `SESSION_CORRUPTED` | `'SESSION_CORRUPTED'` | File sesi 0-byte, JSON korup, atau skema tidak valid. |
| `SNAPSHOT_CREATION_FAILED` | `'SNAPSHOT_CREATION_FAILED'` | Gagal menulis atau mengarsipkan snapshot atomik. |
| `SNAPSHOT_INCONSISTENT` | `'SNAPSHOT_INCONSISTENT'` | Snapshot mengandung file parsial atau checksum tidak cocok. |
| `SNAPSHOT_CORRUPTED` | `'SNAPSHOT_CORRUPTED'` | Arsip snapshot gagal verifikasi integritas. |
| `SESSION_UNRECOVERABLE` | `'SESSION_UNRECOVERABLE'` | Tidak ada snapshot valid dan file sesi rusak permanen. |
| `RESTORE_FAILED` | `'RESTORE_FAILED'` | Gagal mengekstrak file snapshot ke folder sesi. |
| `RESTORE_ACTIVATION_FAILED` | `'RESTORE_ACTIVATION_FAILED'` | Kredensial hasil restore gagal menginisialisasi koneksi. |
| `RECOVERY_BLOCKED_401` | `'RECOVERY_BLOCKED_401'` | Pemulihan dihentikan karena sesi menerima 401 logged out resmi dari WhatsApp. |
| `RECOVERY_BUSY` | `'RECOVERY_BUSY'` | Proses recovery dipicu saat ada recovery lain yang sedang berjalan. |
| `INVALID_PARAMETER` | `'INVALID_PARAMETER'` | Parameter opsi tidak valid pada konstruktor atau metode SessionRecovery. |

---

### `HEALTH_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `HEALTH_INVALID_THRESHOLD` | `'HEALTH_INVALID_THRESHOLD'` | Nilai ambang degraded tidak lebih kecil dari critical. |
| `HEALTH_INVALID_OPTION` | `'HEALTH_INVALID_OPTION'` | Nilai konfigurasi tidak bertipe angka atau opsi tidak valid. |
| `HEALTH_PROBE_ERROR` | `'HEALTH_PROBE_ERROR'` | Handler probe kesehatan kustom melempar unhandled exception. |

---

### `WATCHDOG_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `WATCHDOG_INVALID_OPTION` | `'WATCHDOG_INVALID_OPTION'` | Parameter opsi gagal validasi integer atau batas minimum. |
| `WATCHDOG_SOCKET_ERROR` | `'WATCHDOG_SOCKET_ERROR'` | Pengecekan ping socket gagal atau socket tidak responsif melampaui batas toleransi. |

---

### `MEMORY_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `MEMORY_INVALID_OPTION` | `'MEMORY_INVALID_OPTION'` | Opsi konfigurasi `MemoryGuard` tidak valid. |
| `MEMORY_INVALID_THRESHOLD` | `'MEMORY_INVALID_THRESHOLD'` | Ambang batas warning tidak lebih kecil dari critical. |
| `MEMORY_HOOK_ERROR` | `'MEMORY_HOOK_ERROR'` | Hook mitigasi memori terdaftar mengalami timeout atau melempar error. |

---

### `TRAFFIC_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `TRAFFIC_QUEUE_FULL` | `'TRAFFIC_QUEUE_FULL'` | Pesan ditolak karena antrean keluar telah mencapai `maxQueueSize`. |
| `TRAFFIC_TASK_CANCELLED` | `'TRAFFIC_TASK_CANCELLED'` | Task dalam antrean dibatalkan oleh ID task atau JID penerima. |
| `TRAFFIC_CONTROLLER_STOPPED` | `'TRAFFIC_CONTROLLER_STOPPED'` | Pengiriman dipanggil pada instance `TrafficController` yang sedang berhenti. |
| `TRAFFIC_INVALID_OPTION` | `'TRAFFIC_INVALID_OPTION'` | Opsi konfigurasi atau level prioritas pengiriman tidak valid. |

---

### `MEDIA_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `INVALID_SOURCE` | `'MEDIA_INVALID_SOURCE'` | Sumber bukan URL, Buffer, Stream, atau path berkas yang valid. |
| `SIZE_EXCEEDED` | `'MEDIA_SIZE_EXCEEDED'` | Ukuran payload media melebihi batas byte maksimum. |
| `UNSUPPORTED_TYPE` | `'MEDIA_UNSUPPORTED_TYPE'` | MIME type yang terdeteksi tidak didukung oleh WhatsApp. |
| `FETCH_FAILED` | `'MEDIA_FETCH_FAILED'` | Unduhan media jarak jauh gagal (status HTTP non-2xx). |
| `FETCH_TIMEOUT` | `'MEDIA_FETCH_TIMEOUT'` | Unduhan media jarak jauh melampaui batas waktu timeout. |
| `SSRF_BLOCKED` | `'MEDIA_SSRF_BLOCKED'` | IP tujuan tergolong jaringan privat, loopback, link-local, atau metadata cloud. |
| `REDIRECT_LIMIT` | `'MEDIA_REDIRECT_LIMIT'` | URL jarak jauh melampaui batas maksimum redirect HTTP. |
| `TRANSFORM_FAILED` | `'MEDIA_TRANSFORM_FAILED'` | Transformer media (misal konversi WebP stiker) gagal dieksekusi. |
| `QUEUE_FULL` | `'MEDIA_QUEUE_FULL'` | Antrean konkurensi persiapan media penuh. |
| `PIPELINE_ABORTED` | `'MEDIA_PIPELINE_ABORTED'` | Proses pipeline media dibatalkan sebelum selesai. |
| `REPRESENTATION_UNAVAILABLE` | `'MEDIA_REPRESENTATION_UNAVAILABLE'` | Representasi aktif tunggal (misal stream) sudah dikonsumsi atau ditutup. |
| `RESOURCE_RELEASED` | `'MEDIA_RESOURCE_RELEASED'` | Mencoba mengakses buffer media setelah `release()` dipanggil. |

---

### `RATE_LIMIT_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `INVALID_OPTION` | `'RATE_LIMIT_INVALID_OPTION'` | Opsi konfigurasi `IngressRateLimiter` tidak valid. |
| `INTERNAL_ERROR` | `'RATE_LIMIT_ERROR'` | Ekstraktor key menghasilkan string kosong atau melempar exception. |

---

### `DEDUP_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `INVALID_OPTION` | `'DEDUP_INVALID_OPTION'` | Opsi konfigurasi `IngressDeduplicator` tidak valid. |
| `INVALID_KEY` | `'DEDUP_INVALID_KEY'` | Key identitas deduplikasi kosong atau tidak valid. |
| `INTERNAL_ERROR` | `'DEDUP_ERROR'` | Kegagalan penyimpanan cache deduplikasi atau error lookup internal. |

---

### `TERMINAL_ERROR_CODES`

| Kunci Konstanta | Nilai String (`err.code`) | Kondisi Pemicu |
| :--- | :--- | :--- |
| `INVALID_OPTION` | `'TERMINAL_INVALID_OPTION'` | Opsi konfigurasi terminal tidak valid atau instance renderer salah. |
| `INVALID_EVENT` | `'TERMINAL_INVALID_EVENT'` | Input dispatch bukan objek event valid atau level keparahan salah. |
| `RENDERER_ERROR` | `'TERMINAL_RENDERER_ERROR'` | Metode renderer melempar unhandled formatting exception. |
| `INTERNAL_ERROR` | `'TERMINAL_ERROR'` | Kegagalan internal pada subsistem presentasi terminal. |

---

## 5. Pola Penanganan Error (Consumer Patterns)

Aplikasi dapat menggabungkan pemeriksaan tipe (`instanceof`), kode error (`err.code`), dan inspeksi metadata untuk menangani error secara aman.

### Pola 1: Pencocokan Berbasis Tipe (`instanceof`)

Sangat tepat saat Anda perlu menangani kategori error tertentu:

```javascript
import { 
  PromptTimeoutError, 
  PromptCancelledError, 
  PromptMaxRetriesError,
  LeavesError 
} from 'leaves-guardian';

try {
  const result = await prompt.run(userJid);
} catch (err) {
  if (err instanceof PromptTimeoutError) {
    await client.sendText(userJid, '⏱ Waktu pengisian formulir habis. Silakan ketik /start untuk mengulang.');
  } else if (err instanceof PromptCancelledError) {
    await client.sendText(userJid, '❌ Proses pendaftaran dibatalkan.');
  } else if (err instanceof PromptMaxRetriesError) {
    await client.sendText(userJid, '🚫 Anda telah mencapai batas maksimal kesalahan input. Hubungi admin.');
  } else if (err instanceof LeavesError) {
    console.error(`Leaves Error [${err.code}]:`, err.message);
  } else {
    console.error('Unexpected non-library error:', err);
  }
}
```

---

### Pola 2: Pencocokan Berbasis Kode (`err.code`)

Sangat tepat untuk penanganan kondisi spesifik subsistem:

```javascript
import { 
  MediaError, 
  MEDIA_ERROR_CODES 
} from 'leaves-guardian';

try {
  await client.media.prepareMedia(sourceUrl);
} catch (err) {
  if (err instanceof MediaError) {
    switch (err.code) {
      case MEDIA_ERROR_CODES.SSRF_BLOCKED:
        console.warn('Peringatan Keamanan: URL tujuan SSRF diblokir.');
        break;
      case MEDIA_ERROR_CODES.SIZE_EXCEEDED:
        console.warn('File ditolak: Ukuran media melebihi batas yang diizinkan.');
        break;
      case MEDIA_ERROR_CODES.FETCH_TIMEOUT:
        console.warn('Gangguan Jaringan: Unduhan media jarak jauh mengalami timeout.');
        break;
      default:
        console.error('Persiapan media gagal:', err.message);
    }
  }
}
```

---

### Pola 3: Inspeksi Metadata & Cause

Memeriksa field metadata kontekstual dan rantai error:

```javascript
try {
  await client.send(jid, messageBuilder);
} catch (err) {
  if (err instanceof TrafficError) {
    console.error('Pengiriman trafik gagal untuk task:', err.taskId);
    console.error('JID Tujuan:', err.jid);
    if (err.cause) {
      console.error('Penyebab error socket asli:', err.cause);
    }
  }
}
```

---

## 6. Batasan & Panduan Penanganan Error

- **Klasifikasi Diagnostik Terstruktur**: Leaves Guardian mengklasifikasikan error berdasarkan kelas dan kode untuk memberikan visibilitas operasional yang jelas.
- **Tanggung Jawab Aplikasi Konsumen**: Library tidak memaksakan proses mati atau melakukan retry otomatis secara sepihak, kecuali diatur eksplisit oleh opsi subsistem terkait (seperti pacing antrean `TrafficController` atau snapshot `SessionRecovery`).
- **Strategi Pemulihan**: Pengembang dapat menyusun strategi pemulihan mandiri—seperti meminta input ulang dari pengguna, memberi notifikasi ke admin, atau beralih ke transport alternatif—berdasarkan kelas error dan kode diagnostik yang terdokumentasi.
