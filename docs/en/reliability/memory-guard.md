---
title: Memory Guard (Pressure & Mitigation)
description: Node.js process memory monitoring, heuristic sustained growth detection, and bounded mitigation hooks.
---

# Memory Guard (Pressure & Mitigation)

`MemoryGuard` monitors host Node.js process memory metrics, detects memory pressure and heuristic sustained growth trends, and coordinates bounded subsystem mitigation hooks (such as clearing caches and sweeping expired store entries).

Accessible via `client.memoryGuard` on the client instance.

---

## Key Invariants & Architectural Boundary

1. **Host Process Memory Scope:** MemoryGuard reads `process.memoryUsage()`. It observes overall Node.js process memory, not claiming exclusive ownership over leaves-guardian allocations.
2. **Zero Socket or Process Authority:** MemoryGuard has zero authority to kill sockets, trigger reconnects, or invoke `process.exit()`.
3. **Single-Flight Mitigation:** Concurrent calls to `mitigate()` coalesce into a single in-flight Promise.
4. **Heuristic Growth Trend:** Sustained growth warnings require monotonic heap increases across the entire sampling window, exceeding both percentage and absolute minimum byte thresholds.

---

## Configuration & Default Heuristics

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  memoryGuard: {
    enabled: true,
    checkIntervalMs: 30000,               // Sample memory every 30s
    heapWarningBytes: 150 * 1024 * 1024,  // 150 MB warning threshold
    heapCriticalBytes: 300 * 1024 * 1024, // 300 MB critical threshold
    rssWarningBytes: 250 * 1024 * 1024,   // 250 MB RSS warning
    rssCriticalBytes: 500 * 1024 * 1024,  // 500 MB RSS critical
    growthRateWarningPercent: 20,         // 20% growth across sample window
    minimumGrowthBytes: 20 * 1024 * 1024, // 20 MB minimum growth delta
    sampleWindowSize: 5,                  // Sample window history (5 ticks)
    autoMitigateOnCritical: true,         // Automatically run mitigation hooks on CRITICAL
    allowManualGc: false,                 // Allow global.gc() if --expose-gc is set
    gcCooldownMs: 60000,                  // 60s cooldown between manual GCs
    hookTimeoutMs: 5000                   // 5s maximum execution time per mitigation hook
  }
});
```

---

## Public API & Mitigation Hooks

### `registerMitigationHook(name, hookFn, options)`
Registers a cleanup hook executed during memory pressure:

```javascript
client.memoryGuard.registerMitigationHook('custom_cache_cleaner', async () => {
  const itemsCleared = myCache.flushOldEntries();
  return { itemsCleared };
}, { timeoutMs: 3000 });
```

*(LeavesClient automatically registers a default mitigation hook for `client.store.sweep`)*.

### `mitigate()`
Executes all registered mitigation hooks with single-flight coalescing and returns a forensic report:

```javascript
const report = await client.memoryGuard.mitigate();
console.log('Mitigation succeeded:', report.succeeded);
console.log('Actions executed:', report.actions);
```

### `checkNow()`
Performs an instantaneous memory inspection without updating the sliding window history or emitting events:

```javascript
const check = client.memoryGuard.checkNow();
console.log('Current Level:', check.level); // 'NORMAL' | 'WARNING' | 'CRITICAL'
```

### `getStatus()`
Returns a 15-field canonical status snapshot adhering to the system contract.

---

## Subsystem Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `memory_sample` | `{ timestamp, state, level, processMemory, growth }` | Emitted on every periodic sampling tick. |
| `memory_pressure` | `{ timestamp, level, processMemory, reasons }` | Emitted when memory enters WARNING level. |
| `memory_critical` | `{ timestamp, level, processMemory, reasons }` | Emitted when memory enters CRITICAL level. |
| `memory_recovered` | `{ timestamp, fromLevel, processMemory }` | Emitted when memory recovers back to NORMAL. |
| `memory_growth_warning` | `{ timestamp, growthRatePercent, deltaBytes, currentHeapUsed }` | Emitted when heuristic sustained growth is detected. |
| `mitigation_completed` | `report` | Emitted after mitigation hooks finish execution. |
