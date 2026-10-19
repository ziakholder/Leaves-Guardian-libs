# AlbumMessage Builder (v0.4.0)

`AlbumMessage` is a builder for sending native WhatsApp media albums introduced in **Leaves Guardian v0.4.0**.

With `AlbumMessage`, collections of images and videos are grouped visually into a unified interactive grid card in the WhatsApp chat bubble (just like when a user selects multiple media files from their phone gallery), preventing long vertical message spam.

---

## Key Advantages

1. **Clean & Auto-Clustered Layout**: Prevents long vertical message feeds when bots send product photo catalogs, multi-page screenshots, or visual documentation.
2. **Mixed Image & Video Support**: Allows combining images (`imageMessage`) and videos (`videoMessage`) inside a single album.
3. **Official WhatsApp Protocol**: Implements the official Baileys `albumMessage` structure complete with parent stanzas and child associations via `contextInfo.associatedChildMessageId`.
4. **Defensive Validation**: Automatically enforces WhatsApp's minimum requirement of at least 2 media items before sending.

---

## Method Reference

| Method | Parameter Types | Description |
| :--- | :--- | :--- |
| `.addImage(source, options)` | `Buffer \| string, Object` | Adds an image to the album (URL, Buffer, or local file path). Supports `{ caption }`. |
| `.addVideo(source, options)` | `Buffer \| string, Object` | Adds a video to the album (URL, Buffer, or local file path). Supports `{ caption }`. |
| `.send(jid, options)` | `string, Object` | Sends the album to the target WhatsApp JID. |

---

## Practical Examples

### 1. Using AlbumMessage Builder

```javascript
import { AlbumMessage } from 'leaves-guardian';
import fs from 'node:fs';

const album = new AlbumMessage(client)
  .addImage('https://example.com/photo1.jpg', { caption: 'Scenery 1' })
  .addImage(fs.readFileSync('./photo2.jpg'), { caption: 'Scenery 2' })
  .addVideo('https://example.com/video1.mp4', { caption: 'Atmosphere Video' });

await album.send(msg.chat.id);
```

### 2. Using Direct Helper `client.sendAlbum()`

For a concise inline syntax without instantiating a builder:

```javascript
await client.sendAlbum(msg.chat.id, [
  { image: { url: 'https://example.com/product-front.jpg' }, caption: 'Front View' },
  { image: { url: 'https://example.com/product-side.jpg' }, caption: 'Side View' },
  { video: { url: 'https://example.com/product-review.mp4' }, caption: 'Unboxing Video' }
]);
```

### 3. Using Fluent MessageBuilder Proxy

```javascript
await client.messageBuilder(msg.chat.id)
  .setType('Album')
  .addImage('https://example.com/item1.jpg')
  .addImage('https://example.com/item2.jpg')
  .send();
```
