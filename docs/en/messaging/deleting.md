# Deleting Messages

WhatsApp allows bots to revoke or delete messages ("Delete for Everyone"). In Leaves Guardian, message deletion is performed via `client.deleteMessage()`.

---

## The `client.deleteMessage()` Method

```javascript
// Signature: client.deleteMessage(key)
await client.deleteMessage(key);
```

### Readiness Prerequisite

`deleteMessage()` requires that the client is currently in the **`READY`** state (`client.isReady() === true`). If called while disconnected or authenticating, it throws a `ConnectionError`.

---

## Accepted Key Formats

Leaves Guardian accepts multiple key formats to provide maximum flexibility:

### 1. Dispatched Message Response Object

When sending a message using `sendMessage()` or `sendText()`, pass the returned object directly:

```javascript
// 1. Send a temporary notice
const sent = await client.sendText(msg.chat.id, 'This message will be deleted in 5 seconds.');

// 2. Wait 5 seconds
await new Promise((resolve) => setTimeout(resolve, 5000));

// 3. Delete the message
await client.deleteMessage(sent);
```

### 2. Normalized Incoming `Message` Instance

To delete an incoming message (for example, in group moderation when the bot is admin):

```javascript
client.on('message', async (msg) => {
  if (msg.chat.isGroup && msg.text.includes('bad_word')) {
    // Delete the offending message
    await client.deleteMessage(msg);
  }
});
```

### 3. Explicit Canonical Key Object

You can also pass a raw key object explicitly:

```javascript
await client.deleteMessage({
  remoteJid: '628123456789@s.whatsapp.net',
  id: '3EB0ABC123DEF456',
  fromMe: true
});
```

For group moderation where deleting another participant's message:

```javascript
await client.deleteMessage({
  remoteJid: '120363012345678901@g.us',
  id: '3EB0ABC123DEF456',
  fromMe: false,
  participant: '628987654321@s.whatsapp.net'
});
```

---

## Automated Deletions: AutoDelete vs Deleting

If your application requires scheduled or timed message deletions (e.g., self-destructing countdowns or OTP messages), prefer using **[Auto-Delete Manager](/en/utilities/autodelete)**:

```javascript
// Automatically send and schedule deletion in 10,000 ms (10 seconds)
await client.sendAndAutoDelete(msg.chat.id, 'Temporary secret message', 10000);
```

---

## Related Documentation

- **[Auto-Delete Manager](/en/utilities/autodelete)**: Client-side scheduled deletion timers.
- **[Ephemeral Messages](/en/utilities/ephemeral)**: Native WhatsApp disappearing messages.
- **[Sending Text Messages](/en/messaging/sending-text)**: Outbound text messaging.
