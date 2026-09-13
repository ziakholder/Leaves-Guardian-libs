# Message Builders Overview

Leaves Guardian includes a comprehensive suite of **12 Message Builders** (Layer 5) for constructing complex, interactive, and media-rich WhatsApp message payloads with a fluent, chainable API.

All builders inherit from `BaseBuilder`, providing a shared set of capabilities including text templating, channel forwarding, external ad replies, user mentions, and message quoting.

---

## The 12 Builders at a Glance

| Builder Class | Target Payload Type | Key Capabilities |
| :--- | :--- | :--- |
| **`TextMessage`** | `extendedTextMessage` | Formatted text, link preview toggles, mentions, and quotes. |
| **`ButtonMessage`** | `interactiveMessage` | Native flow buttons (Quick Reply, CTA URL, CTA Copy, CTA Call). |
| **`ListMessage`** | `interactiveMessage` | Multi-section selection menu lists with titles and descriptions. |
| **`CarouselMessage`** | `interactiveMessage` | Multi-card horizontal carousel structures with per-card buttons and images. |
| **`MediaMessage`** | Unified Media | Single builder for Image, Video, Audio/PTT, Document, and Sticker. |
| **`StickerMessage`** | `stickerMessage` | WebP sticker conversion with custom EXIF pack and author metadata. |
| **`ProductMessage`** | `productMessage` | Product catalog cards with currency-formatted pricing and retailer IDs. |
| **`PollMessage`** | `pollCreationMessage` | Single-select or multi-select polling and voting messages. |
| **`AIRichMessage`** | `interactiveMessage` | Structured response cards with markdown, code snippets, and source badges. |
| **`CanvasMessage`** | `interactiveMessage` | HTML-based canvas payload generator with domain whitelisting. |
| **`EventMessage`** | `eventMessage` | WhatsApp native group calendar event invitations. |
| **`RichMessage`** | `interactiveMessage` | Visual flex cards with headers, footers, badges, and action buttons. |

---

## Shared Methods (`BaseBuilder`)

Because every builder extends `BaseBuilder`, the following chainable methods are universally available on all 12 builders:

### 1. Header, Body, and Footer
```javascript
builder
  .setTitle('Header Title')
  .setBody('Main body content with {{variable}} support')
  .setFooter('Footer note');
```

### 2. Built-in String Templating (`setVars`)
You can embed `{{key}}` placeholders in any text field and resolve them dynamically using `.setVars()`:

```javascript
builder
  .setBody('Hello {{name}}, your order #{{orderId}} is ready!')
  .setVars({ name: 'Rafa', orderId: '84920' });
```

### 3. External Ad Reply Preview (`setAdReply`)
Attach rich link preview metadata (image banner, title, source URL) to the message payload:

```javascript
builder.setAdReply({
  title: 'Leaves Guardian Documentation',
  body: 'Enterprise Baileys Wrapper',
  thumbnailUrl: 'https://example.com/cover.jpg',
  sourceUrl: 'https://leaves-guardian.dev',
  previewType: 'PHOTO'
});
```

### 4. Channel Forwarding (`setChannelForward`)
Simulate forwarding context from a verified WhatsApp newsletter/channel:

```javascript
builder.setChannelForward({
  channelJid: '120363000000000000@newsletter',
  channelName: 'Official Announcements'
});
```

### 5. Mentions and Quoting
```javascript
builder
  .mention(['628123456789@s.whatsapp.net'])
  .quote(originalIncomingMessage);
```

---

## Dispatching Builders

Builders can be sent in two equivalent ways:

### Option A: Via `client.sendMessage()` (Recommended)
```javascript
import { TextMessage } from 'leaves-guardian';

const message = new TextMessage()
  .setBody('Hello world!');

await client.sendMessage(msg.chat.id, message);
```

### Option B: Via `.send()` on the Builder Instance
```javascript
const message = new TextMessage(client)
  .setBody('Hello world!');

await message.send(msg.chat.id);
```

---

## Related Documentation

- **[Handling Interactive Responses](/en/builders/handling-responses)**: How to capture button clicks and menu selections.
- **[TextMessage Guide](/en/builders/text-message)**: Dedicated guide for text payloads.
- **[ButtonMessage Guide](/en/builders/button-message)**: Dedicated guide for interactive buttons.
