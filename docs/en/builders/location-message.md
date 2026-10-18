# LocationMessage Builder (v0.3.9)

`LocationMessage` is a modern interactive WhatsApp location card builder introduced in **Leaves Guardian v0.3.8** and refined in **v0.3.9**.

It generates an authentic *Share Location* card featuring a red pin emoji `📍`, prominent bold title, address/description text, high-resolution square avatar or map thumbnail on the right, and interactive action buttons (*Native Flow*) along with dropdown menus underneath.

---

## Key Advantages

1. **Elegant & Premium Appearance**: Gives bots an official enterprise look with a unified location card layout and right-aligned avatar thumbnail.
2. **Automated Smart Thumbnail Compression (v0.3.9)**: Employs a multi-engine compression pipeline (`sharp` -> `@napi-rs/canvas` -> `jimp`) that automatically transforms any thumbnail image (large PNGs, 4K JPEGs) into an optimized 300x300 center-cropped JPEG (~15-30 KB).
3. **Resistant to Silent Drops & 401 Disconnections**: WhatsApp safely validates native location stanzas across Multi-Device clients without triggering silent drops caused by bloated Protobuf payloads.
4. **Inherits Full ButtonMessage Capabilities**: Subclasses `ButtonMessage`, allowing Quick Reply buttons, CTA URL links, CTA Copy shortcuts, CTA Call buttons, and Dropdown selection menus all within the same card.

---

## Dedicated Methods

| Method | Description |
| :--- | :--- |
| `.setName(name)` | Sets the primary bold title displayed next to the pin icon `📍`. |
| `.setAddress(address)` | Sets the description or address text underneath the title. |
| `.setThumbnail(thumb, opts)` | Sets the square thumbnail image on the right (accepts URL, Buffer, or local path). Automatically compressed to 300x300 JPEG. Optional custom `{ width, height, quality }` options supported. |
| `.setCoordinates(lat, long)` | Sets the map latitude & longitude coordinates (optional, default `0, 0`). |
| `.addReply(text, id)` | Adds a quick reply action button. |
| `.addUrl(text, url)` | Adds an external web link button. |
| `.addCopy(text, code)` | Adds a one-tap copy-to-clipboard button. |
| `.addDropdown(title, sections)` | Adds a dropdown list selection popup menu. |
| `.setBody(body)` | Sets optional secondary text underneath the card. |
| `.setFooter(footer)` | Sets the footer text. |

---

## Practical Examples

### 1. Assistant Welcome Card

```javascript
import { LocationMessage } from 'leaves-guardian';

const assistantCard = new LocationMessage(client)
  .setName('Hello Rafa~ 👋')
  .setAddress('I am Sylphy, your AI assistant. Choose an interactive option below! 🌸')
  .setThumbnail('https://example.com/avatar-sylphy.jpg')
  .addReply('📋 Open Main Menu', '.menu')
  .addCopy('✨ Copy User ID', 'USER-9821')
  .addUrl('🌐 Visit Documentation', 'https://leavesguardian.enginelabs.my.id');

await client.sendMessage(msg.chat.id, assistantCard);
```

### 2. Location Card with Dropdown Menu

```javascript
import { LocationMessage } from 'leaves-guardian';

const serviceCard = new LocationMessage(client)
  .setName('🏢 Royal Engine Headquarters')
  .setAddress('Grand Orchard Tower 12th Floor, South Jakarta. Open Mon - Fri 09:00 - 18:00 WIB.')
  .setThumbnail('https://example.com/office-building.jpg')
  .setCoordinates(-6.2088, 106.8456)
  .addDropdown('📋 Select a Service', [
    {
      title: 'Technical Consultation',
      rows: [
        { id: 'srv_bot', title: 'WhatsApp Bot Architecture', description: '24/7 Node.js Baileys solution' },
        { id: 'srv_cloud', title: 'Cloud VPS Deployment', description: 'Zero-downtime auto-purge recovery' }
      ]
    },
    {
      title: 'Customer Care',
      rows: [
        { id: 'srv_cs', title: 'Contact Support', description: 'Fast response during office hours' }
      ]
    }
  ])
  .addReply('📍 Get Directions', 'btn_directions')
  .addCall('📞 Call Office', '+6281234567890');

await serviceCard.send(msg.chat.id);
```

---

## Capturing Responses

Just like `ButtonMessage`, clicking Quick Reply buttons or selecting Dropdown items emits a normalized `message` event:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'BUTTON') {
    console.log('Button clicked:', msg.text);
  } else if (msg.type === 'LIST') {
    console.log('Dropdown item selected:', msg.text);
  }
});
```

## Automated Smart Thumbnail Compression (Multi-Engine)

In WhatsApp, location card thumbnails are directly serialized into the raw binary Protobuf payload (`jpegThumbnail`). If a bot attempts to attach uncompressed images (such as 3 MB PNG files or 4K camera captures), the socket frame swells significantly, which frequently triggers silent drops or delivery delays on recipients' mobile devices.

In **Leaves Guardian v0.3.9**, `LocationMessage` and `.setLocationHeader()` on `ButtonMessage` / `ListMessage` feature an automatic multi-engine processing pipeline:

1. **Sharp (Primary Engine)**: Harnesses MozJPEG and Lanczos3 resampling for the highest visual clarity at minimal file sizes (~15-25 KB). Automatically utilized whenever `sharp` is present in your project or Baileys dependencies.
2. **@napi-rs/canvas (First Fallback)**: Built-in Rust Skia canvas renderer bundled directly with Leaves Guardian, configured with `imageSmoothingQuality = 'high'`.
3. **Jimp (Pure JS Fallback)**: Pure JavaScript image processor for environments lacking native binary toolchains.
4. **Raw Buffer Fallback (Safety Net)**: If all engines are unavailable, the raw buffer is preserved to ensure uninterrupted message delivery.

By default, the image is center-cover cropped into a 300x300 pixel square JPEG at 80% quality. You can also customize dimensions or compression quality:

```javascript
// Customize resolution or output quality
assistantCard.setThumbnail('https://example.com/photo.png', {
  width: 300,
  height: 300,
  quality: 85,
});
```

---

## Related Documentation

- **[ButtonMessage Builder](/en/builders/button-message)**: Standard native flow button flows.
- **[ListMessage Builder](/en/builders/list-message)**: Multi-section popup list menus.
- **[Handling Interactive Responses](/en/builders/handling-responses)**: Complete interaction handling guide.

