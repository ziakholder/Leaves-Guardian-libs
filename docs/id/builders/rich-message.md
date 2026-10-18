# RichMessage Builder

`RichMessage` membangun kartu visual serbaguna (*visual flex card*) untuk WhatsApp dengan header terstruktur, paragraf deskripsi, lencana status (*badge*), dan tombol aksi interaktif.

Builder ini sangat cocok untuk menyajikan pengumuman sistem, ringkasan transaksi, laporan status server, atau kartu informasi resmi.

---

## Contoh Penggunaan Dasar

```javascript
import { RichMessage } from 'leaves-guardian';

const kartuPengumuman = new RichMessage(client)
  .setHeader('📢 Pengumuman Sistem', 'Pemeliharaan Selesai')
  .setBody('Peningkatan infrastruktur untuk Leaves Guardian v0.3.8 telah berhasil diterapkan!')
  .addBadge('Versi 0.3.8', '#15803d')
  .setFooter('Royal Engine Studio')
  .addButton('📖 Lihat Catatan Rilis', 'lihat_rilis')
  .addButton('🌐 Kunjungi Dokumentasi', 'https://leavesguardian.enginelabs.my.id', 'url');

await client.sendMessage(msg.chat.id, kartuPengumuman);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setHeader(title, subtitle)` | Mengatur judul kepala kartu dan subjudul pendukung. |
| `.setBody(text)` | Mengatur isi teks deskripsi utama. |
| `.setFooter(footer)` | Mengatur catatan kaki di bagian bawah kartu. |
| `.addBadge(label, color)` | Menambahkan lencana status visual berwarna. |
| `.addButton(text, idOrUrl, type)` | Menambahkan tombol aksi interaktif (`'reply'`, `'url'`, atau `'copy'`). |

---

## Navigasi Terkait

- **[AIRichMessage Builder](/id/builders/ai-rich-message)**: Pembuat kartu respon terstruktur AI.
- **[ButtonMessage Builder](/id/builders/button-message)**: Pembuat tombol aksi native flow.
- **[TextMessage Builder](/id/builders/text-message)**: Pengiriman pesan teks biasa.
