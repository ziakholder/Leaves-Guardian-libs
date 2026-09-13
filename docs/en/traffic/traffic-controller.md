---
title: Traffic Controller (Queuing & Pacing)
description: Outbound message queuing, priority scheduling, starvation prevention, pacing, and backpressure watermarks.
---

# Traffic Controller (Queuing & Pacing)

`TrafficController` manages all outbound message dispatching in Leaves Guardian. It provides priority-based queued scheduling, starvation prevention, transmission pacing, and backpressure flow control to protect bot instances from dispatch spikes and rate rejection.

---

## Key Invariants & Features

1. **Priority Scheduling with Fairness:** Tasks are assigned `HIGH`, `NORMAL`, or `LOW` priority. Scheduling is FIFO within each priority level.
2. **Starvation Prevention (`maxConsecutiveHigh: 5`):** After 5 consecutive `HIGH` priority dispatches, the controller forcibly selects a `NORMAL` or `LOW` task (if pending) to prevent low-priority starvation.
3. **Dispatch Pacing (`minDispatchIntervalMs: 250`):** Enforces a minimum delay between consecutive message dispatches to smooth out traffic spikes.
4. **Backpressure Watermarks:** 
   - High watermark (default 80% of `maxQueueSize`, 800 tasks) triggers `backpressure_active`.
   - Low watermark (default 20% of `maxQueueSize`, 200 tasks) triggers `backpressure_resolved`.
5. **Task Lifecycle & Unmasked Errors:** Tasks transition deterministically through `PENDING` → `DISPATCHING` → `COMPLETED` / `FAILED` / `CANCELLED`. If transport fails, the exact underlying error is rejected back to the caller.

---

## Configuration & Defaults

```javascript
import { TrafficController } from 'leaves-guardian';

const traffic = new TrafficController({
  maxQueueSize: 1000,              // Maximum pending tasks before rejecting admissions
  maxConcurrentDispatches: 1,      // Number of concurrent dispatches (default 1)
  minDispatchIntervalMs: 250,      // Minimum delay between dispatches (250ms)
  highWatermarkRatio: 0.8,         // 80% (800 tasks) triggers backpressure
  lowWatermarkRatio: 0.2,          // 20% (200 tasks) resolves backpressure
  maxConsecutiveHigh: 5,           // Starvation prevention threshold
  historyLimit: 100                // Retain last 100 terminal tasks
});
```

---

## Public API

### `enqueue(jid, content, options)` / `send(jid, content, options)`
Enqueues a message for scheduled transmission and returns a Promise:

```javascript
// Normal priority
await client.traffic.enqueue('628123456789@s.whatsapp.net', { text: 'Hello!' });

// High priority dispatch (e.g. OTP or critical alert)
await client.traffic.enqueue('628123456789@s.whatsapp.net', { text: 'Your OTP: 1234' }, {
  priority: 'HIGH'
});
```

### `cancel(taskId)`
Cancels a specific pending task from the queue:

```javascript
const cancelled = client.traffic.cancel(taskId);
```

### `cancelByJid(jid)`
Cancels all pending tasks targeting a specific recipient JID:

```javascript
const count = client.traffic.cancelByJid('628123456789@s.whatsapp.net');
console.log(`Cancelled ${count} queued messages for recipient.`);
```

### `getStatus()`
Returns real-time queue metrics:

```javascript
const status = client.traffic.getStatus();
console.log('Queue Size:', status.queueSize);
console.log('By Priority:', status.queueByPriority); // { HIGH, NORMAL, LOW }
console.log('In-Flight:', status.inFlightCount);
console.log('Backpressure Active:', status.backpressureActive);
console.log('Avg Wait Time:', status.metrics.averageWaitTimeMs, 'ms');
```

---

## Subsystem Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `state_change` | `{ from, to }` | Emitted when controller transitions between RUNNING, PAUSED, and STOPPED. |
| `backpressure_active` | `{ queueSize, highWatermark }` | Emitted on the rising edge when queue size exceeds high watermark. |
| `backpressure_resolved` | `{ queueSize, lowWatermark }` | Emitted on the falling edge when queue size drops below low watermark. |
