# StickerPackMessage Builder (v0.4.0)

`StickerPackMessage` adalah builder untuk mengirim bundel paket stiker resmi WhatsApp (*Sticker Pack*) lengkap beserta gambar sampul tray (*cover icon*) yang diperkenalkan pada **Leaves Guardian v0.4.0**.

Dengan `StickerPackMessage`, bot dapat mendistribusikan koleksi stiker ke pengguna sehingga pengguna dapat melihat seluruh stiker dalam satu tampilan bundel rapi dan menambahkannya langsung ke koleksi stiker WhatsApp mereka.

---

## Keunggulan StickerPackMessage

1. **Distribusi Koleksi Praktis**: Tidak perlu mengirim stiker satu per satu yang memenuhi riwayat chat; pengguna mendapatkan seluruh isi pack sekaligus.
2. **Branding & Metadata Lengkap**: Menyertakan nama paket stiker, nama publisher/studio, deskripsi, serta file cover tray WebP khusus.
3. **Emoji Association**: Setiap stiker di dalam pack dapat dipetakan ke emoji tertentu agar otomatis disarankan saat pengguna mengetik emoji di keyboard WhatsApp.

---

## Daftar Method

| Method | Tipe Parameter | Keterangan |
| :--- | :--- | :--- |
| `.setName(name)` | `string` | Mengatur nama bundel stiker pack. |
| `.setPublisher(publisher)` | `string` | Mengatur nama pembuat atau studio pembuat stiker. |
| `.setDescription(desc)` | `string` | Mengatur deskripsi ringkas paket stiker. |
| `.setCover(cover)` | `Buffer \| string` | Mengatur gambar sampul ikon tray bundel stiker (WebP / PNG / Buffer / URL / file path). |
| `.addSticker(sticker, emojis)` | `Buffer \| string, Array<string>` | Menambahkan satu item stiker WebP ke dalam pack beserta array emoji terkait (contoh: `['🔥', '✨']`). |
| `.send(jid, options)` | `string, Object` | Mengirim paket stiker ke target JID WhatsApp. |

---

## Contoh Penggunaan Praktis

### 1. Menggunakan StickerPackMessage Builder

```javascript
import { StickerPackMessage } from 'leaves-guardian';
import fs from 'node:fs';

const pack = new StickerPackMessage(client)
  .setName('Sylphy Chibi Collection')
  .setPublisher('Royal Engine Studio')
  .setDescription('Koleksi stiker imut Sylphy untuk obrolan sehari-hari')
  .setCover(fs.readFileSync('./tray-cover.webp'))
  .addSticker(fs.readFileSync('./sylphy-hi.webp'), ['👋', '✨'])
  .addSticker(fs.readFileSync('./sylphy-love.webp'), ['❤️', '🥰'])
  .addSticker(fs.readFileSync('./sylphy-cry.webp'), ['😭', '💔']);

await pack.send(msg.chat.id);
```

### 2. Menggunakan Direct Helper `client.sendStickerPack()`

```javascript
await client.sendStickerPack(msg.chat.id, {
  name: 'Meme Pack 2026',
  publisher: 'Leaves Guardian Community',
  cover: './assets/tray.webp',
  stickers: [
    { source: './assets/meme1.webp', emojis: ['😂'] },
    { source: './assets/meme2.webp', emojis: ['💀'] }
  ]
});
```
