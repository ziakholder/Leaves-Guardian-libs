# Ephemeral Messages

`EphemeralMessage` is a builder and wrapper (Layer 4.4) for WhatsApp's **native disappearing messages protocol**.

Unlike `AutoDeleteManager` (which tracks timers in Node.js memory and issues manual deletion commands), `EphemeralMessage` instructs WhatsApp servers and client apps to expire the message natively without using any bot server resources.

---

## Supported Ephemeral Durations (`EPHEMERAL_DURATIONS`)

WhatsApp protocol officially supports three disappearing durations (defined in seconds):

```javascript
import { EPHEMERAL_DURATIONS } from 'leaves-guardian';

console.log(EPHEMERAL_DURATIONS);
// {
//   ONE_DAY: 86400,        // 24 Hours
//   ONE_WEEK: 604800,      // 7 Days (Leaves Guardian Default)
//   THREE_MONTHS: 7776000, // 90 Days
//   DISABLED: 0            // Ephemeral disabled
// }
```

---

## Basic Usage

### 1. Using `EphemeralMessage` Builder

```javascript
import { EphemeralMessage, EPHEMERAL_DURATIONS } from 'leaves-guardian';

// Create a disappearing text message set to expire in 24 hours
const ephemeral = new EphemeralMessage()
  .setContent({ text: '⏳ This message will disappear in 24 hours natively.' })
  .setExpiration(EPHEMERAL_DURATIONS.ONE_DAY);

// Send directly via client
await client.sendMessage(msg.chat.id, ephemeral);
```

### 2. Wrapping Other Message Builders

`EphemeralMessage` can wrap any Leaves Guardian builder (such as `ButtonMessage`, `ListMessage`, or `MediaMessage`):

```javascript
import { EphemeralMessage, ButtonMessage, EPHEMERAL_DURATIONS } from 'leaves-guardian';

const button = new ButtonMessage()
  .setText('Exclusive 24-Hour Deal!')
  .addButton('claim_deal', '🎁 Claim Offer');

const ephemeralButton = new EphemeralMessage()
  .setContent(button)
  .setExpiration(EPHEMERAL_DURATIONS.ONE_DAY);

await client.sendMessage(msg.chat.id, ephemeralButton);
```

### 3. Setting Expiration via `sendMessage` Options

You can also pass `ephemeralExpiration` directly into standard dispatch options:

```javascript
await client.sendMessage(
  msg.chat.id,
  { text: 'Disappearing text message.' },
  { ephemeralExpiration: EPHEMERAL_DURATIONS.ONE_WEEK }
);
```

---

## When to Use Ephemeral vs AutoDelete

| Criteria | Use `EphemeralMessage` | Use `AutoDeleteManager` |
| :--- | :--- | :--- |
| **Short countdowns (e.g. 5s - 10m)** | ❌ No (minimum is 24h) | ✅ **Yes** (supports exact millisecond delays) |
| **Long disappearing messages (24h+)**| ✅ **Yes** (zero memory footprint) | ❌ No (requires long Node.js timers) |
| **Visual revocation ("This message was deleted")** | ❌ No (fades silently) | ✅ Yes (replaces with deletion placeholder) |
| **Server Resource Usage** | **0 MB / 0 Timers** | 1 Timer per active task |

---

## Related Documentation

- **[Auto-Delete Manager](/en/utilities/autodelete)**: Client-side scheduled deletions with custom delays.
- **[Message Dispatching](/en/messaging/dispatching)**: Dispatching messages with options.
- **[Sending Text Messages](/en/messaging/sending-text)**: Basic text messaging.
