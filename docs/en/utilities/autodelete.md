# Auto-Delete Manager

`AutoDeleteManager` is a client-side scheduled message deletion engine (Layer 4.5) in Leaves Guardian. It allows bots to schedule message revocations ("Delete for Everyone") automatically after a specified delay.

---

## Core Methods

### 1. `client.sendAndAutoDelete()`

The most common helper for atomically sending a message and scheduling its deletion:

```javascript
// Signature: client.sendAndAutoDelete(jid, contentOrBuilder, delayMs, options)

// Send a verification OTP that self-destructs in 30 seconds (30,000 ms)
const { message, task } = await client.sendAndAutoDelete(
  msg.chat.id,
  '🔐 Your verification code is *849201*. This message will delete in 30s.',
  30000
);

console.log(`Scheduled auto-delete task ID: ${task.id}`);
```

### 2. `client.autoDelete.schedule()`

To schedule deletion for an already-sent message or an incoming message:

```javascript
// Schedule deletion for an existing message in 60 seconds
const task = client.autoDelete.schedule(sentMessage, 60000);
```

---

## Delay Validation Rules

Leaves Guardian applies strict atomic delay validation (`validateDelay`):

- **Non-Negative**: `delayMs >= 0` must be satisfied. Passing negative numbers will throw a `LeavesValidationError` with code `AUTODELETE_INVALID_DELAY`.
- **Finite Integer**: `delayMs` must be a valid integer in milliseconds (e.g., `5000` for 5 seconds).

```javascript
// Valid: 0 ms (immediate scheduled queue execution)
await client.sendAndAutoDelete(msg.chat.id, 'Test', 0);

// Invalid: Throws LeavesValidationError
await client.sendAndAutoDelete(msg.chat.id, 'Test', -1000); // ❌ Throws error
```

---

## Task Management & Cancellation

Scheduled tasks return an `AutoDeleteTask` instance that can be inspected and cancelled prior to execution:

```javascript
const { task } = await client.sendAndAutoDelete(msg.chat.id, 'Notice', 60000);

// Later, if the condition changes:
task.cancel(); // Cancels the scheduled timer cleanly
```

You can also cancel tasks via the manager using the task ID or message key:

```javascript
client.autoDelete.cancel(taskId);
client.autoDelete.cancelByKey(messageKey);
```

---

## Task Lifecycle States (`AUTODELETE_STATES`)

| State | Description |
| :--- | :--- |
| `AUTODELETE_STATES.PENDING` | Timer is active, waiting for the delay duration to elapse. |
| `AUTODELETE_STATES.EXECUTING` | Delay elapsed, revocation request sent to WhatsApp. |
| `AUTODELETE_STATES.COMPLETED` | Deletion request succeeded. |
| `AUTODELETE_STATES.CANCELLED` | Task was cancelled before execution. |
| `AUTODELETE_STATES.FAILED` | Deletion request failed on the network. |

---

## AutoDelete vs Ephemeral Messages

It is important to understand the fundamental difference between `AutoDeleteManager` and `EphemeralMessage`:

| Feature | `AutoDeleteManager` | `EphemeralMessage` |
| :--- | :--- | :--- |
| **Mechanism** | Client-side Node.js timer triggering explicit `deleteMessage()` | Native WhatsApp server-side disappearing protocol |
| **Duration** | Any custom millisecond duration (`delayMs >= 0`) | Fixed WhatsApp presets (24 Hours, 7 Days, 90 Days) |
| **Node.js Timers** | Active `setTimeout` tracked in memory | **Zero (0) Node.js timers** |
| **Revocation Signal** | Sends explicit message revocation stanza | Native disappearance handled by WhatsApp apps |

---

## Related Documentation

- **[Ephemeral Messages](/en/utilities/ephemeral)**: Native WhatsApp disappearing message wrapper.
- **[Deleting Messages](/en/messaging/deleting)**: Manual message deletion method.
- **[Sending Text Messages](/en/messaging/sending-text)**: Standard text dispatching.
