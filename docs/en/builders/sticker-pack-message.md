# StickerPackMessage Builder (v0.4.0)

`StickerPackMessage` is a builder for sending official WhatsApp sticker pack bundles complete with tray cover icons and emoji associations introduced in **Leaves Guardian v0.4.0**.

With `StickerPackMessage`, bots can distribute sticker collections to users so they can inspect all stickers in a single bundled view and add them directly to their personal WhatsApp sticker favorites.

---

## Key Advantages

1. **Seamless Bundle Distribution**: Eliminates the need to send individual stickers one by one; users receive the whole pack in one message.
2. **Complete Branding & Metadata**: Includes pack title, publisher/creator attribution, description, and custom WebP tray cover icons.
3. **Smart Emoji Association**: Each sticker in the pack can be tagged with relevant emojis for WhatsApp keyboard smart suggestions.

---

## Method Reference

| Method | Parameter Types | Description |
| :--- | :--- | :--- |
| `.setName(name)` | `string` | Sets sticker pack bundle name. |
| `.setPublisher(publisher)` | `string` | Sets author or studio publisher name. |
| `.setDescription(desc)` | `string` | Sets short description for the sticker pack. |
| `.setCover(cover)` | `Buffer \| string` | Sets tray cover icon for the bundle (WebP / PNG / Buffer / URL / file path). |
| `.addSticker(sticker, emojis)` | `Buffer \| string, Array<string>` | Adds a WebP sticker item with associated emoji triggers (e.g. `['🔥', '✨']`). |
| `.send(jid, options)` | `string, Object` | Relays sticker pack bundle to the target WhatsApp JID. |

---

## Practical Examples

### 1. Using StickerPackMessage Builder

```javascript
import { StickerPackMessage } from 'leaves-guardian';
import fs from 'node:fs';

const pack = new StickerPackMessage(client)
  .setName('Sylphy Chibi Collection')
  .setPublisher('Royal Engine Studio')
  .setDescription('Cute chibi sticker set for daily chats')
  .setCover(fs.readFileSync('./tray-cover.webp'))
  .addSticker(fs.readFileSync('./sylphy-hi.webp'), ['👋', '✨'])
  .addSticker(fs.readFileSync('./sylphy-love.webp'), ['❤️', '🥰'])
  .addSticker(fs.readFileSync('./sylphy-cry.webp'), ['😭', '💔']);

await pack.send(msg.chat.id);
```

### 2. Using Direct Helper `client.sendStickerPack()`

```javascript
await client.sendStickerPack(msg.chat.id, {
  name: 'Meme Pack 2026',
  publisher: 'Leaves Guardian Community',
  cover: './assets/tray.webp',
  stickers: [
    { source: './assets/meme1.webp', emojis: ['😂'] },
    { source: './assets/meme2.webp', emojis: ['💀'] }
  ]
});
```
