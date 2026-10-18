# A2UIMessage Builder

`A2UIMessage` adalah builder pesan antarmuka generatif A2UI (*Agent-To-User Interface*) berbasis protokol Meta Bloks / StarCore Widget untuk WhatsApp Multi-Device.

Builder ini memungkinkan bot berbasis AI dan agen otonom merakit antarmuka komponen generatif (teks, tombol, kolom, kartu, gambar, dan formulir pilihan) yang langsung dirender secara native di dalam chat WhatsApp.

---

## Konsep Dasar A2UI

Berbeda dengan pesan statis biasa, A2UI bekerja dengan mendaftarkan komponen antarmuka (*widgets*) ke dalam sebuah pohon tata letak (*component tree*) menggunakan ID unik, kemudian menetapkan elemen terluar menggunakan method `.root([id1, id2, ...])`.

---

## Contoh Penggunaan Dasar: Formulir & Kartu

```javascript
import { A2UIMessage } from 'leaves-guardian';

const a2ui = new A2UIMessage(client);

// 1. Daftarkan elemen teks judul
const titleId = a2ui.text('🌿 Formulir Konfirmasi Layanan', { variant: 'title' });

// 2. Daftarkan gambar banner
const imgId = a2ui.image('https://example.com/cover.jpg', { fit: 'cover' });

// 3. Daftarkan teks deskripsi
const descId = a2ui.text('Silakan konfirmasi pesanan cloud server Anda:', { variant: 'body' });

// 4. Daftarkan pemilih opsi (ChoicePicker)
const pickerId = a2ui.choicePicker('Pilih Paket VPS:', [
  { id: 'vps_starter', label: 'Starter (1 vCPU, 2GB RAM)' },
  { id: 'vps_pro', label: 'Pro (2 vCPU, 4GB RAM)' }
], { displayStyle: 'checkbox' });

// 5. Daftarkan tombol konfirmasi
const btnTextId = a2ui.text('🚀 Konfirmasi & Pesan');
const btnId = a2ui.button(btnTextId, { variant: 'primary', action: 'submit_order' });

// 6. Susun elemen ke dalam kolom utama
const colId = a2ui.column([titleId, imgId, descId, pickerId, btnId]);

// 7. Jadikan kolom sebagai root interface
a2ui.root([colId]);

await client.sendMessage(msg.chat.id, a2ui);
```

---

## Menggunakan Template Cepat: `listCard`

Untuk tampilan daftar item atau menu transaksi cepat, `A2UIMessage` menyediakan pintasan praktis `.listCard()`:

```javascript
const daftarBelanja = new A2UIMessage(client)
  .listCard({
    title: '🧾 Rincian Tagihan Cloud',
    fallbackText: 'Rincian Tagihan Cloud Anda',
    items: [
      { title: 'VPS Singapore SG-01', price: 'Rp 120.000', assetType: 'SERVICE' },
      { title: 'Dedicated IPv4 Static', price: 'Rp 35.000', assetType: 'ADDON' },
      { title: 'Backup Harian Otomatis', price: 'Rp 15.000', assetType: 'ADDON' }
    ]
  });

await client.sendMessage(msg.chat.id, daftarBelanja);
```

---

## Daftar Komponen & Method

| Method | Keterangan |
| :--- | :--- |
| `.text(text, opts)` | Mendaftarkan komponen teks dengan varian (`'title'`, `'body'`, `'caption'`). |
| `.image(url, opts)` | Mendaftarkan komponen gambar dengan opsi `fit` (`'cover'`, `'contain'`). |
| `.video(url, opts)` | Mendaftarkan komponen pemutar video. |
| `.button(childId, opts)` | Mendaftarkan komponen tombol dengan varian dan payload `action`. |
| `.card(childId, opts)` | Membungkus komponen anak ke dalam wadah kartu dengan elevasi. |
| `.column(childrenArray, opts)` | Menata kumpulan komponen secara vertikal. |
| `.row(childrenArray, opts)` | Menata kumpulan komponen secara horizontal. |
| `.divider(opts)` | Menambahkan garis pemisah tipis (*divider*). |
| `.choicePicker(label, options, opts)` | Menampilkan pemilih opsi tunggal atau banyak (*mutuallyExclusive*). |
| `.textField(label, opts)` | Menampilkan kolom isian teks (*input text*). |
| `.root(childrenArray)` | Menentukan elemen tingkat teratas pohon komponen antarmuka. |
| `.listCard(opts)` | Pintasan pembuatan kartu daftar produk / tagihan siap pakai. |

---

## Navigasi Terkait

- **[AIRichMessage Builder](/id/builders/ai-rich-message)**: Kartu respon markdown AI.
- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol interaktif native flow.
- **[CanvasMessage Builder](/id/builders/canvas-message)**: Antarmuka canvas berbasis HTML.
