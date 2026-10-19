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
| `.setLinkPreview(opts)` | Attaches advanced web link preview metadata (`title`, `description`, `url`, `thumbnail`, `favicon`, `largerThumbnail`). |
| `.mention(jids)` | Adds JID(s) to the mention list. |
| `.quote(msg)` | Attaches a quoted reply context. |
| `.setAdReply(opts)` | Attaches rich external ad preview context. |
| `.setChannelForward(opts)` | Attaches channel forwarding context. |
| `.build()` | Compiles and returns the raw Baileys message object. |
| `.send(jid, options)` | Dispatches the message directly. |

---

## Advanced Link Preview (v0.4.0)

Send web links with high-resolution thumbnails (square or banner), custom page titles, descriptions, and official website favicons uploaded via WhatsApp MMS metadata:

```javascript
import { TextMessage } from 'leaves-guardian';

const linkMsg = new TextMessage(client)
  .setBody('Hello! Check out our official documentation below:')
  .setLinkPreview({
    url: 'https://leavesguardian.enginelabs.my.id',
    title: 'Leaves Guardian Docs',
    description: 'Enterprise Baileys Wrapper & Infrastructure Library for Node.js',
    thumbnail: './assets/banner.jpg',
    favicon: './assets/favicon.png',
    largerThumbnail: true
  });

await linkMsg.send(msg.chat.id);
```

### Direct Helper `withLinkPreview`:

```javascript
import { withLinkPreview } from 'leaves-guardian';

const preview = await withLinkPreview({
  url: 'https://github.com/ziakholder/Leaves-Guardian',
  title: 'GitHub Repository',
  description: 'Official Leaves Guardian source code repository',
  thumbnail: fs.readFileSync('./thumb.jpg')
}, client.getRawSocket());
```

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

- **[Builders Overview](/en/builders/overview)**: Overview of all builders.
- **[ButtonMessage Guide](/en/builders/button-message)**: Interactive buttons.
- **[Sending Text Messages](/en/messaging/sending-text)**: Fast text helper.
