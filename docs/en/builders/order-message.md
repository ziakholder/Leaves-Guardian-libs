# OrderMessage Builder (v0.4.0)

`OrderMessage` is a builder for sending official WhatsApp catalog invoice and order summary messages introduced in **Leaves Guardian v0.4.0**.

This message renders an official WhatsApp receipt-style bubble complete with order title, order status, total item count, detailed price calculations with standard currency codes (e.g. `USD`, `IDR`), and product preview thumbnails.

---

## Key Advantages

1. **Official WhatsApp E-Commerce Layout**: Delivers a formal, professional order card ideal for online shop bots, subscription invoices, donations, and automated checkouts.
2. **Precise Currency Calculation**: Automatically handles WhatsApp's internal micro-unit price conversions (`totalAmount1000`).
3. **Product Thumbnail Support**: Allows attaching custom thumbnail images or company logos to the order card.

---

## Method Reference

| Method | Parameter Types | Description |
| :--- | :--- | :--- |
| `.setOrderId(id)` | `string` | Sets a custom unique order ID (auto-generated if omitted). |
| `.setOrderTitle(title)` | `string` | Sets the main title or primary item name of the order. |
| `.setMessage(text)` | `string` | Sets order notes or descriptive details. |
| `.setItemCount(count)` | `number` | Sets total quantity of items ordered. |
| `.setStatus(status)` | `number` | Sets order status flag (default: `1` / INQUIRY). |
| `.setSurface(surface)` | `number` | Sets WhatsApp catalog surface (default: `1` / CATALOG). |
| `.setTotalAmount(amount, currency)` | `number, string` | Sets total monetary amount and currency code (e.g. `35000, 'IDR'`). |
| `.setThumbnail(thumb)` | `Buffer \| string` | Sets preview thumbnail image for the order card. |
| `.setSellerJid(jid)` | `string` | Sets seller WhatsApp JID (optional). |
| `.send(jid, options)` | `string, Object` | Relays the order card to the target WhatsApp JID. |

---

## Practical Examples

### 1. Using OrderMessage Builder

```javascript
import { OrderMessage } from 'leaves-guardian';

const order = new OrderMessage(client)
  .setOrderTitle('Iced Caramel Macchiato')
  .setMessage('2x Large Cup, Oat Milk')
  .setItemCount(2)
  .setTotalAmount(48000, 'IDR')
  .setThumbnail('https://example.com/coffee.jpg');

await order.send(msg.chat.id);
```

### 2. Using Direct Helper `client.sendOrder()`

```javascript
await client.sendOrder(msg.chat.id, {
  orderTitle: '1-Month VIP Subscription',
  message: 'Full access to Leaves Guardian premium features',
  itemCount: 1,
  totalAmount: 15,
  totalCurrencyCode: 'USD'
});
```

### 3. Using Fluent MessageBuilder Proxy

```javascript
await client.messageBuilder(msg.chat.id)
  .setType('Order')
  .setOrderTitle('Cloud VPS Setup Service')
  .setItemCount(1)
  .setTotalAmount(25, 'USD')
  .send();
```
