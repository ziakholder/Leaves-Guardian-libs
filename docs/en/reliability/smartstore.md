---
title: SmartStore (State & KV Store)
description: Lightweight, in-memory key-value store with TTL, namespaces, and atomic JSON persistence in Leaves Guardian.
---

# SmartStore (State & KV Store)

`SmartStore` is Leaves Guardian's built-in, lightweight state and key-value persistence engine. It maintains in-memory state with asynchronous API operations, non-blocking atomic disk persistence, strict JSON validation, namespace isolation, and time-to-live (TTL) expiration.

`SmartStore` is accessible directly on the client instance via `client.store` or can be instantiated standalone.

## Key Invariants & Features

1. **In-Memory State with Asynchronous Operations & Atomic Persistence:** State is cached in memory (`Map`) for rapid access, while all public API operations (`get`, `has`, `set`, `delete`, `keys`, `entries`) return Promises. Writes enqueue atomic disk persistence via temporary file + `fsync` + atomic rename.
2. **Strict JSON Validation:** Values must be JSON-compatible. SmartStore explicitly rejects `undefined`, `Function`, `Symbol`, `BigInt`, `NaN`, `Infinity`, `Promise`, `Map`, `Set`, `Date`, `Buffer`, custom class instances, and circular references.
3. **Namespace Isolation:** Supports partitioned key-value spaces (e.g., `sessions`, `user_state`, `cooldowns`) via `store.namespace(name)`.
4. **Time-To-Live (TTL):** Supports per-key expiration timestamps. Expired keys are evicted lazily on access and actively via periodic housekeeping sweeps.
5. **Non-Poisoning Write Queue:** Individual disk write failures reject only their own operation without poisoning subsequent persistence calls.

---

## Configuration & Defaults

When initializing `LeavesClient`, SmartStore options can be configured under the `store` option:

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  store: {
    filePath: './data/smart-store.json', // Target JSON file
    autoPersist: true,                   // Automatically persist writes to disk
    sweepIntervalMs: 60000,              // Sweep expired keys every 60s
    autoSweep: true                      // Enable background sweep timer
  }
});
```

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `filePath` | `string` | `'./data/smart-store.json'` | Path to the storage JSON file on disk. |
| `autoPersist` | `boolean` | `true` | When `true`, mutative operations queue disk persistence immediately. |
| `sweepIntervalMs` | `number` | `60000` (60s) | Interval in milliseconds for periodic background expiration sweeps. |
| `autoSweep` | `boolean` | `true` | Starts the unreferenced background sweep timer automatically on creation. |

---

## Basic Usage (Default Namespace)

By default, operations on `client.store` target the `'default'` namespace:

```javascript
// Store a value
await client.store.set('user:123:step', 'AWAITING_PAYMENT');

// Store a value with a 5-minute TTL (in milliseconds)
await client.store.set('otp:user:123', '948201', { ttl: 5 * 60 * 1000 });

// Read a value (returns undefined if missing or expired)
const step = await client.store.get('user:123:step');
console.log('Current step:', step);

// Check key existence
const hasOtp = await client.store.has('otp:user:123');

// Delete a key
const deleted = await client.store.delete('user:123:step');

// Clear all keys in default namespace
await client.store.clear();
```

---

## Namespace Partitioning

Namespaces provide clean isolation for different bot features:

```javascript
// Create namespace proxies
const sessions = client.store.namespace('user_sessions');
const rateLimits = client.store.namespace('command_cooldowns');

// Set values within isolated namespaces
await sessions.set('628123456789', {
  currentFlow: 'ORDER_CREATION',
  cart: [{ id: 'item_1', qty: 2 }]
});

await rateLimits.set('628123456789:daily_claim', true, { ttl: 24 * 60 * 60 * 1000 });

// Access namespace data
const userSession = await sessions.get('628123456789');
const allSessionKeys = await sessions.keys();
const sessionCount = await sessions.size();
```

### Namespace Methods

Each `SmartStoreNamespace` instance provides identical scoped async methods:
- `set(key, value, options)`
- `get(key)`
- `has(key)`
- `delete(key)`
- `clear()`
- `entries()`
- `keys()`
- `values()`
- `size()`

---

## Manual Eviction & Persistence

```javascript
// Actively sweep all expired keys across all namespaces
const evictedCount = client.store.sweep();
console.log(`Evicted ${evictedCount} expired entries.`);

// Force immediate flush of in-memory data to disk
await client.store.flush();

// Graceful shutdown (stops sweep timers and flushes remaining writes)
await client.store.stop();
```

---

## Subsystem Events

`SmartStore` extends Node.js `EventEmitter` and emits the following diagnostic events:

| Event | Payload | Description |
| :--- | :--- | :--- |
| `set` | `{ namespace, key, value, expiresAt }` | Emitted when a key is stored or updated. |
| `delete` | `{ namespace, key }` | Emitted when a key is deleted. |
| `clear` | `{ namespace }` | Emitted when a namespace is cleared. |
| `expired` | `{ namespace, key }` | Emitted when an expired key is evicted during access or sweep. |
| `writeError` | `Error` | Emitted when atomic disk persistence fails (non-fatal event). |
| `shutdownError` | `Error` | Emitted if final flush fails during store shutdown. |
