# Panduan 12 Message Builders

Leaves Guardian menyediakan **12 Message Builders** terpadu (Layer 5) untuk mempermudah pembuatan pesan WhatsApp yang kaya, interaktif, dan terstruktur dengan sintaks yang rapi (*fluent chainable API*).

Seluruh builder mewarisi method dasar dari `BaseBuilder`, sehingga secara otomatis mendukung fitur *string templating* `{{var}}`, external ad reply, forwarding saluran (channel), mention pengguna, dan kutipan pesan (*quote*).

---

## Ringkasan 12 Builders

| Class Builder | Tipe Pesan | Kemampuan Utama |
| :--- | :--- | :--- |
| **`TextMessage`** | Teks Terformat | Mendukung format markdown, ad-reply, mention, dan penonaktifan link preview. |
| **`ButtonMessage`** | Tombol Interaktif | Tombol quick reply, CTA tautan web, CTA salin teks/kupon, dan CTA panggilan telepon. |
| **`ListMessage`** | Menu List Pilihan | Menu pop-up vertikal bertingkat dengan section dan row. |
| **`CarouselMessage`** | Carousel Kartu | Kartu geser horizontal dengan gambar dan tombol interaktif per kartu. |
| **`MediaMessage`** | Media Terpadu | Satu class untuk Gambar, Video/GIF, Dokumen, Audio/Voice Note (PTT), dan Stiker. |
| **`StickerMessage`** | Stiker WebP | Pembuatan stiker dengan metadata EXIF kustom (nama pack & author). |
| **`ProductMessage`** | Kartu Produk | Kartu katalog produk dengan gambar, deskripsi, harga mata uang, dan ID SKU. |
| **`PollMessage`** | Polling & Voting | Polling interaktif single-choice atau multi-choice (2 hingga 12 opsi). |
| **`AIRichMessage`** | Respons AI Terstruktur | Format kaya untuk respons AI (blok kode, sitasi sumber, dan badge status). |
| **`CanvasMessage`** | Canvas / Mini App | Pembuat payload HTML canvas interaktif dengan whitelist domain. |
| **`EventMessage`** | Acara Kalender | Undangan acara resmi WhatsApp Group Event dengan waktu mulai/selesai & link call. |
| **`RichMessage`** | Flex Card Visual | Kartu visual dengan header, badge status, dan tombol aksi. |

---

## Method Bersama (`BaseBuilder`)

Setiap builder memiliki method bawaan berikut:

```javascript
builder
  .setTitle('Judul Pesan')
  .setBody('Halo {{nama}}, pesanan #{{orderId}} Anda sudah diproses!')
  .setFooter('Leaves Guardian Store')
  .setVars({ nama: 'Rafa', orderId: '84920' })
  .mention(['628123456789@s.whatsapp.net'])
  .setAdReply({
    title: 'Leaves Guardian Docs',
    body: 'Enterprise Baileys Wrapper'
  });
```

---

## Contoh Penggunaan Praktis

### 1. Tombol Interaktif (`ButtonMessage`)

```javascript
import { ButtonMessage } from 'leaves-guardian';

const button = new ButtonMessage(client)
  .setTitle('Konfirmasi Pesanan')
  .setBody('Apakah Anda ingin memproses pembayaran sekarang?')
  .setFooter('Leaves Store')
  .addReply('✅ Bayar Sekarang', 'btn_pay')
  .addCopy('📋 Salin Kode Promo', 'DISKON20')
  .addUrl('🌐 Buka Toko', 'https://example.com/store');

await client.sendMessage(msg.chat.id, button);
```

### 2. Menu Pilihan List (`ListMessage`)

```javascript
import { ListMessage } from 'leaves-guardian';

const list = new ListMessage(client)
  .setTitle('Daftar Layanan')
  .setBody('Silakan pilih salah satu layanan kami:')
  .setButtonText('Lihat Menu')
  .addSection('Layanan Teknis', [
    { id: 'srv_bot', title: 'Pembuatan Bot WhatsApp', description: 'Integrasi kustom 24/7' },
    { id: 'srv_cloud', title: 'Cloud Hosting Server', description: 'Server VPS performa tinggi' }
  ]);

await client.sendMessage(msg.chat.id, list);
```

### 3. Polling Interaktif (`PollMessage`)

```javascript
import { PollMessage } from 'leaves-guardian';

const poll = new PollMessage(client)
  .setQuestion('Apa topik diskusi mingguan berikutnya?')
  .addOption('🚀 Optimasi Media Pipeline')
  .addOption('🛡️ Keamanan Memori & Watchdog')
  .addOption('📊 Egress Traffic Scheduling')
  .allowMultipleAnswers(false);

await client.sendMessage(msg.chat.id, poll);
```

---

## Panduan Terkait

- **[Menangkap Respon Tombol & Menu List](/id/guides/handling-responses)**: Menangani klik tombol dan pemilihan menu.
- **[Auto-Delete & Pesan Sementara](/id/guides/autodelete)**: Menjadwalkan penghapusan pesan otomatis.
- **[Skema Normalisasi Pesan](/id/guides/schema)**: Format pesan masuk yang terstandarisasi.
