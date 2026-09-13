# EventMessage Builder

`EventMessage` constructs official WhatsApp calendar event invitation payloads (`proto.Message.EventMessage`).

It allows bots to schedule and announce events in WhatsApp groups with start/end timestamps, physical or virtual locations, and optional WhatsApp voice/video call links.

---

## Basic Example

```javascript
import { EventMessage } from 'leaves-guardian';

const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const eventEnd = new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

const event = new EventMessage(client)
  .setName('🍃 Leaves Guardian Developer Meetup')
  .setDescription('Deep dive into Baileys architecture, traffic control, and memory safety.')
  .setStartTime(nextWeek)
  .setEndTime(eventEnd)
  .setLocation('Discord Tech Stage / Jakarta')
  .setCallLink('https://call.whatsapp.com/video/example123');

await client.sendMessage(groupJid, event);
```

---

## Methods

| Method | Description |
| :--- | :--- |
| `.setName(name)` | Sets the title of the event. |
| `.setDescription(desc)` | Sets detailed event description and agenda. |
| `.setStartTime(dateOrTimestamp)` | Sets the event start time (accepts `Date` instance or Unix timestamp ms). |
| `.setEndTime(dateOrTimestamp)` | Sets the event end time (accepts `Date` instance or Unix timestamp ms). |
| `.setLocation(locationName)` | Sets the physical address or online venue name. |
| `.setCallLink(url)` | Attaches a WhatsApp call link for online meetups. |
| `.setCanceled(boolean)` | Marks the event as canceled. |

---

## Related Documentation

- **[PollMessage Builder](/en/builders/poll-message)**: Group voting and polls.
- **[ButtonMessage Builder](/en/builders/button-message)**: Interactive button cards.
- **[Incoming Events](/en/messaging/incoming-events)**: Listening for client events.
