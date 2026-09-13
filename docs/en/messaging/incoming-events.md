# Incoming Messages & Events

Leaves Guardian provides an event-driven architecture built on Node.js `EventEmitter`. Events are categorized into two primary groups:

1. **Message Events**: Real-time incoming WhatsApp messages normalized into immutable data structures.
2. **Connection & Lifecycle Events**: State transitions, authentication flows, connection health, and disconnect signals.

---

## 1. Message Event

### The `'message'` Event

Fires whenever an incoming WhatsApp message is received, unwrapped, and normalized:

```javascript
client.on('message', async (msg) => {
  console.log(`[${msg.type}] from ${msg.sender.id} in ${msg.chat.id}: ${msg.text}`);
});
```

* **Payload**: Normalized, immutable `Message` object.
* **Filtering Self-Messages**: Messages sent by the bot account have `msg.sender.isMe === true`.

---

## 2. Connection & Lifecycle Events

### Authentication Events

#### `'qr'`
Emitted when an ASCII QR code is generated for terminal scanning:
```javascript
client.on('qr', (qrString) => {
  console.log('Raw QR string received:', qrString);
});
```

#### `'pairing_required'`
Emitted when pairing code authentication mode is eligible and ready:
```javascript
client.on('pairing_required', ({ phoneNumber }) => {
  console.log(`Requesting pairing code for ${phoneNumber}...`);
});
```

#### `'pairing_code'`
Emitted when WhatsApp generates the 8-digit pairing code:
```javascript
client.on('pairing_code', ({ code, phoneNumber }) => {
  console.log(`Pairing code for ${phoneNumber}: ${code}`);
});
```

---

### Connection State Events

#### `'connecting'`
Emitted when the WebSocket transport layer initiates a connection attempt:
```javascript
client.on('connecting', () => {
  console.log('Connecting to WhatsApp WebSocket servers...');
});
```

#### `'connection_open'`
Emitted when the raw WebSocket connection is open (State: `OPEN`):
```javascript
client.on('connection_open', () => {
  console.log('Socket transport open (performing readiness checks)...');
});
```

#### `'ready'`
Emitted when session readiness verification succeeds and user identity is confirmed (State: `READY`):
```javascript
client.on('ready', ({ user }) => {
  console.log('Bot is authenticated and ready to process traffic!', user);
});
```

#### `'connection_close'`
Emitted when the socket disconnects temporarily or permanently:
```javascript
client.on('connection_close', ({ statusCode, reason, error }) => {
  console.warn(`Connection closed: ${reason} (Status: ${statusCode})`);
});
```

#### `'reconnecting'`
Emitted when auto-reconnect logic initiates a backoff retry:
```javascript
client.on('reconnecting', ({ reason }) => {
  console.log(`Reconnecting due to: ${reason}`);
});
```

#### `'logged_out'`
Emitted when the device session is logged out or unlinked from WhatsApp (State: `LOGGED_OUT`):
```javascript
client.on('logged_out', (error) => {
  console.error('Account unlinked or logged out from WhatsApp:', error.message);
});
```

---

### State & System Events

#### `'state_change'`
Emitted on every state transition of `LeavesClient`:
```javascript
client.on('state_change', ({ from, to }) => {
  console.log(`Client transition: ${from} -> ${to}`);
});
```

#### `'shutdown'`
Emitted when `await client.disconnect()` completes graceful shutdown:
```javascript
client.on('shutdown', () => {
  console.log('Leaves Guardian client cleanly shut down.');
});
```

#### `'error'`
Emitted on general runtime and client-level errors:
```javascript
client.on('error', (err) => {
  console.error('Client runtime error:', err);
});
```

---

## Complete Event Inventory

| Event Name | Category | Payload | Description |
| :--- | :--- | :--- | :--- |
| `message` | Message | `Message` | Normalized incoming message. |
| `connecting` | Connection | *(none)* | Starting socket handshake. |
| `qr` | Authentication | `string` | Raw QR code payload string. |
| `pairing_required` | Authentication | `{ phoneNumber }` | Pairing mode triggered. |
| `pairing_code` | Authentication | `{ code, phoneNumber }` | 8-digit pairing code generated. |
| `connection_open` | Connection | *(none)* | WebSocket transport open. |
| `ready` | Connection | `{ user }` | Authenticated and fully ready. |
| `connection_close`| Connection | `{ statusCode, reason, error }` | Socket closed or disconnected. |
| `reconnecting` | Connection | `{ reason }` | Auto-reconnection backoff in progress. |
| `logged_out` | Connection | `Error` | Device unlinked / logged out. |
| `state_change` | Lifecycle | `{ from, to }` | Internal state machine transition. |
| `shutdown` | Lifecycle | *(none)* | Graceful shutdown finished. |
| `error` | System | `Error` | Uncaught client runtime error. |

---

## Related Documentation

- **[Normalized Message Schema](/en/messaging/schema)**: Detailed contract of the `Message` object.
- **[Sending Text Messages](/en/messaging/sending-text)**: How to reply to incoming messages.
- **[Architecture & Lifecycle](/en/getting-started/architecture)**: Deep dive into the lifecycle state machine.
