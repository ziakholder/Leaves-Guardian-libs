---
title: Penyimpanan Data Ringan (SmartStore)
description: Penyimpanan state & key-value in-memory cepat dengan persistensi atomik JSON, namespace, dan TTL di Leaves Guardian.
---

# Penyimpanan Data Ringan (SmartStore)

`SmartStore` adalah engine penyimpanan state dan key-value bawaan Leaves Guardian. State disimpan di memori untuk akses cepat, sementara seluruh API publik SmartStore menggunakan operasi asynchronous berbasis Promise dan persistensi disk dilakukan secara atomik tanpa memblokir event loop.

Tersedia langsung pada instance client via `client.store` atau dapat diinisialisasi secara mandiri.

---

## Fitur & Invarian Utama

1. **State In-Memory dengan Operasi Asynchronous & Persistensi Atomik:** Data disimpan di memori (`Map`) untuk performa tinggi, sementara seluruh method publik (`get`, `has`, `set`, `delete`, `keys`, `entries`) mengembalikan Promise (`async`). Operasi tulis mengantrekan persistensi disk atomik (file sementara + `fsync` + atomic rename).
2. **Validasi JSON Ketat:** Nilai yang disimpan harus valid JSON murni. SmartStore secara tegas menolak `undefined`, `Function`, `Symbol`, `BigInt`, `NaN`, `Infinity`, `Promise`, `Map`, `Set`, `Date`, `Buffer`, objek class kustom, dan referensi sirkular.
3. **Partisi Namespace:** Mendukung isolasi ruang data antar fitur (misal: `user_sessions`, `cooldowns`) via `store.namespace(nama)`.
4. **Time-To-Live (TTL):** Mendukung batas waktu kedaluwarsa per-key dalam milidetik. Entri kedaluwarsa dibersihkan saat diakses (*lazy*) dan melalui pembersihan berkala (*sweep*).
5. **Antrean Tulis Bebas Racun (Non-Poisoning):** Kegagalan penulisan disk pada satu operasi hanya me-reject operasi tersebut tanpa merusak rantai antrean persistensi berikutnya.

---

## Konfigurasi & Opsi Bawaan

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  store: {
    filePath: './data/smart-store.json', // Lokasi berkas penyimpanan
    autoPersist: true,                   // Simpan otomatis ke disk saat ada mutasi
    sweepIntervalMs: 60000,              // Pembersihan kunci kedaluwarsa tiap 60s
    autoSweep: true                      // Aktifkan timer pembersihan latar belakang
  }
});
```

---

## Penggunaan Dasar (Namespace Default)

Secara bawaan, pemanggilan langsung pada `client.store` menargetkan namespace `'default'`:

```javascript
// Menyimpan data
await client.store.set('user:123:step', 'MENUNGGU_PEMBAYARAN');

// Menyimpan data dengan TTL 5 menit (dalam milidetik)
await client.store.set('otp:user:123', '948201', { ttl: 5 * 60 * 1000 });

// Membaca data (mengembalikan undefined jika tidak ada / kedaluwarsa)
const step = await client.store.get('user:123:step');
console.log('Langkah saat ini:', step);

// Memeriksa keberadaan key
const adaOtp = await client.store.has('otp:user:123');

// Menghapus data
const terhapus = await client.store.delete('user:123:step');

// Mengosongkan seluruh namespace default
await client.store.clear();
```

---

## Partisi Menggunakan Namespace

Namespace memisahkan ruang data fitur bot agar tidak saling bertabrakan:

```javascript
// Membuat proxy namespace
const sesiUser = client.store.namespace('sesi_pengguna');
const batasCooldown = client.store.namespace('cooldown_command');

// Menyimpan data di namespace masing-masing
await sesiUser.set('628123456789', {
  tahap: 'PEMBUATAN_PESANAN',
  keranjang: [{ id: 'produk_a', qty: 2 }]
});

await batasCooldown.set('628123456789:klaim_harian', true, { ttl: 24 * 60 * 60 * 1000 });

// Mengakses data namespace
const dataSesi = await sesiUser.get('628123456789');
const semuaKey = await sesiUser.keys();
const jumlahSesi = await sesiUser.size();
```

---

## Pembersihan & Persistensi Manual

```javascript
// Membersihkan seluruh kunci kedaluwarsa lintas namespace
const jumlahDibersihkan = client.store.sweep();
console.log(`Membersihkan ${jumlahDibersihkan} entri kedaluwarsa.`);

// Memaksa penulisan instan memori ke disk
await client.store.flush();

// Penutupan aman (menghentikan timer sweep dan mem-flush antrean tersisa)
await client.store.stop();
```

---

## Event Subsistem

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `set` | `{ namespace, key, value, expiresAt }` | Dipancarkan saat kunci disimpan/diperbarui. |
| `delete` | `{ namespace, key }` | Dipancarkan saat kunci dihapus. |
| `clear` | `{ namespace }` | Dipancarkan saat namespace dikosongkan. |
| `expired` | `{ namespace, key }` | Dipancarkan saat kunci kedaluwarsa dibersihkan. |
| `writeError` | `Error` | Dipancarkan jika terjadi kegagalan tulis disk (non-fatal). |
| `shutdownError` | `Error` | Dipancarkan jika flush terakhir gagal saat shutdown. |
