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

## Konversi ButtonMessage ke Kartu Carousel (`toCard()` v0.4.0)

Mulai versi **0.4.0**, Anda dapat mengubah instance `ButtonMessage` biasa menjadi kartu carousel secara instan tanpa mendefinisikan ulang properti kartu. `CarouselMessage.addCard()` juga mendukung pengoperan array kumpulan kartu sekaligus:

```javascript
import { ButtonMessage, CarouselMessage } from 'leaves-guardian';

// Buat kartu menggunakan ButtonMessage
const paket1 = new ButtonMessage(client)
  .setTitle('📦 Paket Hemat')
  .setBody('Kapasitas 1 GB, Bandwidth Tanpa Batas')
  .setFooter('Rp25.000 / bln')
  .addReply('Pesan Paket 1', 'order_pkg_1');

const paket2 = new ButtonMessage(client)
  .setTitle('🚀 Paket Pro')
  .setBody('Kapasitas 5 GB, Prioritas Server Utama')
  .setFooter('Rp50.000 / bln')
  .addReply('Pesan Paket 2', 'order_pkg_2');

// Langsung masukkan ke Carousel dalam bentuk array
const carousel = new CarouselMessage(client)
  .setBody('Silakan pilih paket server bot WhatsApp kamu:')
  .addCard([paket1, paket2]);

await carousel.send(msg.chat.id);
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
