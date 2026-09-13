---
title: Resep Bot Produksi Tahan Banting 24/7
description: Panduan arsitektur lengkap menggabungkan SmartStore, SessionRecovery, HealthMonitor, Watchdog, MemoryGuard, TrafficController, RateLimiter, dan Deduplicator.
---

# Resep Bot Produksi Tahan Banting 24/7

Resep ini mendemonstrasikan integrasi lengkap seluruh subsistem keandalan (*reliability stack*) Leaves Guardian untuk membangun bot WhatsApp yang beroperasi stabil 24/7.

---

## Implementasi Lengkap

```javascript
import { LeavesClient, IngressRateLimiter, IngressDeduplicator } from 'leaves-guardian';

// 1. Inisialisasi Rate Limiter & Deduplicator Masuk
const rateLimiter = new IngressRateLimiter({
  windowMs: 60000,
  maxRequests: 30
});

const deduplicator = new IngressDeduplicator({
  ttlMs: 300000 // 5 menit
});

// 2. Inisialisasi Client dengan Seluruh Fitur Keandalan
const client = new LeavesClient({
  auth: {
    mode: 'pairing',
    phoneNumber: '628123456789'
  },
  session: {
    sessionDirectory: './session'
  },
  store: {
    filePath: './data/bot-store.json',
    autoPersist: true,
    sweepIntervalMs: 60000
  },
  recovery: {
    autoSnapshotOnConnect: true,
    autoRestoreOnCorruption: true,
    maxSnapshots: 5
  },
  watchdog: {
    enabled: true,
    checkIntervalMs: 15000,
    maxSilenceMs: 60000,
    maxMissedPings: 2
  },
  memoryGuard: {
    enabled: true,
    heapWarningBytes: 150 * 1024 * 1024,
    heapCriticalBytes: 300 * 1024 * 1024,
    autoMitigateOnCritical: true
  },
  health: {
    enabled: true,
    probeIntervalMs: 30000
  }
});

// 3. Daftarkan Probe Diagnostik Kustom
client.healthMonitor.registerProbe('status_store', async () => {
  const totalKey = await client.store.size();
  return { keysTersimpan: totalKey };
});

// 4. Pipeline Pemrosesan Pesan Masuk
client.on('message', async (msg) => {
  // Abaikan pesan yang dikirim oleh bot sendiri
  if (msg.sender.isMe) return;

  // A. Gerbang Deduplikasi
  const hasilDedup = deduplicator.checkAndMark(msg);
  if (hasilDedup.isDuplicate) {
    return;
  }

  // B. Gerbang Rate Limiter
  const keputusanRate = rateLimiter.consume(msg);
  if (!keputusanRate.allowed) {
    console.warn(`Rate limit terpicu untuk ${keputusanRate.key}`);
    return;
  }

  // C. Eksekusi Perintah
  if (msg.text === '!ping') {
    await client.send(
      msg.chat.id,
      client.buildText('Pong! Bot beroperasi normal.')
    );
  }

  if (msg.text === '!health') {
    const health = await client.healthMonitor.getHealth();
    await client.send(
      msg.chat.id,
      client.buildText(`*Status Sistem:* ${health.status}\n*Uptime:* ${health.runtime.uptimeSeconds} detik\n*Event Loop Lag:* ${health.runtime.eventLoopLagMs} ms`)
    );
  }
});

// 5. Pencatatan Event Lifecycle
client.on('ready', (account) => {
  console.log(`Bot SIAP beroperasi pada nomor ${account.id}`);
});

client.on('disconnected', (reason) => {
  console.warn('Bot terputus:', reason);
});

// 6. Penanganan Graceful Shutdown
async function shutdown(sinyal) {
  console.log(`Menerima sinyal ${sinyal}. Menutup bot dengan aman...`);
  await client.disconnect();
  rateLimiter.destroy();
  deduplicator.destroy();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 7. Mulai Koneksi Bot
await client.connect();
```
