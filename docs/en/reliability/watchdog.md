---
title: Socket Watchdog (Liveness & Zombie Detection)
description: Passive silence tracking, active WebSocket ping probes, zombie socket detection, and safe termination delegation.
---

# Socket Watchdog (Liveness & Zombie Detection)

`Watchdog` monitors WhatsApp WebSocket liveness in Leaves Guardian. Mobile network connections can silently freeze (*zombie sockets*) where the OS socket appears open, but the remote WhatsApp server has stopped routing packets.

Watchdog detects this condition using a hybrid approach: **passive traffic silence observation** followed by **active ping probes**.

Accessible via `client.watchdog` on the client instance.

---

## Key Invariants & Ownership Boundaries

1. **No Reconnection Ownership:** Watchdog has **zero** reconnect logic and does not set reconnection timers. When a zombie socket is confirmed, Watchdog requests immediate socket termination (`connectionManager.terminateSocket('ZOMBIE_SOCKET_DETECTED')`). Reconnection backoff is 100% owned by `ReconnectManager`.
2. **Activity vs Pong Acknowledgement:**
   - Inbound socket traffic or incoming messages update `lastActivityAt` and reset missed pings.
   - Pong control frames update `lastPingAckAt` and resolve the in-flight ping without altering `lastActivityAt`.
3. **Single-Flight Ping:** Only one WebSocket ping probe can be in-flight at any time.
4. **Generation Token Protection:** In-flight asynchronous termination tasks carry a generation token to prevent stale terminations from affecting subsequent socket connections.
5. **Lifecycle Sensitivity:** Watchdog operates only when the client is in `READY` or `OPEN` state and is automatically paused during disconnection.

---

## Configuration & Defaults

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  watchdog: {
    enabled: true,
    checkIntervalMs: 15000, // Periodic evaluation interval (15s)
    maxSilenceMs: 60000,    // Trigger active ping after 60s of silence
    pingTimeoutMs: 10000,   // Wait up to 10s for pong response
    maxMissedPings: 2       // Confirm zombie socket after 2 consecutive timeouts
  }
});
```

---

## Public API & Diagnostics

### `recordActivity(source)`
Notifies the watchdog of incoming traffic (`'socket'`, `'message'`, or `'pong'`):

```javascript
client.watchdog.recordActivity('message');
```

### `getStatus()`
Returns a snapshot of the watchdog's internal state:

```javascript
const status = client.watchdog.getStatus();
console.log('Watchdog State:', status.state); // 'STOPPED' | 'RUNNING' | 'PAUSED' | 'TERMINATING'
console.log('Silence Duration:', status.silenceDurationMs, 'ms');
console.log('Missed Pings:', status.missedPings);
console.log('Total Zombies Detected:', status.zombiesDetectedTotal);
```

### Lifecycle Control
- `start()`: Starts the periodic tick loop.
- `stop()`: Stops the monitoring loop and clears timers.
- `pause()`: Pauses evaluation during disconnect.
- `resume()`: Resumes evaluation when client reconnects.
- `reset()`: Clears diagnostic counters and resets state.

---

## Subsystem Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `watchdog_tick` | `{ timestamp, silenceDurationMs, missedPings, state }` | Emitted on every evaluation tick. |
| `ping_sent` | `{ timestamp, silenceDurationMs, success, error? }` | Emitted when an active ping is dispatched. |
| `ping_ack` | `{ timestamp, rttMs }` | Emitted when a pong ACK is received from WhatsApp. |
| `ping_timeout` | `{ timestamp, missedPings, maxMissedPings }` | Emitted when a dispatched ping times out. |
| `zombie_detected` | `{ timestamp, silenceDurationMs, missedPings, reason }` | Emitted when consecutive ping timeouts confirm a zombie socket. |
| `zombie_terminated` | `{ timestamp, reason }` | Emitted when socket termination is accepted by ConnectionManager. |
| `zombie_termination_failed` | `{ timestamp, error }` | Emitted if socket termination fails. |
