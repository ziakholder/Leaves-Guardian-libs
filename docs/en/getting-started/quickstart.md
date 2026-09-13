# Quick Start

Welcome to **Leaves Guardian**! This guide is designed as the fastest path to building and running your first WhatsApp bot using the `leaves-guardian` library.

---

## Prerequisites

Before getting started, ensure your environment meets the following requirements:

- **Node.js**: Version `>= 18.0.0` (LTS recommended).
- **Module System**: ECMAScript Modules (ESM) enabled (`"type": "module"` in your `package.json`).
- **Terminal Access**: An interactive terminal to render QR codes during authentication (or an active WhatsApp phone number for pairing code authentication).

---

## Installation

Install the `leaves-guardian` package using your preferred package manager:

::: code-group

```bash [npm]
npm install leaves-guardian
```

```bash [pnpm]
pnpm add leaves-guardian
```

```bash [yarn]
yarn add leaves-guardian
```

:::

Ensure your `package.json` specifies `"type": "module"`:

```json
{
  "name": "my-whatsapp-bot",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "leaves-guardian": "^0.2.0"
  }
}
```

---

## Your First Leaves Client

Create an entry file named `index.js` with the following minimal, runnable example:

```javascript
import { LeavesClient } from 'leaves-guardian';

// 1. Initialize the client instance
const client = new LeavesClient({
  auth: {
    directory: './session', // Directory where multi-file session credentials are saved
    method: 'qr'            // 'qr' (default) or 'pairing'
  }
});

// 2. Listen for the readiness event (socket open + authenticated identity verified)
client.on('ready', ({ user }) => {
  console.log(`✅ Bot successfully connected as ${user?.id || user?.jid || 'WhatsApp Bot'}!`);
});

// 3. Listen for normalized incoming messages
client.on('message', async (msg) => {
  // Ignore messages sent by the bot account itself
  if (msg.sender.isMe) return;

  // Simple command response
  if (msg.text.trim() === '!ping') {
    await client.sendText(msg.chat.id, '🏓 Pong from Leaves Guardian!');
  }
});

// 4. Initiate the connection
await client.connect();
```

To run your bot, execute:

```bash
node index.js
```

---

## Authentication

Leaves Guardian supports two primary authentication modes out of the box.

### QR Code Authentication (Default)

By default, `auth.method` is set to `'qr'`. When you execute `await client.connect()`, Leaves Guardian will automatically render an ASCII QR code directly inside your terminal using `qrcode-terminal`.

```javascript
const client = new LeavesClient({
  auth: {
    directory: './session',
    method: 'qr'
  }
});
```

* **Scan**: Open WhatsApp on your phone, navigate to **Linked Devices** > **Link a Device**, and scan the QR code displayed in your terminal.
* **Disable Terminal QR Output**: If you are embedding the client into a custom dashboard or GUI, set `printQR: false` in the options and listen to the `qr` event:
  ```javascript
  const client = new LeavesClient({
    printQR: false
  });

  client.on('qr', (qrString) => {
    // Process or display raw QR string in your custom interface
  });
  ```

### Pairing Code Authentication

If your bot runs in a headless environment without terminal graphics or you prefer pairing via a phone number, use the pairing code method:

```javascript
const client = new LeavesClient({
  auth: {
    directory: './session',
    method: 'pairing',
    phoneNumber: '628123456789' // Country code + phone number without '+' or formatting
  }
});

client.on('pairing_code', ({ code, phoneNumber }) => {
  console.log(`🔑 Pairing Code for ${phoneNumber}: ${code}`);
});
```

* **Link on Device**: Open WhatsApp on your phone, go to **Linked Devices** > **Link a Device** > **Link with phone number instead**, and enter the 8-digit code.

---

## Connection Lifecycle

Leaves Guardian manages socket states through an explicit lifecycle state machine:

```text
IDLE
  └── INITIALIZING
        └── AUTHENTICATING
              └── CONNECTING
                    └── OPEN
                          └── READY
```

### Important Rule: `OPEN !== READY`

In WhatsApp connections, a socket reaching the raw `OPEN` state does **not** guarantee that the session is authenticated and ready to dispatch messages.

- **`OPEN`**: The raw WebSocket connection to WhatsApp servers is established.
- **`READY`**: The runtime initialization pipeline has verified the authenticated credentials (`sock.user` / auth credentials identity). The `ready` event triggers only when the client is genuinely ready to send and receive traffic.

---

## Receiving Messages

Incoming messages are normalized into an immutable `Message` data object before being emitted through the `message` event:

```javascript
client.on('message', async (msg) => {
  console.log(`[${msg.type}] from ${msg.sender.id} in ${msg.chat.id}: ${msg.text}`);
});
```

### Core Message Fields

| Property | Type | Description |
| :--- | :--- | :--- |
| `msg.id` | `string` | Unique WhatsApp message ID. |
| `msg.chat.id` | `string` | JID of the conversation (`xxx@s.whatsapp.net` for DMs, `xxx@g.us` for groups). |
| `msg.chat.isGroup` | `boolean` | `true` if the message originated in a group chat. |
| `msg.sender.id` | `string` | JID of the user who sent the message. |
| `msg.sender.isMe` | `boolean` | `true` if the message was sent by the authenticated bot account. |
| `msg.text` | `string` | Extracted plain text content of the message. |
| `msg.type` | `string` | Categorized message type (e.g., `TEXT`, `IMAGE`, `STICKER`). |

> **Note**: `Message` is an immutable data object and does not possess instance methods such as `msg.reply()`. Outbound message dispatching is performed explicitly through `LeavesClient`.

---

## Sending Messages

To send messages back to chats or users, use the client's messaging methods:

### 1. Simple Text Helper: `sendText`

For standard text responses:

```javascript
await client.sendText(msg.chat.id, 'Hello! This is a simple response.');
```

### 2. Standard Message Dispatcher: `sendMessage`

For structured payloads or advanced message builders:

```javascript
await client.sendMessage(msg.chat.id, {
  text: 'Hello from standard dispatch!'
});
```

---

## Graceful Shutdown

Leaves Guardian attaches process listeners for `SIGINT` and `SIGTERM` signals by default. When you terminate the process (e.g., pressing <kbd>Ctrl</kbd>+<kbd>C</kbd>), the client automatically:

1. Stops internal timers and observability monitors.
2. Flushes any pending background operations.
3. Closes the socket connection cleanly.

You can also trigger a graceful shutdown programmatically:

```javascript
// Cleanly disconnect and release all resources
await client.disconnect();
```

---

## Expected Output

When running your client for the first time with QR authentication, you will observe terminal output similar to the following:

```text
[INIT] Initializing Leaves Guardian client...
[AUTH] Please scan the QR code below:

  ▄▄▄▄▄▄▄ ▄ ▄▄ ▄▄▄▄▄▄▄
  █ ▄▄▄ █ █▄██ █ ▄▄▄ █
  █ ███ █ ▄▄█  █ ███ █
  ... (QR code rendered in terminal) ...

[CONNECT] Connecting to WhatsApp...
[CONNECT] WhatsApp socket connection open
[READY] Client initialized and ready! Logged in as 628123456789@s.whatsapp.net
✅ Bot successfully connected as 628123456789@s.whatsapp.net!
```

---

## Troubleshooting

### `Cannot find package 'leaves-guardian'`
- **Cause**: The package is not installed in your project root.
- **Solution**: Run `npm install leaves-guardian` in the same directory as your `package.json`.

### `SyntaxError: Cannot use import statement outside a module`
- **Cause**: Node.js defaults to CommonJS if `"type": "module"` is omitted.
- **Solution**: Add `"type": "module"` to your `package.json`.

### `Session directory locking issues`
- **Cause**: Another process holds an active `.session.lock` inside your `./session` folder.
- **Solution**: Ensure only one bot instance runs against a specific session directory at a time.

### `Invalid pairing phone number format`
- **Cause**: Providing a phone number with leading `+` or spaces (e.g., `+62 812-3456-789`).
- **Solution**: Provide only digits including country code, e.g., `'628123456789'`.

---

## What Happens Next?

Now that you have your minimal client running, explore the core concepts and architectural foundations of Leaves Guardian:

- **[Overview & Philosophy](/en/getting-started/overview)**: The mental model, design goals, and explicit library boundaries.
- **[Architecture & Lifecycle](/en/getting-started/architecture)**: The 5-layer conceptual architecture, state transitions, and subsystem isolation.
- **[Normalized Message Schema](/en/messaging/schema)**: Unified message data contract, quote unwrapping, and media metadata.
