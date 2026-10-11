# GroupCache: Caching Metadata Grup & Sinkronisasi Real-Time

`GroupCache` adalah subsistem keandalan di Leaves Guardian yang menyediakan manajemen metadata grup WhatsApp berperforma tinggi, caching cerdas dengan singleflight request coalescing, dan sinkronisasi real-time berbasis event.

---

## 🔍 Masalah Umum Metadata Grup pada Bot WhatsApp

Pada bot WhatsApp berbasis Baileys konvensional, setiap kali perintah grup dijalankan (seperti `.kick`, `.hidetag`, atau `.adminonly`), developer sering memanggil:

```javascript
const metadata = await sock.groupMetadata(msg.chat.id);
```

### Mengapa Pola Tersebut Bermasalah di Produksi?
1. **WhatsApp IQ Rate Limit (Error 429):** WhatsApp membatasi frekuensi query IQ metadata grup. Jika grup ramai atau beberapa member mengetik perintah sekaligus, WhatsApp akan memblokir request dengan error rate limit.
2. **Latensi Jaringan Tinggi:** Setiap panggilan `sock.groupMetadata()` memerlukan round-trip request ke server WhatsApp (berkisar antara 300ms hingga 2000ms), membuat respon bot terasa lambat.
3. **Logika Pengecekan Admin yang Rumit:** Format JID pengirim WhatsApp modern bervariasi: nomor biasa (`628xxx@s.whatsapp.net`), user dengan device suffix (`628xxx:12@s.whatsapp.net`), atau Linked Identity (`@lid`). Developer bot kerap kesulitan mencocokkan JID admin secara akurat.
4. **Cache Statis Cepat Usang:** Bot yang menerapkan cache manual sederhana sering mengalami *stale state*. Ketika ada member baru bergabung, keluar, atau di-promote menjadi admin, bot tidak mengetahui perubahan tersebut hingga cache kedaluwarsa atau bot di-restart.

---

## 🏛️ Solusi Terintegrasi GroupCache Leaves Guardian

Leaves Guardian mengatasi semua kendala di atas dengan arsitektur cache aktif:

```
                  Command Masuk (.kick / .tagall)
                               │
                               ▼
                   client.groupMetadata(jid)
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        Cache Hit (Belum Expired)      Cache Miss / Expired
                 │                           │
                 │                    Singleflight Coalescing
                 │                           │
                 │                     1 Request ke WhatsApp
                 │                           │
                 │                           ▼
                 └──────────────┬────────────┘
                                │
                                ▼
                       Metadata Siap Pakai
```

### Keunggulan Utama
* **Singleflight Request Coalescing:** Jika terdapat 10 perintah grup masuk dalam milidetik yang sama, GroupCache hanya mengeksekusi 1 request jaringan ke WhatsApp. 9 pemanggil lainnya menunggu Promise yang sama.
* **Sinkronisasi Event Real-Time:** GroupCache otomatis mendengarkan event socket `groups.update` dan `group-participants.update`. Saat member di-add, di-kick, di-promote, atau di-demote, array partisipan lokal langsung diperbarui saat itu juga tanpa request ulang ke server.
* **Normalisasi JID Pintar:** Pengecekan admin secara otomatis menangani nomor telepon mentah, JID dengan device ID, maupun JID LID.
* **Ramah Memori & Terintegrasi MemoryGuard:** Kapasitas cache dibatasi oleh batas maksimal grup (default 250 grup) dan terdaftar di `MemoryGuard` untuk pembersihan otomatis saat server mengalami tekanan memori.

---

## ⚙️ Konfigurasi GroupCache

GroupCache aktif secara otomatis di `LeavesClient`. Anda dapat menyesuaikan parameternya melalui opsi `groupCache` (atau alias `groups`):

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  groupCache: {
    ttlMs: 5 * 60 * 1000, // Waktu kedaluwarsa cache (default: 5 menit)
    maxGroups: 250        // Maksimal jumlah grup yang disimpan dalam cache (default: 250)
  }
});
```

---

## 💻 Panduan Penggunaan API

LeavesClient menyediakan metode pembantu tingkat atas yang bersih dan siap pakai:

### 1. Mengambil Metadata Grup
Mengambil metadata grup dengan cache otomatis:

```javascript
// Mengambil dari cache (atau fetch jika belum ada / kedaluwarsa)
const metadata = await client.groupMetadata('123456789-987654@g.us');
console.log(`Nama Grup: ${metadata.subject}`);
console.log(`Jumlah Member: ${metadata.participants.length}`);

// Memaksa query ulang ke server (bypass cache)
const freshMetadata = await client.groupMetadata('123456789-987654@g.us', true);
```

### 2. Memeriksa Apakah Pengguna adalah Admin
Mendeteksi apakah user tertentu memiliki hak admin atau superadmin:

```javascript
const isAdmin = await client.isGroupAdmin(msg.chat.id, msg.sender.id);
if (!isAdmin) {
  return client.sendText(msg.chat.id, '❌ Perintah ini khusus untuk admin grup.');
}
```

### 3. Memeriksa Apakah Bot adalah Admin
Mendeteksi apakah akun bot sendiri adalah admin di grup tersebut tanpa perlu menulis logika pencocokan nomor bot manual:

```javascript
const isBotAdmin = await client.isBotAdmin(msg.chat.id);
if (!isBotAdmin) {
  return client.sendText(msg.chat.id, '⚠️ Jadikan bot sebagai admin grup terlebih dahulu.');
}
```

### 4. Mengambil Daftar Semua Admin
Mengambil array JID seluruh admin dan superadmin di grup:

```javascript
const admins = await client.getGroupAdmins(msg.chat.id);
// Output: ['628123456789@s.whatsapp.net', '628987654321@s.whatsapp.net']
```

### 5. Mengambil Seluruh Peserta Grup
Mengambil array JID seluruh peserta grup yang sudah dinormalisasi:

```javascript
const members = await client.getGroupParticipants(msg.chat.id);
```

---

## 🛡️ Contoh Nyata: Perintah Kick & Tag All

Berikut contoh implementasi perintah grup yang aman, cepat, dan anti rate limit:

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient();

client.on('message', async (msg) => {
  if (!msg.chat.isGroup) return;

  const [cmd, ...args] = (msg.text || '').trim().split(/\s+/);

  // Perintah .tagall / .hidetag
  if (cmd === '.tagall') {
    const isSenderAdmin = await client.isGroupAdmin(msg.chat.id, msg.sender.id);
    if (!isSenderAdmin) {
      return client.sendText(msg.chat.id, 'Hanya admin yang dapat memanggil semua member.');
    }

    const participants = await client.getGroupParticipants(msg.chat.id);
    let tagText = '📢 Panggilan Semua Member:\n\n';
    for (const jid of participants) {
      tagText += `@${jid.split('@')[0]}\n`;
    }

    return client.sendMessage(msg.chat.id, {
      text: tagText,
      mentions: participants
    });
  }

  // Perintah .kick
  if (cmd === '.kick') {
    const isSenderAdmin = await client.isGroupAdmin(msg.chat.id, msg.sender.id);
    if (!isSenderAdmin) {
      return client.sendText(msg.chat.id, 'Anda harus menjadi admin grup.');
    }

    const isBotAdmin = await client.isBotAdmin(msg.chat.id);
    if (!isBotAdmin) {
      return client.sendText(msg.chat.id, 'Bot membutuhkan hak admin untuk mengeluarkan member.');
    }

    const target = msg.quoted?.sender?.id || msg.mentions?.[0];
    if (!target) {
      return client.sendText(msg.chat.id, 'Balas pesan atau mention member yang ingin dikeluarkan.');
    }

    const sock = client.getRawSocket();
    await sock.groupParticipantsUpdate(msg.chat.id, [target], 'remove');
    // GroupCache otomatis memperbarui daftar member lokal seketika!
    return client.sendText(msg.chat.id, 'Member berhasil dikeluarkan.');
  }
});
```

---

## 📊 Manajemen Manual & Direct Access

Jika Anda memerlukan interaksi langsung dengan instance cache:

```javascript
// Akses instance cache langsung
const cache = client.groupCache; // atau client.groups

// Cek apakah metadata grup ada di memori dan belum expired
const hasCache = cache.hasMetadata(groupJid);

// Ambil seluruh metadata grup yang aktif tersimpan
const allGroups = client.getAllCachedGroupMetadata();

// Kosongkan seluruh cache grup
cache.clear();
```
