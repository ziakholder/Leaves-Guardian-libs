# ButtonMessage Builder

`ButtonMessage` constructs modern interactive button payloads based on WhatsApp's native flow architecture (`InteractiveMessage.NativeFlowMessage`).

It supports multiple button types, including quick replies, URL click-throughs, copy-to-clipboard buttons, call-phone buttons, and promotional offer headers.

---

## Supported Button Types

| Button Type | Method | Description |
| :--- | :--- | :--- |
| **Quick Reply** | `.addReply(text, id)` | Standard action button. Triggers a `BUTTON` event when clicked. |
| **CTA URL** | `.addUrl(text, url)` | Opens an external web link in the browser. |
| **CTA Copy** | `.addCopy(text, code)` | Copies a text string or promo code to the user's clipboard. |
| **CTA Call** | `.addCall(text, phone)` | Triggers a direct phone call intent on mobile devices. |

---

## Basic Example

```javascript
import { ButtonMessage } from 'leaves-guardian';

const buttonMsg = new ButtonMessage(client)
  .setTitle('🛒 Order Confirmation')
  .setBody('Hello {{name}}, your cart is ready for checkout!')
  .setFooter('Leaves Guardian Store')
  .setVars({ name: 'Rafa' })
  .addReply('✅ Proceed to Payment', 'btn_checkout_yes')
  .addCopy('📋 Copy Promo Code', 'LEAVES20')
  .addUrl('🌐 View Store Website', 'https://example.com/store');

await client.sendMessage(msg.chat.id, buttonMsg);
```

---

## Adding Media Headers to Buttons

You can attach images, videos, or documents as headers to the button message:

```javascript
const buttonMsg = new ButtonMessage(client)
  .setImage('https://example.com/banner.jpg')
  .setBody('Explore our newest service package!')
  .addReply('📦 View Details', 'btn_details')
  .addReply('💬 Chat Agent', 'btn_agent');

await client.sendMessage(msg.chat.id, buttonMsg);
```

---

## Capturing Button Click Responses

When a user clicks a quick reply button, your bot receives a normalized message with `msg.type === 'BUTTON'`:

```javascript
client.on('message', async (msg) => {
  if (msg.type === 'BUTTON') {
    console.log('Button response text/payload:', msg.text);
    // msg.text contains display text or JSON payload like {"id": "btn_checkout_yes"}
  }
});
```

For complete details on response handling, see **[Handling Interactive Responses](/en/builders/handling-responses)**.

---

## Related Documentation

- **[Handling Interactive Responses](/en/builders/handling-responses)**: Parsing button clicks.
- **[ListMessage Builder](/en/builders/list-message)**: Multi-section menu lists.
- **[CarouselMessage Builder](/en/builders/carousel-message)**: Multi-card carousel cards.
