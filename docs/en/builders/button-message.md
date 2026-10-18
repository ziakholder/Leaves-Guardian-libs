# ButtonMessage Builder

`ButtonMessage` constructs modern interactive button payloads based on WhatsApp's native flow architecture (`InteractiveMessage.NativeFlowMessage`).

It supports multiple button types, including quick replies, URL click-throughs, copy-to-clipboard buttons, call-phone buttons, and promotional offer headers.

---

## Supported Button Types

| Button Type | Method | Description |
| :--- | :--- | :--- |
| **Quick Reply** | `.addReply(text, id)` | Standard action button. Triggers a `BUTTON` event with `id` when clicked. |
| **CTA URL** | `.addUrl(text, url)` | Opens an external web link in the browser. |
| **CTA Copy** | `.addCopy(text, code)` | One-click copy of a text string, payment account, or promo code to clipboard. |
| **Dropdown List** | `.addDropdown(title, sections)` | Embeds a multi-section selection popup list menu directly inside the button card. |
| **Galaxy Flow** | `.addGalaxy(flowCtaText, opts)` | Navigation banner / aesthetic native flow button. |
| **Limited Offer**| `.addLimitedOffer(text, opts)` | Promotional badge banner with expiration countdown timer. |

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

## Combining Buttons with Dropdown Lists (`addDropdown`)

You can combine direct action buttons and selection popup lists within the same interactive message:

```javascript
const fullMenu = new ButtonMessage(client)
  .setTitle('Service Catalog')
  .setBody('Choose an option or browse categories:')
  .addReply('⚡ Quick Start', 'quick_start')
  .addDropdown('📂 Browse Categories', [
    {
      title: 'WhatsApp Solutions',
      rows: [
        { id: 'srv_bot_basic', title: 'Standard Bot', description: 'Auto-reply & notification service' },
        { id: 'srv_bot_pro', title: 'Enterprise Agent', description: 'Multi-agent orchestration' }
      ]
    }
  ])
  .addUrl('🌐 Visit Documentation', 'https://leavesguardian.enginelabs.my.id');

await client.sendMessage(msg.chat.id, fullMenu);
```

---

## Interactive Location Card Headers (v0.3.8)

You can attach a location card header with a red pin `📍` and avatar thumbnail:

```javascript
const locationButton = new ButtonMessage(client)
  .setLocationHeader('Hello Rafa~ 👋', 'Choose an option below:', 'https://example.com/avatar.jpg')
  .addReply('📋 Main Menu', '.menu')
  .addReply('📞 Contact CS', 'cs_help');

await client.sendMessage(msg.chat.id, locationButton);
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
- **[LocationMessage Builder](/en/builders/location-message)**: Dedicated location card builder.
- **[ListMessage Builder](/en/builders/list-message)**: Multi-section menu lists.
- **[CarouselMessage Builder](/en/builders/carousel-message)**: Multi-card carousel cards.
