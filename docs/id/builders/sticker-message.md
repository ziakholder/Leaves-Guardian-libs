# StickerMessage Builder

`StickerMessage` adalah builder untuk membuat dan mengirimkan stiker WhatsApp (`image/webp`) dengan metadata EXIF kustom, seperti nama pack stiker, nama pembuat (*author*), dan kategori emoji.

Builder ini secara otomatis memproses penskalaan dimensi gambar agar sesuai dengan spesifikasi resmi stiker WhatsApp.

---

## Contoh Penggunaan Dasar

```javascript
import { StickerMessage } from 'leaves-guardian';

const stiker = new StickerMessage(client)
  .setSource('https://example.com/maskot.png')
  .setPackName('Sylphy MD Official Pack')
  .setAuthor('Royal Engine Studio')
  .setCategories(['🍃', '🤖']);

await client.sendMessage(msg.chat.id, stiker);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setSource(source)` | Menentukan gambar sumber (menerima URL web, Buffer biner, atau path file lokal). |
| `.setPackName(name)` | Mengatur nama paket stiker (*pack name*) di metadata EXIF. |
| `.setAuthor(author)` | Mengatur nama pembuat / penerbit (*author name*) di metadata EXIF. |
| `.setCategories(emojis)` | Mengatur emoji terkait (array string) untuk pengindeksan pencarian stiker WhatsApp. |

---

## Generator EXIF Statis (`createExif`)

Jika bot Anda mengonversi file WebP secara mandiri menggunakan modul eksternal (misal Sharp atau Fluent-FFmpeg), Anda dapat memanfaatkan fungsi pembantu statis `StickerMessage.createExif()` untuk membuat chunk Buffer EXIF secara langsung:

```javascript
import { StickerMessage } from 'leaves-guardian';

const exifBuffer = StickerMessage.createExif(
  'Paket Stiker Sylphy',
  'Rafa Dito',
  ['🌸', '✨']
);
```

---

## Navigasi Terkait

- **[MediaMessage Builder](/id/builders/media-message)**: Pengiriman media terpadu.
- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol interaktif native flow.
