// Schema migrations across releases. v0.1 — no-op.

const SCHEMA_VERSION = 1;

export async function migrate(): Promise<void> {
  // Reserved for future versions: read SCHEMA_VERSION from storage, apply deltas.
  // No-op in v0.1.
  void SCHEMA_VERSION;
}