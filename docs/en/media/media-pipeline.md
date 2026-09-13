---
title: Media Pipeline & SSRF Protection
description: Safe media preparation, MIME detection, memory/disk thresholding, and SSRF security isolation in Leaves Guardian.
---

# Media Pipeline & SSRF Protection

`MediaPipeline` prepares and transforms media files (images, audio, video, documents, stickers) for outbound transmission in Leaves Guardian. It provides streaming download resolution, MIME type sniffing from magic numbers, spill-to-disk buffer thresholding, and SSRF (Server-Side Request Forgery) protection against private IP ranges.

> [!IMPORTANT]
> `MediaPipeline` prepares media into structured `PreparedMedia` containers. Transport transmission is handled separately by `TrafficController` and Baileys.

---

## Key Invariants & Pipeline Limits

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `maxInputBytes` | `100 MB` (104,857,600 B) | Maximum acceptable input stream/file size. |
| `maxOutputBytes` | `100 MB` (104,857,600 B) | Maximum transformed output size. |
| `bufferThresholdBytes` | `10 MB` (10,485,760 B) | Streams smaller than 10MB are kept in memory; larger streams spill to temporary disk storage. |
| `fetchTimeoutMs` | `30000` (30s) | Maximum duration for remote media HTTP downloads. |
| `maxRedirects` | `5` | Maximum permitted HTTP redirect hops. |
| `maxConcurrentJobs` | `3` | Concurrency ceiling for parallel transformation jobs. |
| `maxWaitingJobs` | `50` | Maximum queue depth for waiting media jobs. |
| `allowPrivateIp` | `false` | SSRF guard: blocks requests to loopback (`127.0.0.1`), private RFC-1918 (`10.x`, `192.168.x`, `172.16.x`), and cloud metadata IP ranges (`169.254.169.254`). |

---

## Usage Example

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient();

// MediaMessage automatically invokes MediaPipeline under the hood
await client.send(
  '628123456789@s.whatsapp.net',
  client.buildMedia()
    .image('https://example.com/secure-image.jpg')
    .caption('Prepared safely through MediaPipeline')
);
```

---

## Pipeline Execution Phases

```
Source URL / Buffer / Stream / File Path
                  │
                  ▼
         [ SSRF & IP Guard ]
                  │
                  ▼
         [ Stream Fetcher ]
         ├── < 10MB: In-Memory Buffer
         └── ≥ 10MB: Temp Disk Spill
                  │
                  ▼
      [ Magic Number MIME Sniffer ]
                  │
                  ▼
         [ PreparedMedia Container ]
                  │
                  ▼
        Dispatch to TrafficController
```
