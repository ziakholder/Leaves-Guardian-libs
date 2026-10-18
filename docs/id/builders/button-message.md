# ButtonMessage Builder

`ButtonMessage` membangun payload pesan tombol interaktif WhatsApp modern berbasis arsitektur Native Flow (`InteractiveMessage.NativeFlowMessage`).

Builder ini mendukung beragam jenis tombol interaktif, termasuk tombol respon cepat (*Quick Reply*), tautan web (*CTA URL*), tombol salin ke clipboard (*CTA Copy*), panggilan telepon (*CTA Call*), banner estetika (*Galaxy Flow*), badge diskon bertempo (*Limited Offer*), hingga menu pilihan dropdown langsung di dalam kartu tombol.

---

## Tipe Tombol yang Didukung

| Tipe Tombol | Method | Deskripsi |
| :--- | :--- | :--- |
| **Quick Reply** | `.addReply(text, id)` | Tombol aksi standar. Memicu event pesan bertipe `BUTTON` dengan ID tersebut saat diklik. |
| **CTA URL** | `.addUrl(text, url)` | Membuka tautan website eksternal langsung di browser pengguna. |
| **CTA Copy** | `.addCopy(text, code)` | Menyalin teks, nomor rekening, atau kode promo ke clipboard pengguna dengan 1 ketukan. |
| **CTA Call** | `.addCall(text, phone)` | Membuka dialer telepon perangkat untuk melakukan panggilan suara langsung. |
| **Dropdown List** | `.addDropdown(title, sections)` | Menampilkan tombol pop-up list menu pilihan bertingkat di dalam kartu tombol. |
| **Galaxy Flow** | `.addGalaxy(ctaText, opts)` | Banner navigasi dekoratif atau alur visual native flow yang elegan. |
| **Limited Offer** | `.addLimitedOffer(text, opts)` | Banner promosi dengan penghitung waktu mundur (*countdown expiration timer*). |

---

## Contoh Penggunaan Dasar

```javascript
import { ButtonMessage } from 'leaves-guardian';

const tombol = new ButtonMessage(client)
  .setTitle('🛒 Konfirmasi Pesanan')
  .setBody('Halo {{nama}}, pesanan Anda telah siap untuk diproses!')
  .setFooter('Leaves Guardian Store')
  .setVars({ nama: 'Rafa' })
  .addReply('✅ Lanjut Pembayaran', 'btn_bayar')
  .addCopy('📋 Salin Kode Promo', 'LEAVES20')
  .addUrl('🌐 Kunjungi Website Toko', 'https://example.com/store');

await client.sendMessage(msg.chat.id, tombol);
```

---

## Menambahkan Banner Media atau Header Lokasi

`ButtonMessage` mendukung penambahan gambar banner di bagian header atas:

```javascript
const tombolGambar = new ButtonMessage(client)
  .setImage('https://example.com/banner-promo.jpg')
  .setBody('Dapatkan diskon paket hosting terbaru hingga 50%!')
  .addReply('📦 Lihat Detail Paket', 'btn_paket')
  .addReply('💬 Hubungi Sales', 'btn_sales');

await client.sendMessage(msg.chat.id, tombolGambar);
```

### Menggunakan Header Lokasi dengan Avatar Thumbnail (v0.3.8)

Mulai versi 0.3.8, Anda juga dapat menampilkan header bergaya kartu lokasi interaktif lengkap dengan pin lokasi `📍` dan avatar persegi di sebelah kanan:

```javascript
const tombolLokasi = new ButtonMessage(client)
  .setLocationHeader('Hai Kak Rafa~ 👋', 'Silakan pilih opsi bantuan di bawah ini:', 'https://example.com/avatar.jpg')
  .addReply('📋 Buka Menu Utama', '.menu')
  .addReply('📞 Hubungi CS', 'cs_help');

await client.sendMessage(msg.chat.id, tombolLokasi);
```

---

## Menggabungkan Tombol dan List Dropdown (`addDropdown`)

Anda dapat memadukan tombol aksi langsung dan menu dropdown pilihan sekaligus dalam satu pesan yang sama:

```javascript
const menuLengkap = new ButtonMessage(client)
  .setTitle('Daftar Layanan Digital')
  .setBody('Pilih opsi langsung atau telusuri katalog lengkap:')
  .addReply('⚡ Mulai Cepat', 'quick_start')
  .addDropdown('📂 Jelajahi Kategori', [
    {
      title: 'Layanan Bot WhatsApp',
      rows: [
        { id: 'opt_wa_basic', title: 'Bot Standar', description: 'Otomatisasi pesan & CS' },
        { id: 'opt_wa_pro', title: 'Bot Enterprise', description: 'Integrasi AI & Multi-Agent' }
      ]
    },
    {
      title: 'Layanan Cloud VPS',
      rows: [
        { id: 'opt_vps_sg', title: 'Server Singapore', description: 'Latency rendah 15ms' }
      ]
    }
  ])
  .addUrl('🌐 Portal Dokumentasi', 'https://leavesguardian.enginelabs.my.id');

await client.sendMessage(msg.chat.id, menuLengkap);
```

---

## Menangkap Respon Tombol

Saat pengguna mengetuk tombol *Quick Reply*, Leaves Guardian secara otomatis memancarkan pesan masuk dengan tipe `msg.type === 'BUTTON'`:

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

    console.log('ID Tombol yang Ditekan:', buttonId);

    if (buttonId === 'btn_bayar') {
      await client.sendText(msg.chat.id, 'Silakan selesaikan pembayaran melalui tautan berikut...');
    }
  }
});
```

Untuk panduan mendalam tentang menangkap respon tombol dan dropdown, baca **[Menangkap Respon Interaktif](/id/builders/handling-responses)**.

---

## Navigasi Terkait

- **[LocationMessage Builder](/id/builders/location-message)**: Kartu lokasi interaktif terdedikasi.
- **[ListMessage Builder](/id/builders/list-message)**: Menu pop-up vertikal bertingkat.
- **[CarouselMessage Builder](/id/builders/carousel-message)**: Kartu geser horizontal multi-kartu.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Panduan penanganan event interaktif.
