---
title: Ingress Deduplicator (Deduplikasi Pesan)
description: Deduplikasi pesan masuk in-memory atomik test-and-set terhadap webhook ganda dan retry jaringan.
---

# Ingress Deduplicator (Deduplikasi Pesan)

Jaringan WhatsApp sesekali dapat mengirimkan event webhook pesan yang sama lebih dari satu kali saat terjadi rekoneksi atau retry jaringan. `IngressDeduplicator` menyediakan deduplikasi pesan berbasis memori dengan operasi *atomic test-and-set* untuk menjamin logika bot hanya dieksekusi tepat satu kali per pesan.

> [!NOTE]
> IngressDeduplicator adalah filter in-memory pada level proses. Subsistem ini **bukan** database idempotensi terdistribusi.

---

## Invarian & Fitur Utama

1. **Atomic Test-and-Set (`checkAndMark`):** Memeriksa keberadaan dan mencatat pesan pertama kali secara atomik dalam satu langkah sinkron.
2. **Ekstraksi Identitas Ganda:** Mendukung objek `Message` ternormalisasi maupun raw key Baileys.
   - *Pesan Pribadi:* `${chatId}:${messageId}:${fromMe}`
   - *Pesan Grup:* `${chatId}:${messageId}:${fromMe}:${senderId}`
3. **TTL Kedaluwarsa Tetap:** Pesan duplikat menambah counter pengamatan namun **tidak** memperpanjang TTL entri asli.
4. **Kapasitas Terbatas (`maxTrackedMessages: 10000`):** Mencegah kebocoran memori dengan batasan kapasitas maksimum entri.

---

## Konfigurasi & Default

```javascript
import { IngressDeduplicator } from 'leaves-guardian';

const dedup = new IngressDeduplicator({
  ttlMs: 300000,              // TTL deduplikasi 5 menit (300.000 ms)
  maxTrackedMessages: 10000,  // Maksimal 10.000 identitas pesan terlacak
  cleanupIntervalMs: 60000    // Pembersihan entri kedaluwarsa tiap 60s
});
```

---

## Penggunaan

```javascript
client.on('message', async (msg) => {
  const hasil = dedup.checkAndMark(msg);

  if (hasil.isDuplicate) {
    console.log(`Mengabaikan pesan duplikat ${msg.id} (diterima ${hasil.seenCount} kali)`);
    return;
  }

  // Jalankan proses bisnis pesan
});
```

---

## Event Subsistem

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `duplicate_detected` | `{ key, result, timestamp }` | Dipancarkan saat pesan duplikat terdeteksi. |
| `dedup_reset` | `{ key?, clearedCount?, timestamp }` | Dipancarkan saat catatan pelacakan dibersihkan. |
