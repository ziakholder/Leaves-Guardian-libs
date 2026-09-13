---
title: LeavesClient API Reference
description: Complete API reference for the LeavesClient class, lifecycle state machine, configuration schema, public subsystems, and event catalog.
---

# LeavesClient API Reference

`LeavesClient` is the primary entrypoint and orchestrator of the Leaves Guardian library. It integrates Baileys socket management with enterprise reliability subsystems—including session integrity recovery, socket watchdog monitoring, host memory guards, priority traffic scheduling, media preparation, and developer interaction utilities.

```javascript
import { LeavesClient, CLIENT_STATES } from 'leaves-guardian';

const client = new LeavesClient(options);
```

---

## Constructor & Configuration Schema

`new LeavesClient(options)` initializes the client instance with configured subsystem options.

### Standard Consumer Options

```javascript
const client = new LeavesClient({
  // Authentication & Session
  auth: {
    directory: './session',           // Path to store Baileys auth credentials
    method: 'pairing',                // 'pairing' | 'qr'
    phoneNumber: '628123456789'       // Required when method is 'pairing'
  },

  // Reconnection Backoff (ReconnectManager)
  reconnect: {
    enabled: true,
    maxAttempts: Infinity,
    initialDelay: 1000,               // Initial backoff delay (1s)
    maxDelay: 30000,                  // Maximum backoff ceiling (30s)
    jitter: 1000                      // Random jitter range (ms)
  },

  // Terminal & Logging Presentation (Layer 5.5)
  terminal: {
    enabled: true,
    minLevel: 'INFO',                 // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    privacyMasking: true              // Mask phone numbers and tokens in logs
  },

  // Lightweight State & KV Store (SmartStore)
  store: {
    filePath: './data/smart-store.json',
    autoPersist: true,
    sweepIntervalMs: 60000,
    autoSweep: true
  },

  // Session & Auth Integrity Recovery
  recovery: {
    sessionDirectory: './session',
    backupDirectory: './session/.backup',
    quarantineDirectory: './session/.quarantine',
    maxSnapshots: 3,
    maxQuarantineEntries: 10,
    autoSnapshotOnConnect: true,
    autoRestoreOnCorruption: true,
    purgeBackupsOn401: true
  },

  // Central Runtime Observability & Health Engine
  health: {
    enabled: true,
    probeIntervalMs: 30000,
    probeTimeoutMs: 3000,
    historyLength: 60,
    thresholds: {
      eventLoopLagDegradedMs: 250,
      eventLoopLagCriticalMs: 1000,
      memoryHeapPercentDegraded: 80,
      memoryHeapPercentCritical: 95,
      disconnectedDurationDegradedMs: 15000,
      disconnectedDurationCriticalMs: 60000
    }
  },

  // Socket Liveness & Zombie Watchdog
  watchdog: {
    enabled: true,
    checkIntervalMs: 15000,
    maxSilenceMs: 60000,
    pingTimeoutMs: 10000,
    maxMissedPings: 2
  },

  // Host Process Memory Pressure & Mitigation
  memoryGuard: {
    enabled: true,
    checkIntervalMs: 30000,
    heapWarningBytes: 150 * 1024 * 1024,
    heapCriticalBytes: 300 * 1024 * 1024,
    rssWarningBytes: 250 * 1024 * 1024,
    rssCriticalBytes: 500 * 1024 * 1024,
    growthRateWarningPercent: 20,
    minimumGrowthBytes: 20 * 1024 * 1024,
    sampleWindowSize: 5,
    autoMitigateOnCritical: true
  },

  // Egress Dispatch & Traffic Control
  traffic: {
    maxQueueSize: 1000,
    maxConcurrentDispatches: 1,
    minDispatchIntervalMs: 250,
    highWatermarkRatio: 0.8,
    lowWatermarkRatio: 0.2,
    maxConsecutiveHigh: 5,
    historyLimit: 100
  },

  // Media Preparation & SSRF Security
  media: {
    maxInputBytes: 100 * 1024 * 1024,
    maxOutputBytes: 100 * 1024 * 1024,
    bufferThresholdBytes: 10 * 1024 * 1024,
    fetchTimeoutMs: 30000,
    maxRedirects: 5,
    maxConcurrentJobs: 3,
    maxWaitingJobs: 50,
    allowPrivateIp: false
  },

  // Ingress Rate Limiting
  rateLimiter: {
    windowMs: 60000,
    maxRequests: 60,
    penaltyDurationMs: 0,
    maxTrackedKeys: 10000,
    cleanupIntervalMs: 60000
  },

  // Ingress Deduplication
  deduplicator: {
    ttlMs: 300000,
    maxTrackedMessages: 10000,
    cleanupIntervalMs: 60000
  },

  // General Behavior Flags
  browser: ['Leaves Guardian', 'Chrome', '1.0.0'],
  markOnlineOnConnect: true,
  handleShutdown: true,               // Automatically handle SIGINT / SIGTERM
  logIncomingMessages: true,          // Format and print incoming messages
  printQR: true                       // Render terminal QR code in QR mode
});
```

### Advanced / Test Injection Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `socketFactory` | `function` | `makeWASocket` | Custom Baileys socket creation function. Intended for mocking and testing. |

---

## Lifecycle State Machine (`CLIENT_STATES`)

`LeavesClient` transitions deterministically through the following states:

```
[IDLE] ──► [INITIALIZING] ──► [AUTHENTICATING] ──► [CONNECTING] ──► [OPEN] ──► [READY]
                                                                        ▲          │
                                                                        │          ▼
                                                                  [RECONNECTING] ◄─ [DISCONNECTED]
                                                                        │
                                                                        ├──► [LOGGED_OUT]
                                                                        └──► [SHUTDOWN]
```

- **`IDLE`**: Instantiated but not connected.
- **`INITIALIZING`**: Running preflight session inspection and auto-recovery.
- **`AUTHENTICATING`**: Loading credentials and requesting pairing code or QR.
- **`CONNECTING`**: Opening WebSocket handshake with WhatsApp.
- **`OPEN`**: Underlying WebSocket is open.
- **`READY`**: Client completed internal initialization and verified authenticated account identity.
- **`DISCONNECTED`**: Socket closed by server or network.
- **`RECONNECTING`**: ReconnectManager scheduled an auto-reconnect backoff attempt.
- **`LOGGED_OUT`**: Terminal unlinked session or permanent 401 error.
- **`SHUTDOWN`**: Graceful shutdown completed via `client.disconnect()`.

> [!IMPORTANT]
> **`OPEN !== READY`**: `OPEN` signifies raw socket connection. `READY` indicates readiness verification has confirmed authenticated user credentials.
> Consumers should treat `client.state` as read-only; lifecycle transitions are owned and managed internally by `LeavesClient`.

---

## Public Surface & Tier Classification

### Tier 1 — Core Consumer API

#### `connect()`
- **Signature:** `async connect(): Promise<LeavesClient>`
- **Description:** Starts client initialization, executes preflight session integrity checks, and initiates the socket connection.

#### `disconnect()`
- **Signature:** `async disconnect(): Promise<void>`
- **Description:** Initiates a terminal graceful shutdown. Stops all active paginators, prompts, collectors, and auto-delete timers; flushes SmartStore; stops watchdog and memory guards; terminates traffic queues; closes the socket; and transitions state to `SHUTDOWN`.
- **Subsystem Cleanup Sequence:**
  1. Stops all active paginators (`paginator.stop('clientShutdown')`).
  2. Cancels all active prompts (`prompt.cancel('clientShutdown')`).
  3. Ends all active message collectors (`collector.stop('SHUTDOWN')`).
  4. Stops the auto-delete task scheduler (`autoDelete.stop()`).
  5. Flushes and stops SmartStore persistence (`await store.stop()`).
  6. Shuts down session recovery queues (`await recovery.stop()`).
  7. Stops health monitoring ticks (`health.stop()`).
  8. Stops socket watchdog pings (`watchdog.stop()`).
  9. Stops memory guard sampling (`memoryGuard.stop()`).
  10. Clears and stops traffic queues (`trafficController.stop()`).
  11. Destroys media pipeline resources (`await mediaPipeline.destroy()`).
  12. Destroys rate limiter caches (`rateLimiter.destroy()`).
  13. Destroys deduplicator caches (`deduplicator.destroy()`).
  14. Detaches presentation adapters (`presentationAdapter.detach()`).
  15. Destroys terminal managers (`terminalManager.destroy()`).
  16. Closes underlying Baileys socket connection (`await connectionManager.close()`).
  17. Emits terminal `'shutdown'` event.

#### `sendMessage(jid, contentOrBuilder, options)` / `send(...)`
- **Signature:** `async sendMessage(jid: string, content: object | BaseBuilder, options?: object): Promise<any>`
- **Description:** Enqueues an outbound message through `TrafficController` for prioritized, paced transmission. `client.send()` is an exact alias.

#### `sendText(jid, text, options)`
- **Signature:** `async sendText(jid: string, text: string, options?: object): Promise<any>`
- **Description:** Helper shortcut for sending plain text messages.

#### `deleteMessage(key)`
- **Signature:** `async deleteMessage(key: object): Promise<any>`
- **Description:** Sends a revocation/delete message for everyone using a canonical WAMessageKey. Requires client to be in `READY` state.

#### `sendAndAutoDelete(jid, contentOrBuilder, delayMs, options)`
- **Signature:** `async sendAndAutoDelete(jid: string, content: object | BaseBuilder, delayMs: number, options?: object): Promise<{ message: any, task: AutoDeleteTask }>`
- **Description:** Validates the delay and options, sends the message, then schedules an auto-delete task. If scheduling fails after sending, an `AutoDeleteError` is thrown and the sent message is not rolled back.

#### `getState()`
- **Signature:** `getState(): string`
- **Description:** Returns the current lifecycle state string (`CLIENT_STATES`).

#### `isReady()`
- **Signature:** `isReady(): boolean`
- **Description:** Returns `true` if client is currently in `READY` state.

#### `getUser()`
- **Signature:** `getUser(): { id: string, name?: string } | null`
- **Description:** Returns authenticated account information if connected.

#### `requestPairingCode(phoneNumber)`
- **Signature:** `async requestPairingCode(phoneNumber: string): Promise<string>`
- **Description:** Manually requests an 8-character pairing code for a given phone number.

---

### Utility & Flow Factories

- **`createMessageCollector(options)`**: Returns a new `MessageCollector` instance tracked by the client.
- **`awaitMessage(options)`**: Returns a Promise resolving the first matching message or rejecting on timeout.
- **`awaitMessages(options)`**: Returns a Promise resolving an array of collected messages when limits or timeout occur.
- **`createPrompt(options)`**: Returns a new interactive multi-step `Prompt` instance.
- **`createPaginator(options)`**: Returns a new interactive `Paginator` instance.
- **`createEphemeralMessage(content, options)`**: Returns an `EphemeralMessage` container.
- **`createAutoDeleteManager(options)`**: Creates a standalone `AutoDeleteManager` instance.
- **`registerMemoryMitigationHook(name, fn, options)`**: Registers a memory cleanup hook on `client.memoryGuard`.

---

### Tier 2 — Public Subsystem Accessors

The following properties provide direct access to Leaves Guardian subsystems:

| Property | Subsystem Class | Description |
| :--- | :--- | :--- |
| `client.store` | `SmartStore` | Key-value store with namespaces and TTL. |
| `client.recovery` | `SessionRecovery` | Disk auth backup, snapshotting, and quarantine. |
| `client.health` | `HealthMonitor` | Runtime health, lag profiling, and custom probes. |
| `client.watchdog` | `Watchdog` | Socket liveness and zombie detection. |
| `client.memoryGuard` | `MemoryGuard` | Host process memory monitoring and mitigation. |
| `client.traffic` | `TrafficController` | Priority queuing, starvation prevention, and pacing. |
| `client.media` | `MediaPipeline` | Media stream resolution, MIME detection, and SSRF guard. |
| `client.rateLimiter` | `IngressRateLimiter` | Ingress sliding window rate limiting. |
| `client.deduplicator` | `IngressDeduplicator` | Ingress atomic message deduplication. |
| `client.autoDelete` | `AutoDeleteManager` | Scheduled message deletion task manager. |
| `client.terminal` | `LeavesTerminal` | Presentation logging facade with privacy masking. |

---

### Tier 3 — Advanced / Escape Hatch

#### `getRawSocket()`
- **Signature:** `getRawSocket(): any`
- **Description:** Returns the underlying raw Baileys socket object (`sock`).
- **Warning:**
  > [!WARNING]
  > Raw socket access bypasses Leaves Guardian's higher-level messaging abstractions and may bypass features such as traffic queuing and other wrapper-level safeguards.

---

## Public Events Catalog

`LeavesClient` extends `EventEmitter` and emits the following verified events:

| Event Name | Exact Payload | Description / Trigger Condition |
| :--- | :--- | :--- |
| `state_change` | `{ from: string, to: string, ...meta }` | Emitted whenever the client transitions between `CLIENT_STATES`. |
| `connecting` | `void` | Emitted when socket connection to WhatsApp starts. |
| `qr` | `qrString: string` | Emitted when a new QR code is received from Baileys. |
| `pairing_required` | `{ phoneNumber: string }` | Emitted when client is ready to request a pairing code. |
| `pairing_code` | `{ code: string, phoneNumber: string }` | Emitted when an 8-character pairing code is generated. |
| `connection_open` | `void` | Emitted when underlying WebSocket connection opens (`OPEN` state). |
| `ready` | `{ user: object }` | Emitted when runtime readiness checks complete (`READY` state). |
| `connection_close` | `{ statusCode?: number, reason?: string, error?: Error }` | Emitted when the socket disconnects. |
| `reconnecting` | `{ reason: string }` | Emitted when ReconnectManager schedules an auto-reconnection attempt. |
| `logged_out` | `err: Error` | Emitted when account is unlinked or receives terminal 401. |
| `message` | `normalizedMessage: Message` | Emitted when an inbound normalized message is received. |
| `error` | `err: Error` | Emitted when an uncaught client or socket error occurs. |
| `session_corrupted` | `inspection: object` | Emitted when corrupted auth files are detected during preflight. |
| `recovery_failed` | `{ error: Error }` | Emitted when automatic session recovery fails. |
| `shutdown` | `void` | Emitted after `disconnect()` completes cleanup of all subsystems. |
