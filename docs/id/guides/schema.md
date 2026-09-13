# Skema Normalisasi Pesan (Normalized Message)

Pada Baileys murni, setiap pesan masuk diterima dalam struktur protobuf yang bertingkat dan dinamis. Menangani berbagai tipe pesan (pesan teks, media, view-once, pesan sementara, atau editan) secara manual sering kali menghasilkan kode yang rentan *error*.

Leaves Guardian menyederhanakan proses ini dengan mengubah setiap pesan mentah Baileys menjadi **objek `Message` yang terstandarisasi dan *immutable***.

---

## Kontrak Objek `Message`

Saat Anda mendengarkan event `client.on('message', (msg) => ...)`, Anda menerima instance dari class `Message`:

```javascript
client.on('message', async (msg) => {
  console.log(`ID Pesan: ${msg.id}`);
  console.log(`ID Percakapan: ${msg.chat.id} (Grup: ${msg.chat.isGroup})`);
  console.log(`Pengirim: ${msg.sender.id} (Dari Bot: ${msg.sender.isMe})`);
  console.log(`Tipe Pesan: ${msg.type}`);
  console.log(`Teks Pesan: ${msg.text}`);
  console.log(`Waktu: ${new Date(msg.timestamp).toISOString()}`);
});
```

---

## Referensi Struktur Data

Objek `Message` memiliki properti publik terverifikasi berikut:

```typescript
interface Message {
  readonly id: string;
  readonly chat: {
    readonly id: string;
    readonly isGroup: boolean;
  };
  readonly sender: {
    readonly id: string;
    readonly isMe: boolean;
  };
  readonly type: string;
  readonly text: string;
  readonly mentions: readonly string[];
  readonly quoted: {
    readonly id: string;
    readonly sender: string;
    readonly text: string;
    readonly type: string;
    readonly message: any;
  } | null;
  readonly media: {
    readonly mimetype: string;
    readonly isViewOnce: boolean;
    readonly [key: string]: any;
  } | null;
  readonly timestamp: number;
  readonly raw: any;
}
```

### Penjelasan Setiap Field

| Properti | Tipe Data | Deskripsi |
| :--- | :--- | :--- |
| `id` | `string` | ID unik pesan dari WhatsApp. |
| `chat.id` | `string` | JID percakapan tujuan (`xxx@s.whatsapp.net` untuk chat pribadi, `xxx@g.us` untuk grup). |
| `chat.isGroup` | `boolean` | Bernilai `true` jika pesan berasal dari grup WhatsApp. |
| `sender.id` | `string` | JID pengguna yang mengirim pesan (pada grup, ini adalah JID partisipan). |
| `sender.isMe` | `boolean` | Bernilai `true` jika pesan dikirim oleh akun bot sendiri. |
| `type` | `string` | Kategori tipe pesan (misal: `TEXT`, `IMAGE`, `VIDEO`, `STICKER`, `DOCUMENT`). |
| `text` | `string` | Konten teks pesan atau caption media yang diekstrak secara otomatis. |
| `mentions` | `string[]` | Daftar JID pengguna yang di-*mention* dalam pesan. |
| `quoted` | `object \| null` | Informasi konteks pesan yang dikutip/dibalas (jika ada). |
| `media` | `object \| null` | Metadata media lampiran (mimetype, flag isViewOnce, dll). |
| `timestamp` | `number` | Unix timestamp (dalam milidetik) saat pesan dikirim. |
| `raw` | `object` | **Objek pesan mentah Baileys** sebagai *escape hatch* tingkat lanjut. |

---

## Immutabilitas & Keamanan Data

Untuk mencegah terjadinya *race condition* dan perubahan data tak terduga pada event handler yang berjalan secara asinkron, seluruh objek `Message` dibekukan menggunakan `Object.freeze()`:

- **Tanpa Mutasi Properti**: Upaya untuk mengubah nilai properti seperti `msg.text = '...'` tidak akan berpengaruh (atau melempar `TypeError` pada mode *strict*).
- **Struktur Data Murni**: Objek `Message` adalah struktur data murni dan **tidak memiliki method instance** seperti `msg.reply()` atau `msg.delete()`.

> **Mengirim Balasan**: Pengiriman pesan balasan selalu dilakukan secara eksplisit melalui instance `LeavesClient`, contoh: `await client.sendText(msg.chat.id, 'Balasan')` atau `await client.sendMessage(msg.chat.id, payload)`.

---

## Escape Hatch: `msg.raw`

Meskipun skema normalisasi `Message` telah mencakup sebagian besar kebutuhan pembuatan bot, kebutuhan khusus tertentu mungkin memerlukan akses ke struktur pesan Baileys tingkat rendah.

Leaves Guardian menyediakan referensi ke pesan asli Baileys melalui properti `msg.raw`:

```javascript
client.on('message', async (msg) => {
  // Penggunaan normal
  console.log(msg.text);

  // Akses tingkat lanjut ke struktur mentah Baileys
  if (msg.raw) {
    const rawEphemeral = msg.raw.message?.ephemeralMessage;
    const rawKey = msg.raw.key;
  }
});
```

---

## Panduan Terkait

- **[Pengenalan & Filosofi](/id/quickstart/overview)**: Model mental dan batas tanggung jawab library.
- **[Arsitektur & Siklus Hidup](/id/quickstart/architecture)**: Penjelasan mendalam arsitektur 5 layer dan siklus hidup koneksi.
- **[Instalasi & Quick Start](/id/quickstart/quickstart)**: Membangun bot WhatsApp pertama dengan skema pesan ternormalisasi.
