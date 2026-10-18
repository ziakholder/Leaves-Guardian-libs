# ProductMessage Builder

`ProductMessage` membangun kartu katalog produk terstruktur resmi WhatsApp (`productMessage`).

Builder ini memungkinkan bot untuk menyajikan barang dagangan atau jasa dengan gambar produk resolusi tinggi, format mata uang dan harga otomatis, deskripsi lengkap, nomor SKU/retailer ID, dan tombol pesan/beli langsung.

---

## Contoh Penggunaan Dasar

```javascript
import { ProductMessage } from 'leaves-guardian';

const produk = new ProductMessage(client)
  .setTitle('Biji Kopi Arabica Toraja (250g)')
  .setDescription('100% Arabica murni dengan aroma karamel dan buah tropis. Tingkat sangrai Medium Roast.')
  .setPrice(75000, 'IDR') // Diformat otomatis menjadi format mata uang WhatsApp
  .setImage('https://example.com/kopi-toraja.jpg')
  .setRetailerId('SKU_KOPI_001')
  .setButtonText('🛍️ Pesan Sekarang')
  .setFooter('Leaves Coffee Roastery');

await client.sendMessage(msg.chat.id, produk);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setTitle(title)` | Mengatur nama atau judul utama produk. |
| `.setDescription(desc)` | Mengatur deskripsi detail produk. |
| `.setPrice(amount, currency)` | Mengatur harga numerik dan kode mata uang 3 digit (misal: `75000, 'IDR'`). |
| `.setImage(source)` | Memasang gambar hero produk (menerima URL web, Buffer, atau path file lokal). |
| `.setRetailerId(id)` | Mengatur SKU atau nomor ID barang unik toko. |
| `.setButtonText(text)` | Mengatur label teks pada tombol aksi katalog. |
| `.setUrl(url)` | Menambahkan tautan checkout atau situs web produk eksternal. |

---

## Navigasi Terkait

- **[CarouselMessage Builder](/id/builders/carousel-message)**: Menampilkan banyak produk dalam format kartu geser.
- **[ListMessage Builder](/id/builders/list-message)**: Daftar pilihan menu beraneka ragam.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Menangani respon tombol transaksi.
