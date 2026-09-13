# TextMessage Builder

`TextMessage` constructs formatted text message payloads with link preview controls, ad-reply headers, mentions, and quotes.

---

## Basic Usage

```javascript
import { TextMessage } from 'leaves-guardian';

const textMsg = new TextMessage()
  .setBody('Hello {{user}}, welcome to Leaves Guardian!')
  .setVars({ user: 'Rafa' });

await client.sendMessage(msg.chat.id, textMsg);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setBody(text)` | Sets the primary text message body (supports `{{var}}` templating). |
| `.disableLinkPreview()` | Disables automatic URL preview cards if the text contains hyperlinks. |
| `.mention(jids)` | Adds JID(s) to the mention list. |
| `.quote(msg)` | Attaches a quoted reply context. |
| `.setAdReply(opts)` | Attaches rich external ad preview context. |
| `.setChannelForward(opts)` | Attaches channel forwarding context. |
| `.build()` | Compiles and returns the raw Baileys message object. |
| `.send(jid, options)` | Dispatches the message directly. |

---

## Example with Ad-Reply & Link Preview Control

```javascript
const textMsg = new TextMessage()
  .setBody('Check out our official documentation at https://leaves-guardian.dev')
  .setAdReply({
    title: 'Leaves Guardian Documentation',
    body: 'Enterprise Baileys Wrapper & Infrastructure Library',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    sourceUrl: 'https://leaves-guardian.dev'
  });

await client.sendMessage(msg.chat.id, textMsg);
```

---

## Related Documentation

- **[Builders Overview](/en/builders/overview)**: Overview of all 12 builders.
- **[ButtonMessage Guide](/en/builders/button-message)**: Interactive buttons.
- **[Sending Text Messages](/en/messaging/sending-text)**: Fast text helper.
