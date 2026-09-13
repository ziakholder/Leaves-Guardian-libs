# CarouselMessage Builder

`CarouselMessage` constructs multi-card horizontal carousel message structures for WhatsApp (`InteractiveMessage.CarouselMessage`).

Each card in the carousel can have its own image header, body description, and interactive action buttons.

---

## Basic Example

```javascript
import { CarouselMessage } from 'leaves-guardian';

const carousel = new CarouselMessage(client)
  .setBody('🌟 Featured Products This Week')
  .setFooter('Swipe horizontally to browse items');

// Card 1: Product A
const card1 = carousel.newCard()
  .setTitle('Premium Coffee Beans')
  .setBody('Single origin roasted Arabica (250g)')
  .setImage('https://example.com/coffee.jpg')
  .addReply('🛒 Buy Coffee', 'buy_coffee')
  .addUrl('ℹ️ More Info', 'https://example.com/coffee');

// Card 2: Product B
const card2 = carousel.newCard()
  .setTitle('Artisan Matcha Powder')
  .setBody('Ceremonial grade green tea from Kyoto (100g)')
  .setImage('https://example.com/matcha.jpg')
  .addReply('🛒 Buy Matcha', 'buy_matcha')
  .addUrl('ℹ️ More Info', 'https://example.com/matcha');

carousel.addCard(card1);
carousel.addCard(card2);

await client.sendMessage(msg.chat.id, carousel);
```

---

## `CarouselCard` Methods

When invoking `carousel.newCard()`, an instance of `CarouselCard` is created with the following builder methods:

| Method | Description |
| :--- | :--- |
| `.setTitle(title)` | Sets the header title on the card. |
| `.setBody(body)` | Sets the main description on the card. |
| `.setFooter(footer)` | Sets the footer text on the card. |
| `.setImage(source)` | Attaches an image (URL, Buffer, or path) to the card header. |
| `.addReply(text, id)` | Adds a quick reply button to the card. |
| `.addUrl(text, url)` | Adds a CTA URL button to the card. |
| `.addCopy(text, code)` | Adds a copy-to-clipboard button to the card. |

---

## Related Documentation

- **[ButtonMessage Builder](/en/builders/button-message)**: Single-message button flows.
- **[ListMessage Builder](/en/builders/list-message)**: Vertical selection menus.
- **[Handling Interactive Responses](/en/builders/handling-responses)**: Handling card button clicks.
