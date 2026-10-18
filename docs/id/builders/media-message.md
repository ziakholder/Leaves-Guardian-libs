# MediaMessage Builder

`MediaMessage` menyediakan satu antarmuka builder terpadu (*unified fluent builder*) untuk mengirimkan seluruh jenis media standar di WhatsApp: Gambar (*Image*), Video, Dokumen/File, Audio / Pesan Suara (*Voice Note / PTT*), dan Stiker.

---

## Tipe Media yang Didukung

Anda dapat menentukan tipe media melalui argumen constructor atau dengan memanggil method `.setType()`:
- `'image'` (Default)
- `'video'`
- `'audio'`
- `'document'`
- `'sticker'`

---

## Contoh Penggunaan Praktis

### 1. Mengirim Gambar dengan Keterangan & Ad-Reply

```javascript
import { MediaMessage } from 'leaves-guardian';

const gambar = new MediaMessage(client, 'image')
  .setSource('https://example.com/foto-kantor.jpg')
  .setBody('📸 Selamat datang di kantor baru kami di Jakarta!')
  .setAdReply({
    title: 'Leaves Studio',
    body: 'Galeri Resmi Tim',
    sourceUrl: 'https://leavesguardian.enginelabs.my.id'
  });

await client.sendMessage(msg.chat.id, gambar);
```

### 2. Mengirim Dokumen File (PDF / Zip)

```javascript
import fs from 'fs';
const pdfBuffer = fs.readFileSync('./dokumen/invoice_oktober.pdf');

const dokumen = new MediaMessage(client, 'document')
  .setSource(pdfBuffer)
  .setFileName('invoice_oktober_2026.pdf')
  .setMimetype('application/pdf')
  .setBody('📄 Terlampir invoice langganan bot Anda bulan ini.');

await client.sendMessage(msg.chat.id, dokumen);
```

### 3. Mengirim Pesan Suara WhatsApp (Voice Note / PTT)

```javascript
const vn = new MediaMessage(client, 'audio')
  .setSource('https://example.com/audio-sambutan.ogg')
  .setPtt(true); // Dikirim sebagai WhatsApp Voice Note dengan waveform

await client.sendMessage(msg.chat.id, vn);
```

### 4. Mengirim Video sebagai GIF Animasi

```javascript
const gif = new MediaMessage(client, 'video')
  .setSource('https://example.com/animasi-selamat.mp4')
  .setGifPlayback(true) // Memutar video looping otomatis sebagai GIF di chat
  .setBody('🎉 Selamat atas pencapaian baru tim!');

await client.sendMessage(msg.chat.id, gif);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setType(type)` | Mengubah tipe media aktif (`'image'`, `'video'`, `'audio'`, `'document'`, `'sticker'`). |
| `.setSource(source)` | Menentukan sumber payload media (menerima URL web, Buffer biner, atau path file lokal). |
| `.setFileName(name)` | Mengatur nama file yang ditampilkan (sangat penting untuk dokumen). |
| `.setMimetype(mimetype)` | Menentukan MIME type eksplisit (misal: `'application/pdf'`). |
| `.setPtt(boolean)` | Jika `true` pada media audio, dikirim sebagai Voice Note (Push-To-Talk). |
| `.setGifPlayback(boolean)` | Jika `true` pada media video, dikirim dan diputar otomatis sebagai GIF animasi. |
| `.setBody(caption)` | Mengatur teks takarir (*caption*) pada gambar atau video. |

---

## Navigasi Terkait

- **[StickerMessage Builder](/id/builders/sticker-message)**: Pembuatan stiker WebP dengan EXIF metadata khusus.
- **[Media Pipeline & SSRF](/id/media/media-pipeline)**: Pipeline pemrosesan media aman dari ancaman SSRF.
- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol interaktif dengan banner media.
