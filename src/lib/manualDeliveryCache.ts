/** Bounded process-local reuse. Pending loads coalesce; failures never persist. */
export class ManualDeliveryCache<T> {
  private entries = new Map<string, { value: T; expires: number; bytes: number }>();
  private pending = new Map<string, Promise<T>>();
  private bytes = 0;

  private maxEntries: number;
  private maxBytes: number;
  constructor(maxEntries: number, maxBytes: number) { this.maxEntries = maxEntries; this.maxBytes = maxBytes; }

  async get(key: string, load: () => Promise<T>, policy: (value: T) => { ttl: number; bytes: number }): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expires > Date.now()) {
      this.entries.delete(key);
      this.entries.set(key, hit);
      return hit.value;
    }
    if (hit) this.remove(key);
    const active = this.pending.get(key);
    if (active) return active;
    if (this.pending.size >= 128) throw new Error('Manual data queue is full');
    const promise = load().then(value => {
      const { ttl, bytes } = policy(value);
      if (ttl > 0 && bytes <= this.maxBytes / 4) {
        this.remove(key);
        this.entries.set(key, { value, expires: Date.now() + ttl, bytes });
        this.bytes += bytes;
        while (this.entries.size > this.maxEntries || this.bytes > this.maxBytes) {
          this.remove(this.entries.keys().next().value!);
        }
      }
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }

  private remove(key: string) {
    const old = this.entries.get(key);
    if (old) this.bytes -= old.bytes;
    this.entries.delete(key);
  }
}
