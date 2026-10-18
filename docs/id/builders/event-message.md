# EventMessage Builder

`EventMessage` membangun payload undangan agenda kalender resmi WhatsApp Group Event (`proto.Message.EventMessage`).

Builder ini memungkinkan bot untuk menjadwalkan dan mengumumkan acara resmi di grup WhatsApp lengkap dengan waktu mulai, waktu selesai, lokasi pertemuan fisik/virtual, serta tautan panggilan suara atau video WhatsApp call resmi.

---

## Contoh Penggunaan Dasar

```javascript
import { EventMessage } from 'leaves-guardian';

const mingguDepan = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const waktuSelesai = new Date(mingguDepan.getTime() + 2 * 60 * 60 * 1000); // Durasi 2 jam

const acara = new EventMessage(client)
  .setName('🍃 Pertemuan Pengembang Leaves Guardian')
  .setDescription('Diskusi mendalam arsitektur Baileys, mitigasi memori, dan zero-downtime recovery.')
  .setStartTime(mingguDepan)
  .setEndTime(waktuSelesai)
  .setLocation('Discord Tech Stage / Jakarta')
  .setCallLink('https://call.whatsapp.com/video/contoh123');

await client.sendMessage(groupJid, acara);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setName(name)` | Mengatur judul nama agenda kegiatan. |
| `.setDescription(desc)` | Mengatur deskripsi detail agenda dan jadwal acara. |
| `.setStartTime(dateOrTimestamp)` | Mengatur waktu mulai (menerima objek `Date` atau timestamp milidetik). |
| `.setEndTime(dateOrTimestamp)` | Mengatur waktu selesai (menerima objek `Date` atau timestamp milidetik). |
| `.setLocation(locationName)` | Mengatur nama tempat fisik atau lokasi online acara. |
| `.setCallLink(url)` | Menyematkan tautan panggilan suara/video resmi WhatsApp. |
| `.setCanceled(boolean)` | Menandai acara tersebut sebagai dibatalkan jika diperlukan. |

---

## Navigasi Terkait

- **[PollMessage Builder](/id/builders/poll-message)**: Pembuatan polling dan voting grup.
- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol aksi interaktif.
- **[Group Metadata Cache](/id/reliability/group-cache)**: Manajemen metadata grup WhatsApp berkecepatan tinggi.
