---
title: Ingress Deduplicator (Message Deduplication)
description: Atomic test-and-set in-memory deduplication for duplicate WhatsApp message webhooks and network retries.
---

# Ingress Deduplicator (Message Deduplication)

WhatsApp message delivery can occasionally send duplicate webhook events during network reconnects or retry handshakes. `IngressDeduplicator` provides atomic, synchronous in-memory test-and-set deduplication to ensure bot business logic executes exactly once per message delivery.

> [!NOTE]
> IngressDeduplicator is an in-memory process-level filter. It is **not** a distributed idempotency database.

---

## Key Invariants & Features

1. **Atomic Test-and-Set (`checkAndMark`):** Checks for existence and records first observation atomically in memory.
2. **Dual Identity Extraction:** Supports normalized `Message` objects and Baileys raw key payloads.
   - *Direct Chat:* `${chatId}:${messageId}:${fromMe}`
   - *Group Chat:* `${chatId}:${messageId}:${fromMe}:${senderId}`
3. **Fixed Expiration TTL:** Duplicates increment observation count but **do not** extend the TTL of the original record.
4. **Bounded Capacity (`maxTrackedMessages: 10000`):** Enforces a maximum memory ceiling using an internal FIFO/LRU eviction map.

---

## Configuration & Defaults

```javascript
import { IngressDeduplicator } from 'leaves-guardian';

const dedup = new IngressDeduplicator({
  ttlMs: 300000,              // 5-minute deduplication TTL
  maxTrackedMessages: 10000,  // Maximum 10,000 tracked message IDs
  cleanupIntervalMs: 60000    // Housekeeping sweep every 60s
});
```

---

## Public API

### `checkAndMark(keyOrMessage)`
Evaluates message identity atomically, returning an immutable `DeduplicationResult`:

```javascript
client.on('message', async (msg) => {
  const result = dedup.checkAndMark(msg);

  if (result.isDuplicate) {
    console.log(`Ignored duplicate message ${msg.id} (seen ${result.seenCount} times)`);
    return;
  }

  // Process message business logic
});
```

### `DeduplicationResult` Properties
- `isDuplicate`: `boolean` — `true` if message was already observed.
- `key`: `string` — Canonical message identity string.
- `firstSeenAt`: `number` — Timestamp of initial observation.
- `lastSeenAt`: `number` — Timestamp of most recent duplicate observation.
- `seenCount`: `number` — Total times observed (1 for first seen).
- `expiresAt`: `number` — Expiration timestamp.
- `ttlRemainingMs`: `number` — Remaining validity time.

### Inspection & Management
- `peek(keyOrMessage)` / `getState(keyOrMessage)`: Inspects status without mutating observation count.
- `has(keyOrMessage)`: Checks if message is tracked and active.
- `reset(keyOrMessage)`: Removes tracking entry for a message.
- `resetAll()`: Clears cache.
- `getStats()`: Returns `{ trackedMessages, totalFirstSeen, totalDuplicates, state, isRunning }`.
- `start()`, `stop()`, `destroy()`.

---

## Subsystem Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `duplicate_detected` | `{ key, result, timestamp }` | Emitted whenever a duplicate message is received. |
| `dedup_reset` | `{ key?, clearedCount?, timestamp }` | Emitted when tracking records are cleared. |
