---
title: Media Pipeline & Proteksi SSRF
description: Penyiapan media aman, deteksi MIME magic number, thresholding buffer memori/disk, dan proteksi SSRF di Leaves Guardian.
---

# Media Pipeline & Proteksi SSRF

`MediaPipeline` bertugas mempersiapkan dan mentransformasikan berkas media (gambar, audio, video, dokumen, stiker) untuk pengiriman keluar pada Leaves Guardian. Subsistem ini mencakup pengunduhan streaming, sniffing tipe MIME dari magic number, buffer thresholding (spill-to-disk), dan perlindungan SSRF (Server-Side Request Forgery) terhadap rentang IP privat.

> [!IMPORTANT]
> `MediaPipeline` menyiapkan media ke dalam struktur `PreparedMedia`. Proses transmisi aktual dilakukan secara terpisah oleh `TrafficController` dan Baileys.

---

## Batasan & Konstanta Pipeline

| Parameter | Nilai Bawaan | Deskripsi |
| :--- | :--- | :--- |
| `maxInputBytes` | `100 MB` (104.857.600 B) | Batas ukuran maksimal stream/file input. |
| `maxOutputBytes` | `100 MB` (104.857.600 B) | Batas ukuran maksimal file output setelah transformasi. |
| `bufferThresholdBytes` | `10 MB` (10.485.760 B) | Media < 10MB disimpan di memori; media ≥ 10MB dialihkan ke file disk sementara. |
| `fetchTimeoutMs` | `30000` (30 detik) | Batas waktu unduh media remote. |
| `maxRedirects` | `5` | Batas maksimal redirect HTTP yang diizinkan. |
| `maxConcurrentJobs` | `3` | Batas maksimal pemrosesan media konkuren. |
| `maxWaitingJobs` | `50` | Kapasitas maksimal antrean tugas media yang menunggu. |
| `allowPrivateIp` | `false` | Proteksi SSRF: memblokir permintaan ke IP loopback, IP lokal RFC-1918, dan metadata cloud. |

---

## Penggunaan

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient();

// MediaMessage secara otomatis memanfaatkan MediaPipeline
await client.send(
  '628123456789@s.whatsapp.net',
  client.buildMedia()
    .image('https://example.com/gambar-aman.jpg')
    .caption('Diproses dengan aman melalui MediaPipeline')
);
```
