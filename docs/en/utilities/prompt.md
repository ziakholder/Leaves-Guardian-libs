# Interactive Prompts

`Prompt` is an interactive conversation wizard (Layer 4.2) built directly on top of `LeavesClient` and `MessageCollector`. It simplifies building multi-step interactive workflows, input validation, automatic retries, and user confirmation dialogues.

---

## Quick Static Helpers

For simple single-question interactions, `Prompt` provides convenient static methods that resolve directly to values:

### 1. Simple Question: `Prompt.ask()`

```javascript
import { Prompt } from 'leaves-guardian';

// Ask a question and receive the validated text response
const age = await Prompt.ask(client, msg.chat.id, 'How old are you?', {
  validate: (val) => (!isNaN(val) && Number(val) > 0) || 'Please enter a valid age number.'
});

await client.sendText(msg.chat.id, `Recorded age: ${age}`);
```

### 2. Yes/No Confirmation: `Prompt.confirm()`

`Prompt.confirm()` automatically recognizes Indonesian and English affirmative (`ya`, `yes`, `y`, `ok`, `1`, `true`) and negative (`tidak`, `no`, `n`, `false`) keywords, returning a strict `boolean`:

```javascript
const confirmed = await Prompt.confirm(
  client,
  msg.chat.id,
  'Are you sure you want to proceed with account registration?'
);

if (confirmed) {
  await client.sendText(msg.chat.id, '✅ Proceeding with registration...');
} else {
  await client.sendText(msg.chat.id, '❌ Registration cancelled.');
}
```

### 3. Selection Choice: `Prompt.select()`

```javascript
const selectedFruit = await Prompt.select(
  client,
  msg.chat.id,
  'Please select your favorite fruit:',
  ['Apple', 'Banana', 'Orange', 'Mango']
);

await client.sendText(msg.chat.id, `You selected: ${selectedFruit}`);
```

---

## Multi-Step Wizard Example

For multi-step flows (like user onboarding or survey forms), instantiate a `Prompt` and chain `.addStep()` calls:

```javascript
import { Prompt } from 'leaves-guardian';

client.on('message', async (msg) => {
  if (msg.text === '!register') {
    const wizard = new Prompt(client, {
      timeout: 120000,      // 2 minutes overall wizard timeout
      stepTimeout: 45000,   // 45 seconds per step
      cancelKeywords: ['batal', 'cancel', 'exit', 'quit']
    });

    // Step 1: User's Name
    wizard.addStep({
      id: 'name',
      question: '👤 What is your full name?',
      validate: (val) => val.trim().length >= 3 || 'Name must be at least 3 characters.'
    });

    // Step 2: Email Address
    wizard.addStep({
      id: 'email',
      question: '📧 What is your email address?',
      validate: (val) => val.includes('@') && val.includes('.') || 'Please enter a valid email address.',
      transform: (val) => val.trim().toLowerCase()
    });

    // Step 3: Age
    wizard.addStep({
      id: 'age',
      question: '🎂 What is your age?',
      validate: (val) => (!isNaN(val) && Number(val) >= 13) || 'You must be at least 13 years old.',
      transform: (val) => Number(val)
    });

    try {
      // Execute the wizard for this conversation
      const answers = await wizard.run(msg.chat.id, msg.sender.id);

      console.log('Registration complete:', answers);
      // answers = { name: 'John Doe', email: 'john@example.com', age: 25 }

      await client.sendText(
        msg.chat.id,
        `🎉 Registration successful!\n• Name: ${answers.name}\n• Email: ${answers.email}\n• Age: ${answers.age}`
      );
    } catch (err) {
      if (err.name === 'PromptCancelledError') {
        await client.sendText(msg.chat.id, '❌ Registration was cancelled.');
      } else if (err.name === 'PromptTimeoutError') {
        await client.sendText(msg.chat.id, '⏳ Registration timed out due to inactivity.');
      } else {
        await client.sendText(msg.chat.id, `⚠️ Error: ${err.message}`);
      }
    }
  }
});
```

---

## Step Configuration Options

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique key for the step in the resulting answers object. |
| `question` | `string \| Function` | Question text, builder instance, or dynamic async generator function. |
| `validate` | `Function` | Validator `async (val, msg, ctx) => boolean \| string`. Return `string` as error message on invalid input. |
| `transform` | `Function` | Transformer `async (val, msg, ctx) => any` to cast or clean the parsed output. |
| `retries` | `number` | Retry attempts allowed after an invalid input (default: `2`). |
| `timeout` | `number` | Step timeout in milliseconds (overrides `stepTimeout`). |
| `onInvalid` | `Function` | Custom handler called when validation fails. |

---

## Prompt States (`PROMPT_STATES`)

| State | Description |
| :--- | :--- |
| `PROMPT_STATES.IDLE` | Wizard initialized, waiting to be executed with `.run()`. |
| `PROMPT_STATES.RUNNING` | Wizard is actively collecting answers. |
| `PROMPT_STATES.COMPLETED` | All steps successfully completed. |
| `PROMPT_STATES.CANCELLED` | User sent a cancel keyword or `.cancel()` was called. |
| `PROMPT_STATES.TIMEOUT` | Overall or step timeout expired. |
| `PROMPT_STATES.MAX_RETRIES` | User exceeded max invalid attempt retries on a step. |
| `PROMPT_STATES.ERROR` | An unhandled error occurred during step execution. |
| `PROMPT_STATES.SHUTDOWN` | Client shut down while prompt was running. |

---

## Related Documentation

- **[Message Collector](/en/utilities/collector)**: Lower-level message collection engine.
- **[Interactive Paginator](/en/utilities/paginator)**: Multi-page navigation lists.
- **[Auto-Delete Manager](/en/utilities/autodelete)**: Scheduled message deletion.
