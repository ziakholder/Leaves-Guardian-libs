# LocationMessage Builder (v0.3.8)

`LocationMessage` is a modern interactive WhatsApp location card builder introduced in **Leaves Guardian v0.3.8**.

It generates an authentic *Share Location* card featuring a red pin emoji `📍`, prominent bold title, address/description text, high-resolution square avatar or map thumbnail on the right, and interactive action buttons (*Native Flow*) along with dropdown menus underneath.

---

## Key Advantages

1. **Elegant & Premium Appearance**: Gives bots an official enterprise look with a unified location card layout and right-aligned avatar thumbnail.
2. **Resistant to Silent Drops & 401 Disconnections**: WhatsApp safely validates native location stanzas across Multi-Device clients without triggering silent drops.
3. **Inherits Full ButtonMessage Capabilities**: Subclasses `ButtonMessage`, allowing Quick Reply buttons, CTA URL links, CTA Copy shortcuts, CTA Call buttons, and Dropdown selection menus all within the same card.

---

## Dedicated Methods

| Method | Description |
| :--- | :--- |
| `.setName(name)` | Sets the primary bold title displayed next to the pin icon `📍`. |
| `.setAddress(address)` | Sets the description or address text underneath the title. |
| `.setThumbnail(thumb)` | Sets the square thumbnail image on the right (accepts URL, Buffer, or local path). |
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

---

## Related Documentation

- **[ButtonMessage Builder](/en/builders/button-message)**: Standard native flow button flows.
- **[ListMessage Builder](/en/builders/list-message)**: Multi-section popup list menus.
- **[Handling Interactive Responses](/en/builders/handling-responses)**: Complete interaction handling guide.
