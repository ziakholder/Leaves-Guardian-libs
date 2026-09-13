---
title: Socket Watchdog (Deteksi Zombie Socket)
description: Pemantauan hening pasif, probe ping aktif WebSocket, deteksi zombie socket, dan delegasi terminasi aman.
---

# Socket Watchdog (Deteksi Zombie Socket)

`Watchdog` memantau keaktifan WebSocket WhatsApp pada Leaves Guardian. Pada jaringan seluler, koneksi dapat mengalami kondisi *zombie socket*—koneksi terlihat terbuka di level OS, namun server WhatsApp sudah tidak merutekan data.

Watchdog mendeteksi kondisi ini melalui kombinasi: **pemantauan keheningan pasif** dan **probe ping aktif**.

Dapat diakses via `client.watchdog` pada instance client.

---

## Invarian & Batasan Kepemilikan Rekoneksi

1. **Bukan Pemilik Rekoneksi:** Watchdog **tidak memiliki logika rekoneksi** dan tidak menyetel timer reconnect. Saat zombie socket terkonfirmasi, Watchdog hanya meminta ConnectionManager memutus socket (`connectionManager.terminateSocket('ZOMBIE_SOCKET_DETECTED')`). Seluruh logika backoff dan rekoneksi 100% dikelola oleh `ReconnectManager`.
2. **Aktivitas vs Balasan Pong:**
   - Lalu lintas masuk atau pesan baru memperbarui `lastActivityAt` dan mereset missed pings.
   - Balasan frame pong memperbarui `lastPingAckAt` dan menyelesaikan in-flight ping **tanpa** mengubah `lastActivityAt`.
3. **Single-Flight Ping:** Hanya 1 probe ping yang boleh aktif dalam satu waktu.
4. **Token Generasi:** Menggunakan token generasi untuk membatalkan proses terminasi usang saat koneksi telah berganti.

---

## Konfigurasi & Default

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  watchdog: {
    enabled: true,
    checkIntervalMs: 15000, // Periksa setiap 15 detik
    maxSilenceMs: 60000,    // Kirim ping jika hening selama 60 detik
    pingTimeoutMs: 10000,   // Tunggu balasan pong maksimal 10 detik
    maxMissedPings: 2       // Konfirmasi zombie setelah 2x timeout berturut-turut
  }
});
```

---

## API Publik & Diagnostik

- `recordActivity(source)`: Mencatat aktivitas lalu lintas (`'socket'`, `'message'`, atau `'pong'`).
- `getStatus()`: Mengembalikan status diagnostik (`state`, `silenceDurationMs`, `missedPings`, `zombiesDetectedTotal`, `lastActivityAt`, dll).
- `start()`, `stop()`, `pause()`, `resume()`, `reset()`.

---

## Event Subsistem

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `watchdog_tick` | `{ timestamp, silenceDurationMs, missedPings, state }` | Dipancarkan pada setiap siklus evaluasi. |
| `ping_sent` | `{ timestamp, silenceDurationMs, success }` | Dipancarkan saat probe ping dikirim. |
| `ping_ack` | `{ timestamp, rttMs }` | Dipancarkan saat pong balasan diterima. |
| `ping_timeout` | `{ timestamp, missedPings, maxMissedPings }` | Dipancarkan saat ping tidak dibalas melebihi batas waktu. |
| `zombie_detected` | `{ timestamp, silenceDurationMs, missedPings, reason }` | Dipancarkan saat koneksi terkonfirmasi sebagai zombie socket. |
| `zombie_terminated` | `{ timestamp, reason }` | Dipancarkan saat pemutusan socket diterima ConnectionManager. |
