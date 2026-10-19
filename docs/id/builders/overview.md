# Ringkasan Message Builders

Leaves Guardian menyediakan rangkaian **Message Builders** (Layer 5) untuk membangun pesan WhatsApp yang kaya, modern, interaktif, dan terstruktur menggunakan *fluent chainable API*.

Semua builder mewarisi fungsionalitas dasar dari `BaseBuilder`. Hal ini memberikan kemampuan bersama seperti *string templating*, forwarding saluran resmi (*channel newsletter*), kartu link preview (*external ad reply*), mention pengguna, dan kutipan pesan (*quote*).

---

## Daftar Lengkap Message Builders

| Class Builder | Tipe Payload WhatsApp | Kemampuan Utama |
| :--- | :--- | :--- |
| **`TextMessage`** | `extendedTextMessage` | Teks terformat, markdown, toggle link preview, advanced link preview (v0.4.0), mention, dan quote. |
| **`ButtonMessage`** | `interactiveMessage` | Tombol native flow (Quick Reply, CTA URL, CTA Copy, CTA Call, Dropdown List) dan konversi ke carousel card `.toCard()`. |
| **`ButtonMessageV2`** | `buttonsMessage` | Pesan tombol klasik dengan trik `headerType: 6` (Location Header) agar tombol tetap muncul di WhatsApp klien lawas. |
| **`LocationMessage`** | `interactiveMessage` | Kartu lokasi interaktif dengan pin 📍, judul tebal, deskripsi, thumbnail avatar, dan tombol aksi. |
| **`ListMessage`** | `interactiveMessage` | Menu pop-up vertikal bertingkat dengan section, row pilihan, dan header media/lokasi. |
| **`CarouselMessage`** | `interactiveMessage` | Kartu swipe horizontal multi-kartu dengan gambar dan tombol interaktif per kartu, serta input array tombol. |
| **`AlbumMessage`** | `albumMessage` | Koleksi foto dan video asli WhatsApp yang otomatis dikelompokkan ke dalam satu kartu grid album. |
| **`OrderMessage`** | `orderMessage` | Kartu faktur dan ringkasan pesanan katalog resmi WhatsApp dengan rincian harga dan nominal mikro. |
| **`StickerPackMessage`** | `stickerPackMessage` | Bundel paket stiker WhatsApp resmi lengkap dengan tray cover icon dan pemetaan emoji keyboard. |
| **`MediaMessage`** | Unified Media | Satu builder terpadu untuk Gambar, Video, Audio/Voice Note (PTT), Dokumen, dan Stiker. |
| **`StickerMessage`** | `stickerMessage` | Konversi stiker WebP statis/animasi dengan metadata EXIF nama pack & author. |
| **`ProductMessage`** | `productMessage` | Kartu katalog produk resmi WhatsApp dengan mata uang, harga, dan ID retailer. |
| **`PollMessage`** | `pollCreationMessage` | Polling interaktif WhatsApp dengan pilihan tunggal (single-choice) atau multi-choice. |
| **`AIRichMessage`** | `interactiveMessage` | Kartu respon AI terstruktur dengan blok kode copyable, badge model, sitasi sumber, dan widget HTML interaktif. |
| **`CanvasMessage`** | `interactiveMessage` | Generator payload antarmuka canvas HTML dengan whitelist domain aman. |
| **`EventMessage`** | `eventMessage` | Undangan agenda kalender resmi WhatsApp Group Event dengan waktu mulai/selesai. |
| **`RichMessage`** | `interactiveMessage` | Kartu visual serbaguna dengan header, body, footer, badge status, dan tombol aksi. |
| **`A2UIMessage`** | `interactiveMessage` | Agent-to-User Interface widget berbasis arsitektur Meta Bloks / StarCore. |

---

## Method Bersama (BaseBuilder)

Karena seluruh builder mewarisi class `BaseBuilder`, method-method *chaining* berikut tersedia di semua builder:

### 1. Header, Body, dan Footer
```javascript
builder
  .setTitle('Judul Kartu')
  .setBody('Isi pesan utama dengan dukungan variabel {{nama}}')
  .setFooter('Catatan kaki bot');
```

### 2. String Templating Bawaan (`setVars`)
Anda dapat menyisipkan placeholder `{{variabel}}` di dalam teks apa pun dan menyelesaikannya secara dinamis menggunakan `.setVars()`:

```javascript
builder
  .setBody('Halo {{nama}}, pesanan nomor #{{orderId}} kamu siap dikirim!')
  .setVars({ nama: 'Rafa', orderId: '84920' });
```

### 3. External Ad Reply Link Preview (`setAdReply`)
Menempelkan banner gambar besar dengan watermark link di atas pesan:

```javascript
builder.setAdReply({
  title: 'Leaves Guardian Documentation',
  body: 'Enterprise Baileys Reliability Layer',
  thumbnailUrl: 'https://example.com/banner.jpg',
  sourceUrl: 'https://leavesguardian.enginelabs.my.id',
  previewType: 'PHOTO'
});
```

### 4. Forwarding Saluran Resmi (`setChannelForward`)
Mensimulasikan konteks bahwa pesan ini diteruskan dari Channel / Saluran resmi WhatsApp:

```javascript
builder.setChannelForward({
  channelJid: '120363000000000000@newsletter',
  channelName: 'Pengumuman Resmi Bot'
});
```

### 5. Mention Pengguna dan Quoting Pesan
```javascript
builder
  .mention(['628123456789@s.whatsapp.net'])
  .quote(pesanMasuk);
```

---

## Cara Mengirim Builder

Ada dua cara yang sama-sama valid untuk mengirimkan builder:

### Opsi A: Lewat `client.sendMessage()` (Direkomendasikan)
```javascript
import { TextMessage } from 'leaves-guardian';

const pesan = new TextMessage()
  .setBody('Halo dunia dari Leaves Guardian!');

await client.sendMessage(msg.chat.id, pesan);
```

### Opsi B: Lewat Method `.send()` pada Instance Builder
Jika Anda mengoper instance `client` saat instansiasi builder:

```javascript
const pesan = new TextMessage(client)
  .setBody('Halo dunia langsung dari builder!');

await pesan.send(msg.chat.id);
```

---

## Navigasi Dokumentasi Builder

Pilih dokumentasi builder spesifik di bawah ini untuk melihat contoh kode dan parameter lengkap:

- **[TextMessage](/id/builders/text-message)**: Pengiriman teks terformat dan kutipan pesan.
- **[ButtonMessage](/id/builders/button-message)**: Tombol native flow, URL link, copy promo, dan dropdown menu.
- **[LocationMessage](/id/builders/location-message)**: Kartu lokasi interaktif dengan pin 📍, avatar thumbnail, dan tombol.
- **[ListMessage](/id/builders/list-message)**: Menu pop-up vertikal bertingkat (*single select*).
- **[CarouselMessage](/id/builders/carousel-message)**: Kartu geser horizontal multi-card.
- **[MediaMessage](/id/builders/media-message)**: Pengiriman gambar, video, audio PTT, dan dokumen terpadu.
- **[StickerMessage](/id/builders/sticker-message)**: Pembuatan stiker WebP dengan metadata EXIF kustom.
- **[ProductMessage](/id/builders/product-message)**: Kartu katalog produk WhatsApp.
- **[PollMessage](/id/builders/poll-message)**: Pembuatan polling dan voting interaktif.
- **[AIRichMessage](/id/builders/ai-rich-message)**: Kartu respon AI dengan blok kode dan badge.
- **[CanvasMessage](/id/builders/canvas-message)**: Kartu antarmuka canvas HTML.
- **[EventMessage](/id/builders/event-message)**: Undangan kalender acara grup WhatsApp.
- **[RichMessage](/id/builders/rich-message)**: Kartu visual serbaguna.
- **[A2UIMessage](/id/builders/a2ui-message)**: Antarmuka generatif Agent-to-UI widget.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Panduan menangkap klik tombol dan pemilihan menu.
