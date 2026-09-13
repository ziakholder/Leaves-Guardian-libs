# Message Collector

`MessageCollector` is a utility (Layer 4.1) for collecting incoming WhatsApp messages that match specific criteria over a defined duration or message count.

It operates strictly on normalized `Message` objects emitted by `LeavesClient`, providing automatic lifecycle cleanup, idle timers, and filter predicates.

---

## Creating a Collector

You can create a collector via `new MessageCollector()` or using the client helper method `client.createMessageCollector()`:

```javascript
import { MessageCollector } from 'leaves-guardian';

// Create collector listening in a specific chat
const collector = new MessageCollector(client, {
  chatId: msg.chat.id,
  senderId: msg.sender.id,
  filter: (m) => m.text.length > 0,
  timeout: 30000, // Stop after 30 seconds
  max: 5          // Stop after collecting 5 messages
});
```

---

## Collector Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `chatId` | `string` | `undefined` | Restrict collection to a specific conversation JID. |
| `senderId` | `string` | `undefined` | Restrict collection to a specific sender JID. |
| `messageType` | `string` | `undefined` | Restrict collection to specific `MessageTypes` (e.g., `'IMAGE'`). |
| `filter` | `Function` | `() => true` | Predicate function `(message) => boolean` to accept/reject messages. |
| `timeout` | `number` | `null` | Max duration in milliseconds before stopping (reason: `'time'`). |
| `idle` | `number` | `null` | Max inactivity duration in milliseconds before stopping (reason: `'idle'`). |
| `max` | `number` | `null` | Max collected messages before stopping (reason: `'limit'`). |
| `maxProcessed` | `number` | `null` | Max total evaluated messages before stopping (reason: `'processedLimit'`). |
| `dispose` | `boolean` | `false` | If `true`, emit `'dispose'` event when a message is removed. |

---

## Collector Events

```javascript
// Triggered on every message accepted by the filter
collector.on('collect', (message) => {
  console.log(`Collected message from ${message.sender.id}: ${message.text}`);
});

// Triggered when the collector stops
collector.on('end', (collectedMap, reason) => {
  console.log(`Collector ended with reason: ${reason}. Total collected: ${collectedMap.size}`);
});
```

---

## Collector End Reasons

The reason passed to the `'end'` event is one of the verified `COLLECTOR_END_REASONS`:

| Reason Constant | Value | Trigger |
| :--- | :--- | :--- |
| `COLLECTOR_END_REASONS.LIMIT` | `'limit'` | The `max` message count was reached. |
| `COLLECTOR_END_REASONS.TIME` | `'time'` | The overall `timeout` duration expired. |
| `COLLECTOR_END_REASONS.IDLE` | `'idle'` | The `idle` inactivity timer expired. |
| `COLLECTOR_END_REASONS.USER` | `'user'` | The collector was stopped manually via `collector.stop()`. |
| `COLLECTOR_END_REASONS.CANCELED` | `'canceled'` | Cancelled programmatically. |
| `COLLECTOR_END_REASONS.PROCESSED_LIMIT` | `'processedLimit'` | The `maxProcessed` threshold was reached. |
| `COLLECTOR_END_REASONS.SHUTDOWN` | `'clientShutdown'` | Client was disconnected (`client.disconnect()`). |

---

## Example: Collecting a Single Response with `next()`

`collector.next()` returns a `Promise` resolving to the next single accepted message:

```javascript
client.on('message', async (msg) => {
  if (msg.text === '!askname') {
    await client.sendText(msg.chat.id, 'What is your name? (Reply within 15 seconds)');

    const collector = new MessageCollector(client, {
      chatId: msg.chat.id,
      senderId: msg.sender.id,
      timeout: 15000
    });

    try {
      const response = await collector.next();
      await client.sendText(msg.chat.id, `Nice to meet you, ${response.text}!`);
    } catch (err) {
      await client.sendText(msg.chat.id, '⏳ You did not respond in time.');
    }
  }
});
```

---

## Related Documentation

- **[Interactive Prompts](/en/utilities/prompt)**: Multi-step conversational wizards built on MessageCollector.
- **[Interactive Paginator](/en/utilities/paginator)**: Multi-page navigation lists.
- **[Normalized Message Schema](/en/messaging/schema)**: Understanding the incoming `Message` format.
