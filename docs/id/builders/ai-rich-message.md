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
| `.addHtml(htmlString, options)` | Menyematkan payload HTML interaktif (`FOAHtmlPrimitiveDemoDONOTUSE`) dengan opsi domain terpercaya `{ trustedSources: [] }`. |

---

## Contoh Widget HTML Interaktif Meta AI (`.addHtml()` v0.4.0)

Fitur ini memanfaatkan primitif resmi Meta AI WhatsApp (`FOAHtmlPrimitiveDemoDONOTUSE`) untuk merender widget interaktif mini-app dengan daftar domain terpercaya:

```javascript
import { AIRichMessage } from 'leaves-guardian';

const aiMsg = new AIRichMessage(client)
  .setTitle('Statistik Performa Server')
  .addHtml(`
    <div style="font-family: sans-serif; padding: 12px; background: #f0fdf4; border-radius: 8px;">
      <h3 style="color: #166534; margin: 0;">Server Status: OK</h3>
      <p style="color: #15803d; margin: 4px 0;">Uptime: 99.98% | Latency: 18ms</p>
    </div>
  `.trim(), {
    trustedSources: ['leavesguardian.enginelabs.my.id', 'nixel.dev']
  });

await aiMsg.send(msg.chat.id);
```

---

## Navigasi Terkait

- **[CanvasMessage Builder](/id/builders/canvas-message)**: Kartu antarmuka canvas HTML interaktif.
- **[RichMessage Builder](/id/builders/rich-message)**: Kartu visual serbaguna dengan header dan badge.
- **[TextMessage Builder](/id/builders/text-message)**: Pengiriman pesan teks terformat.
