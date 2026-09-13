---
title: High-Availability Production Bot Recipe
description: Complete architecture combining SmartStore, SessionRecovery, HealthMonitor, Watchdog, MemoryGuard, TrafficController, RateLimiter, and Deduplicator.
---

# High-Availability Production Bot Recipe

This recipe demonstrates how to combine Leaves Guardian's reliability subsystems into a robust, 24/7 production WhatsApp bot.

---

## Complete Production Setup

```javascript
import { LeavesClient, IngressRateLimiter, IngressDeduplicator } from 'leaves-guardian';

// 1. Initialize Ingress Rate Limiter & Deduplicator
const rateLimiter = new IngressRateLimiter({
  windowMs: 60000,
  maxRequests: 30
});

const deduplicator = new IngressDeduplicator({
  ttlMs: 300000 // 5 minutes
});

// 2. Initialize LeavesClient with full Reliability Stack
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

// 3. Register Custom Subsystem Probes
client.healthMonitor.registerProbe('smart_store', async () => {
  const size = await client.store.size();
  return { keysInStore: size };
});

// 4. Ingress Pipeline (Deduplication -> Rate Limiting -> Handler)
client.on('message', async (msg) => {
  // Ignore messages sent by bot itself
  if (msg.sender.isMe) return;

  // A. Deduplication Gate
  const dedupResult = deduplicator.checkAndMark(msg);
  if (dedupResult.isDuplicate) {
    return;
  }

  // B. Rate Limiting Gate
  const limitDecision = rateLimiter.consume(msg);
  if (!limitDecision.allowed) {
    console.warn(`Rate limit triggered for ${limitDecision.key}`);
    return;
  }

  // C. Command Execution
  if (msg.text === '!ping') {
    await client.send(
      msg.chat.id,
      client.buildText('Pong! Bot is operational.')
    );
  }

  if (msg.text === '!health') {
    const health = await client.healthMonitor.getHealth();
    await client.send(
      msg.chat.id,
      client.buildText(`*System Health:* ${health.status}\n*Uptime:* ${health.runtime.uptimeSeconds}s\n*Lag:* ${health.runtime.eventLoopLagMs}ms`)
    );
  }
});

// 5. Diagnostics & Event Logging
client.on('ready', (account) => {
  console.log(`Bot is READY on ${account.id}`);
});

client.on('disconnected', (reason) => {
  console.warn('Bot disconnected:', reason);
});

// 6. Graceful Process Shutdown
async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  await client.disconnect();
  rateLimiter.destroy();
  deduplicator.destroy();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// 7. Start Bot Connection
await client.connect();
```
