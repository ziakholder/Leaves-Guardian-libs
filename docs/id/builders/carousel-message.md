# CarouselMessage Builder

`CarouselMessage` membangun struktur pesan carousel geser horizontal multi-kartu untuk WhatsApp (`InteractiveMessage.CarouselMessage`).

Setiap kartu di dalam carousel dapat memiliki gambar header, teks deskripsi tersendiri, serta tombol aksi interaktif masing-masing (seperti Quick Reply, tautan URL, atau tombol salin kode).

---

## Contoh Penggunaan Praktis

```javascript
import { CarouselMessage } from 'leaves-guardian';

const carousel = new CarouselMessage(client)
  .setBody('🌟 Katalog Produk Unggulan Pekan Ini')
  .setFooter('Geser ke samping (swipe) untuk melihat pilihan produk');

// Kartu 1: Produk A
const kartu1 = carousel.newCard()
  .setTitle('Biji Kopi Arabica Premium')
  .setBody('Biji kopi sangrai single origin kualitas tinggi (250g)')
  .setImage('https://example.com/kopi.jpg')
  .addReply('🛒 Beli Kopi', 'beli_kopi')
  .addUrl('ℹ️ Info Lengkap', 'https://example.com/kopi');

// Kartu 2: Produk B
const kartu2 = carousel.newCard()
  .setTitle('Bubuk Matcha Jepang')
  .setBody('Ceremonial grade green tea asli dari Kyoto (100g)')
  .setImage('https://example.com/matcha.jpg')
  .addReply('🛒 Beli Matcha', 'beli_matcha')
  .addUrl('ℹ️ Info Lengkap', 'https://example.com/matcha');

carousel.addCard(kartu1);
carousel.addCard(kartu2);

await client.sendMessage(msg.chat.id, carousel);
```

---

## Daftar Method `CarouselCard`

Saat Anda memanggil `carousel.newCard()`, instance class pembantu `CarouselCard` dibuat dengan method berikut:

| Method | Keterangan |
| :--- | :--- |
| `.setTitle(title)` | Mengatur judul kepala kartu. |
| `.setBody(body)` | Mengatur teks deskripsi kartu. |
| `.setFooter(footer)` | Mengatur catatan kaki kartu. |
| `.setImage(source)` | Memasang gambar header kartu (menerima URL, Buffer, atau path file). |
| `.addReply(text, id)` | Menambahkan tombol quick reply pada kartu. |
| `.addUrl(text, url)` | Menambahkan tombol tautan web CTA URL pada kartu. |
| `.addCopy(text, code)` | Menambahkan tombol salin cepat ke clipboard pada kartu. |

---

## Menangkap Respon Tombol Carousel

Ketika pengguna mengklik salah satu tombol di salah satu kartu carousel, WhatsApp mengirimkan event `message` dengan `msg.type === 'BUTTON'`:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'BUTTON') {
    let buttonId = null;

    try {
      const parsed = JSON.parse(msg.text);
      buttonId = parsed.id || parsed.selectedId;
    } catch (_) {
      buttonId = msg.text;
    }

    if (buttonId === 'beli_kopi') {
      await client.sendText(msg.chat.id, '☕ Anda memilih untuk membeli Biji Kopi Arabica Premium!');
    }
  }
});
```

---

## Navigasi Terkait

- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol interaktif kartu tunggal.
- **[ProductMessage Builder](/id/builders/product-message)**: Kartu katalog produk WhatsApp.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Panduan menangkap event interaktif.
