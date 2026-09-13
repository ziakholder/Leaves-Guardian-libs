# Auto-Delete & Pesan Sementara (Ephemeral)

Leaves Guardian menyediakan dua mekanisme terpisah untuk menangani pesan yang memiliki masa aktif terbatas:

1. **`AutoDeleteManager`**: Penghapusan pesan berbasis timer di sisi server bot (*client-side*). Menarik/menghapus pesan untuk semua orang (*Delete for Everyone*) setelah jeda milidetik tertentu.
2. **`EphemeralMessage`**: Pesan sementara berbasis protokol asli WhatsApp (*native disappearing messages*). Pesan kedaluwarsa secara otomatis di server WhatsApp tanpa menggunakan memori atau timer Node.js.

---

## 1. Auto-Delete Manager (`AutoDeleteManager`)

Gunakan `AutoDeleteManager` ketika Anda membutuhkan pesan terhapus secara otomatis dalam durasi pendek (hitungan detik atau menit), seperti kode OTP, notifikasi peringatan sementara, atau pesan konfirmasi.

### Mengirim dan Menjadwalkan Otomatis: `sendAndAutoDelete`

```javascript
// Kirim pesan OTP yang akan otomatis terhapus dalam 30 detik (30.000 ms)
const { message, task } = await client.sendAndAutoDelete(
  msg.chat.id,
  '🔐 Kode verifikasi Anda adalah *918234*. Pesan ini akan terhapus dalam 30 detik.',
  30000
);

console.log(`Task auto-delete terjadwal dengan ID: ${task.id}`);
```

### Validasi Jeda Waktu (`validateDelay`)
Leaves Guardian menerapkan validasi ketat pada durasi delay:
- **Wajib Non-Negatif**: Nilai `delayMs >= 0` harus terpenuhi. Memberikan nilai negatif akan melempar `LeavesValidationError` dengan kode `AUTODELETE_INVALID_DELAY`.
- **Integer Milidetik**: Nilai berupa bilangan bulat dalam milidetik (misal: `10000` untuk 10 detik).

### Membatalkan Jadwal Penghapusan
Jika kondisi berubah sebelum jeda waktu habis, Anda dapat membatalkan timer:

```javascript
// Pembatalan langsung via instance task
task.cancel();

// Atau pembatalan via manager berdasarkan ID task
client.autoDelete.cancel(task.id);
```

---

## 2. Pesan Sementara Asli WhatsApp (`EphemeralMessage`)

Gunakan `EphemeralMessage` untuk pesan yang ingin diatur agar hilang setelah periode hari/bulan sesuai kebijakan resmi WhatsApp tanpa membebani memori server bot Anda.

### Durasi Resmi (`EPHEMERAL_DURATIONS`)

```javascript
import { EphemeralMessage, EPHEMERAL_DURATIONS } from 'leaves-guardian';

console.log(EPHEMERAL_DURATIONS);
// {
//   ONE_DAY: 86400,        // 24 Jam
//   ONE_WEEK: 604800,      // 7 Hari (Default)
//   THREE_MONTHS: 7776000, // 90 Hari
//   DISABLED: 0            // Nonaktif
// }
```

### Mengirim Pesan Ephemeral

```javascript
import { EphemeralMessage, EPHEMERAL_DURATIONS } from 'leaves-guardian';

const ephemeral = new EphemeralMessage()
  .setContent({ text: '⏳ Pesan ini akan otomatis hilang dalam 24 jam secara native.' })
  .setExpiration(EPHEMERAL_DURATIONS.ONE_DAY);

await client.sendMessage(msg.chat.id, ephemeral);
```

---

## Perbandingan AutoDelete vs Ephemeral

| Fitur | `AutoDeleteManager` | `EphemeralMessage` |
| :--- | :--- | :--- |
| **Mekanisme** | Timer Node.js memanggil `deleteMessage()` | Protokol server-side WhatsApp disappearing |
| **Rentang Waktu** | Kustom milidetik (`delayMs >= 0`) | Durasi tetap WhatsApp (24 Jam, 7 Hari, 90 Hari) |
| **Penggunaan Resource** | 1 timer aktif per task | **0 Timer / 0 MB memori** |
| **Tampilan di WhatsApp** | Pesan ditarik ("Pesan ini telah dihapus") | Pesan memudar/hilang secara senyap |

---

## Panduan Terkait

- **[Interaksi & Tanya Jawab (Prompt & Collector)](/id/guides/prompts)**: Menangani alur percakapan interaktif.
- **[Skema Normalisasi Pesan](/id/guides/schema)**: Format pesan masuk yang terstandarisasi.
- **[Instalasi & Quick Start](/id/quickstart/quickstart)**: Memulai bot dengan cepat.
