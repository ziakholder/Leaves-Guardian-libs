# Normalized Message Schema

In raw Baileys, incoming messages are structured as nested, dynamic protobuf envelopes where message types, captions, view-once wrappers, and edited messages require custom unwrapping logic.

Leaves Guardian solves this by transforming every raw Baileys message into a **normalized, immutable `Message` object**.

---

## The Normalized `Message` Contract

When listening to `client.on('message', (msg) => ...)`, you receive an instance of the `Message` class:

```javascript
client.on('message', async (msg) => {
  console.log(`Received message ID: ${msg.id}`);
  console.log(`Chat ID: ${msg.chat.id} (Group: ${msg.chat.isGroup})`);
  console.log(`Sender ID: ${msg.sender.id} (From Bot: ${msg.sender.isMe})`);
  console.log(`Type: ${msg.type}`);
  console.log(`Text content: ${msg.text}`);
  console.log(`Timestamp: ${new Date(msg.timestamp).toISOString()}`);
});
```

---

## Schema Reference

An incoming `Message` contains the following verified public fields:

```typescript
interface Message {
  readonly id: string;
  readonly chat: {
    readonly id: string;
    readonly isGroup: boolean;
  };
  readonly sender: {
    readonly id: string;
    readonly isMe: boolean;
  };
  readonly type: string;
  readonly text: string;
  readonly mentions: readonly string[];
  readonly quoted: {
    readonly id: string;
    readonly sender: string;
    readonly text: string;
    readonly type: string;
    readonly message: any;
  } | null;
  readonly media: {
    readonly mimetype: string;
    readonly isViewOnce: boolean;
    readonly [key: string]: any;
  } | null;
  readonly timestamp: number;
  readonly raw: any;
}
```

### Field Descriptions

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique WhatsApp message identifier. |
| `chat.id` | `string` | JID of the conversation (`xxx@s.whatsapp.net` for direct chats, `xxx@g.us` for group chats). |
| `chat.isGroup` | `boolean` | `true` if the message originated in a group. |
| `sender.id` | `string` | JID of the user who sent the message (in groups, this is the participant JID). |
| `sender.isMe` | `boolean` | `true` if the message was sent by the authenticated bot account. |
| `type` | `string` | Categorized message type (e.g., `TEXT`, `IMAGE`, `VIDEO`, `STICKER`, `DOCUMENT`). |
| `text` | `string` | Extracted plain text content or media caption. |
| `mentions` | `string[]` | Array of user JIDs mentioned in the message text. |
| `quoted` | `object \| null` | Context information if this message is a reply to another message. |
| `media` | `object \| null` | Metadata describing attached media (mimetype, viewOnce flags). |
| `timestamp` | `number` | Unix timestamp (in milliseconds) when the message was sent. |
| `raw` | `object` | **The raw Baileys message object** provided as an advanced escape hatch. |

---

## Immutability & Safety

To prevent race conditions and unintended side-effects across concurrent event handlers, all `Message` instances are deeply frozen with `Object.freeze()` upon normalization:

- **No Property Mutation**: Attempting to modify `msg.text = '...'` or `msg.chat.id = '...'` will fail silently in non-strict mode or throw a `TypeError` in strict mode.
- **Pure Data Object**: `Message` is a pure data structure. It **does not** contain instance methods like `msg.reply()` or `msg.delete()`.

> **Dispatching Outbound Messages**: To send a response, pass the destination JID to the client instance, e.g., `await client.sendText(msg.chat.id, 'Response')` or `await client.sendMessage(msg.chat.id, payload)`.

---

## The `msg.raw` Escape Hatch

While the normalized `Message` covers the vast majority of bot development needs, specialized use cases may require direct access to raw Baileys structures (such as proprietary protocol extensions or niche message stanzas).

Leaves Guardian exposes the original Baileys envelope under `msg.raw`:

```javascript
client.on('message', async (msg) => {
  // Standard access
  console.log(msg.text);

  // Advanced escape hatch to raw Baileys proto
  if (msg.raw) {
    const rawEphemeral = msg.raw.message?.ephemeralMessage;
    const rawKey = msg.raw.key;
  }
});
```

---

## Related Documentation

- **[Overview & Philosophy](/en/getting-started/overview)**: Architectural principles and design goals.
- **[Architecture & Lifecycle](/en/getting-started/architecture)**: 5-layer conceptual architecture and connection state machine.
- **[Quick Start Guide](/en/getting-started/quickstart)**: Build and run your first bot using normalized messages.
