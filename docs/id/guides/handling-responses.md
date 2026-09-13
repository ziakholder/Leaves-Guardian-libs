# Menangkap Respon Tombol & Menu (Interactive Responses)

Saat pengguna berinteraksi dengan pesan yang dikirim menggunakan **`ButtonMessage`**, **`ListMessage`**, **`CarouselMessage`**, atau **`PollMessage`**, WhatsApp mengirimkan respon tindakan mereka kembali ke bot melalui event pesan masuk standar (`message`).

Leaves Guardian secara otomatis mengelompokkan jenis event interaktif ini ke dalam tipe data yang terdefinisi, sambil tetap mempertahankan akses ke objek mentah Baileys melalui properti `msg.raw`.

---

## 1. Menangkap Klik Tombol (`msg.type === 'BUTTON'`)

Ketika pengguna menekan tombol *Quick Reply*, Leaves Guardian memancarkan event `message` dengan tipe **`BUTTON`**:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'BUTTON') {
    let buttonId = null;

    // Coba parse payload JSON dari native flow (misal: {"id": "btn_pay"})
    try {
      const parsed = JSON.parse(msg.text);
      buttonId = parsed.id || parsed.selectedId;
    } catch (_) {
      // Fallback ke teks tombol jika bukan payload JSON
      buttonId = msg.text;
    }

    console.log(`Pengguna mengklik tombol dengan ID / Teks: ${buttonId}`);

    if (buttonId === 'btn_pay') {
      await client.sendText(msg.chat.id, '✅ Mengarahkan Anda ke portal pembayaran...');
    }
  }
});
```

---

## 2. Menangkap Pemilihan Menu List (`msg.type === 'LIST'`)

Ketika pengguna memilih salah satu item dari menu list, Leaves Guardian memancarkan pesan dengan tipe **`LIST`**:

- **`msg.text`**: Berisi judul (*title*) baris yang dipilih pengguna.
- **`msg.raw` (Escape Hatch)**: Berisi objek mentah Baileys lengkap untuk membaca `selectedRowId` mesin secara presisi.

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'LIST') {
    const rowTitle = msg.text;

    // Dapatkan selectedRowId dari raw payload Baileys
    const selectedRowId =
      msg.raw?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.raw?.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

    console.log(`Judul Menu Dipilih: ${rowTitle}`);
    console.log(`ID Menu Dipilih: ${selectedRowId}`);

    if (selectedRowId === 'srv_bot') {
      await client.sendText(msg.chat.id, '🤖 Anda memilih layanan Pembuatan Bot WhatsApp!');
    }
  }
});
```

---

## 3. Menangkap Voting Polling (`msg.type === 'POLL'`)

Pesan pembuatan atau pembaruan suara polling diterima dengan tipe **`POLL`**:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'POLL') {
    console.log(`Topik Polling: ${msg.text}`);

    if (msg.raw?.message?.pollUpdateMessage) {
      console.log('Update suara polling diterima:', msg.raw.message.pollUpdateMessage);
    }
  }
});
```

---

## Ringkasan Tipe Interaktif

| Elemen Pesan | Tipe Pesan (`msg.type`) | Field Utama (`msg.text`) | Properti Raw (`msg.raw`) |
| :--- | :--- | :--- | :--- |
| **Tombol Quick Reply** | `'BUTTON'` | Teks tombol atau JSON `{"id": "..."}` | `raw.message.interactiveResponseMessage` |
| **Pilihan Menu List** | `'LIST'` | Judul menu pilihan | `raw.message.listResponseMessage.singleSelectReply.selectedRowId` |
| **Polling / Voting** | `'POLL'` | Judul pertanyaan polling | `raw.message.pollCreationMessage` / `pollUpdateMessage` |

---

## Panduan Terkait

- **[Panduan 12 Message Builders](/id/guides/builders)**: Cara membuat pesan interaktif.
- **[Interaksi & Tanya Jawab (Prompt)](/id/guides/prompts)**: Menangani alur percakapan bertingkat.
- **[Skema Normalisasi Pesan](/id/guides/schema)**: Mempelajari struktur objek data pesan.
