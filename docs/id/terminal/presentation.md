# Arsitektur Presentasi Terminal

`leaves-guardian` memiliki **Subistem Presentasi Terminal** modular berkinerja tinggi yang dirancang untuk memberikan observabilitas konsol yang bersih, terstruktur, dan aman dari kebocoran data privasi. Berbeda dengan library logging tradisional yang mencampur aduk konkatenasi string mentah dengan penulisan langsung ke konsol, `leaves-guardian` secara ketat memisahkan antara pembuatan event semantik, sanitasi keamanan, perenderan teks visual, dan pengiriman ke stream output.

---

## 1. Ikhtisar & Model Arsitektur

Subistem Presentasi Terminal beroperasi menggunakan arsitektur berbasis pipeline yang sinkron (Contract Baseline v1.3):

```mermaid
flowchart TD
    A[Sumber Event / Aksi Developer] -->|client.terminal.info/warn/...| B[LeavesTerminal Facade]
    B -->|dispatch input event| TM[TerminalManager Engine]
    
    subgraph Pipeline [Pipeline Eksekusi TerminalManager]
        TM --> C{Filter Level
LEVEL_WEIGHTS}
        C -- Ditolak --> END1[Abaikan]
        C -- Diterima --> D{Guard Rekursi
maxDispatchDepth}
        D -- Melampaui Batas --> END2[Abaikan]
        D -- Aman --> E[PresentationSanitizer
Redaksi Rahasia & Masking]
        E --> F[Buat Snapshot
TerminalEvent Imutabel]
        F --> G[TerminalRenderer
Transformasi Teks Visual]
        G -- Render Berhasil --> H[OutputSink
Pengiriman stdout / stderr]
        G -- Render Gagal --> FB[Resilience Fallback
stderr [TERR_FALLBACK]]
    end
```

### Invarian Desain Inti

1. **Pemisahan Peran:** Data event semantik (`TerminalEvent`) terpisah sepenuhnya dari tata letak visual (`TerminalRenderer`) dan distribusi stream (`OutputSink`).
2. **Snapshot Imutabel:** Setiap event yang dikirimkan dikonversi menjadi objek nilai `TerminalEvent` yang dibekukan (`deep-frozen`) sebelum diteruskan ke renderer.
3. **Resiliensi Anti-Crash:** Kesalahan atau exception di dalam renderer kustom/default ditangkap secara aman. Subistem mencatat peringatan fallback ke `stderr` tanpa menghentikan bot.
4. **Kesadaran Kapabilitas Fisik Terminal:** Perenderan menyesuaikan diri secara otomatis dengan kemampuan fisik terminal (`supportsColor`, `isTTY`, `columns`) tanpa menebak-nebak label OS/environment.

---

## 2. Facade Publik LeavesTerminal (`client.terminal`)

Antarmuka konsumen utama untuk logging terminal terpasang langsung pada `client.terminal` (dan diekspor sebagai `LeavesTerminal`). Facade ini membungkus `TerminalManager` dengan method logging yang semantik dan ramah pengembang:

```js
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({ /* ... */ });

// Logging semantik standar
client.terminal.info('AUTH', 'Memverifikasi sesi WhatsApp...');
client.terminal.success('READY', 'Bot terhubung dan siap menerima pesan');
client.terminal.warn('RATE_LIMIT', 'Ambang batas pesan masuk tercapai untuk pengguna');
client.terminal.error('SOCKET', 'Socket terputus tiba-tiba', { reason: 'TIMEDOUT' });
client.terminal.debug('MEDIA', 'Memproses payload stream audio');

// Helper masking privasi
const maskedJid = client.terminal.mask('6281234567890@s.whatsapp.net');
// Output: '62812******90'
```

### Referensi Method Facade

| Method | Signature | Level Severity | Deskripsi |
| :--- | :--- | :--- | :--- |
| `terminal.info` | `(tag: string, message: string, data?: object)` | `INFO` | Mengirimkan event semantik informasional. |
| `terminal.success` | `(tag: string, message: string, data?: object)` | `INFO` | Mengirimkan event pencapaian positif yang dirender dengan centang hijau (`✓`). *(Lihat catatan di bawah)* |
| `terminal.warn` | `(tag: string, message: string, data?: object)` | `WARN` | Mengirimkan event peringatan yang dialirkan ke `stderr`. |
| `terminal.error` | `(tag: string, message: string, data?: object)` | `ERROR` | Mengirimkan event error dengan metadata kesalahan yang dialirkan ke `stderr`. |
| `terminal.debug` | `(tag: string, message: string, data?: object)` | `DEBUG` | Mengirimkan log diagnostik mendalam (disaring/diabaikan secara default kecuali `minLevel: 'DEBUG'`). |
| `terminal.mask` | `(jid: string, options?: object)` | N/A | Fungsi utilitas untuk menyamarkan nomor WhatsApp JID demi privasi konsol. |

> [!NOTE]
> **Event Semantik vs Tingkat Severity:**
> `terminal.success()` adalah method facade kenyamanan yang mengirimkan event level `INFO` dengan penanda presentasi sukses (`_legacySuccess: true`). `SUCCESS` bukan tingkat severity terpisah di dalam `TERMINAL_LEVEL`; pemfilteran level semata-mata dikendalikan oleh `DEBUG`, `INFO`, `WARN`, dan `ERROR`.

---

## 3. Spesifikasi Model TerminalEvent

`TerminalEvent` adalah objek nilai imutabel yang merepresentasikan sebuah event diagnostik atau lifecycle pada waktu tertentu.

```js
export class TerminalEvent {
  constructor({ id, timestamp, level, domain, type, message, data }) {
    this.id = String(id || '');
    this.timestamp = Number(timestamp) || Date.now();
    this.level = level || TERMINAL_LEVEL.INFO;
    this.domain = domain || TERMINAL_DOMAIN.APPLICATION;
    this.type = String(type || 'GENERAL');
    this.message = String(message || '');
    this.data = data && typeof data === 'object' ? data : undefined;

    Object.freeze(this);
  }
}
```

### Spesifikasi Properti

- **`id` (`string`):** Pengenal berurutan yang ditetapkan oleh engine (cth: `'evt_1'`, `'evt_2'`).
- **`timestamp` (`number`):** Timestamp milidetik epoch otoritatif dari clock yang terkonfigurasi.
- **`level` (`string`):** Tingkat keparahan: `'DEBUG'`, `'INFO'`, `'WARN'`, atau `'ERROR'`.
- **`domain` (`string`):** Domain arsitektural: `'CLIENT'`, `'MESSAGE'`, `'RELIABILITY'`, `'TRAFFIC'`, `'MEDIA'`, atau `'APPLICATION'`.
- **`type` (`string`):** Aksi semantik atau tag spesifik (cth: `'READY'`, `'DISCONNECT'`, `'MESSAGE'`, `'AUTH'`).
- **`message` (`string`):** Ringkasan teks semantik murni tanpa format. Pesan ini tidak pernah memuat kode warna ANSI atau dekorasi visual.
- **`data` (`object | undefined`):** Snapshot payload data yang sudah dibersihkan dan dibekukan. Seluruh kredensial sensitif disensor otomatis sebelum dilekatkan.

---

## 4. Engine TerminalManager & Pipeline Eksekusi

`TerminalManager` bertindak sebagai engine eksekusi dan koordinator sinkronisasi. Ketika `dispatch(eventInput)` dipanggil, tahapan berikut dieksekusi:

### 1. Filter Level & Bobot Severity
Engine memeriksa tingkat keparahan event terhadap `LEVEL_WEIGHTS`:

| Level | Bobot | Status Default | Stream Output |
| :--- | :--- | :--- | :--- |
| `DEBUG` | 10 | Disaring secara default (`minLevel: 'INFO'`) | `process.stdout` |
| `INFO` | 20 | Ditampilkan secara default | `process.stdout` |
| `WARN` | 30 | Ditampilkan secara default | `process.stderr` |
| `ERROR` | 40 | Ditampilkan secara default | `process.stderr` |

Jika `LEVEL_WEIGHTS[event.level] < LEVEL_WEIGHTS[options.minLevel]`, event langsung dibuang tanpa alokasi memori tambahan.

### 2. Guard Rekursi (`maxDispatchDepth`)
Untuk mencegah terjadinya loop logging tak terbatas (misalnya jika sink output atau listener memicu logging terminal baru saat dispatch berjalan), `TerminalManager` memantau kedalaman pemanggilan via `_dispatchDepth`. Jika melampaui `maxDispatchDepth` (default: `3`), event rekursif langsung diabaikan.

### 3. Sanitasi & Sensor Data Rahasia
Payload data diproses oleh `PresentationSanitizer` untuk menyensor kredensial autentikasi, token, kunci privat sesi, dan path absolut filesystem *(dibahas mendalam pada bagian Privacy Scrubber)*.

### 4. Perenderan Visual & Mekanisme Fallback
Event imutabel diserahkan ke `renderer.render(event)` (Model A: transformasi string sinkron murni).

Jika renderer kustom atau default mengalami error/exception yang tidak tertangani:
1. `TerminalManager` menangkap exception tersebut secara sinkron.
2. Status `rendererStatus` pada manager beralih menjadi `RENDERER_STATUS.DEGRADED`.
3. Pesan fallback terstruktur ditulis langsung ke `process.stderr`:
   ```text
   [TERR_FALLBACK] [ERROR] (APPLICATION:GENERAL) Formatter error: <renderErr.message> | <original event.message>
   ```
4. Aplikasi bot terus berjalan normal tanpa mengalami crash.

### 5. Distribusi ke Sink Output
Teks hasil render dikirimkan ke `sink.write(output, event.level)`. Secara default, `DefaultDualSink` merutekan `INFO` dan `DEBUG` ke `process.stdout` serta `WARN` dan `ERROR` ke `process.stderr` *(dibahas mendalam pada bagian Sink & Renderer Kustom)*.

---

## 5. Kapabilitas Fisik Terminal

`leaves-guardian` menyertakan pemeriksa kapabilitas fisik terminal yang independen dari lingkungan OS:

```js
import { getTerminalCapabilities } from 'leaves-guardian';

const caps = getTerminalCapabilities(process.stdout);
```

### Kontrak Objek Kapabilitas

```js
Object.freeze({
  isTTY: Boolean(stream?.isTTY),
  supportsColor: Boolean(!noColor && (forceColor || isTTY || colorDepth > 1)),
  supportsCursorMovement: Boolean(isTTY && stream === process.stdout),
  columns: stream.columns || 80,
  rows: stream.rows || 24
});
```

- **Kepatuhan Warna:** Menghormati variabel lingkungan standar `NO_COLOR` dan `FORCE_COLOR`. Ketika `NO_COLOR=1` terdeteksi atau warna tidak didukung, `DefaultTextRenderer` secara otomatis menanggalkan styling ANSI dan menghasilkan tag teks ASCII polos (cth: `[OK]`, `[WARN]`, `[ERROR]`).
- **Dimensi:** Mendeteksi lebar kolom dan baris terminal secara dinamis, dengan fallback aman ke `80x24` pada lingkungan CI/kontainer non-interaktif.

---

## 6. Opsi Konfigurasi & Nilai Default

`TerminalManager` dapat dikonfigurasi saat inisialisasi client atau diubah secara dinamis saat runtime:

```js
const client = new LeavesClient({
  terminal: {
    enabled: true,
    minLevel: 'INFO',          // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    privacyMasking: true,       // Mengaktifkan penyamaran JID & normalisasi path
    maxDispatchDepth: 3,        // Perlindungan terhadap loop logging rekursif
    renderer: customRenderer,   // TerminalRenderer kustom opsional
    sink: customSink            // OutputSink kustom opsional
  }
});

// Rekonfigurasi dinamis saat runtime
client.terminalManager.configure({
  minLevel: 'DEBUG'
});
```

| Opsi | Tipe | Nilai Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Sakelar utama untuk output presentasi terminal. |
| `minLevel` | `string` | `'INFO'` | Ambang batas keparahan minimum untuk dispatch event (`'DEBUG'`, `'INFO'`, `'WARN'`, `'ERROR'`). |
| `privacyMasking` | `boolean` | `true` | Mengaktifkan penyamaran nomor JID dan normalisasi path file lokal absolut. |
| `maxDispatchDepth` | `number` | `3` | Batas maksimum kedalaman pemanggilan dispatch bersarang/rekursif. |
| `renderer` | `object` | `new DefaultTextRenderer()` | Engine render visual aktif yang mengimplementasikan `render(event)`. |
| `sink` | `object` | `new DefaultDualSink()` | Tujuan stream output aktif yang mengimplementasikan `write(text, level)`. |
| `clock` | `function` | `() => Date.now()` | Fungsi penyedia timestamp. |
