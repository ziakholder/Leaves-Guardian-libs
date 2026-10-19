# ButtonMessageV2 Builder (v0.4.0)

`ButtonMessageV2` (alias `ButtonV2`) adalah builder pesan tombol WhatsApp klasik (*legacy buttonsMessage*) yang diperkenalkan pada **Leaves Guardian v0.4.0**.

Builder ini mengimplementasikan trik khusus protokol WhatsApp dengan menetapkan `headerType: 6` (Location Header) pada payload `buttonsMessage` lama, sehingga tombol-tombol respon cepat (*quick reply*) tetap dapat muncul dan diklik pada klien WhatsApp lawas atau modifikasi WhatsApp tertentu yang memblokir format *Native Flow* baru.

---

## Keunggulan ButtonMessageV2

1. **Kompatibilitas WhatsApp Lawas**: Memastikan pengguna WhatsApp versi lama atau WhatsApp Web versi tertentu tetap dapat melihat dan menekan tombol tanpa mengalami pesan kosong (*blank bubble*).
2. **Desain Kompak & Bersih**: Menyediakan judul, subjudul, isi pesan utama, serta catatan kaki (*footer*) dalam format pesan tombol sederhana.
3. **Format Quick Reply Teruji**: Menghasilkan respon teks instan saat tombol ditekan oleh pengguna.

---

## Daftar Method

| Method | Tipe Parameter | Keterangan |
| :--- | :--- | :--- |
| `.setTitle(title)` | `string` | Mengatur judul kartu (muncul pada lokasi header). |
| `.setSubtitle(subtitle)` | `string` | Mengatur subjudul atau alamat pada header. |
| `.setBody(body)` | `string` | Mengatur teks pesan utama. |
| `.setFooter(footer)` | `string` | Mengatur catatan kaki pesan. |
| `.addButton(displayText, buttonId)` | `string, string` | Menambahkan tombol quick reply. |
| `.send(jid, options)` | `string, Object` | Mengirim pesan tombol V2 ke target WhatsApp JID. |

---

## Contoh Penggunaan Praktis

```javascript
import { ButtonMessageV2 } from 'leaves-guardian';

const btn = new ButtonMessageV2(client)
  .setTitle('Menu Navigasi Klasik')
  .setSubtitle('Pilihan Cepat Pengguna')
  .setBody('Silakan pilih salah satu layanan kami di bawah ini:')
  .setFooter('Leaves Guardian v0.4.0')
  .addButton('🔥 Cek Promo', 'promo_btn')
  .addButton('📞 Hubungi CS', 'cs_btn');

await btn.send(msg.chat.id);
```
