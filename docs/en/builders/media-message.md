# MediaMessage Builder

`MediaMessage` provides a unified, fluent builder interface for sending all standard media types in WhatsApp: Images, Videos, Audio, Documents, and Stickers.

---

## Supported Media Types

You can configure the media type in the constructor or by calling `.setType()`:
- `'image'` (Default)
- `'video'`
- `'audio'`
- `'document'`
- `'sticker'`

---

## Examples

### 1. Sending an Image

```javascript
import { MediaMessage } from 'leaves-guardian';

const image = new MediaMessage(client, 'image')
  .setSource('https://example.com/photo.jpg')
  .setBody('📸 Check out our new office space!')
  .setAdReply({
    title: 'Leaves Studio',
    body: 'Official Gallery'
  });

await client.sendMessage(msg.chat.id, image);
```

### 2. Sending a Document (PDF / Zip)

```javascript
const document = new MediaMessage(client, 'document')
  .setSource(pdfBuffer)
  .setFileName('monthly_invoice_october.pdf')
  .setMimetype('application/pdf')
  .setBody('📄 Here is your requested monthly invoice.');

await client.sendMessage(msg.chat.id, document);
```

### 3. Sending an Audio Voice Note (PTT)

```javascript
const voiceNote = new MediaMessage(client, 'audio')
  .setSource('https://example.com/audio.ogg')
  .setPtt(true); // Sends as a WhatsApp push-to-talk voice note

await client.sendMessage(msg.chat.id, voiceNote);
```

### 4. Sending a Video as GIF

```javascript
const gif = new MediaMessage(client, 'video')
  .setSource('https://example.com/animation.mp4')
  .setGifPlayback(true)
  .setBody('🎉 Congratulations!');

await client.sendMessage(msg.chat.id, gif);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setType(type)` | Changes active media type (`'image'`, `'video'`, `'audio'`, `'document'`, `'sticker'`). |
| `.setSource(source)` | Sets the media payload (URL string, Buffer, or filesystem path). |
| `.setFileName(name)` | Sets the displayed filename (required for documents). |
| `.setMimetype(mimetype)` | Sets explicit MIME type (e.g. `'application/pdf'`). |
| `.setPtt(boolean)` | When `true` on audio, sends as a voice note. |
| `.setGifPlayback(boolean)` | When `true` on video, plays as an animated GIF. |
| `.setBody(caption)` | Sets the text caption accompanying the media. |

---

## Related Documentation

- **[StickerMessage Builder](/en/builders/sticker-message)**: Dedicated sticker builder with EXIF metadata.
- **[TextMessage Builder](/en/builders/text-message)**: Formatted text messaging.
- **[Message Dispatching](/en/messaging/dispatching)**: Dispatching messages with options.
