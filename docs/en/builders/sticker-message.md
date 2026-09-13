# StickerMessage Builder

`StickerMessage` constructs and sends WhatsApp stickers (`image/webp`) with custom EXIF metadata, including sticker pack names, author credits, and emoji categories.

It automatically handles conversion and dimension scaling for image inputs.

---

## Basic Example

```javascript
import { StickerMessage } from 'leaves-guardian';

const sticker = new StickerMessage(client)
  .setSource('https://example.com/mascot.png')
  .setPackName('Roxy Bot Official Pack')
  .setAuthor('Royal Engine Studio')
  .setCategories(['🍃', '🤖']);

await client.sendMessage(msg.chat.id, sticker);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setSource(source)` | Sets the source image (URL, Buffer, or file path). |
| `.setPackName(name)` | Sets the sticker pack title embedded in the EXIF metadata. |
| `.setAuthor(author)` | Sets the publisher/author name in the EXIF metadata. |
| `.setCategories(emojis)` | Sets associated emoji tags for WhatsApp search indexing. |

---

## Static EXIF Generator

If you are generating raw WebP stickers independently, you can use the static `StickerMessage.createExif()` utility to produce raw EXIF Buffer chunks:

```javascript
const exifBuffer = StickerMessage.createExif(
  'My Pack',
  'Author Name',
  ['🔥', '✨']
);
```

---

## Related Documentation

- **[MediaMessage Builder](/en/builders/media-message)**: General media sender.
- **[ButtonMessage Builder](/en/builders/button-message)**: Interactive button flows.
