# Terminal Presentation Architecture

`leaves-guardian` features a decoupled, high-performance **Terminal Presentation Subsystem** designed to provide clear, structured, and privacy-safe console observability. Unlike traditional logging libraries that interleave raw string concatenation with direct console writes, `leaves-guardian` strictly separates semantic event creation, security sanitization, visual text rendering, and output stream delivery.

---

## 1. Overview & Architecture Model

The Terminal Presentation subsystem operates on a synchronous, pipeline-based architecture (Contract Baseline v1.3):

```mermaid
flowchart TD
    A[Event Source / Developer Action] -->|client.terminal.info/warn/...| B[LeavesTerminal Facade]
    B -->|dispatch event input| TM[TerminalManager Engine]
    
    subgraph Pipeline [TerminalManager Execution Pipeline]
        TM --> C{Level Filtering
LEVEL_WEIGHTS}
        C -- Suppressed --> END1[Discard]
        C -- Accepted --> D{Recursion Guard
maxDispatchDepth}
        D -- Exceeded --> END2[Discard]
        D -- Safe --> E[PresentationSanitizer
Secret Redaction & Masking]
        E --> F[Create Immutable
TerminalEvent Snapshot]
        F --> G[TerminalRenderer
Visual Text Transformation]
        G -- Render Success --> H[OutputSink
stdout / stderr Dispatch]
        G -- Render Throws --> FB[Resilience Fallback
stderr [TERR_FALLBACK]]
    end
```

### Core Design Invariants

1. **Decoupled Concerns:** Semantic event data (`TerminalEvent`) is completely decoupled from visual layout formatting (`TerminalRenderer`) and stream multiplexing (`OutputSink`).
2. **Immutable Snapshot:** Every dispatched event is converted into a deep-frozen, immutable `TerminalEvent` value object before reaching the renderer.
3. **Non-Blocking Resilience:** Formatter crashes inside custom or default renderers are safely trapped. The subsystem logs a fallback alert to `stderr` and never crashes the bot's runtime loop.
4. **Physical Stream Capability Awareness:** Rendering automatically adapts to the physical terminal's capabilities (`supportsColor`, `isTTY`, `columns`) without guessing OS environment labels.

---

## 2. LeavesTerminal Public Facade (`client.terminal`)

The primary consumer interface for terminal logging is exposed directly on `client.terminal` (and exported as `LeavesTerminal`). It wraps the underlying `TerminalManager` with clean, semantic logging methods:

```js
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({ /* ... */ });

// Standard semantic logging
client.terminal.info('AUTH', 'Authenticating WhatsApp session...');
client.terminal.success('READY', 'Bot connected and listening for messages');
client.terminal.warn('RATE_LIMIT', 'Inbound message threshold reached for user');
client.terminal.error('SOCKET', 'Socket disconnected unexpectedly', { reason: 'TIMEDOUT' });
client.terminal.debug('MEDIA', 'Processing audio stream payload');

// Privacy masking helper
const maskedJid = client.terminal.mask('6281234567890@s.whatsapp.net');
// Output: '62812******90'
```

### Facade Method Reference

| Method | Signature | Severity Level | Description |
| :--- | :--- | :--- | :--- |
| `terminal.info` | `(tag: string, message: string, data?: object)` | `INFO` | Dispatches an informational semantic event. |
| `terminal.success` | `(tag: string, message: string, data?: object)` | `INFO` | Dispatches a positive milestone event rendered with a green checkmark (`✓`). *(See note below)* |
| `terminal.warn` | `(tag: string, message: string, data?: object)` | `WARN` | Dispatches a warning event routed to `stderr`. |
| `terminal.error` | `(tag: string, message: string, data?: object)` | `ERROR` | Dispatches an error event with error metadata routed to `stderr`. |
| `terminal.debug` | `(tag: string, message: string, data?: object)` | `DEBUG` | Dispatches detailed diagnostic logs (filtered out by default unless `minLevel: 'DEBUG'`). |
| `terminal.mask` | `(jid: string, options?: object)` | N/A | Utility helper that returns a privacy-masked representation of a WhatsApp JID or phone number. |

> [!NOTE]
> **Semantic Event vs Severity Level:**
> `terminal.success()` is a convenience facade method that dispatches an `INFO` level event with a success presentation flag (`_legacySuccess: true`). `SUCCESS` is not a standalone severity level in `TERMINAL_LEVEL`; severity filtering is governed strictly by `DEBUG`, `INFO`, `WARN`, and `ERROR`.

---

## 3. TerminalEvent Model Specification

A `TerminalEvent` is an immutable, canonical value object representing a single point-in-time diagnostic or lifecycle event.

```js
export class TerminalEvent {
  constructor({ id, timestamp, level, domain, type, message, data }) {
    this.id = String(id || '');
    this.timestamp = Number(timestamp) || Date.now();
    this.level = level || TERMINAL_LEVEL.INFO;
    this.domain = domain || TERMINAL_DOMAIN.APPLICATION;
    this.type = String(type || 'GENERAL');
    this.message = String(message || '');
    this.data = data && typeof data === 'object' ? data : undefined;

    Object.freeze(this);
  }
}
```

### Property Specifications

- **`id` (`string`):** Monotonic identifier assigned sequentially by the engine (e.g. `'evt_1'`, `'evt_2'`).
- **`timestamp` (`number`):** Authoritative epoch millisecond timestamp generated by the configured clock.
- **`level` (`string`):** Severity level: `'DEBUG'`, `'INFO'`, `'WARN'`, or `'ERROR'`.
- **`domain` (`string`):** Architectural domain: `'CLIENT'`, `'MESSAGE'`, `'RELIABILITY'`, `'TRAFFIC'`, `'MEDIA'`, or `'APPLICATION'`.
- **`type` (`string`):** Specific semantic action or tag (e.g. `'READY'`, `'DISCONNECT'`, `'MESSAGE'`, `'AUTH'`).
- **`message` (`string`):** Pure unformatted semantic summary. It never contains ANSI escape codes or visual borders.
- **`data` (`object | undefined`):** Sanitized, deep-frozen metadata payload snapshot. All sensitive credentials are automatically redacted before attachment.

---

## 4. TerminalManager Engine & Execution Pipeline

`TerminalManager` is the central execution engine and synchronization coordinator. When `dispatch(eventInput)` is called, it executes the following pipeline:

### 1. Level Filtering & Severity Thresholds
The engine checks the event's severity against `LEVEL_WEIGHTS`:

| Level | Weight | Default Status | Output Stream |
| :--- | :--- | :--- | :--- |
| `DEBUG` | 10 | Filtered out by default (`minLevel: 'INFO'`) | `process.stdout` |
| `INFO` | 20 | Emitted by default | `process.stdout` |
| `WARN` | 30 | Emitted by default | `process.stderr` |
| `ERROR` | 40 | Emitted by default | `process.stderr` |

If `LEVEL_WEIGHTS[event.level] < LEVEL_WEIGHTS[options.minLevel]`, the event is immediately discarded with zero allocation overhead.

### 2. Recursion Guard (`maxDispatchDepth`)
To prevent infinite logging loops (for example, if a log sink or renderer listener emits another terminal log during dispatch), `TerminalManager` tracks `_dispatchDepth`. If dispatch exceeds `maxDispatchDepth` (default: `3`), the recursive event is safely dropped.

### 3. Sanitization & Redaction
The payload is processed by `PresentationSanitizer` to redact authentication credentials, tokens, session private keys, and absolute filesystem paths *(covered in detail in the Privacy Scrubber section)*.

### 4. Visual Rendering & Resilience Fallback
The immutable event is passed to `renderer.render(event)` (Model A: pure synchronous string transformation).

If a custom or default renderer encounters an uncaught exception during execution:
1. `TerminalManager` catches the error synchronously.
2. The manager's `rendererStatus` transitions to `RENDERER_STATUS.DEGRADED`.
3. A structured fallback message is written directly to `process.stderr`:
   ```text
   [TERR_FALLBACK] [ERROR] (APPLICATION:GENERAL) Formatter error: <renderErr.message> | <original event.message>
   ```
4. The application continues running without crashing.

### 5. Stream Output Delivery
The rendered string is forwarded to `sink.write(output, event.level)`. By default, `DefaultDualSink` routes `INFO` and `DEBUG` to `process.stdout` and `WARN` and `ERROR` to `process.stderr` *(covered in detail in the Custom Sinks & Renderers section)*.

---

## 5. Physical Terminal Capabilities

`leaves-guardian` includes an environment-agnostic terminal capability inspector:

```js
import { getTerminalCapabilities } from 'leaves-guardian';

const caps = getTerminalCapabilities(process.stdout);
```

### Capability Object Contract

```js
Object.freeze({
  isTTY: Boolean(stream?.isTTY),
  supportsColor: Boolean(!noColor && (forceColor || isTTY || colorDepth > 1)),
  supportsCursorMovement: Boolean(isTTY && stream === process.stdout),
  columns: stream.columns || 80,
  rows: stream.rows || 24
});
```

- **Color Compliance:** Respects standard `NO_COLOR` and `FORCE_COLOR` environment variables. When `NO_COLOR=1` is detected or color is unsupported, `DefaultTextRenderer` automatically strips all ANSI styling and outputs plain ASCII tags (e.g. `[OK]`, `[WARN]`, `[ERROR]`).
- **Dimensions:** Dynamically detects terminal dimensions, falling back safely to `80x24` in non-interactive CI/container environments.

---

## 6. Configuration Options & Defaults

`TerminalManager` can be configured during client initialization or reconfigured dynamically at runtime:

```js
const client = new LeavesClient({
  terminal: {
    enabled: true,
    minLevel: 'INFO',          // 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    privacyMasking: true,       // Enable automatic JID & path masking
    maxDispatchDepth: 3,        // Guard against recursive dispatch loops
    renderer: customRenderer,   // Optional custom TerminalRenderer
    sink: customSink            // Optional custom OutputSink
  }
});

// Dynamic runtime reconfiguration
client.terminalManager.configure({
  minLevel: 'DEBUG'
});
```

| Option | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Master switch for terminal presentation output. |
| `minLevel` | `string` | `'INFO'` | Minimum severity threshold for event dispatch (`'DEBUG'`, `'INFO'`, `'WARN'`, `'ERROR'`). |
| `privacyMasking` | `boolean` | `true` | Toggles automatic masking of phone JIDs and normalization of absolute local file paths. |
| `maxDispatchDepth` | `number` | `3` | Maximum allowed recursive dispatch nesting depth. |
| `renderer` | `object` | `new DefaultTextRenderer()` | Active visual rendering engine implementing `render(event)`. |
| `sink` | `object` | `new DefaultDualSink()` | Active stream dispatch destination implementing `write(text, level)`. |
| `clock` | `function` | `() => Date.now()` | Timestamp provider function. |
