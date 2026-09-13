# Interaksi & Tanya Jawab (Prompt & Collector)

Leaves Guardian menyediakan dua utilitas utama untuk menangani percakapan dua arah yang interaktif antara pengguna dan bot WhatsApp:

1. **`Prompt`**: Wizard alur percakapan langkah-demi-langkah (*multi-step wizard*), validasi input otomatis, percobaan ulang (*retry*), dan dialog konfirmasi.
2. **`MessageCollector`**: Mesin penangkap pesan masuk tingkat rendah (*lower-level collector*) yang memfilter pesan berdasarkan pengirim, jenis pesan, atau batas waktu.

---

## 1. Helper Cepat: `Prompt.ask()`, `confirm()`, `select()`

Untuk pertanyaan tunggal yang sederhana, gunakan static method pada class `Prompt`:

### Tanya Jawab Sederhana (`Prompt.ask`)

```javascript
import { Prompt } from 'leaves-guardian';

// Mengajukan pertanyaan dan memvalidasi jawaban berupa angka umur
const age = await Prompt.ask(client, msg.chat.id, 'Berapa usia Anda saat ini?', {
  validate: (val) => (!isNaN(val) && Number(val) > 0) || 'Mohon masukkan angka umur yang valid.'
});

await client.sendText(msg.chat.id, `Umur Anda tercatat: ${age} tahun.`);
```

### Konfirmasi Ya/Tidak (`Prompt.confirm`)

`Prompt.confirm()` mengenali kata kunci persetujuan (`ya`, `y`, `yes`, `ok`, `1`, `true`) dan penolakan (`tidak`, `t`, `no`, `0`, `false`), serta mengembalikan nilai bertipe `boolean`:

```javascript
const confirmed = await Prompt.confirm(
  client,
  msg.chat.id,
  'Apakah Anda yakin ingin melanjutkan proses registrasi?'
);

if (confirmed) {
  await client.sendText(msg.chat.id, '✅ Melanjutkan proses pendaftaran...');
} else {
  await client.sendText(msg.chat.id, '❌ Pendaftaran dibatalkan.');
}
```

### Memilih Opsi Menu (`Prompt.select`)

```javascript
const pilihan = await Prompt.select(
  client,
  msg.chat.id,
  'Silakan pilih layanan yang Anda inginkan:',
  ['Konsultasi Akun', 'Layanan Teknis', 'Pembayaran & Tagihan']
);

await client.sendText(msg.chat.id, `Anda memilih: *${pilihan}*`);
```

---

## 2. Wizard Multi-Langkah (`Prompt`)

Untuk formulir pendaftaran bertingkat atau alur data kompleks:

```javascript
import { Prompt } from 'leaves-guardian';

client.on('message', async (msg) => {
  if (msg.text === '!daftar') {
    const wizard = new Prompt(client, {
      timeout: 120000,      // Batas waktu total 2 menit
      stepTimeout: 45000,   // Batas waktu per langkah 45 detik
      cancelKeywords: ['batal', 'cancel', 'exit', 'quit']
    });

    // Langkah 1: Nama Lengkap
    wizard.addStep({
      id: 'nama',
      question: '👤 Siapa nama lengkap Anda?',
      validate: (val) => val.trim().length >= 3 || 'Nama minimal 3 karakter.'
    });

    // Langkah 2: Email
    wizard.addStep({
      id: 'email',
      question: '📧 Masukkan alamat email aktif Anda:',
      validate: (val) => val.includes('@') && val.includes('.') || 'Format email tidak valid.',
      transform: (val) => val.trim().toLowerCase()
    });

    try {
      const hasil = await wizard.run(msg.chat.id, msg.sender.id);
      // hasil = { nama: 'Rafa Dito', email: 'rafa@example.com' }

      await client.sendText(
        msg.chat.id,
        `🎉 Pendaftaran Berhasil!\n• Nama: ${hasil.nama}\n• Email: ${hasil.email}`
      );
    } catch (err) {
      if (err.name === 'PromptCancelledError') {
        await client.sendText(msg.chat.id, '❌ Pendaftaran telah dibatalkan.');
      } else if (err.name === 'PromptTimeoutError') {
        await client.sendText(msg.chat.id, '⏳ Waktu pendaftaran telah habis.');
      } else {
        await client.sendText(msg.chat.id, `⚠️ Error: ${err.message}`);
      }
    }
  }
});
```

---

## 3. Menangkap Pesan Kustom: `MessageCollector`

Gunakan `MessageCollector` saat Anda ingin mengumpulkan beberapa pesan dalam rentang waktu tertentu:

```javascript
import { MessageCollector } from 'leaves-guardian';

const collector = new MessageCollector(client, {
  chatId: msg.chat.id,
  senderId: msg.sender.id,
  timeout: 30000, // Berhenti setelah 30 detik
  max: 5          // Maksimal mengumpulkan 5 pesan
});

collector.on('collect', (m) => {
  console.log(`Pesan tertangkap: ${m.text}`);
});

collector.on('end', (collectedMap, reason) => {
  console.log(`Pengumpulan selesai. Alasan: ${reason}. Total: ${collectedMap.size}`);
});
```

---

## Panduan Terkait

- **[Auto-Delete & Pesan Sementara](/id/guides/autodelete)**: Menjadwalkan penghapusan pesan otomatis.
- **[Skema Normalisasi Pesan](/id/guides/schema)**: Memahami struktur objek pesan masuk.
- **[Pengenalan & Filosofi](/id/quickstart/overview)**: Model arsitektur Leaves Guardian.
