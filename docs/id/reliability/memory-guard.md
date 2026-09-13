---
title: Memory Guard (Tekanan Memori & Mitigasi)
description: Pemantauan memori proses Node.js, deteksi tren pertumbuhan sustained heuristik, dan hook mitigasi terikat.
---

# Memory Guard (Tekanan Memori & Mitigasi)

`MemoryGuard` memantau metrik memori proses Node.js host, mendeteksi tekanan memori serta pola pertumbuhan tidak wajar (*sustained growth*), dan mengeksekusi hook pembersihan subsistem terdaftar secara terkoordinasi.

Dapat diakses via `client.memoryGuard` pada instance client.

---

## Invarian Arsitektural

1. **Cakupan Memori Proses Host:** Membaca `process.memoryUsage()` untuk memantau proses Node.js secara keseluruhan (bukan hanya alokasi internal library).
2. **Tanpa Wewenang Socket atau Proses:** MemoryGuard tidak memiliki wewenang mematikan socket atau memanggil `process.exit()`.
3. **Mitigasi Single-Flight:** Pemanggilan `mitigate()` yang bersamaan digabungkan ke dalam satu Promise in-flight.
4. **Peringatan Pertumbuhan Heuristik:** Peringatan pertumbuhan berkelanjutan mensyaratkan kenaikan monotonik pada seluruh jendela sampel dan melampaui ambang persentase serta delta byte minimum.

---

## Konfigurasi & Opsi Bawaan

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  memoryGuard: {
    enabled: true,
    checkIntervalMs: 30000,               // Sampel memori tiap 30s
    heapWarningBytes: 150 * 1024 * 1024,  // Ambang peringatan Heap (150 MB)
    heapCriticalBytes: 300 * 1024 * 1024, // Ambang kritis Heap (300 MB)
    rssWarningBytes: 250 * 1024 * 1024,   // Ambang peringatan RSS (250 MB)
    rssCriticalBytes: 500 * 1024 * 1024,  // Ambang kritis RSS (500 MB)
    growthRateWarningPercent: 20,         // Ambang persentase pertumbuhan (20%)
    minimumGrowthBytes: 20 * 1024 * 1024, // Pertumbuhan absolut minimal (20 MB)
    sampleWindowSize: 5,                  // Jendela riwayat sampel (5 titik)
    autoMitigateOnCritical: true,         // Eksekusi hook otomatis saat status CRITICAL
    allowManualGc: false,                 // Izinkan pemanggilan global.gc()
    gcCooldownMs: 60000,                  // Jeda antar GC manual (60s)
    hookTimeoutMs: 5000                   // Batas waktu eksekusi tiap hook (5s)
  }
});
```

---

## API Publik & Hook Mitigasi

### `registerMitigationHook(name, hookFn, options)`
Mendaftarkan fungsi pembersihan saat terjadi tekanan memori:

```javascript
client.memoryGuard.registerMitigationHook('bersihkan_cache', async () => {
  const dihapus = cacheLokal.bersihkanEntriUsang();
  return { dihapus };
}, { timeoutMs: 3000 });
```

### Method Lainnya
- `mitigate()`: Menjalankan seluruh hook mitigasi terdaftar secara terkoordinasi.
- `checkNow()`: Pemeriksaan status memori instan tanpa mengubah riwayat sampel.
- `getStatus()`: Mengembalikan snapshot status lengkap 15-field kanonikal.
- `start()`, `stop()`, `pause()`, `resume()`, `reset()`.

---

## Event Subsistem

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `memory_sample` | `{ timestamp, state, level, processMemory, growth }` | Dipancarkan pada setiap siklus sampling. |
| `memory_pressure` | `{ timestamp, level, processMemory, reasons }` | Dipancarkan saat memori memasuki level WARNING. |
| `memory_critical` | `{ timestamp, level, processMemory, reasons }` | Dipancarkan saat memori memasuki level CRITICAL. |
| `memory_recovered` | `{ timestamp, fromLevel, processMemory }` | Dipancarkan saat level memori kembali NORMAL. |
| `memory_growth_warning` | `{ timestamp, growthRatePercent, deltaBytes }` | Dipancarkan saat terdeteksi pola pertumbuhan memori berkelanjutan. |
| `mitigation_completed` | `report` | Dipancarkan setelah eksekusi hook mitigasi selesai. |
