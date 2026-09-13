---
title: Ingress Rate Limiter (Sliding Window)
description: Pembatasan laju pesan masuk berbasis memori sinkron dan sliding window pada Leaves Guardian.
---

# Ingress Rate Limiter (Sliding Window)

`IngressRateLimiter` menyediakan pembatasan laju pesan masuk (*rate limiting*) berbasis memori yang deterministik dan sinkron. Subsistem ini melacak jumlah permintaan per pengguna/chat menggunakan algoritma *sliding window* untuk melindungi command handler bot dari serangan *flood*.

> [!NOTE]
> IngressRateLimiter adalah pengatur laju trafik masuk di level aplikasi. Subsistem ini **bukan** sistem anti-ban atau anti-spam WhatsApp.

---

## Invarian & Fitur Utama

1. **Evaluasi Sinkron (`consume`):** Evaluasi berjalan secara sinkron di memori tanpa memblokir event loop.
2. **Ekstraksi Kunci Defensif:** Menerima string ID atau objek `Message` (mengekstrak `senderJid` → `chatId` → Baileys `key.participant` / `key.remoteJid`).
3. **Algoritma Sliding Window:** Melacak stempel waktu permintaan secara presisi dalam array berbatas.
4. **Penalti Sementara Opsional:** Mendukung pemberian jeda penalti (`penaltyDurationMs`) saat batas terlampaui.
5. **Pembersihan Otomatis:** Menghapus data pelacakan yang kedaluwarsa secara berkala pada interval `cleanupIntervalMs`.

---

## Konfigurasi & Default

```javascript
import { IngressRateLimiter } from 'leaves-guardian';

const limiter = new IngressRateLimiter({
  windowMs: 60000,          // Jendela sliding window 60 detik
  maxRequests: 60,          // Maksimal 60 pesan per jendela waktu
  penaltyDurationMs: 0,     // Durasi penalti tambahan (0 = nonaktif)
  maxTrackedKeys: 10000,    // Maksimal 10.000 entri yang dilacak
  cleanupIntervalMs: 60000  // Interval pembersihan berkala (60 detik)
});
```

---

## Penggunaan

```javascript
client.on('message', async (msg) => {
  const keputusan = limiter.consume(msg);

  if (!keputusan.allowed) {
    console.warn(`Rate limit terlampaui untuk ${keputusan.key}. Coba lagi setelah ${keputusan.retryAfterMs}ms`);
    return; // Abaikan pesan atau beri notifikasi cooldown
  }

  // Proses perintah bot secara normal
});
```

---

## Event Subsistem

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `rate_limit_exceeded` | `{ decision, key, timestamp }` | Dipancarkan saat permintaan melampaui batas `maxRequests`. |
| `penalty_applied` | `{ key, penaltyDurationMs, penaltyUntil, timestamp }` | Dipancarkan saat durasi penalti diterapkan. |
| `rate_limit_reset` | `{ key?, timestamp }` | Dipancarkan saat status batas direset. |
