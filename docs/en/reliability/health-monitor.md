---
title: Health Monitor (Runtime Observability)
description: Non-blocking event loop lag profiling, memory inspection, subsystem status, and isolated custom health probes.
---

# Health Monitor (Runtime Observability)

`HealthMonitor` provides comprehensive runtime observability for Leaves Guardian. It continuously profiles Node.js event loop latency, process memory metrics, CPU utilization, Baileys connection state, throughput counters, subsystem health, and isolated custom probes.

Accessible via `client.healthMonitor` (and `client.getHealth()`).

---

## Key Invariants & Architectural Boundary

1. **Observational Only:** HealthMonitor measures and reports health status. It has zero authority to terminate sockets, restart processes, or trigger reconnect timers.
2. **Non-Blocking Measurement:** Event loop lag is measured asynchronously via `setImmediate` and `performance.now()`.
3. **Single-Flight Protection:** Concurrent manual and periodic evaluations coalesce into a single in-flight Promise.
4. **Deterministic Precedence:** Overall health evaluates with strict precedence: `CRITICAL` > `DEGRADED` > `HEALTHY`.
5. **Separation of Manual vs Periodic:** Periodic evaluation ticks update the ring buffer history and emit transition events. Manual calls (`getHealth()`) return an on-demand report without polluting history.

---

## Configuration & Default Thresholds

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  health: {
    enabled: true,
    probeIntervalMs: 30000, // Periodic evaluation interval (30s)
    probeTimeoutMs: 3000,   // Per-probe execution timeout (3s)
    historyLength: 60,      // Keep last 60 periodic snapshots
    thresholds: {
      eventLoopLagDegradedMs: 250,
      eventLoopLagCriticalMs: 1000,
      memoryHeapPercentDegraded: 80,
      memoryHeapPercentCritical: 95,
      disconnectedDurationDegradedMs: 15000, // 15s
      disconnectedDurationCriticalMs: 60000  // 60s
    }
  }
});
```

---

## Public API

### `getHealth()`
Performs an on-demand evaluation snapshot protected by single-flight mutex:

```javascript
const report = await client.healthMonitor.getHealth();
console.log('Status:', report.status); // 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
console.log('Event Loop Lag:', report.runtime.eventLoopLagMs, 'ms');
console.log('Heap Used:', (report.runtime.memory.heapUsedBytes / (1024 * 1024)).toFixed(2), 'MB');
console.log('Messages / Min:', report.throughput.messagesPerMinute);
```

### `getSummary()`
Returns a deep copy of the latest periodic summary without triggering a new evaluation:

```javascript
const summary = client.healthMonitor.getSummary();
if (summary) {
  console.log('Is healthy:', summary.isHealthy);
  console.log('Degraded reasons:', summary.degradedReasons);
}
```

### `getHistory()`
Returns the ring buffer history of periodic reports:

```javascript
const history = client.healthMonitor.getHistory();
console.log(`Captured ${history.length} snapshots.`);
```

### `registerProbe(name, probeFn, options)`
Registers a custom async probe with isolated timeout and serialization:

```javascript
client.healthMonitor.registerProbe('database_ping', async () => {
  const isDbOk = await checkDatabaseConnection();
  if (!isDbOk) throw new Error('Database unreachable');
  return { pingMs: 12 };
}, { timeoutMs: 2000, critical: true });
```

### `unregisterProbe(name)` & `getRegisteredProbes()`
Manage registered custom probes dynamically.

---

## Subsystem Events (Periodic Evaluation)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `health_check` | `report` | Emitted on every periodic health tick. |
| `health_degraded` | `{ report, reasons }` | Emitted when health degrades from HEALTHY. |
| `health_critical` | `{ report, reasons }` | Emitted when health transitions to CRITICAL. |
| `health_recovered` | `{ report, fromStatus }` | Emitted when health recovers to HEALTHY. |
