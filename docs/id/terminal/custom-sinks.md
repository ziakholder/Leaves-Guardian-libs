# Custom Sinks & Renderers

Leaves Guardian memiliki **Subistem Presentasi Terminal** terpisah yang membedakan **pemformatan visual event (rendering)** dari **pengiriman output fisik (sink transport)**. Dengan mengimplementasikan custom renderer atau custom sink, Anda dapat memformat log sesuai kebutuhan visual maupun mengalirkan data log ke berkas lokal, harness pengujian, atau log collector eksternal.

---

## 1. Arsitektur Ekstensi & Pipeline

Pipeline presentasi terminal memproses setiap event melalui lapisan arsitektur berikut:

```
Semantic Event Input
        │
        ▼
PresentationSanitizer (Privasi & Masking)
        │
        ▼
TerminalEvent (Model Immutable)
        │
        ▼
TerminalRenderer (render() ──► string | null)
        │
        ▼
OutputSink (write(text, level) ──► Output Fisik)
```

### Pemisahan Tanggung Jawab

| Komponen | Tanggung Jawab | Input | Output |
| :--- | :--- | :--- | :--- |
| **`TerminalRenderer`** | **Transformasi Presentasi** — Mengubah event semantik terstruktur menjadi string teks visual, teks berwarna, atau format baris data terstruktur. | `TerminalEvent` (Immutable) | `string` (untuk dicetak) atau `null` (untuk disupresi) |
| **`OutputSink`** | **Transport Fisik** — Menerima string hasil render dan mengirimkannya ke stream fisik, deskriptor file, atau buffer memori. | `text: string`, `level: string` | Emisi stream / penyimpanan |

> [!NOTE]
> Sink hanya menerima `string` yang sudah selesai dirender dan `level` keparahan. Sink tidak pernah berinteraksi langsung dengan instance `TerminalEvent` mentah atau state internal client.

---

## 2. Output Sinks (Lapisan Transport Fisik)

**Output Sink** adalah tujuan akhir dari string output terminal. Setiap objek yang mengimplementasikan metode `write()` memenuhi kontrak antarmuka sink.

### Kontrak Antarmuka Output Sink

```typescript
interface OutputSink {
  /**
   * Menulis teks yang sudah dirender ke media transport tujuan.
   * @param text String teks hasil render (dengan atau tanpa trailing newline).
   * @param level String tingkat keparahan ('DEBUG' | 'INFO' | 'WARN' | 'ERROR').
   */
  write(text: string, level: string): void;

  /**
   * Hook pembersihan siklus hidup opsional saat terminal manager dihancurkan.
   */
  destroy?(): void;
}
```

---

### Built-in Sink: `DefaultDualSink`

`DefaultDualSink` adalah transport default bawaan Leaves Guardian. Sink ini melakukan **perutean stream berbasis level (level-based stream routing)** ke stream standar proses Node.js:

- **`WARN` & `ERROR`** $\rightarrow$ diarahkan ke `process.stderr`
- **`DEBUG` & `INFO`** $\rightarrow$ diarahkan ke `process.stdout`
- **Normalisasi Baris Baru**: Secara otomatis menambahkan karakter newline `\n` jika string teks belum memilikinya.

```javascript
import { DefaultDualSink } from 'leaves-guardian';

// Perutean default stdout/stderr
const dualSink = new DefaultDualSink();

// Injeksi stream kustom (misal stream writable tiruan)
const customDualSink = new DefaultDualSink(myStdoutStream, myStderrStream);
```

---

### Built-in Sink: `MemorySink` (Pengujian & Inspeksi Headless)

`MemorySink` menyimpan baris output hasil render di dalam memori. Sink ini dirancang khusus untuk **unit test, suite asersi CI, dan debugging headless** agar tidak mengotori stream terminal proses pengujian.

```javascript
import { MemorySink } from 'leaves-guardian';

const memorySink = new MemorySink();

// TerminalManager menulis output ke memorySink
memorySink.write('ℹ [INFO] Client ready', 'INFO');

// Ambil seluruh baris teks polos
console.log(memorySink.getLines());
// Output: ['ℹ [INFO] Client ready']

// Ambil rekaman entri terstruktur
console.log(memorySink.getEntries());
// Output:
// [
//   {
//     text: 'ℹ [INFO] Client ready',
//     output: 'ℹ [INFO] Client ready',
//     level: 'INFO',
//     timestamp: 1773400000000
//   }
// ]

// Bersihkan entri tersimpan
memorySink.clear();

// Hancurkan sink
memorySink.destroy();
```

#### Skema Entri Terverifikasi pada `MemorySink`

Setiap objek yang dikembalikan oleh `getEntries()` memiliki struktur:

| Properti | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `text` | `string` | Teks terformat yang ditulis ke dalam sink. |
| `output` | `string` | Salinan identik dari `text` untuk kompatibilitas ke belakang. |
| `level` | `string` | String level keparahan (`DEBUG`, `INFO`, `WARN`, `ERROR`). |
| `timestamp` | `number` | Epoch timestamp (dalam ms) saat entri dicatat. |

---

## 3. Contoh Custom Sink (Pola Integrasi)

Contoh berikut mengilustrasikan bagaimana pengembang dapat mengimplementasikan `OutputSink` untuk kebutuhan infrastruktur kustom. Pola ini merupakan integrasi tingkat konsumen, bukan dependensi resmi bawaan package.

### Contoh 1: File Sink Lokal

Custom sink yang mengalirkan log terformat ke berkas disk lokal menggunakan `fs.createWriteStream` Node.js:

```javascript
import fs from 'node:fs';

export class FileSink {
  constructor(filePath) {
    this.name = 'FileSink';
    this.stream = fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' });
  }

  write(text, level) {
    if (!this.stream.writable) return;
    const line = text.endsWith('\n') ? text : `${text}\n`;
    this.stream.write(line);
  }

  destroy() {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
}
```

---

### Contoh 2: Multi-Destination / Fan-Out Sink

Custom sink yang mendistribusikan baris teks ke terminal standar sekaligus meneruskannya ke transport logging sekunder:

```javascript
import { DefaultDualSink } from 'leaves-guardian';

export class FanOutSink {
  constructor(secondarySink) {
    this.name = 'FanOutSink';
    this.terminalSink = new DefaultDualSink();
    this.secondarySink = secondarySink;
  }

  write(text, level) {
    // 1. Tulis ke terminal standar (stdout/stderr)
    this.terminalSink.write(text, level);

    // 2. Teruskan ke transport sekunder
    if (this.secondarySink && typeof this.secondarySink.write === 'function') {
      try {
        this.secondarySink.write(text, level);
      } catch (_) {
        // Cegah error transport sekunder menghentikan terminal
      }
    }
  }

  destroy() {
    this.terminalSink.destroy();
    if (this.secondarySink && typeof this.secondarySink.destroy === 'function') {
      this.secondarySink.destroy();
    }
  }
}
```

---

## 4. Visual Renderers (Lapisan Presentasi)

**Visual Renderer** bertugas mentransformasikan instance immutable `TerminalEvent` menjadi string visual terformat (atau mengembalikan `null` untuk menyupresi output).

### Kontrak Sinkron Model A

Leaves Guardian menerapkan kontrak **Transformasi String Sinkron Model A**:

```typescript
interface TerminalRenderer {
  /**
   * Mentransformasikan semantic event secara sinkron menjadi output string.
   * Kembalikan null atau string kosong untuk menyupresi rendering.
   */
  render(event: TerminalEvent): string | null;

  /**
   * Hook inisialisasi opsional untuk menerima informasi kapabilitas dan opsi aman.
   */
  init?(context: Readonly<RendererContext>): void;

  /**
   * Hook pembersihan opsional saat renderer diganti atau dihancurkan.
   */
  destroy?(): void;
}
```

> [!IMPORTANT]
> Metode `render()` wajib dieksekusi secara sinkron. Renderer bertugas mentransformasikan data menjadi string dan tidak boleh menulis langsung ke stream output atau memanipulasi state internal bot.

---

### Konteks Aman Renderer (`RendererContext`)

Saat renderer diinisialisasi melalui `init(context)`, `TerminalManager` memberikan objek konteks terisolasi yang di-`Object.freeze`:

```javascript
{
  capabilities: {
    isTTY: boolean,
    supportsColor: boolean,
    supportsCursorMovement: boolean,
    columns: number,
    rows: number
  },
  options: {
    enabled: boolean,
    minLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    privacyMasking: boolean
  }
}
```

#### Keamanan & Batasan Sandbox

Konteks ini menyediakan **informasi kapabilitas hanya-baca**. Referensi sistem internal, sink fisik, fungsi jam (`clock`), dan instance client sengaja dihilangkan untuk menjaga isolasi lapisan presentasi.

---

## 5. DefaultTextRenderer & Hook Tema

`DefaultTextRenderer` adalah renderer visual teks standar bawaan Leaves Guardian.

### Aturan Pemformatan Default

- **Timestamp**: Diformat sebagai `[HH:MM:SS]` (diberi warna abu-abu Chalk jika terminal mendukung warna).
- **Tag Domain/Tipe**: Label berukuran 8 karakter (misal `CLIENT  `, `MESSAGE `).
- **Badge Keparahan**:
  - `DEBUG` $\rightarrow$ `🔍 [DEBUG]` (Magenta)
  - `WARN` $\rightarrow$ `⚠ [WARN]` (Kuning)
  - `ERROR` $\rightarrow$ `✖ [ERROR]` (Merah)
  - `INFO` $\rightarrow$ `ℹ [INFO]` (Cyan)
  - `INFO` (dengan `_legacySuccess: true`) $\rightarrow$ `✓ [OK]` (Hijau)
  - `INFO` (dengan `type: 'MESSAGE'`) $\rightarrow$ `💬 [MSG] [Group: <chatId>] <sender>: <text>` (Biru)

---

### Hook Ekstensi Tema Kustom

`DefaultTextRenderer` menerima opsi konfigurasi `theme` di dalam constructor untuk kustomisasi pemformatan:

```javascript
import { DefaultTextRenderer } from 'leaves-guardian';

const customRenderer = new DefaultTextRenderer({
  theme: {
    // Hook pemformat timestamp kustom
    formatTimestamp(timestamp) {
      const d = new Date(timestamp);
      return `[${d.toISOString()}]`;
    },

    // Hook pemformat baris event kustom
    formatEvent(event, { timestamp, color }) {
      if (event.level === 'ERROR') {
        return `${timestamp} [CRITICAL ERROR] (${event.domain}) ${event.message}`;
      }
      return `${timestamp} [${event.level}] ${event.message}`;
    }
  }
});
```

---

## 6. Contoh Custom Renderer

Konsumen dapat membuat renderer kustom untuk format log khusus lingkungan server atau hosting.

### Contoh 1: Line-Delimited JSON (NDJSON) Renderer

Untuk lingkungan kontainer yang mengonsumsi log terstruktur per baris JSON, renderer dapat mengekstrak field resmi dari `TerminalEvent`:

```javascript
export class JsonLineRenderer {
  constructor() {
    this.name = 'JsonLineRenderer';
  }

  init(context) {
    this.context = context;
  }

  render(event) {
    if (!event) return null;

    const payload = {
      id: event.id,
      timestamp: event.timestamp,
      iso: new Date(event.timestamp).toISOString(),
      level: event.level,
      domain: event.domain,
      type: event.type,
      message: event.message,
      data: event.data
    };

    return JSON.stringify(payload);
  }

  destroy() {
    this.context = null;
  }
}
```

---

### Contoh 2: Renderer Minimalis / Headless

Renderer ringkas tanpa warna ANSI untuk lingkungan CI/CD atau server daemon yang tenang:

```javascript
export class MinimalRenderer {
  constructor() {
    this.name = 'MinimalRenderer';
  }

  render(event) {
    if (!event) return null;
    const time = new Date(event.timestamp).toLocaleTimeString();
    return `${time} |${event.level.padEnd(5)}| ${event.message}`;
  }
}
```

---

## 7. Inisialisasi & Penggantian Renderer Runtime

### Konfigurasi Melalui Constructor

Anda dapat menyuntikkan custom renderer dan custom sink saat membuat instance `LeavesTerminal` atau `TerminalManager`:

```javascript
import { LeavesTerminal, MemorySink } from 'leaves-guardian';
import { JsonLineRenderer } from './JsonLineRenderer.js';

const terminal = new LeavesTerminal({
  renderer: new JsonLineRenderer(),
  sink: new MemorySink(),
  logLevel: 'debug',
  privacy: true
});
```

---

### Penggantian Renderer di Runtime (`setRenderer`)

Anda dapat mengganti visual renderer secara dinamis saat bot sedang berjalan:

```javascript
import { TerminalManager, DefaultTextRenderer } from 'leaves-guardian';
import { JsonLineRenderer } from './JsonLineRenderer.js';

const manager = new TerminalManager();

// Ganti ke rendering JSON terstruktur
manager.setRenderer(new JsonLineRenderer());

// Kembalikan ke text renderer default
manager.setRenderer(new DefaultTextRenderer());
```

#### Proses yang Terjadi Saat `setRenderer(newRenderer)`:

1. **Validasi**: Memastikan `typeof newRenderer.render === 'function'`. Jika tidak valid, melempar `TerminalError` dengan kode `TERMINAL_INVALID_OPTION`.
2. **Pembersihan**: Memanggil metode `destroy()` pada renderer sebelumnya (jika tersedia).
3. **Pemulihan Status**: Mereset `rendererStatus` kembali ke `RENDERER_STATUS.HEALTHY`.
4. **Inisialisasi Konteks**: Memanggil metode `init(context)` pada renderer baru dengan `RendererContext` yang aman.

---

## 8. Penanganan Kegagalan & Status Degradasi

Subistem presentasi terminal Leaves Guardian bersifat **tahan kegagalan (fault-resilient)**. Jika custom renderer melempar exception saat mengeksekusi `render()`, engine presentasi melindungi aplikasi bot agar tidak mengalami crash:

```
Custom Renderer melempar Exception
               │
               ▼
TerminalManager menangkap error
               │
               ├─► Mengubah rendererStatus = RENDERER_STATUS.DEGRADED
               │
               └─► Menulis baris darurat [TERR_FALLBACK] langsung ke process.stderr
```

### Format Baris Fallback Darurat

Saat terdegradasi, manager menulis langsung ke `process.stderr` menggunakan format terverifikasi:

```text
[TERR_FALLBACK] [ERROR] (CLIENT:GENERAL) Formatter error: Unexpected token | Pesan asli event
```

- Error pada custom renderer diisolasi sepenuhnya.
- Aplikasi bot tetap berjalan normal tanpa gangguan.
- Begitu renderer yang sehat dipasang kembali via `setRenderer()`, status otomatis kembali ke `HEALTHY`.

---

## 9. Ringkasan Referensi API

### `DefaultDualSink`

| Anggota | Signature | Deskripsi |
| :--- | :--- | :--- |
| `constructor` | `(stdout = process.stdout, stderr = process.stderr)` | Menginisialisasi dual sink dengan stream standar atau stream writable yang disuntikkan. |
| `write` | `(text: string, level: string): void` | Menulis baris teks secara sinkron ke stderr (`WARN`/`ERROR`) dan stdout (`INFO`/`DEBUG`). |
| `destroy` | `(): void` | Membersihkan referensi stream internal. |

### `MemorySink`

| Anggota | Signature | Deskripsi |
| :--- | :--- | :--- |
| `constructor` | `()` | Menginisialisasi array penampung rekaman log dalam memori. |
| `write` | `(text: string, level: string): void` | Menambahkan objek `{ text, output, level, timestamp }` jika belum dihancurkan. |
| `getLines` | `(): string[]` | Mengembalikan array berisi seluruh baris teks terformat. |
| `getEntries` | `(): Object[]` | Mengembalikan salinan shallow array berisi seluruh objek entri log terstruktur. |
| `clear` | `(): void` | Mengosongkan seluruh rekaman entri di memori. |
| `destroy` | `(): void` | Mengatur flag internal untuk menolak penulisan berikutnya. |

### `DefaultTextRenderer`

| Anggota | Signature | Deskripsi |
| :--- | :--- | :--- |
| `constructor` | `(options = { theme: {} })` | Menginisialisasi renderer teks dengan hook pemformatan tema kustom. |
| `init` | `(context: Readonly<RendererContext>): void` | Menerima konteks kapabilitas terminal dan opsi yang aman. |
| `render` | `(event: TerminalEvent): string | null` | Mentransformasikan event secara sinkron menjadi baris teks berwarna dengan badge level. |
| `destroy` | `(): void` | Membersihkan referensi context internal. |
