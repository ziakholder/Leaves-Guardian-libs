---
title: Traffic Controller (Antrean & Pacing)
description: Penjadwalan antrean pesan keluar, pencegahan starvation prioritas, pacing pengiriman, dan kendali backpressure.
---

# Traffic Controller (Antrean & Pacing)

`TrafficController` mengatur seluruh pengiriman pesan keluar (*outbound*) pada Leaves Guardian. Subsistem ini menyediakan antrean berbasis prioritas, pencegahan kelaparan antrean (*starvation prevention*), pacing interval pengiriman, dan kendali aliran *backpressure*.

---

## Invarian & Fitur Utama

1. **Penjadwalan Prioritas Berkeadilan:** Tugas dikelompokkan ke dalam `HIGH`, `NORMAL`, atau `LOW` dengan urutan FIFO di setiap tingkat prioritas.
2. **Pencegahan Starvation (`maxConsecutiveHigh: 5`):** Setelah 5 pengiriman `HIGH` berturut-turut, controller secara paksa mengambil tugas dari antrean `NORMAL` atau `LOW` untuk mencegah kemacetan tugas prioritas rendah.
3. **Pacing Pengiriman (`minDispatchIntervalMs: 250`):** Menerapkan jeda minimum 250ms antar pengiriman pesan untuk menghindari lonjakan trafik mendadak.
4. **Watermark Backpressure:**
   - High watermark (80% dari `maxQueueSize`, 800 tugas) memancarkan event `backpressure_active`.
   - Low watermark (20% dari `maxQueueSize`, 200 tugas) memancarkan event `backpressure_resolved`.
5. **Siklus Hidup Tugas:** Tugas bergerak melalui status `PENDING` → `DISPATCHING` → `COMPLETED` / `FAILED` / `CANCELLED`.

---

## Konfigurasi & Default

```javascript
import { TrafficController } from 'leaves-guardian';

const traffic = new TrafficController({
  maxQueueSize: 1000,              // Maksimal kapasitas antrean
  maxConcurrentDispatches: 1,      // Jumlah pengiriman konkuren (default 1)
  minDispatchIntervalMs: 250,      // Jeda minimum antar dispatch (250ms)
  highWatermarkRatio: 0.8,         // Ambang batas atas backpressure (80%)
  lowWatermarkRatio: 0.2,          // Ambang batas bawah pemulihan (20%)
  maxConsecutiveHigh: 5,           // Batas maksimal tugas HIGH berurutan
  historyLimit: 100                // Riwayat tugas terminal yang disimpan
});
```

---

## API Publik

### `enqueue(jid, content, options)` / `send(jid, content, options)`
Mendaftarkan pesan ke dalam antrean:

```javascript
// Pengiriman prioritas normal
await client.traffic.enqueue('628123456789@s.whatsapp.net', { text: 'Halo!' });

// Pengiriman prioritas tinggi (misal: kode OTP)
await client.traffic.enqueue('628123456789@s.whatsapp.net', { text: 'Kode OTP: 5541' }, {
  priority: 'HIGH'
});
```

### Pembatalan & Status
- `cancel(taskId)`: Membatalkan tugas tertentu dari antrean.
- `cancelByJid(jid)`: Membatalkan seluruh tugas tertunda untuk penerima JID tertentu.
- `getStatus()`: Mengambil metrik antrean real-time (`queueSize`, `queueByPriority`, `inFlightCount`, `backpressureActive`, `metrics`).
- `start()`, `pause()`, `resume()`, `stop()`.

---

## Event Subsistem

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `state_change` | `{ from, to }` | Dipancarkan saat status controller berubah (RUNNING, PAUSED, STOPPED). |
| `backpressure_active` | `{ queueSize, highWatermark }` | Dipancarkan saat antrean melampaui high watermark. |
| `backpressure_resolved` | `{ queueSize, lowWatermark }` | Dipancarkan saat antrean turun di bawah low watermark. |
