# Pengenalan & Filosofi

**Leaves Guardian** adalah sebuah **Enterprise Baileys Wrapper & Infrastructure Library** untuk membangun aplikasi bot WhatsApp yang stabil, berkinerja tinggi, dan tahan banting menggunakan Node.js.

Library ini memposisikan dirinya tepat di antara [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) dan kode aplikasi Anda, menangani stabilitas koneksi, normalisasi pesan, antrean lalu lintas pesan keluar, observabilitas, serta utilitas pengembang.

---

## Model Mental Arsitektur

Leaves Guardian dirancang bukan untuk menggantikan logika bisnis bot Anda, melainkan untuk mengisolasi dan menangani kompleksitas infrastruktur jaringan Baileys di tingkat produksi:

```
┌────────────────────────────────────────────────────────┐
│               Aplikasi Pengembang                      │
│     (Logika Bot, Perintah, Database, & Handlers)       │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Leaves Guardian                       │
│    • Normalisasi Skema Pesan    • Traffic Controller   │
│    • State Machine Siklus Hidup • Ingress Rate Limiter │
│    • Health & Socket Watchdog   • Message Builders     │
│    • Mitigasi Memory Guard      • Utilitas Pengembang  │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                 @whiskeysockets/baileys                │
│              (Protokol WebSocket WhatsApp)             │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Server WhatsApp                     │
└────────────────────────────────────────────────────────┘
```

---

## Batasan Ruang Lingkup: Apa Itu Leaves Guardian (Dan Apa yang Bukan)

Untuk menjaga batasan arsitektur yang bersih, Leaves Guardian secara eksplisit mendefinisikan tanggung jawabnya:

### ✅ Yang Termasuk dalam Leaves Guardian:
- **Sebuah Infrastructure Library**: Package NPM yang menyediakan lapisan keandalan (*reliability layer*) di atas Baileys.
- **Normalizer Pesan**: Menstandarisasi objek protobuf Baileys yang bersarang menjadi struktur data `Message` yang seragam dan *immutable*.
- **Mesin Keandalan & Observabilitas**: Menyediakan subsistem terintegrasi untuk pemantauan kesehatan (*health monitor*), pendeteksi socket beku (*watchdog*), dan pemantauan memori (*memory guard*).
- **Pengatur Lalu Lintas (Traffic & Ingress)**: Penjadwalan pesan keluar dengan antrean prioritas dan *pacing*, serta pembatasan laju pesan masuk (*inbound rate limiting*).
- **Message Builders**: Pembangun pesan interaktif (tombol, list, carousel, poll, stiker, dan canvas).

### ❌ Yang BUKAN Bagian dari Leaves Guardian:
- **BUKAN Bot Framework**: Tidak memaksakan struktur router perintah (*command router*) atau kerangka handler aplikasi tertentu.
- **BUKAN Plugin Framework**: Tidak mengelola siklus hidup plugin, dependensi plugin, ataupun isolasi sandbox plugin.
- **BUKAN Orkestrator Multi-Tenant**: Mengelola sesi client tunggal; orkestrasi kluster multi-akun menjadi tanggung jawab lapisan aplikasi Anda.
- **BUKAN Database Utama**: Meskipun menyediakan `SmartStore` untuk cache in-memory/JSON dan pemulihan sesi, ini bukan pengganti database relasional atau dokumen.

---

## Prinsip Desain Utama

### 1. Immutabilitas & Tanpa Efek Samping
Semua pesan masuk yang dinormalisasi dibekukan secara mendalam (`Object.freeze()`). Kode aplikasi Anda tidak dapat mengubah properti pesan secara tidak sengaja, mencegah *bug* konkurensi antar event listener.

### 2. State Machine Siklus Hidup yang Eksplisit
Koneksi WhatsApp memiliki beberapa fase penting. Leaves Guardian memodelkannya melalui state machine yang jelas (`IDLE` ➔ `INITIALIZING` ➔ `AUTHENTICATING` ➔ `CONNECTING` ➔ `OPEN` ➔ `READY`). Invarian penting **`OPEN !== READY`** menjamin bahwa bot tidak akan mengirim pesan sebelum autentikasi akun terverifikasi.

### 3. Pemisahan Kontrol Ingress dan Egress
- **Ingress (Masuk)**: Ditangani oleh `IngressRateLimiter` menggunakan *sliding-window tracker* untuk membatasi lonjakan request per pengirim.
- **Egress (Keluar)**: Ditangani oleh `TrafficController` menggunakan antrean prioritas dan *pacing* untuk mengatur pengiriman pesan keluar ke server WhatsApp secara teratur.

### 4. Isolasi Kegagalan Subsistem
Kegagalan pada fitur non-kritis (seperti prompt yang kedaluwarsa atau timeout collector) terisolasi sepenuhnya dan tidak akan memutus koneksi socket utama.

---

## Panduan Terkait

- **[Instalasi & Quick Start](/id/quickstart/quickstart)**: Membangun dan menjalankan bot pertama Anda dalam 5 menit.
- **[Arsitektur & Siklus Hidup](/id/quickstart/architecture)**: Memahami model arsitektur 5 layer dan transisi state koneksi.
- **[Skema Normalisasi Pesan](/id/guides/schema)**: Mempelajari kontrak data pesan `Message` yang immutable.
