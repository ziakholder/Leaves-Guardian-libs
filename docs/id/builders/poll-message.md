# PollMessage Builder

`PollMessage` membangun pesan pemungutan suara / voting resmi WhatsApp (`proto.Message.PollCreationMessage`).

Builder ini mendukung polling pilihan tunggal (*single-choice*) maupun banyak pilihan (*multi-choice*) yang dapat dikirimkan ke obrolan pribadi (PC) maupun grup WhatsApp.

---

## Contoh Penggunaan Dasar

```javascript
import { PollMessage } from 'leaves-guardian';

const polling = new PollMessage(client)
  .setQuestion('Fitur apa yang ingin Anda lihat di update berikutnya?')
  .addOption('🚀 Media Pipeline SSRF Filter')
  .addOption('📊 Dashboard Metrik Trafik Real-time')
  .addOption('🎨 Template Canvas UI Interaktif')
  .allowMultipleAnswers(false); // Hanya boleh memilih 1 opsi

await client.sendMessage(msg.chat.id, polling);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setQuestion(pertanyaan)` | Mengatur pertanyaan utama polling (alias untuk `.setTitle()`). |
| `.addOption(namaOpsi)` | Menambahkan satu opsi pilihan (minimal 2 opsi, maksimal 12 opsi). |
| `.allowMultipleAnswers(boolean)` | Menentukan apakah pengguna boleh memilih lebih dari 1 opsi (`true` = multi-select, `false` = single-select). |
| `.setSelectableCount(angka)` | Setter tingkat rendah untuk batas pilihan (`0` = multi-select bebas, `1` = single-select). |

---

## Aturan Validasi WhatsApp

- **Jumlah Minimal**: Polling wajib memiliki sekurang-kurangnya **2 opsi**.
- **Jumlah Maksimal**: Protokol WhatsApp membatasi maksimal **12 opsi** per pesan polling. Menambahkan lebih dari 12 opsi akan melempar `ContentValidationError`.

---

## Menangkap Suara / Respon Polling

Pembaruan suara polling dikirimkan oleh WhatsApp melalui event `messages.update` dengan payload enkripsi `pollUpdateMessage`. Leaves Guardian memvalidasi dan memproses event tersebut secara otomatis pada `MessageStore`.

---

## Navigasi Terkait

- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol aksi native flow.
- **[ListMessage Builder](/id/builders/list-message)**: Menu pilihan pop-up vertikal.
- **[Menangkap Respon Interaktif](/id/builders/handling-responses)**: Panduan menangkap event interaksi pengguna.
