import type { Difficulty } from './types';
import type { GeneratedBoard } from './generator';
import { generateNoGuess, generateDaily } from './generator';

// Supplies boards to the UI. Keeps a small pre-generated buffer per difficulty so
// a new game starts instantly, refilling in the background via a Web Worker. If
// the worker can't be created (rare environments), it falls back to generating
// on the main thread.

const BUFFER_TARGET = 2;

type Pending = (b: GeneratedBoard | null) => void;

class BoardSource {
  private worker: Worker | null = null;
  private reqId = 0;
  private pending = new Map<number, Pending>();
  private buffers = new Map<string, GeneratedBoard[]>();
  private filling = new Set<string>();

  private ensureWorker(): Worker | null {
    if (this.worker) return this.worker;
    try {
      this.worker = new Worker(new URL('./generator.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = (e: MessageEvent) => {
        const { reqId, board } = e.data as { reqId: number; board: GeneratedBoard | null };
        const cb = this.pending.get(reqId);
        if (cb) {
          this.pending.delete(reqId);
          cb(board);
        }
      };
      this.worker.onerror = () => {
        this.worker = null; // fall back to main-thread on the next request
      };
    } catch {
      this.worker = null;
    }
    return this.worker;
  }

  private request(payload: Record<string, unknown>): Promise<GeneratedBoard | null> {
    const w = this.ensureWorker();
    if (!w) return Promise.resolve(null); // caller falls back to main thread
    const reqId = ++this.reqId;
    return new Promise((resolve) => {
      this.pending.set(reqId, resolve);
      w.postMessage({ ...payload, reqId });
    });
  }

  prewarm(d: Difficulty) {
    void this.fill(d);
  }

  private async fill(d: Difficulty) {
    if (this.filling.has(d.id)) return;
    this.filling.add(d.id);
    try {
      const buf = this.buffers.get(d.id) ?? [];
      while (buf.length < BUFFER_TARGET) {
        const board = await this.request({ type: 'noguess', difficultyId: d.id });
        if (board) buf.push(board);
        else break; // worker unavailable
      }
      this.buffers.set(d.id, buf);
    } finally {
      this.filling.delete(d.id);
    }
  }

  async getNoGuess(d: Difficulty): Promise<GeneratedBoard> {
    const buf = this.buffers.get(d.id) ?? [];
    const cached = buf.shift();
    this.buffers.set(d.id, buf);
    void this.fill(d); // refill in the background
    if (cached) return cached;
    const fromWorker = await this.request({ type: 'noguess', difficultyId: d.id });
    if (fromWorker) return fromWorker;
    // Main-thread fallback.
    return generateNoGuess(d) ?? generateNoGuess(d)!;
  }

  async getDaily(d: Difficulty, dateKey: string): Promise<GeneratedBoard> {
    const fromWorker = await this.request({ type: 'daily', difficultyId: d.id, dateKey });
    if (fromWorker) return fromWorker;
    return generateDaily(d, dateKey);
  }
}

export const boardSource = new BoardSource();
