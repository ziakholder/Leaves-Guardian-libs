# Penyensor Privasi & Sanitasi Data (Privacy Scrubber)

`leaves-guardian` menyertakan **Mesin Sanitasi Data & Penyensor Privasi Tiga Tingkat (Tri-Tier)** otomatis (`PresentationSanitizer`). Terintegrasi langsung ke dalam pipeline presentasi terminal, mesin ini memastikan bahwa log produksi, telemetri developer, dan diagnostik debug tidak pernah membocorkan kredensial rahasia, token otentikasi, kunci privat, atau nomor identitas pribadi ke konsol terminal.

---

## 1. Ikhtisar & Model Keamanan

Saat sebuah event dikirimkan melalui pipeline presentasi terminal, payload metadata (`event.data`) menjalani proses sanitasi otomatis sebelum dilekatkan ke dalam snapshot imutabel `TerminalEvent`:

```mermaid
flowchart TD
    RAW[Payload Data Mentah] --> TIER1{Tier 1: Redaksi Rahasia Wajib
SENSITIVE_KEY_PATTERN}
    TIER1 -->|Key Cocok dengan Kebijakan Rahasia| REDACT[Ganti dengan '[REDACTED_SECRET]']
    TIER1 -->|Key Aman| TIER2{Tier 2: Masking Privasi & Path}
    
    subgraph TIER2_FLOW [Sanitasi Tier 2]
        TIER2 -->|JID / Nomor Telepon| JID[maskJid: 62812******90]
        TIER2 -->|Path File Absolut| PATH[sanitizePath: [LOCAL_PATH]/session/creds.json]
    end
    
    REDACT & JID & PATH --> TIER3{Tier 3: Kanonikalisasi Data Aman}
    
    subgraph TIER3_FLOW [Representasi & Keamanan Tier 3]
        TIER3 -->|Buffer / Uint8Array| BUF[Deskriptor: { type, lengthBytes }]
        TIER3 -->|Instance Error| ERR[Deskriptor: { name, message, code }]
        TIER3 -->|Live Stream / Socket / Timer| LIVE[Deskriptor: { className }]
        TIER3 -->|Referensi Sirkular| CIRC[Ganti dengan '[Circular]']
        TIER3 -->|Fungsi & Simbol| DROP[Abaikan / Omit undefined]
    end
    
    BUF & ERR & LIVE & CIRC & DROP --> FREEZE[deepFreeze: Snapshot Imutabel Terisolasi]
    FREEZE --> EVENT[Data Imutabel TerminalEvent.data]
```

### Isolasi Snapshot (Snapshot Isolation)

Sanitizer menjamin **isolasi snapshot**: data yang telah disanitasi dikonversi menjadi snapshot yang baru dialokasikan sebelum dibekukan secara mendalam (`deep-frozen`), sehingga mencegah renderer visual atau sink eksternal memodifikasi objek input asli melalui snapshot hasil sanitasi.

---

## 2. Tier 1: Redaksi Rahasia Wajib (Non-Bypassable)

Tier 1 menegakkan penyensoran tanpa syarat terhadap kredensial keamanan tingkat tinggi. Mesin memeriksa seluruh nama properti objek terhadap pola ekspresi reguler internal (`SENSITIVE_KEY_PATTERN`):

```js
const SENSITIVE_KEY_PATTERN = /^(creds|noiseKey|signedIdentityKey|pairingCode|authKey|identityKey|privateKey|secret|token|password|pin|clientSecret|clientToken)$/i;
```

Jika ada nama properti (key) yang cocok dengan kebijakan ini, nilainya seketika digantikan dengan string sentinel:
```text
'[REDACTED_SECRET]'
```

> [!WARNING]
> **Jaminan Keamanan Non-Bypassable:**
> Redaksi rahasia wajib **selalu aktif**. Sekalipun developer secara eksplisit menyetel opsi `privacyMasking: false`, kredensial yang cocok dengan `SENSITIVE_KEY_PATTERN` tetap disensor secara ketat sebagai `[REDACTED_SECRET]`.

---

## 3. Tier 2: Masking Privasi & Normalisasi Path Terkonfigurasi

Tier 2 menangani nomor telepon pribadi dan path direktori host. Tier ini aktif secara default dan dapat dikendalikan melalui opsi konfigurasi `privacyMasking`.

### 3.1 Penyamaran Nomor Telepon & JID (`maskJid`)

Sanitizer mengenali WhatsApp JID yang berakhiran `@s.whatsapp.net` serta string nomor telepon murni sepanjang 10–15 digit.

- **Formula Penyamaran Standar:** Mempertahankan `prefixLength` awal (default: `5`) dan `suffixLength` akhir (default: `2`), lalu mengganti digit tengah dengan `******`.
- **Penanganan Nilai Pendek:** Jika panjang string angka $le 6$ digit atau $le (	ext{prefixLength} + 	ext{suffixLength})$, seluruh string disamarkan menjadi `'******'`.
- **Masking Dinonaktifkan (`privacyMasking: false`):** Ketika dinonaktifkan, nomor telepon tetap utuh, tetapi akhiran internal `@s.whatsapp.net` dibersihkan demi kerapian tampilan.

```js
import { PresentationSanitizer } from 'leaves-guardian';

// Nomor WhatsApp Indonesia standar 13 digit
PresentationSanitizer.maskJid('6281234567890@s.whatsapp.net');
// Hasil: '62812******90'

// Menyesuaikan batas prefix dan suffix kustom
PresentationSanitizer.maskJid('6281234567890@s.whatsapp.net', {
  prefixLength: 4,
  suffixLength: 3
});
// Hasil: '6281******890'

// Penanganan nomor pendek (<= 6 digit)
PresentationSanitizer.maskJid('12345@s.whatsapp.net');
// Hasil: '******'
```

### 3.2 Normalisasi Path Filesystem (`sanitizePath`)

Untuk mencegah log membocorkan struktur direktori server, nama pengguna sistem operasi lokal, atau tata letak folder deployment, engine menyaring path absolut menggunakan `ABSOLUTE_PATH_PATTERN`:

```js
const ABSOLUTE_PATH_PATTERN = /(?:[a-zA-Z]:[\/][^s"']+|/(?:home|Users|usr|var|etc|opt|tmp|app)[^s"']*)/g;
```

Normalisasi path mengurangi risiko pengungkapan username lokal dan path deployment absolut dengan mengganti path yang dikenali menjadi deskriptor relatif yang mempertahankan paling banyak 2 segmen path terakhir:

```text
Windows:
C:Usersadministratorotsessioncreds.json
  --> [LOCAL_PATH]/session/creds.json

Linux / Docker / macOS:
/home/ubuntu/production/leaves-guardian/data/store.json
  --> [LOCAL_PATH]/data/store.json
/app/session/creds.json
  --> [LOCAL_PATH]/session/creds.json
```

---

## 4. Tier 3: Kanonikalisasi Data Aman & Containment

Tier 3 bertindak sebagai batas keamanan arsitektural. Tier ini mengubah objek biner, instance runtime, dan handle proses aktif menjadi deskriptor yang aman dan dapat diserialisasi guna mencegah luapan buffer terminal, penghentian event loop, dan kebocoran referensi.

### 4.1 Kanonikalisasi Buffer & TypedArray Biner
Nilai biner direpresentasikan oleh deskriptor ringkas yang memuat tipe dan panjang byte, alih-alih mengekspos isi byte mentahnya:

```js
// Input: Buffer.from('binary-data-stream')
// Deskriptor output:
{
  type: 'Buffer',
  lengthBytes: 18
}

// Input: new Uint8Array(64)
// Deskriptor output:
{
  type: 'Uint8Array',
  lengthBytes: 64
}
```

### 4.2 Kanonikalisasi Instance Error
Instance `Error` dikonversi menjadi deskriptor terstruktur `{ name, message, code }`, dengan sanitasi path yang diterapkan langsung pada pesan kesalahan (`message`):

```js
// Input: new Error('Gagal membuka C:\Users\admin\session\creds.json')
// Deskriptor output:
{
  name: 'Error',
  message: 'Gagal membuka [LOCAL_PATH]/session/creds.json',
  code: undefined
}
```

### 4.3 Containment Objek Live & Handle Proses
Stream aktif, socket jaringan yang terbuka, Promise, dan timer dicegat dan direduksi menjadi deskriptor nama kelas, sehingga mencegah visual renderer mencoba menserialisasi handle yang sedang berjalan:

```js
// Instance Socket aktif, ReadStream, Timeout, atau Promise
// Deskriptor output:
{
  className: 'Socket' // atau 'LiveObject', 'Timeout', dll.
}
```

### 4.4 Deteksi Referensi Sirkular & Deep Freezing
- **Pencegahan Siklus:** Referensi induk aktif dipantau selama penelusuran rekursif. Struktur sirkular digantikan dengan aman menggunakan string sentinel `'[Circular]'`.
- **Fungsi & Simbol:** Fungsi eksekutabel dan simbol JavaScript dibuang (`undefined`) selama proses kanonikalisasi.
- **Pembekuan Mendalam (`deepFreeze`):** Snapshot yang dihasilkan dibekukan secara rekursif menggunakan `Object.freeze()`. Renderer dan sink tidak dapat memodifikasi snapshot atau menambahkan properti sembarangan.

---

## 5. Penggunaan Utilitas Mandiri (Standalone)

Meskipun `PresentationSanitizer` dieksekusi secara otomatis saat logging `client.terminal` berjalan, fungsi utilitasnya juga diekspor langsung untuk kebutuhan sanitasi kustom developer:

```js
import { PresentationSanitizer } from 'leaves-guardian';

// 1. Menyamarkan nomor JID tunggal
const masked = PresentationSanitizer.maskJid('6281234567890@s.whatsapp.net');

// 2. Mensanitasi string path absolut
const cleanPath = PresentationSanitizer.sanitizePath('C:\apps\bot\session\creds.json');

// 3. Menjalankan sanitasi Tri-Tier lengkap pada objek data sembarang
const safeSnapshot = PresentationSanitizer.sanitizeData({
  user: '6281234567890@s.whatsapp.net',
  sessionPath: '/home/deploy/bot/creds.json',
  authKey: 'kunci-rahasia-super', // Disensor otomatis
  payload: Buffer.alloc(1024)      // Dikonversi otomatis menjadi { type: 'Buffer', lengthBytes: 1024 }
}, {
  privacyMasking: true
});

console.log(safeSnapshot);
// {
//   user: '62812******90',
//   sessionPath: '[LOCAL_PATH]/bot/creds.json',
//   authKey: '[REDACTED_SECRET]',
//   payload: { type: 'Buffer', lengthBytes: 1024 }
// }

// 4. Membekukan objek secara rekursif
const frozenObject = PresentationSanitizer.deepFreeze({ config: { level: 'INFO' } });
```
