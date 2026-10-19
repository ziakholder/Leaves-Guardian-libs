# ButtonMessageV2 Builder (v0.4.0)

`ButtonMessageV2` (aliased as `ButtonV2`) is a legacy WhatsApp button builder (`buttonsMessage`) introduced in **Leaves Guardian v0.4.0**.

This builder leverages a WhatsApp protocol trick by assigning `headerType: 6` (Location Header) to legacy button payloads, allowing quick reply buttons to remain visible and clickable even on older WhatsApp clients or modified clients that do not properly render modern *Native Flow* buttons.

---

## Key Advantages

1. **Legacy Client Compatibility**: Guarantees users on older WhatsApp versions or specific web distributions can view and click buttons without rendering blank message bubbles.
2. **Compact & Clean Design**: Features a header title, subtitle, main body message, and footer in a simple button layout.
3. **Time-Tested Quick Reply Mechanics**: Dispatches standard text command triggers when pressed by users.

---

## Method Reference

| Method | Parameter Types | Description |
| :--- | :--- | :--- |
| `.setTitle(title)` | `string` | Sets card header title (rendered in location header). |
| `.setSubtitle(subtitle)` | `string` | Sets subtitle / address description in header. |
| `.setBody(body)` | `string` | Sets main message body text. |
| `.setFooter(footer)` | `string` | Sets message footer note. |
| `.addButton(displayText, buttonId)` | `string, string` | Adds a quick reply button. |
| `.send(jid, options)` | `string, Object` | Relays Button V2 message to the target WhatsApp JID. |

---

## Practical Examples

```javascript
import { ButtonMessageV2 } from 'leaves-guardian';

const btn = new ButtonMessageV2(client)
  .setTitle('Classic Menu Navigation')
  .setSubtitle('Quick User Options')
  .setBody('Please select one of the services below:')
  .setFooter('Leaves Guardian v0.4.0')
  .addButton('🔥 View Deals', 'promo_btn')
  .addButton('📞 Support Center', 'cs_btn');

await btn.send(msg.chat.id);
```
