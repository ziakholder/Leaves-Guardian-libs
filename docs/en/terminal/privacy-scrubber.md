# Privacy Scrubber & Data Sanitization

`leaves-guardian` includes an automated **Tri-Tier Privacy Scrubber & Sensitive Data Sanitization Engine** (`PresentationSanitizer`). Built directly into the terminal presentation pipeline, it ensures that production logs, developer telemetry, and debug diagnostics never leak sensitive credentials, authorization tokens, private keys, or raw personal identifiers to terminal output streams.

---

## 1. Overview & Security Model

When an event is dispatched through the terminal presentation pipeline, its metadata payload (`event.data`) undergoes automatic sanitization before being attached to the immutable `TerminalEvent` snapshot:

```mermaid
flowchart TD
    RAW[Raw Event Data Payload] --> TIER1{Tier 1: Mandatory Secret Redaction
SENSITIVE_KEY_PATTERN}
    TIER1 -->|Key Matches Secret Policy| REDACT[Replace with '[REDACTED_SECRET]']
    TIER1 -->|Key Safe| TIER2{Tier 2: Privacy & Path Masking}
    
    subgraph TIER2_FLOW [Tier 2 Sanitization]
        TIER2 -->|JID / Phone Number| JID[maskJid: 62812******90]
        TIER2 -->|Absolute File Path| PATH[sanitizePath: [LOCAL_PATH]/session/creds.json]
    end
    
    REDACT & JID & PATH --> TIER3{Tier 3: Safe Data Canonicalization}
    
    subgraph TIER3_FLOW [Tier 3 Representation & Safety]
        TIER3 -->|Buffer / Uint8Array| BUF[Descriptor: { type, lengthBytes }]
        TIER3 -->|Error Instance| ERR[Descriptor: { name, message, code }]
        TIER3 -->|Live Stream / Socket / Timer| LIVE[Descriptor: { className }]
        TIER3 -->|Circular Reference| CIRC[Replace with '[Circular]']
        TIER3 -->|Functions & Symbols| DROP[Omit undefined]
    end
    
    BUF & ERR & LIVE & CIRC & DROP --> FREEZE[deepFreeze: Immutable Isolated Snapshot]
    FREEZE --> EVENT[Immutable TerminalEvent.data]
```

### Snapshot Isolation

The sanitizer ensures **snapshot isolation**: sanitized data is converted into newly allocated snapshots before being deep-frozen, preventing visual renderers or external sinks from mutating the original input objects through the sanitized snapshot.

---

## 2. Tier 1: Mandatory Secret Redaction (Non-Bypassable)

Tier 1 enforces unconditional redaction of security-critical credentials. It inspects all object property names against a strict internal regex pattern (`SENSITIVE_KEY_PATTERN`):

```js
const SENSITIVE_KEY_PATTERN = /^(creds|noiseKey|signedIdentityKey|pairingCode|authKey|identityKey|privateKey|secret|token|password|pin|clientSecret|clientToken)$/i;
```

If any key in an object matches this policy, its value is immediately replaced with the sentinel string:
```text
'[REDACTED_SECRET]'
```

> [!WARNING]
> **Non-Bypassable Security Guarantee:**
> Mandatory secret redaction is **always enforced**. Even if a developer explicitly sets `privacyMasking: false`, sensitive credentials matching `SENSITIVE_KEY_PATTERN` remain strictly `[REDACTED_SECRET]`.

---

## 3. Tier 2: Configurable Privacy & Path Masking

Tier 2 handles personal identifiers and host filesystem paths. This tier is active by default and can be controlled via the `privacyMasking` configuration option.

### 3.1 Phone JID & Number Masking (`maskJid`)

The sanitizer recognizes WhatsApp JIDs containing `@s.whatsapp.net` as well as standalone 10–15 digit phone number strings.

- **Standard Masking Formula:** Preserves the leading `prefixLength` (default: `5`) and trailing `suffixLength` (default: `2`), replacing intermediate digits with `******`.
- **Short Value Handling:** If the numeric string length is $le 6$ digits or $le (	ext{prefixLength} + 	ext{suffixLength})$, it is completely obfuscated as `'******'`.
- **Masking Disabled (`privacyMasking: false`):** When disabled, phone numbers remain unmasked, but the internal `@s.whatsapp.net` server suffix is stripped for clean presentation.

```js
import { PresentationSanitizer } from 'leaves-guardian';

// Standard 13-digit Indonesian WhatsApp number
PresentationSanitizer.maskJid('6281234567890@s.whatsapp.net');
// Result: '62812******90'

// Custom prefix and suffix bounds
PresentationSanitizer.maskJid('6281234567890@s.whatsapp.net', {
  prefixLength: 4,
  suffixLength: 3
});
// Result: '6281******890'

// Short length edge case (<= 6 digits)
PresentationSanitizer.maskJid('12345@s.whatsapp.net');
// Result: '******'
```

### 3.2 Filesystem Path Normalization (`sanitizePath`)

To prevent logs from leaking deployment directory structures, local operating system usernames, or server folder layouts, the engine intercepts recognized absolute paths using `ABSOLUTE_PATH_PATTERN`:

```js
const ABSOLUTE_PATH_PATTERN = /(?:[a-zA-Z]:[\/][^s"']+|/(?:home|Users|usr|var|etc|opt|tmp|app)[^s"']*)/g;
```

Path normalization reduces disclosure of local usernames and absolute deployment paths by replacing recognized absolute paths with relative descriptors preserving at most the trailing 2 path segments:

```text
Windows:
C:Usersadministratorotsessioncreds.json
  --> [LOCAL_PATH]/session/creds.json

Linux / Docker / macOS:
/home/ubuntu/production/leaves-guardian/data/store.json
  --> [LOCAL_PATH]/data/store.json
/app/session/creds.json
  --> [LOCAL_PATH]/session/creds.json
```

---

## 4. Tier 3: Safe Data Canonicalization & Containment

Tier 3 acts as an architectural safety boundary. It transforms runtime instances, binary data, and live process handles into safe, serializable descriptors to prevent terminal buffer flooding, event loop stalling, and reference leakage.

### 4.1 Binary Buffer & TypedArray Canonicalization
Binary values are represented by compact descriptors containing their type and byte length instead of exposing their raw byte content:

```js
// Input: Buffer.from('binary-data-stream')
// Output descriptor:
{
  type: 'Buffer',
  lengthBytes: 18
}

// Input: new Uint8Array(64)
// Output descriptor:
{
  type: 'Uint8Array',
  lengthBytes: 64
}
```

### 4.2 Error Instance Canonicalization
Error instances are converted to a structured `{ name, message, code }` descriptor, with path sanitization applied directly to the message:

```js
// Input: new Error('Failed to open C:\Users\admin\session\creds.json')
// Output descriptor:
{
  name: 'Error',
  message: 'Failed to open [LOCAL_PATH]/session/creds.json',
  code: undefined
}
```

### 4.3 Live Object & Process Handle Containment
Live streams, active network sockets, Promises, and timers are intercepted and reduced to class name descriptors, preventing visual renderers from attempting to serialize active handles:

```js
// Active Socket, ReadStream, Timeout, or Promise instances
// Output descriptor:
{
  className: 'Socket' // or 'LiveObject', 'Timeout', etc.
}
```

### 4.4 Circular Reference Detection & Deep Freezing
- **Cycle Prevention:** Active parent references are tracked during recursive parsing. Circular structures are safely replaced with the sentinel string `'[Circular]'`.
- **Functions & Symbols:** Invocable functions and JavaScript symbols are dropped (`undefined`) during canonicalization.
- **Deep Freezing (`deepFreeze`):** The resulting snapshot is recursively frozen using `Object.freeze()`. Renderers and sinks cannot modify the snapshot or attach arbitrary properties.

---

## 5. Standalone Utility Usage

While `PresentationSanitizer` is automatically executed during `client.terminal` logging, its utility functions are also exported directly for custom developer sanitization workflows:

```js
import { PresentationSanitizer } from 'leaves-guardian';

// 1. Mask an individual JID
const masked = PresentationSanitizer.maskJid('6281234567890@s.whatsapp.net');

// 2. Sanitize an absolute path string
const cleanPath = PresentationSanitizer.sanitizePath('C:\apps\bot\session\creds.json');

// 3. Perform complete Tri-Tier sanitization on any arbitrary data object
const safeSnapshot = PresentationSanitizer.sanitizeData({
  user: '6281234567890@s.whatsapp.net',
  sessionPath: '/home/deploy/bot/creds.json',
  authKey: 'super-secret-key', // Automatically redacted
  payload: Buffer.alloc(1024)   // Automatically converted to { type: 'Buffer', lengthBytes: 1024 }
}, {
  privacyMasking: true
});

console.log(safeSnapshot);
// {
//   user: '62812******90',
//   sessionPath: '[LOCAL_PATH]/bot/creds.json',
//   authKey: '[REDACTED_SECRET]',
//   payload: { type: 'Buffer', lengthBytes: 1024 }
// }

// 4. Recursively freeze any object
const frozenObject = PresentationSanitizer.deepFreeze({ config: { level: 'INFO' } });
```
