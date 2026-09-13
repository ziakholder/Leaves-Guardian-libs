# Message Dispatching

`client.sendMessage()` is the primary outbound dispatch method in Leaves Guardian. Unlike raw Baileys sockets where messages are immediately pushed to the network, Leaves Guardian routes outbound dispatches through an integrated **Traffic Controller** for pacing and priority scheduling.

---

## The `client.sendMessage()` Method

```javascript
// Signature: client.sendMessage(jid, contentOrBuilder, options)
const sentMessage = await client.sendMessage(chatId, {
  text: 'Hello from dispatch engine!'
});
```

The method returns the dispatched Baileys message object upon successful delivery.

---

## Integration with Traffic Controller

By default, all calls to `sendMessage()` are routed through the `TrafficController` subsystem (Layer 3.1) to protect your WhatsApp connection:

- **Pacing**: Enforces minimum dispatch intervals (`minDispatchIntervalMs: 250ms` default).
- **Priority Queuing**: Outbound messages are organized into `HIGH`, `NORMAL`, and `LOW` priority queues.
- **Starvation Prevention**: Guarantees that continuous high-priority traffic does not permanently block normal and low-priority messages.

### Specifying Dispatch Priority

You can assign priority levels to outbound messages using `options.priority`:

```javascript
// High-priority urgent alert
await client.sendMessage(adminJid, { text: '🚨 CRITICAL: Database offline' }, {
  priority: 'HIGH'
});

// Normal interactive reply (default)
await client.sendMessage(msg.chat.id, { text: 'Here is your requested data.' }, {
  priority: 'NORMAL'
});

// Low-priority bulk broadcast or background report
await client.sendMessage(groupJid, { text: '📊 Daily statistics report...' }, {
  priority: 'LOW'
});
```

---

## Dispatching Fluent Message Builders

`sendMessage()` natively accepts any Leaves Guardian Message Builder instance:

```javascript
import { TextMessage } from 'leaves-guardian';

const builder = new TextMessage()
  .setText('Hello world!')
  .withAdReply({
    title: 'Leaves Guardian Docs',
    body: 'Enterprise Baileys Wrapper',
    previewType: 'PHOTO'
  });

// Dispatch builder directly
await client.sendMessage(msg.chat.id, builder);
```

---

## Bypassing the Traffic Queue (Raw Dispatch)

In latency-critical scenarios or when handling raw custom transports, you can bypass the `TrafficController` queue:

```javascript
await client.sendMessage(msg.chat.id, { text: 'Immediate unqueued message' }, {
  traffic: { enabled: false }
});
```

> **Warning**: Bypassing the Traffic Controller disables pacing and queue starvation protection. Use this option only when strictly necessary.

---

## Related Documentation

- **[Sending Text Messages](/en/messaging/sending-text)**: Fast text sending helper and formatting.
- **[Incoming Events](/en/messaging/incoming-events)**: Listen for client lifecycle and message events.
- **[Deleting Messages](/en/messaging/deleting)**: Revoking sent messages.
- **[Auto-Delete Manager](/en/utilities/autodelete)**: Scheduled message deletion.
