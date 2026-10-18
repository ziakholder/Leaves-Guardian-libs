# ListMessage Builder

`ListMessage` membangun menu pop-up pemilihan daftar bertingkat (*single-select list native flow*) resmi WhatsApp dengan dukungan banner media (gambar, video, dokumen) atau kartu lokasi di bagian kepalanya.

Builder ini sangat ideal untuk menampilkan daftar menu bot, pemilihan paket layanan, pengaturan akun pengguna, formulir transaksi, atau katalog beraneka pilihan.

---

## Contoh Penggunaan dengan Header Gambar

```javascript
import { ListMessage } from 'leaves-guardian';

const menuList = new ListMessage(client)
  .setImage('https://example.com/banner-kafe.jpg')
  .setTitle('🏪 {{namaToko}}')
  .setBody('Halo {{nama}}, silakan pilih kategori menu lezat kami di bawah ini:')
  .setFooter('Pilih salah satu item untuk memesan')
  .setButtonText('📋 Buka Daftar Menu')
  .setVars({ namaToko: 'Leaves Artisan Coffee', nama: 'Rafa' })
  .addSection('☕ Aneka Kopi Pilihan', [
    { id: 'kopi_latte', title: 'Vanilla Latte', description: 'Espresso segar dengan susu vanilla lembut' },
    { id: 'kopi_americano', title: 'Caffe Americano', description: 'Double shot espresso kaya aroma' }
  ])
  .addSection('🥐 Roti & Pastry', [
    { id: 'roti_croissant', title: 'Butter Croissant', description: 'Pastry Prancis renyah dan harum' }
  ]);

await client.sendMessage(msg.chat.id, menuList);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setImage(pathOrBuffer)` | Memasang banner gambar pada bagian header menu list. |
| `.setVideo(pathOrBuffer)` | Memasang banner video pada bagian header menu list. |
| `.setDocument(pathOrBuffer, opts)` | Memasang lampiran dokumen PDF/dokumen pada header. |
| `.setLocationHeader(name, address, thumb)` | Memasang kartu lokasi dengan thumbnail avatar pada header. |
| `.setTitle(title)` | Mengatur judul tebal pesan. |
| `.setBody(body)` | Mengatur isi teks deskripsi utama. |
| `.setFooter(footer)` | Mengatur catatan kaki di bagian bawah. |
| `.setButtonText(text)` | Mengatur label teks pada tombol pemicu menu (default: `'Pilih'`). |
| `.addSection(title, rows)` | Menambahkan kategori section baru beserta kumpulan baris itemnya. |
| `.addRow(sectionTitle, row)` | Menambahkan satu baris item ke dalam section tertentu. |

### Struktur Objek Baris (Row)

Setiap item baris di dalam section menerima properti berikut:
- **`id`**: String unik identifier baris (dikirimkan kembali ke bot saat dipilih).
- **`title`**: Judul utama baris menu.
- **`description`**: Deskripsi tambahan singkat di bawah judul (opsional).
- **`header`**: Teks badge kecil di atas baris (opsional).

---

## Menangkap Pemilihan Menu List

Ketika pengguna memilih salah satu item dari menu list di WhatsApp mereka, Leaves Guardian secara otomatis memancarkan event `message` dengan tipe `msg.type === 'LIST'`.

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'LIST') {
    const judulDipilih = msg.text;

    // Mengambil ID unik baris yang dipilih
    const idDipilih =
      msg.raw?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.raw?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

    console.log(`Pengguna memilih item: ${judulDipilih} (ID: ${idDipilih})`);

    if (idDipilih === 'kopi_latte') {
      await client.sendText(msg.chat.id, '☕ 1 Vanilla Latte berhasil ditambahkan ke keranjang pesanan Anda!');
    }
  }
});
```

---

## Navigasi Terkait

- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol native flow dan dropdown button.
- **[CarouselMessage Builder](/id/builders/carousel-message)**: Kartu geser horizontal.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Panduan menangkap event interaktif.
