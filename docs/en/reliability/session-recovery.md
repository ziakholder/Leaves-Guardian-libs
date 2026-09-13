---
title: Session Recovery & Disk Forensics
description: Disk-level authentication filesystem integrity, atomic snapshotting, forensics quarantine, and exact-tree rollback recovery.
---

# Session Recovery & Disk Forensics

`SessionRecovery` manages the disk-level authentication state for Leaves Guardian bots. It guards against authentication file corruption (zero-byte files, syntax errors, missing crypto keys) by creating atomic, source-consistent snapshots and performing safe staged restorations with exact-tree rollback capabilities.

Accessible via `client.recovery` on the client instance.

---

## Key Invariants & Features

1. **Eligible Auth File Filtering:** Operates strictly on recognized Baileys credential files (`creds.json`, `pre-key-*.json`, `session-*.json`, `sender-key-*.json`, `app-state-sync-*.json`). Custom application files (e.g. `config.json`) are untouched.
2. **Atomic Snapshotting with SHA-256 Manifest v1:** Validates source consistency during copy and writes a deterministic `manifest.json` with file hashes.
3. **Staged Restoration & Exact-Tree Rollback:** Restores files into active session from a validated staging directory. If activation verification fails, it rolls back to the exact pre-activation state.
4. **Complete-Tree Forensics Quarantine:** Isolates corrupt session trees into `.quarantine/corrupted_<timestamp>_<rand>` with full diagnostic metadata.
5. **Terminal 401 Logout Protection:** When a terminal 401 error occurs (`handleLoggedOut()`), snapshots are purged to prevent stale auth loops and further restorations are blocked until explicit login re-authentication.

---

## Configuration & Defaults

```javascript
import { LeavesClient } from 'leaves-guardian';

const client = new LeavesClient({
  recovery: {
    sessionDirectory: './session',
    backupDirectory: './session/.backup',
    quarantineDirectory: './session/.quarantine',
    maxSnapshots: 3,                 // Maximum snapshots retained (1-10)
    maxQuarantineEntries: 10,        // Maximum quarantine records retained (1-100)
    autoSnapshotOnConnect: true,     // Create snapshot when client reaches READY state
    autoRestoreOnCorruption: true,   // Automatically attempt recovery if creds are corrupt
    purgeBackupsOn401: true          // Purge backups on permanent 401 Logout
  }
});
```

---

## Verified Public API

All mutating operations run through an internal serializer to avoid queue poisoning or race conditions:

### 1. `inspectSession()`
Inspects the current active session directory integrity without making mutations.

```javascript
const health = await client.recovery.inspectSession();
console.log(health.status);
// Statuses: 'FRESH_SESSION' | 'HEALTHY' | 'CORRUPTED_ZERO_BYTE' | 'CORRUPTED_SYNTAX_ERROR' | 'CORRUPTED_SCHEMA_INVALID'
```

### 2. `createSnapshot(reason = 'MANUAL')`
Creates an atomic, source-consistent snapshot in `.backup`.

```javascript
const snapshot = await client.recovery.createSnapshot('BEFORE_MIGRATION');
console.log('Created snapshot:', snapshot.snapshotId);
```

### 3. `listSnapshots()`
Lists all available snapshots sorted descending (newest first).

```javascript
const snapshots = await client.recovery.listSnapshots();
for (const s of snapshots) {
  console.log(`${s.snapshotId} created at ${s.createdAtISO} (reason: ${s.reason})`);
}
```

### 4. `validateSnapshot(snapshotIdOrPath)`
Validates a snapshot directory against its mandatory `manifest.json` and Baileys schema.

```javascript
const result = await client.recovery.validateSnapshot('snapshot_1720000000000_a1b2c3d4');
if (!result.valid) {
  console.error('Corrupted snapshot:', result.reason);
}
```

### 5. `restoreSnapshot(snapshotIdOrPath)`
Restores a specific snapshot with staged replacement and rollback protection.

```javascript
const res = await client.recovery.restoreSnapshot('snapshot_1720000000000_a1b2c3d4');
console.log(`Restored ${res.filesRestored} files, cleaned ${res.staleFilesRemoved} stale files.`);
```

### 6. `restoreLatestValidSnapshot()`
Cascades through available snapshots from newest to oldest until a valid snapshot is successfully restored.

```javascript
await client.recovery.restoreLatestValidSnapshot();
```

### 7. `quarantineCurrentSession(diagnostics)`
Moves the current corrupted auth files into `.quarantine` with diagnostic error reports.

```javascript
await client.recovery.quarantineCurrentSession({
  reason: 'SYNTAX_ERROR_DETECTED',
  details: 'Unexpected token at position 0'
});
```

### 8. `cleanEligibleAuthFiles()`
Deletes active auth files in the session directory without touching custom config files.

```javascript
await client.recovery.cleanEligibleAuthFiles();
```

### 9. `handleLoggedOut()`
Terminal 401 handler that clears backups and blocks restorations until fresh pairing.

```javascript
await client.recovery.handleLoggedOut();
```

### 10. `resetTerminalState()`
Explicitly resets the terminal logged-out state when a fresh authenticated login occurs.

```javascript
client.recovery.resetTerminalState();
```

### 11. `stop()`
Performs a graceful shutdown of SessionRecovery by setting shutdown flags and awaiting any in-flight serialized mutation tasks.

```javascript
await client.recovery.stop();
```

### 12. Housekeeping (`pruneSnapshots()`, `pruneQuarantine()`, `clearBackups()`)
- `await client.recovery.pruneSnapshots()`: Enforces `maxSnapshots` limit.
- `await client.recovery.pruneQuarantine()`: Enforces `maxQuarantineEntries` limit.
- `await client.recovery.clearBackups()`: Purges all backup snapshots.

---

## Subsystem Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `snapshot_created` | `{ snapshotId, createdAt, reason, fileCount, durationMs }` | Emitted when a snapshot is created. |
| `session_restored` | `{ snapshotId, filesRestored, staleFilesRemoved, timestamp }` | Emitted when a session is restored. |
| `session_quarantined` | `{ quarantined, quarantineId, quarantinePath, totalQuarantined }` | Emitted when corrupted auth files are isolated. |
| `backups_purged` | `{ reason, timestamp }` | Emitted when snapshots are purged following a terminal 401. |
| `snapshot_pruned` | `{ prunedSnapshots, remainingCount }` | Emitted when older snapshots exceed `maxSnapshots`. |
