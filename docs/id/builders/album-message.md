# AlbumMessage Builder (v0.4.0)

`AlbumMessage` adalah builder pesan album media asli (*native WhatsApp Album*) yang diperkenalkan pada **Leaves Guardian v0.4.0**.

Dengan `AlbumMessage`, sekumpulan foto dan video dikelompokkan secara visual menjadi satu kesatuan kartu grid interaktif di dalam bubble chat WhatsApp (seperti saat pengguna memilih beberapa foto sekaligus dari galeri ponsel), alih-alih terkirim sebagai pesan foto terpisah yang menumpuk.

---

## Keunggulan AlbumMessage

1. **Tampilan Rapi & Menumpuk Otomatis**: Menghindari spam bubble chat panjang saat bot mengirim katalog foto produk, screenshot multi-halaman, atau dokumentasi visual.
2. **Kombinasi Gambar & Video**: Mendukung penggabungan gambar (`imageMessage`) dan video (`videoMessage`) sekaligus dalam satu album.
3. **Protokol Asli WhatsApp**: Menggunakan struktur `albumMessage` resmi Baileys lengkap dengan parent stansa dan `contextInfo.associatedChildMessageId` yang terikat ke setiap item media.
4. **Validasi Defensif**: Memastikan jumlah media minimal 2 item sesuai standar protokol WhatsApp.

---

## Daftar Method

| Method | Tipe Parameter | Keterangan |
| :--- | :--- | :--- |
| `.addImage(source, options)` | `Buffer \| string, Object` | Menambahkan gambar ke dalam album (URL, Buffer, atau file path lokal). Mendukung opsi `{ caption }`. |
| `.addVideo(source, options)` | `Buffer \| string, Object` | Menambahkan video ke dalam album (URL, Buffer, atau file path lokal). Mendukung opsi `{ caption }`. |
| `.send(jid, options)` | `string, Object` | Mengirim album langsung ke target JID WhatsApp. |

---

## Contoh Penggunaan Praktis

### 1. Menggunakan AlbumMessage Builder

```javascript
import { AlbumMessage } from 'leaves-guardian';
import fs from 'node:fs';

const album = new AlbumMessage(client)
  .addImage('https://example.com/foto1.jpg', { caption: 'Foto Pemandangan 1' })
  .addImage(fs.readFileSync('./foto2.jpg'), { caption: 'Foto Pemandangan 2' })
  .addVideo('https://example.com/video1.mp4', { caption: 'Video Suasana' });

await album.send(msg.chat.id);
```

### 2. Menggunakan Direct Helper `client.sendAlbum()`

Jika ingin cara yang lebih ringkas tanpa membuat instance builder:

```javascript
await client.sendAlbum(msg.chat.id, [
  { image: { url: 'https://example.com/produk-depan.jpg' }, caption: 'Tampak Depan' },
  { image: { url: 'https://example.com/produk-samping.jpg' }, caption: 'Tampak Samping' },
  { video: { url: 'https://example.com/review-produk.mp4' }, caption: 'Video Unboxing' }
]);
```

### 3. Menggunakan Fluent MessageBuilder Proxy

```javascript
await client.messageBuilder(msg.chat.id)
  .setType('Album')
  .addImage('https://example.com/item1.jpg')
  .addImage('https://example.com/item2.jpg')
  .send();
```
