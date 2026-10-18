# Menangkap Respon Tombol & Menu (Interactive Responses)

Saat pengguna berinteraksi dengan pesan yang dikirim menggunakan **`ButtonMessage`**, **`LocationMessage`**, **`ListMessage`**, **`CarouselMessage`**, atau **`PollMessage`**, WhatsApp mengirimkan respon tindakan mereka kembali ke bot melalui event pesan masuk standar (`message`).

Leaves Guardian secara otomatis mengelompokkan jenis event interaktif ini ke dalam tipe data ternormalisasi yang jelas, sambil tetap menyediakan akses ke objek mentah Baileys melalui properti `msg.raw`.

---

## 1. Menangkap Klik Tombol (`msg.type === 'BUTTON'`)

Ketika pengguna menekan tombol *Quick Reply* pada pesan tombol biasa, kartu lokasi, atau kartu carousel, Leaves Guardian memancarkan event `message` dengan tipe **`BUTTON`**:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'BUTTON') {
    let buttonId = null;

    // Coba parse payload JSON dari native flow (misal: {"id": "btn_bayar"})
    try {
      const parsed = JSON.parse(msg.text);
      buttonId = parsed.id || parsed.selectedId;
    } catch (_) {
      // Fallback ke teks tombol jika bukan payload JSON
      buttonId = msg.text;
    }

    console.log(`Pengguna mengklik tombol dengan ID / Teks: ${buttonId}`);

    if (buttonId === 'btn_bayar') {
      await client.sendText(msg.chat.id, '✅ Mengarahkan Anda ke portal pembayaran aman...');
    }
  }
});
```

---

## 2. Menangkap Pemilihan Menu List & Dropdown (`msg.type === 'LIST'`)

Ketika pengguna memilih salah satu item dari menu list vertikal atau dropdown tombol, Leaves Guardian memancarkan pesan dengan tipe **`LIST`**:

- **`msg.text`**: Berisi judul (*title*) baris yang dipilih pengguna.
- **`msg.raw`**: Berisi objek mentah Baileys lengkap untuk membaca `selectedRowId` mesin secara presisi.

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

## 3. Menangani Tombol Buka Web (URL) & Salin Teks (Copy)

Penting diketahui bahwa untuk tombol **CTA URL** (`.addUrl()`), **CTA Copy** (`.addCopy()`), dan **CTA Call** (`.addCall()`):

- WhatsApp menangani tindakan tersebut langsung di sisi klien ponsel pengguna (membuka browser, menyalin ke clipboard, atau membuka aplikasi telepon).
- WhatsApp **tidak** mengirimkan event pesan balik ke server/bot karena tindakan terjadi lokal di perangkat pengguna.
- Jika Anda membutuhkan konfirmasi bahwa pengguna telah melakukan tindakan, sediakan tombol pendamping bertipe **Quick Reply** (misal: `"✅ Saya Sudah Bayar"`).

---

## 4. Contoh Pola Router Command & Button Terpadu

Dalam arsitektur bot produksi, pisahkan router penanganan pesan teks biasa dan interaksi tombol:

```javascript
client.on('message', async (msg) => {
  // Abaikan pesan dari bot sendiri jika tidak diinginkan
  if (msg.fromMe) return;

  // 1. Tangani Klik Tombol
  if (msg.type === 'BUTTON') {
    return handleButtonInteraction(client, msg);
  }

  // 2. Tangani Pilihan Menu List
  if (msg.type === 'LIST') {
    return handleListInteraction(client, msg);
  }

  // 3. Tangani Pesan Teks & Perintah
  if (msg.type === 'TEXT') {
    const text = msg.text.trim();
    if (text.startsWith('.menu')) {
      // Kirim menu kartu lokasi interaktif
      return sendMainMenu(client, msg.chat.id);
    }
  }
});
```

---

## Navigasi Terkait

- **[ButtonMessage Builder](/id/builders/button-message)**: Pembuatan tombol interaktif.
- **[LocationMessage Builder](/id/builders/location-message)**: Pembuatan kartu lokasi interaktif.
- **[ListMessage Builder](/id/builders/list-message)**: Pembuatan menu list bertingkat.
- **[Skema Pesan Ternormalisasi](/id/guides/schema)**: Anatomi objek pesan `msg` dan `ctx`.
