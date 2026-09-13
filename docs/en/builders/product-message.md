# ProductMessage Builder

`ProductMessage` constructs structured product catalog cards for WhatsApp.

It allows bots to present items with product images, formatted currency pricing, detailed descriptions, and actionable buy/inquiry buttons.

---

## Basic Example

```javascript
import { ProductMessage } from 'leaves-guardian';

const product = new ProductMessage(client)
  .setTitle('Special Roasted Coffee Beans (250g)')
  .setDescription('100% Arabica with caramel and floral notes. Medium roast.')
  .setPrice(75000, 'IDR') // Formats automatically to IDR 75,000
  .setImage('https://example.com/coffee_bag.jpg')
  .setRetailerId('SKU_COFFEE_001')
  .setButtonText('🛍️ Order Now')
  .setFooter('Leaves Cafe Official');

await client.sendMessage(msg.chat.id, product);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setTitle(title)` | Sets the main product name/title. |
| `.setDescription(desc)` | Sets detailed product description. |
| `.setPrice(amount, currency)` | Sets the numerical price and 3-letter currency code (e.g. `15000, 'IDR'`). |
| `.setImage(source)` | Attaches the product hero image (URL, Buffer, or path). |
| `.setRetailerId(id)` | Sets the unique product SKU or retailer ID. |
| `.setButtonText(text)` | Sets the text on the catalog action button. |
| `.setUrl(url)` | Attaches an external checkout or product web link. |

---

## Related Documentation

- **[ListMessage Builder](/en/builders/list-message)**: Multi-item vertical menu lists.
- **[CarouselMessage Builder](/en/builders/carousel-message)**: Multi-card product sliders.
- **[Handling Interactive Responses](/en/builders/handling-responses)**: Handling product button interactions.
