---
title: Ingress Rate Limiter (Sliding Window)
description: Deterministic, synchronous in-memory sliding window rate observation and limiting for inbound WhatsApp traffic.
---

# Ingress Rate Limiter (Sliding Window)

`IngressRateLimiter` provides deterministic, synchronous, in-memory ingress rate limiting for inbound messages. It tracks request counts using sliding window timestamps and protects bot command handlers from flood attacks.

> [!NOTE]
> IngressRateLimiter is an application-level ingress rate regulator. It is **not** an anti-ban or anti-spam system.

---

## Key Invariants & Features

1. **Synchronous Evaluation (`consume`):** Rate evaluation executes synchronously in-memory without blocking event handling loops.
2. **Defensive Key Extraction:** Accepts a string key or a normalized `Message` object (extracting `senderJid` → `chatId` → Baileys `key.participant` / `key.remoteJid`).
3. **Sliding Window Algorithm:** Requests are tracked in a bounded timestamp array, guaranteeing precision across arbitrary time boundaries.
4. **Temporary Penalty Duration:** Supports optional temporary suspension (`penaltyDurationMs`) upon exceeding thresholds.
5. **Periodic Housekeeping:** Automatically prunes expired key tracking structures at `cleanupIntervalMs`.

---

## Configuration & Defaults

```javascript
import { IngressRateLimiter } from 'leaves-guardian';

const limiter = new IngressRateLimiter({
  windowMs: 60000,          // 60-second sliding window
  maxRequests: 60,          // Up to 60 requests per window
  penaltyDurationMs: 0,     // Extra penalty duration (0 = disabled)
  maxTrackedKeys: 10000,    // Maximum 10,000 tracked entities
  cleanupIntervalMs: 60000  // Housekeeping sweep interval (60s)
});
```

---

## Public API

### `consume(keyOrMessage)`
Evaluates and consumes rate capacity synchronously, returning an immutable `RateLimitDecision`:

```javascript
client.on('message', async (msg) => {
  const decision = limiter.consume(msg);

  if (!decision.allowed) {
    console.warn(`Rate limit exceeded for ${decision.key}. Retry after ${decision.retryAfterMs}ms`);
    return; // Drop or respond with cooldown notice
  }

  // Handle command normally
});
```

### `RateLimitDecision` Properties
- `allowed`: `boolean` — `true` if request is within limits.
- `key`: `string` — Canonical tracking key.
- `currentCount`: `number` — Number of recorded requests in current window.
- `limit`: `number` — Configured `maxRequests`.
- `remaining`: `number` — Remaining capacity in window.
- `resetMs`: `number` — Milliseconds until oldest recorded request expires.
- `retryAfterMs`: `number` — Milliseconds to wait before next allowed request (0 if allowed).
- `isPenalty`: `boolean` — `true` if caller is currently under a penalty duration.

### Inspection & Housekeeping
- `getState(keyOrMessage)`: Returns defensive copy of count, penalty timestamp, and timestamps.
- `has(keyOrMessage)`: Checks if key is actively tracked.
- `reset(keyOrMessage)`: Resets count for a specific key.
- `resetAll()`: Clears all tracked entities.
- `getStats()`: Returns `{ trackedKeys, totalAllowed, totalRejected, state, isRunning }`.
- `start()`, `stop()`, `destroy()`.

---

## Subsystem Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `rate_limit_exceeded` | `{ decision, key, timestamp }` | Emitted when a request exceeds `maxRequests`. |
| `penalty_applied` | `{ key, penaltyDurationMs, penaltyUntil, timestamp }` | Emitted when a penalty duration is assigned. |
| `rate_limit_reset` | `{ key?, timestamp }` | Emitted when keys are reset. |
