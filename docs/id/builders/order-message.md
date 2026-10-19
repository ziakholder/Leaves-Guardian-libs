# OrderMessage Builder (v0.4.0)

`OrderMessage` adalah builder untuk mengirim kartu faktur atau ringkasan pesanan katalog resmi WhatsApp (*Catalog Order Message*) yang diperkenalkan pada **Leaves Guardian v0.4.0**.

Pesan ini menampilkan bubble bergaya struk belanja resmi WhatsApp lengkap dengan judul pesanan, status pesanan, jumlah barang (*item count*), rincian total nominal belanja dalam format mata uang (misal `IDR`), serta thumbnail pratinjau produk.

---

## Keunggulan OrderMessage

1. **Format E-Commerce Resmi WhatsApp**: Menampilkan kartu pesanan formal yang sangat cocok untuk bot toko online, invoice donasi, pembayaran langganan, dan checkout otomatis.
2. **Kalkulasi Mata Uang Presisi**: Menangani konversi pecahan nominal mikro WhatsApp (`totalAmount1000`) secara otomatis.
3. **Mendukung Thumbnail Pratinjau**: Memungkinkan penyematan gambar produk atau logo toko pada kartu pesanan.

---

## Daftar Method

| Method | Tipe Parameter | Keterangan |
| :--- | :--- | :--- |
| `.setOrderId(id)` | `string` | Mengatur ID unik pesanan (opsional, otomatis dibuatkan jika kosong). |
| `.setOrderTitle(title)` | `string` | Mengatur judul atau nama pesanan/produk utama. |
| `.setMessage(text)` | `string` | Mengatur catatan atau deskripsi pesanan. |
| `.setItemCount(count)` | `number` | Mengatur jumlah total barang yang dipesan. |
| `.setStatus(status)` | `number` | Mengatur status pesanan (default: `1` / INQUIRY). |
| `.setSurface(surface)` | `number` | Mengatur tipe surface katalog WhatsApp (default: `1` / CATALOG). |
| `.setTotalAmount(amount, currency)` | `number, string` | Mengatur nominal total dan kode mata uang (contoh: `35000, 'IDR'`). |
| `.setThumbnail(thumb)` | `Buffer \| string` | Mengatur thumbnail gambar kartu pesanan. |
| `.setSellerJid(jid)` | `string` | Mengatur JID penjual (opsional). |
| `.send(jid, options)` | `string, Object` | Mengirim kartu pesanan ke target JID WhatsApp. |

---

## Contoh Penggunaan Praktis

### 1. Menggunakan OrderMessage Builder

```javascript
import { OrderMessage } from 'leaves-guardian';

const order = new OrderMessage(client)
  .setOrderTitle('Kopi Susu Gula Aren')
  .setMessage('2x Ukuran Large, Less Sugar')
  .setItemCount(2)
  .setTotalAmount(36000, 'IDR')
  .setThumbnail('https://example.com/kopi-aren.jpg');

await order.send(msg.chat.id);
```

### 2. Menggunakan Direct Helper `client.sendOrder()`

```javascript
await client.sendOrder(msg.chat.id, {
  orderTitle: 'Paket Langganan VIP 1 Bulan',
  message: 'Akses seluruh fitur premium Leaves Guardian',
  itemCount: 1,
  totalAmount: 50000,
  totalCurrencyCode: 'IDR'
});
```

### 3. Menggunakan Fluent MessageBuilder Proxy

```javascript
await client.messageBuilder(msg.chat.id)
  .setType('Order')
  .setOrderTitle('Jasa Setup VPS Bot')
  .setItemCount(1)
  .setTotalAmount(75000, 'IDR')
  .send();
```
