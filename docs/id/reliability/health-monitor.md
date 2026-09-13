---
title: Health Monitor (Observabilitas Runtime)
description: Pemantauan lag event loop non-blocking, inspeksi memori proses, metrik subsistem, dan probe kustom terisolasi.
---

# Health Monitor (Observabilitas Runtime)

`HealthMonitor` menyediakan observabilitas runtime mendalam untuk Leaves Guardian. Subsistem ini memantau latensi event loop Node.js, konsumsi memori proses, utilisasi CPU, status koneksi Baileys, throughput pesan, metrik kesehatan subsistem, dan probe kesehatan kustom.

Dapat diakses via `client.healthMonitor` (atau `client.getHealth()`).

---

## Batasan Arsitektural & Invarian

1. **Murni Observasional:** HealthMonitor hanya mengukur dan melaporkan status. Subsistem ini **tidak memiliki wewenang** untuk memutus koneksi socket, me-restart proses, atau memicu timer reconnect.
2. **Pengukuran Non-Blocking:** Pengukuran lag event loop dijalankan secara asinkron menggunakan `setImmediate` dan `performance.now()`.
3. **Perlindungan Single-Flight:** Pemanggilan evaluasi on-demand dan periodik yang bersamaan disatukan ke dalam satu Promise in-flight.
4. **Presedensi Status Deterministik:** Status dievaluasi dengan urutan: `CRITICAL` > `DEGRADED` > `HEALTHY`.
5. **Pemisahan Manual vs Periodik:** Evaluasi periodik memperbarui riwayat ring buffer dan memancarkan event transisi status. Panggilan manual (`getHealth()`) mengembalikan snapshot tanpa mencemari riwayat.

---

## Konfigurasi & Ambang Batas Bawaan

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  health: {
    enabled: true,
    probeIntervalMs: 30000, // Evaluasi berkala tiap 30 detik
    probeTimeoutMs: 3000,   // Timeout tiap probe kustom (3 detik)
    historyLength: 60,      // Menyimpan 60 snapshot riwayat terakhir
    thresholds: {
      eventLoopLagDegradedMs: 250,
      eventLoopLagCriticalMs: 1000,
      memoryHeapPercentDegraded: 80,
      memoryHeapPercentCritical: 95,
      disconnectedDurationDegradedMs: 15000, // 15 detik
      disconnectedDurationCriticalMs: 60000  // 60 detik
    }
  }
});
```

---

## API Publik

### `getHealth()`
Melakukan evaluasi kesehatan on-demand:

```javascript
const laporan = await client.healthMonitor.getHealth();
console.log('Status Sistem:', laporan.status); // 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
console.log('Event Loop Lag:', laporan.runtime.eventLoopLagMs, 'ms');
console.log('Heap Terpakai:', (laporan.runtime.memory.heapUsedBytes / (1024 * 1024)).toFixed(2), 'MB');
```

### `registerProbe(name, probeFn, options)`
Mendaftarkan pemeriksaan kustom terisolasi:

```javascript
client.healthMonitor.registerProbe('ping_database', async () => {
  const dbOk = await cekKoneksiDatabase();
  if (!dbOk) throw new Error('Database tidak dapat diakses');
  return { pingMs: 15 };
}, { timeoutMs: 2000, critical: true });
```

### Method Lainnya
- `getSummary()`: Mengambil salinan ringkasan evaluasi periodik terakhir.
- `getHistory()`: Mengambil seluruh riwayat snapshot ring buffer.
- `resetMetrics()`: Mengatur ulang akumulator metrik throughput.
- `start()` / `stop()`: Memulai / menghentikan scheduler evaluasi periodik.

---

## Event Subsistem (Evaluasi Periodik)

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `health_check` | `report` | Dipancarkan pada setiap siklus evaluasi periodik. |
| `health_degraded` | `{ report, reasons }` | Dipancarkan saat status turun dari HEALTHY ke DEGRADED. |
| `health_critical` | `{ report, reasons }` | Dipancarkan saat status memasuki CRITICAL. |
| `health_recovered` | `{ report, fromStatus }` | Dipancarkan saat status pulih kembali ke HEALTHY. |
