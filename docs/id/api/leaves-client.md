---
title: Referensi API LeavesClient
description: Referensi API lengkap untuk class LeavesClient, state machine siklus hidup, skema konfigurasi, subsistem publik, dan katalog event.
---

# Referensi API LeavesClient

`LeavesClient` adalah titik masuk utama dan orkestrator library Leaves Guardian. Class ini mengintegrasikan manajemen socket Baileys dengan subsistem keandalan tingkat enterprise—termasuk pemulihan integritas sesi, pengawas socket (*watchdog*), penjaga memori (*memory guard*), antrean trafik berprioritas (*traffic controller*), penyiapan media, dan utilitas interaksi pengembang.

```javascript
import { LeavesClient, CLIENT_STATES } from 'leaves-guardian';

const client = new LeavesClient(options);
```

---

## Konstruktor & Skema Konfigurasi

`new LeavesClient(options)` menginisialisasi instance klien dengan opsi subsistem yang dikonfigurasi.

### Konfigurasi Konsumen Standar

```javascript
const client = new LeavesClient({
  // Autentikasi & Sesi
  auth: {
    directory: './session',           // Lokasi penyimpanan kredensial autentikasi
    method: 'pairing',                // 'pairing' | 'qr'
    phoneNumber: '628123456789'       // Wajib jika method adalah 'pairing'
  },

  // Pengaturan Rekoneksi Otomatis (ReconnectManager)
  reconnect: {
    enabled: true,
    maxAttempts: Infinity,
    initialDelay: 1000,               // Jeda awal rekoneksi (1s)
    maxDelay: 30000,                  // Batas maksimal jeda rekoneksi (30s)
    jitter: 1000                      // Variasi acak jeda (ms)
  },

  // Presentasi Terminal & Logging (Layer 5.5)
  terminal: {
    enabled: true,
    minLevel: 'INFO',                 // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    privacyMasking: true              // Sensor nomor telepon dan token pada log
  },

  // Penyimpanan Ringan State & KV (SmartStore)
  store: {
    filePath: './data/smart-store.json',
    autoPersist: true,
    sweepIntervalMs: 60000,
    autoSweep: true
  },

  // Pemulihan Integritas Sesi & Disk (SessionRecovery)
  recovery: {
    sessionDirectory: './session',
    backupDirectory: './session/.backup',
    quarantineDirectory: './session/.quarantine',
    maxSnapshots: 3,
    maxQuarantineEntries: 10,
    autoSnapshotOnConnect: true,
    autoRestoreOnCorruption: true,
    purgeBackupsOn401: true
  },

  // Observabilitas & Pemantauan Kesehatan Runtime (HealthMonitor)
  health: {
    enabled: true,
    probeIntervalMs: 30000,
    probeTimeoutMs: 3000,
    historyLength: 60,
    thresholds: {
      eventLoopLagDegradedMs: 250,
      eventLoopLagCriticalMs: 1000,
      memoryHeapPercentDegraded: 80,
      memoryHeapPercentCritical: 95,
      disconnectedDurationDegradedMs: 15000,
      disconnectedDurationCriticalMs: 60000
    }
  },

  // Pengawas Keaktifan Socket (Watchdog)
  watchdog: {
    enabled: true,
    checkIntervalMs: 15000,
    maxSilenceMs: 60000,
    pingTimeoutMs: 10000,
    maxMissedPings: 2
  },

  // Pemantau Tekanan Memori Proses Host (MemoryGuard)
  memoryGuard: {
    enabled: true,
    checkIntervalMs: 30000,
    heapWarningBytes: 150 * 1024 * 1024,
    heapCriticalBytes: 300 * 1024 * 1024,
    rssWarningBytes: 250 * 1024 * 1024,
    rssCriticalBytes: 500 * 1024 * 1024,
    growthRateWarningPercent: 20,
    minimumGrowthBytes: 20 * 1024 * 1024,
    sampleWindowSize: 5,
    autoMitigateOnCritical: true
  },

  // Pengatur Antrean & Pacing Pesan Keluar (TrafficController)
  traffic: {
    maxQueueSize: 1000,
    maxConcurrentDispatches: 1,
    minDispatchIntervalMs: 250,
    highWatermarkRatio: 0.8,
    lowWatermarkRatio: 0.2,
    maxConsecutiveHigh: 5,
    historyLimit: 100
  },

  // Penyiapan Media & Proteksi SSRF (MediaPipeline)
  media: {
    maxInputBytes: 100 * 1024 * 1024,
    maxOutputBytes: 100 * 1024 * 1024,
    bufferThresholdBytes: 10 * 1024 * 1024,
    fetchTimeoutMs: 30000,
    maxRedirects: 5,
    maxConcurrentJobs: 3,
    maxWaitingJobs: 50,
    allowPrivateIp: false
  },

  // Pembatas Laju Pesan Masuk (IngressRateLimiter)
  rateLimiter: {
    windowMs: 60000,
    maxRequests: 60,
    penaltyDurationMs: 0,
    maxTrackedKeys: 10000,
    cleanupIntervalMs: 60000
  },

  // Deduplikasi Pesan Masuk (IngressDeduplicator)
  deduplicator: {
    ttlMs: 300000,
    maxTrackedMessages: 10000,
    cleanupIntervalMs: 60000
  },

  // Flag Perilaku Umum
  browser: ['Leaves Guardian', 'Chrome', '1.0.0'],
  markOnlineOnConnect: true,
  handleShutdown: true,               // Menangani sinyal SIGINT / SIGTERM otomatis
  logIncomingMessages: true,          // Format dan cetak pesan masuk ke terminal
  printQR: true                       // Tampilkan QR code di terminal saat mode QR
});
```

### Opsi Tingkat Lanjut / Injeksi Pengujian

| Opsi | Tipe | Nilai Bawaan | Deskripsi |
| :--- | :--- | :--- | :--- |
| `socketFactory` | `function` | `makeWASocket` | Fungsi kustom pembuat socket Baileys. Disediakan untuk pengujian dan mocking. |

---

## State Machine Siklus Hidup (`CLIENT_STATES`)

`LeavesClient` bergerak secara deterministik melalui status berikut:

```
[IDLE] ──► [INITIALIZING] ──► [AUTHENTICATING] ──► [CONNECTING] ──► [OPEN] ──► [READY]
                                                                        ▲          │
                                                                        │          ▼
                                                                  [RECONNECTING] ◄─ [DISCONNECTED]
                                                                        │
                                                                        ├──► [LOGGED_OUT]
                                                                        └──► [SHUTDOWN]
```

- **`IDLE`**: Instance dibuat tetapi belum terhubung.
- **`INITIALIZING`**: Menjalankan inspeksi integritas sesi dan pemulihan otomatis pra-koneksi.
- **`AUTHENTICATING`**: Memuat kredensial dan meminta pairing code atau QR.
- **`CONNECTING`**: Membuka jabat tangan WebSocket ke WhatsApp.
- **`OPEN`**: Koneksi WebSocket terbuka.
- **`READY`**: Klien menyelesaikan inisialisasi internal dan memverifikasi identitas akun terautentikasi.
- **`DISCONNECTED`**: Socket terputus oleh jaringan atau server.
- **`RECONNECTING`**: ReconnectManager menjadwalkan upaya rekoneksi otomatis.
- **`LOGGED_OUT`**: Sesi di-unlink atau menerima error 401 terminal.
- **`SHUTDOWN`**: Penutupan aman selesai dieksekusi via `client.disconnect()`.

> [!IMPORTANT]
> **`OPEN !== READY`**: `OPEN` menandakan socket terbuka secara fisik. `READY` menandakan verifikasi kesiapan internal telah mengonfirmasi identitas akun pengguna terautentikasi.
> Konsumen harus memperlakukan `client.state` sebagai nilai *read-only*; transisi siklus hidup dikelola secara internal oleh `LeavesClient`.

---

## Klasifikasi API Tiga Tingkat

### Tingkat 1 — API Publik Inti

#### `connect()`
- **Signature:** `async connect(): Promise<LeavesClient>`
- **Deskripsi:** Memulai inisialisasi klien, menjalankan pemeriksaan integritas sesi, dan membuka koneksi socket.

#### `disconnect()`
- **Signature:** `async disconnect(): Promise<void>`
- **Deskripsi:** Menjalankan penutupan aman permanen (*graceful shutdown*). Menghentikan seluruh paginator, prompt, collector, timer auto-delete; mem-flush SmartStore; menghentikan watchdog dan memory guard; membersihkan antrean trafik; menutup socket; dan bertransisi ke status `SHUTDOWN`.
- **Urutan Pembersihan Subsistem:**
  1. Menghentikan seluruh paginator aktif (`paginator.stop('clientShutdown')`).
  2. Membatalkan seluruh prompt aktif (`prompt.cancel('clientShutdown')`).
  3. Menghentikan seluruh collector aktif (`collector.stop('SHUTDOWN')`).
  4. Menghentikan scheduler tugas auto-delete (`autoDelete.stop()`).
  5. Mem-flush dan menghentikan persistensi SmartStore (`await store.stop()`).
  6. Menutup antrean session recovery (`await recovery.stop()`).
  7. Menghentikan evaluasi berkala health monitor (`health.stop()`).
  8. Menghentikan pengawasan watchdog (`watchdog.stop()`).
  9. Menghentikan sampling memory guard (`memoryGuard.stop()`).
  10. Membersihkan dan menghentikan antrean trafik (`trafficController.stop()`).
  11. Menghancurkan alokasi media pipeline (`await mediaPipeline.destroy()`).
  12. Menghapus memori rate limiter (`rateLimiter.destroy()`).
  13. Menghapus memori deduplicator (`deduplicator.destroy()`).
  14. Melepas adapter presentasi (`presentationAdapter.detach()`).
  15. Menutup terminal manager (`terminalManager.destroy()`).
  16. Menutup socket Baileys (`await connectionManager.close()`).
  17. Memancarkan event terminal `'shutdown'`.

#### `sendMessage(jid, contentOrBuilder, options)` / `send(...)`
- **Signature:** `async sendMessage(jid: string, content: object | BaseBuilder, options?: object): Promise<any>`
- **Deskripsi:** Mendaftarkan pesan keluar melalui `TrafficController` untuk pengiriman berprioritas dan terpacing. `client.send()` adalah alias identik.

#### `sendText(jid, text, options)`
- **Signature:** `async sendText(jid: string, text: string, options?: object): Promise<any>`
- **Deskripsi:** Fungsi pembantu ringkas untuk mengirim pesan teks biasa.

#### `deleteMessage(key)`
- **Signature:** `async deleteMessage(key: object): Promise<any>`
- **Deskripsi:** Menghapus pesan untuk semua orang menggunakan WAMessageKey. Memerlukan klien dalam status `READY`.

#### `sendAndAutoDelete(jid, contentOrBuilder, delayMs, options)`
- **Signature:** `async sendAndAutoDelete(jid: string, content: object | BaseBuilder, delayMs: number, options?: object): Promise<{ message: any, task: AutoDeleteTask }>`
- **Deskripsi:** Memvalidasi jeda waktu dan opsi, mengirimkan pesan, kemudian menjadwalkan tugas hapus otomatis. Jika penjadwalan gagal setelah pesan terkirim, `AutoDeleteError` dilempar dan pesan yang sudah terkirim tidak di-rollback.

#### `getState()`
- **Signature:** `getState(): string`
- **Deskripsi:** Mengembalikan string status siklus hidup saat ini (`CLIENT_STATES`).

#### `isReady()`
- **Signature:** `isReady(): boolean`
- **Deskripsi:** Mengembalikan `true` jika klien sedang dalam status `READY`.

#### `getUser()`
- **Signature:** `getUser(): { id: string, name?: string } | null`
- **Deskripsi:** Mengembalikan data akun pengguna terautentikasi jika terhubung.

#### `requestPairingCode(phoneNumber)`
- **Signature:** `async requestPairingCode(phoneNumber: string): Promise<string>`
- **Deskripsi:** Meminta kode pairing 8 karakter untuk nomor telepon tertentu.

---

### Factory Utilitas & Alur Interaksi

- **`createMessageCollector(options)`**: Mengembalikan instance `MessageCollector` baru yang terlacak pada klien.
- **`awaitMessage(options)`**: Mengembalikan Promise yang selesai saat pesan pertama yang cocok diterima.
- **`awaitMessages(options)`**: Mengembalikan Promise array pesan yang terkumpul hingga batas waktu atau limit tercapai.
- **`createPrompt(options)`**: Mengembalikan instance dialog multi-tahap `Prompt` baru.
- **`createPaginator(options)`**: Mengembalikan instance menu navigasi interaktif `Paginator` baru.
- **`createEphemeralMessage(content, options)`**: Mengembalikan kontainer `EphemeralMessage`.
- **`createAutoDeleteManager(options)`**: Membuat instance mandiri `AutoDeleteManager`.
- **`registerMemoryMitigationHook(name, fn, options)`**: Mendaftarkan fungsi pembersihan memori pada `client.memoryGuard`.

---

### Tingkat 2 — Pengakses Subsistem Publik

Properti berikut menyediakan akses langsung ke subsistem Leaves Guardian:

| Properti | Class Subsistem | Deskripsi |
| :--- | :--- | :--- |
| `client.store` | `SmartStore` | Penyimpanan key-value dengan namespace dan TTL. |
| `client.recovery` | `SessionRecovery` | Pencadangan berkas sesi, snapshot, dan karantina disk. |
| `client.health` | `HealthMonitor` | Pemantauan kesehatan, profiling lag, dan custom probe. |
| `client.watchdog` | `Watchdog` | Pemantau keaktifan socket dan deteksi zombie socket. |
| `client.memoryGuard` | `MemoryGuard` | Pengawasan memori proses host dan eksekusi mitigasi. |
| `client.traffic` | `TrafficController` | Penjadwalan antrean prioritas, starvation prevention, dan pacing. |
| `client.media` | `MediaPipeline` | Penyiapan media stream, MIME sniffer, dan proteksi SSRF. |
| `client.rateLimiter` | `IngressRateLimiter` | Pembatasan laju masuk berbasis sliding window. |
| `client.deduplicator` | `IngressDeduplicator` | Deduplikasi pesan masuk atomic test-and-set. |
| `client.autoDelete` | `AutoDeleteManager` | Manajer tugas penghapusan pesan terjadwal. |
| `client.terminal` | `LeavesTerminal` | Fasade pencatatan terminal dengan masking privasi. |

---

### Tingkat 3 — Akses Tingkat Lanjut / Escape Hatch

#### `getRawSocket()`
- **Signature:** `getRawSocket(): any`
- **Deskripsi:** Mengembalikan objek socket Baileys mentah (`sock`).
- **Peringatan Keamanan:**
  > [!WARNING]
  > Akses socket mentah membypass abstraksi pesan tingkat tinggi Leaves Guardian dan dapat melewati fitur seperti antrean trafik serta perlindungan keandalan wrapper lainnya.

---

## Katalog Event Publik

`LeavesClient` mewarisi `EventEmitter` dan memancarkan event resmi berikut:

| Nama Event | Payload Tepat | Deskripsi / Kondisi Pemicu |
| :--- | :--- | :--- |
| `state_change` | `{ from: string, to: string, ...meta }` | Dipancarkan setiap kali klien berpindah antar `CLIENT_STATES`. |
| `connecting` | `void` | Dipancarkan saat jabat tangan socket ke WhatsApp dimulai. |
| `qr` | `qrString: string` | Dipancarkan saat string QR code baru diterima dari Baileys. |
| `pairing_required` | `{ phoneNumber: string }` | Dipancarkan saat klien siap meminta pairing code. |
| `pairing_code` | `{ code: string, phoneNumber: string }` | Dipancarkan saat pairing code 8 karakter berhasil di-generate. |
| `connection_open` | `void` | Dipancarkan saat koneksi WebSocket fisik terbuka (`OPEN` state). |
| `ready` | `{ user: object }` | Dipancarkan saat inisialisasi kesiapan selesai (`READY` state). |
| `connection_close` | `{ statusCode?: number, reason?: string, error?: Error }` | Dipancarkan saat koneksi socket terputus. |
| `reconnecting` | `{ reason: string }` | Dipancarkan saat ReconnectManager menjadwalkan rekoneksi otomatis. |
| `logged_out` | `err: Error` | Dipancarkan saat akun di-unlink atau menerima error terminal 401. |
| `message` | `normalizedMessage: Message` | Dipancarkan saat pesan masuk ternormalisasi diterima. |
| `error` | `err: Error` | Dipancarkan saat terjadi error runtime atau socket tak tertangani. |
| `session_corrupted` | `inspection: object` | Dipancarkan saat berkas sesi korup terdeteksi saat preflight. |
| `recovery_failed` | `{ error: Error }` | Dipancarkan saat pemulihan sesi otomatis gagal dieksekusi. |
| `shutdown` | `void` | Dipancarkan setelah `disconnect()` selesai membersihkan seluruh subsistem. |
