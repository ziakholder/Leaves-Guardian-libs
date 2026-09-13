---
title: Pemulihan Sesi & Forensik Disk
description: Integritas sistem berkas autentikasi disk, snapshotting atomik, karantina forensik, dan pemulihan rollback exact-tree.
---

# Pemulihan Sesi & Forensik Disk

`SessionRecovery` mengelola keamanan dan integritas berkas autentikasi WhatsApp pada level disk. Subsistem ini memitigasi kerusakan berkas sesi (file 0-byte, kesalahan sintaksis JSON, atau hilangnya kunci kriptografi) dengan membuat snapshot atomik dan menyediakan pemulihan berperingkat (*staged restoration*) dengan pengembalian aman (*exact-tree rollback*).

Dapat diakses via `client.recovery` pada instance client.

---

## Invarian & Fitur Utama

1. **Penyaringan Berkas Autentikasi Selektif:** Hanya memproses berkas kredensial Baileys (`creds.json`, `pre-key-*.json`, `session-*.json`, `sender-key-*.json`, `app-state-sync-*.json`). Berkas kustom pengembang tidak pernah disentuh.
2. **Snapshot Atomik dengan Manifest v1 (SHA-256):** Memverifikasi konsistensi berkas sumber saat proses salin dan menyertakan checksum SHA-256 pada `manifest.json`.
3. **Staged Restoration & Exact-Tree Rollback:** Berkas dipulihkan melalui tahap staging. Jika verifikasi aktivasi gagal, sistem memulihkan pohon sesi aktif ke kondisi persis sebelum restorasi dimulai.
4. **Karantina Forensik Lengkap:** Memindahkan pohon berkas korup ke folder `.quarantine` lengkap dengan log diagnostik.
5. **Penanganan Logout Terminal (401):** Jika sesi terkena logout permanen (kode 401), snapshot lama otomatis dibersihkan dan upaya restorasi diblokir agar bot siap melakukan pairing ulang baru.

---

## Konfigurasi & Default

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  recovery: {
    sessionDirectory: './session',
    backupDirectory: './session/.backup',
    quarantineDirectory: './session/.quarantine',
    maxSnapshots: 3,                 // Maksimal 3 snapshot (1-10)
    maxQuarantineEntries: 10,        // Maksimal 10 entri karantina (1-100)
    autoSnapshotOnConnect: true,     // Buat snapshot saat status READY
    autoRestoreOnCorruption: true,   // Otomatis pulihkan jika berkas sesi korup
    purgeBackupsOn401: true          // Hapus backup jika terjadi logout 401
  }
});
```

---

## API Publik Resmi

Seluruh operasi mutasi disk diantrekan secara serial untuk mencegah race condition:

- `async inspectSession()`: Memeriksa kesehatan berkas sesi aktif (`'HEALTHY'`, `'FRESH_SESSION'`, `'CORRUPTED_ZERO_BYTE'`, `'CORRUPTED_SYNTAX_ERROR'`, `'CORRUPTED_SCHEMA_INVALID'`).
- `async createSnapshot(reason = 'MANUAL')`: Membuat snapshot baru di `.backup`.
- `async listSnapshots()`: Mendaftar seluruh snapshot aktif tersortir dari yang terbaru.
- `async validateSnapshot(snapshotIdOrPath)`: Memvalidasi checksum seluruh berkas dalam snapshot terhadap manifest.
- `async restoreSnapshot(snapshotIdOrPath)`: Merestorasi snapshot tertentu dengan perlindungan rollback.
- `async restoreLatestValidSnapshot()`: Mencoba merestorasi snapshot valid terbaru secara berjenjang (*cascading*).
- `async quarantineCurrentSession(diagnostics)`: Mengisolasi berkas sesi korup ke direktori karantina.
- `async cleanEligibleAuthFiles()`: Menghapus berkas autentikasi sesi tanpa menyentuh berkas konfigurasi kustom.
- `async handleLoggedOut()`: Membersihkan snapshot dan mengunci status terminal saat 401 terjadi.
- `async resetTerminalState()`: Mereset status terminal logout 401 saat login autentikasi baru berhasil.
- `async stop()`: Penutupan aman (*graceful shutdown*) SessionRecovery dan menunggu antrean mutasi selesai.
- `async pruneSnapshots()`, `async pruneQuarantine()`, `async clearBackups()`: Pembersihan manual berkas snapshot dan karantina.

---

## Event Subsistem

| Event | Payload | Deskripsi |
| :--- | :--- | :--- |
| `snapshot_created` | `{ snapshotId, createdAt, reason, fileCount, durationMs }` | Dipancarkan saat snapshot berhasil dibuat. |
| `session_restored` | `{ snapshotId, filesRestored, staleFilesRemoved, timestamp }` | Dipancarkan saat sesi berhasil dipulihkan. |
| `session_quarantined` | `{ quarantined, quarantineId, quarantinePath, totalQuarantined }` | Dipancarkan saat berkas sesi korup diisolasi ke karantina. |
| `backups_purged` | `{ reason, timestamp }` | Dipancarkan saat snapshot dihapus karena logout 401. |
