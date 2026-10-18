# LocationMessage Builder (v0.3.8)

`LocationMessage` adalah builder kartu lokasi interaktif WhatsApp modern yang diperkenalkan pada **Leaves Guardian v0.3.8**.

Builder ini menghasilkan pesan bergaya kartu *Share Location* resmi WhatsApp dengan icon pin merah `📍`, nama/judul tebal, teks alamat/deskripsi, thumbnail avatar atau peta persegi di sebelah kanan kartu, serta tombol aksi interaktif (*Native Flow*) dan menu dropdown di bawahnya.

---

## Keunggulan LocationMessage

1. **Tampilan Elegan & Eksklusif**: Memberikan kesan bot asisten profesional seperti akun WhatsApp Business resmi dengan layout kartu terpadu dan thumbnail avatar di sebelah kanan.
2. **Bebas Silent Drop & Error 401**: WhatsApp memvalidasi paket stansa lokasi secara aman pada perangkat Multi-Device tanpa memicu penghapusan diam-diam (*silent drop*).
3. **Mewarisi Kemampuan Tombol Lengkap**: Karena merupakan turunan dari `ButtonMessage`, Anda dapat menambahkan tombol Quick Reply, CTA URL, CTA Copy, CTA Call, hingga menu Dropdown pilihan sekaligus.

---

## Daftar Method Khusus

| Method | Keterangan |
| :--- | :--- |
| `.setName(name)` | Mengatur judul utama yang tampil tebal di samping icon pin `📍`. |
| `.setAddress(address)` | Mengatur teks deskripsi atau alamat di bawah judul. |
| `.setThumbnail(thumb)` | Mengatur thumbnail gambar persegi di sebelah kanan kartu (menerima URL web, Buffer, atau path file lokal). |
| `.setCoordinates(lat, long)` | Mengatur koordinat latitude & longitude (opsional, default `0, 0`). |
| `.addReply(text, id)` | Menambahkan tombol aksi quick reply. |
| `.addUrl(text, url)` | Menambahkan tombol tautan web browser eksternal. |
| `.addCopy(text, code)` | Menambahkan tombol salin cepat ke clipboard. |
| `.addDropdown(title, sections)` | Menambahkan tombol pilihan menu dropdown pop-up list. |
| `.setBody(body)` | Mengatur teks tambahan di bawah kartu lokasi jika diinginkan. |
| `.setFooter(footer)` | Mengatur catatan kaki (*footer*) pesan. |

---

## Contoh Penggunaan Praktis

### 1. Kartu Sambutan Menu Bot Asisten

```javascript
import { LocationMessage } from 'leaves-guardian';

const kartuAsisten = new LocationMessage(client)
  .setName('Hai Kak Rafa~ 👋')
  .setAddress('Aku Sylphy, asisten setia kamu. Silakan pilih menu interaktif di bawah ini ya! 🌸')
  .setThumbnail('https://example.com/avatar-sylphy.jpg')
  .addReply('📋 Buka Semua Menu', '.menu')
  .addCopy('✨ Salin ID Pengguna', 'USER-9821')
  .addUrl('🌐 Kunjungi Website', 'https://leavesguardian.enginelabs.my.id');

await client.sendMessage(msg.chat.id, kartuAsisten);
```

### 2. Kartu Lokasi dengan Menu Dropdown Pilihan

```javascript
import { LocationMessage } from 'leaves-guardian';

const kartuLayanan = new LocationMessage(client)
  .setName('🏢 Kantor Layanan Royal Engine')
  .setAddress('Grand Orchard Tower Lt. 12, Jakarta Selatan. Buka Senin - Jumat 09:00 - 18:00 WIB.')
  .setThumbnail('https://example.com/gedung-kantor.jpg')
  .setCoordinates(-6.2088, 106.8456)
  .addDropdown('📋 Pilih Layanan', [
    {
      title: 'Konsultasi Teknis',
      rows: [
        { id: 'srv_bot', title: 'Pembuatan Bot WhatsApp', description: 'Arsitektur Node.js Baileys 24/7' },
        { id: 'srv_cloud', title: 'Deployment Cloud VPS', description: 'Server anti-downtime & auto-purge' }
      ]
    },
    {
      title: 'Dukungan Pelanggan',
      rows: [
        { id: 'srv_cs', title: 'Hubungi Customer Care', description: 'Respon cepat di jam kerja' }
      ]
    }
  ])
  .addReply('📍 Petunjuk Arah', 'btn_arah')
  .addCall('📞 Telepon Kantor', '+6281234567890');

await kartuLayanan.send(msg.chat.id);
```

---

## Menangkap Respon Interaksi

Sama seperti `ButtonMessage`, ketika pengguna menekan tombol *Quick Reply* atau memilih menu *Dropdown*, bot akan menerima event `message`:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'BUTTON') {
    console.log('Tombol ditekan:', msg.text);
  } else if (msg.type === 'LIST') {
    console.log('Item dropdown dipilih:', msg.text);
  }
});
```

---

## Navigasi Terkait

- **[ButtonMessage Builder](/id/builders/button-message)**: Builder tombol native flow standar.
- **[ListMessage Builder](/id/builders/list-message)**: Builder menu pop-up list.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Panduan lengkap penanganan event interaktif.
