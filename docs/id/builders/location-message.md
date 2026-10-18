# LocationMessage Builder (v0.3.11)

`LocationMessage` adalah builder kartu lokasi interaktif WhatsApp modern yang diperkenalkan pada **Leaves Guardian v0.3.8** dan disempurnakan dengan **Adaptive Byte-Budget Retina HD pada v0.3.11**.

Builder ini menghasilkan pesan bergaya kartu *Share Location* resmi WhatsApp dengan icon pin merah `📍`, nama/judul tebal, teks alamat/deskripsi, thumbnail avatar atau peta persegi di sebelah kanan kartu, serta tombol aksi interaktif (*Native Flow*) dan menu dropdown di bawahnya.

---

## Keunggulan LocationMessage

1. **Tampilan Elegan & Eksklusif**: Memberikan kesan bot asisten profesional seperti akun WhatsApp Business resmi dengan layout kartu terpadu dan thumbnail avatar di sebelah kanan.
2. **Kompresi Thumbnail Adaptive Retina HD (v0.3.11)**: WhatsApp memiliki batasan internal client ponsel sebesar 32 KiB (32.768 bytes) untuk inline thumbnail Protobuf. Pipeline multi-engine (`sharp` -> `@napi-rs/canvas` -> `jimp`) di v0.3.11 secara otomatis mengompresi gambar ke resolusi 300x300 dengan algoritma Lanczos3, penajaman *unsharp mask* (`.sharpen()`), `chromaSubsampling: '4:4:4'`, dan kompresi MozJPEG adaptif yang menjamin ukuran file selalu berada di bawah ambang batas aman (<= 30.000 bytes, rata-rata ~24-27 KB). Gambar tampil super tajam dan jernih tanpa risiko gambar hilang atau blank di aplikasi WhatsApp Android maupun iOS.
3. **Bebas Silent Drop & Error 401**: WhatsApp memvalidasi paket stansa lokasi secara aman pada perangkat Multi-Device tanpa memicu penghapusan diam-diam (*silent drop*) akibat payload Protobuf yang terlalu besar.
4. **Mewarisi Kemampuan Tombol Lengkap**: Karena merupakan turunan dari `ButtonMessage`, Anda dapat menambahkan tombol Quick Reply, CTA URL, CTA Copy, CTA Call, hingga menu Dropdown pilihan sekaligus.

---

## Daftar Method Khusus

| Method | Keterangan |
| :--- | :--- |
| `.setName(name)` | Mengatur judul utama yang tampil tebal di samping icon pin `📍`. |
| `.setAddress(address)` | Mengatur teks deskripsi atau alamat di bawah judul. |
| `.setThumbnail(thumb, opts)` | Mengatur thumbnail gambar persegi di sebelah kanan kartu (menerima URL web, Buffer, atau path file lokal). Otomatis dikompresi ke 300x300 JPEG Retina HD dengan penjaminan byte-budget <= 30 KB. Opsi kustom `{ width, height, quality }` bersifat opsional. |
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

## Kompresi Thumbnail Adaptive Retina HD (Smart Multi-Engine)

Di WhatsApp, thumbnail kartu lokasi disematkan langsung di dalam aliran data Protobuf biner (`jpegThumbnail`). WhatsApp client di perangkat mobile memiliki batasan internal tegas sebesar **32 KiB (32.768 bytes)**. Apabila ukuran `jpegThumbnail` melebihi 32 KB, aplikasi WhatsApp di ponsel Android maupun iOS akan membuang (*drop*) gambar tersebut sehingga kartu lokasi tampil tanpa gambar thumbnail (blank).

Di **Leaves Guardian v0.3.11**, `LocationMessage` dan `.setLocationHeader()` pada `ButtonMessage` / `ListMessage` dilengkapi pipeline multi-engine adaptif berstandar **Retina HD** dengan jaminan ukuran aman (<= 30.000 bytes):

1. **Sharp (Rekomendasi Utama)**: Menggunakan MozJPEG, Lanczos3 resampling, unsharp mask (`.sharpen({ sigma: 1.0, m1: 0.5, m2: 0.5 })`), serta `chromaSubsampling: '4:4:4'` untuk kejernihan dan ketajaman visual tingkat tinggi di layar HP AMOLED/Retina. Dilengkapi loop adaptif yang otomatis menguji ukuran output dan menurunkan kualitas secara bertahap jika melebihi 30 KB, sehingga output selalu berada di kisaran ~24-27 KB yang aman dan stabil. Otomatis aktif bila Baileys atau bot Anda menginstal `sharp`.
2. **@napi-rs/canvas (Fallback Pertama)**: Menggunakan Rust Skia engine bawaan Leaves Guardian dengan `imageSmoothingQuality = 'high'` dan resolusi aman 300x300 quality 80%.
3. **Jimp (Fallback Murni JS)**: Menggunakan engine JavaScript murni untuk lingkungan tanpa binary native.
4. **Buffer Asli (Safety Net)**: Jika seluruh engine tidak tersedia, buffer asli tetap diteruskan tanpa menghentikan bot.

Secara default, gambar dipotong persegi (*center cover-crop*) berukuran 300x300 pixel dengan format JPEG 85% quality. Anda juga dapat menyesuaikan dimensinya:

```javascript
// Mengatur resolusi atau kualitas kustom
kartuAsisten.setThumbnail('https://example.com/foto.png', {
  width: 300,
  height: 300,
  quality: 85,
});
```

---

## Navigasi Terkait

- **[ButtonMessage Builder](/id/builders/button-message)**: Builder tombol native flow standar.
- **[ListMessage Builder](/id/builders/list-message)**: Builder menu pop-up list.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Panduan lengkap penanganan event interaktif.

