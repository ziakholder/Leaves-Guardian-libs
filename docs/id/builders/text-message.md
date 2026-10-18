# TextMessage Builder

`TextMessage` adalah builder untuk membangun pesan teks WhatsApp terformat (`extendedTextMessage`) dengan kontrol link preview, ad-reply banner, mention pengguna, dan kutipan pesan (*quoted message*).

---

## Contoh Penggunaan Dasar

```javascript
import { TextMessage } from 'leaves-guardian';

const pesanTeks = new TextMessage()
  .setBody('Halo {{nama}}, selamat datang di bot resmi Leaves Guardian!')
  .setVars({ nama: 'Rafa' });

await client.sendMessage(msg.chat.id, pesanTeks);
```

---

## Daftar Method

| Method | Keterangan |
| :--- | :--- |
| `.setBody(text)` | Mengatur isi teks utama (mendukung template variabel `{{kunci}}`). |
| `.disableLinkPreview()` | Menonaktifkan kartu preview URL otomatis jika teks berisi hyperlink. |
| `.mention(jids)` | Menambahkan satu atau kumpulan string WhatsApp JID ke dalam daftar mention. |
| `.quote(msg)` | Menempelkan konteks pesan yang dikutip (*quoted reply*). |
| `.setAdReply(opts)` | Menempelkan kartu preview tautan luar (*external ad reply*). |
| `.setChannelForward(opts)` | Menempelkan konteks penerusan saluran resmi (*channel newsletter*). |
| `.build()` | Mengompilasi dan mengembalikan objek payload mentah Baileys. |
| `.send(jid, options)` | Mengirimkan pesan langsung ke tujuan jika client di-pass ke constructor. |

---

## Contoh Lengkap: Ad-Reply & Mention

```javascript
import { TextMessage } from 'leaves-guardian';

const pesanTeks = new TextMessage(client)
  .setBody('Hai Kak @{{nomor}}! Silakan kunjungi dokumentasi resmi kami di https://leavesguardian.enginelabs.my.id')
  .setVars({ nomor: '628123456789' })
  .mention(['628123456789@s.whatsapp.net'])
  .quote(msg)
  .setAdReply({
    title: 'Leaves Guardian Docs',
    body: 'Enterprise Baileys Reliability Layer',
    thumbnailUrl: 'https://example.com/banner.jpg',
    sourceUrl: 'https://leavesguardian.enginelabs.my.id',
    previewType: 'PHOTO'
  });

await pesanTeks.send(msg.chat.id);
```

---

## Navigasi Terkait

- **[Ringkasan Message Builders](/id/builders/overview)**: Pengenalan arsitektur BaseBuilder.
- **[ButtonMessage Builder](/id/builders/button-message)**: Tombol aksi native flow.
- **[Skema Pesan Ternormalisasi](/id/guides/schema)**: Format objek pesan ctx dan msg.
