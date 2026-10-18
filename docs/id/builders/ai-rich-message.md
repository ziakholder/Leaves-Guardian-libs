# AIRichMessage Builder

`AIRichMessage` membangun kartu respon terstruktur yang dirancang khusus untuk keluaran asisten kecerdasan buatan (AI), cuplikan dokumentasi teknis, dan bot konsultasi pemrograman.

Builder ini mendukung format modular yang mencakup teks markdown yang rapi, blok cuplikan kode (*syntax highlighted*), sitasi sumber referensi, badge status model, dan tombol interaksi.

---

## Contoh Penggunaan Dasar

```javascript
import { AIRichMessage } from 'leaves-guardian';

const aiMsg = new AIRichMessage(client)
  .addHeader('🧠 Asisten Kode AI', 'Solusi Pemrograman')
  .addMarkdown('Berikut adalah cara membuat server HTTP sederhana menggunakan Node.js:')
  .addCode(`
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Halo dari Leaves Guardian!');
});

server.listen(3000, () => {
  console.log('Server berjalan di port 3000');
});
  `.trim(), 'javascript')
  .addSearchSources([
    { title: 'Dokumentasi Resmi Node.js', url: 'https://nodejs.org' }
  ])
  .addBadge('Solusi Terverifikasi', '#2e7d32');

await client.sendMessage(msg.chat.id, aiMsg);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.addHeader(title, subtitle)` | Menambahkan banner visual kepala kartu dengan judul dan subjudul. |
| `.addMarkdown(text)` | Menambahkan konten teks dengan format markdown terstruktur. |
| `.addCode(codeString, language)` | Memformat blok kode pemrograman dengan anotasi bahasa. |
| `.addSearchSources(sourcesArray)` | Menyematkan kartu sitasi referensi dengan judul dan tautan URL. |
| `.addBadge(label, color)` | Menambahkan lencana/badge status visual (misal status verifikasi). |
| `.addHtml(htmlString, options)` | Menyematkan cuplikan markup HTML jika diperlukan. |

---

## Navigasi Terkait

- **[CanvasMessage Builder](/id/builders/canvas-message)**: Kartu antarmuka canvas HTML interaktif.
- **[RichMessage Builder](/id/builders/rich-message)**: Kartu visual serbaguna dengan header dan badge.
- **[TextMessage Builder](/id/builders/text-message)**: Pengiriman pesan teks terformat.
