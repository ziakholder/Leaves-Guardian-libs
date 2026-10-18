# CanvasMessage Builder

`CanvasMessage` memperluas kemampuan `AIRichMessage` untuk membangun payload antarmuka interaktif berbasis canvas HTML untuk WhatsApp.

Builder ini memungkinkan Anda menyematkan konten HTML5, styling CSS, dan tata letak visual kaya dengan kontrol perizinan domain (*domain whitelisting*).

---

## Contoh Penggunaan Dasar

```javascript
import { CanvasMessage } from 'leaves-guardian';

const payloadHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 20px; background: #f0fdf4; }
    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    h1 { color: #166534; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🍃 Leaves Guardian</h1>
    <p>Template Canvas UI Interaktif</p>
  </div>
</body>
</html>
`;

const canvas = new CanvasMessage(client)
  .setHtml(payloadHtml, {
    trustedSources: ['leavesguardian.enginelabs.my.id', 'whatsapp.com']
  });

await client.sendMessage(msg.chat.id, canvas);
```

---

## Daftar Method & Opsi

| Method | Keterangan |
| :--- | :--- |
| `.setHtml(htmlString, options)` | Mengatur markup HTML lengkap yang akan dirender. |
| `options.trustedSources` | Array daftar domain tepercaya yang diizinkan untuk memuat aset eksternal. |

---

## Catatan Kompatibilitas Klien WhatsApp

> **Perhatian**: Dukungan rendering antarmuka HTML interaktif bergantung pada versi aplikasi WhatsApp dan platform penerima. Pada versi WhatsApp yang belum mendukung runtime canvas secara penuh, WhatsApp akan secara otomatis menampilkan teks fallback standar yang aman.

---

## Navigasi Terkait

- **[AIRichMessage Builder](/id/builders/ai-rich-message)**: Pembuat kartu respon terstruktur AI.
- **[RichMessage Builder](/id/builders/rich-message)**: Pembuat kartu visual serbaguna.
- **[MediaMessage Builder](/id/builders/media-message)**: Pengiriman gambar, video, dan dokumen.
