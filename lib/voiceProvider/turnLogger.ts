/**
 * turnLogger.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-turn structured timing log.
 *
 * Measures every stage of the voice pipeline:
 *   user_speech_end → STT start/end → LLM start/end → TTS request start
 *   → first byte → playback start → playback end
 *
 * In __DEV__ mode, prints a formatted table to the console after each turn.
 * In production, does nothing (zero cost).
 *
 * Usage:
 *   import { TurnLogger } from '@/lib/voiceProvider/turnLogger';
 *   const log = new TurnLogger();
 *   log.mark('user_speech_end');
 *   log.mark('stt_start');
 *   ...
 *   log.print(); // prints table and returns snapshot
 */

export type TurnMark =
  | 'user_speech_end'
  | 'stt_start'
  | 'stt_end'
  | 'llm_start'
  | 'llm_end'
  | 'tts_request_start'
  | 'tts_first_byte'
  | 'tts_done'
  | 'playback_start'
  | 'playback_end';

export interface TurnSnapshot {
  turnId: string;
  timestamps: Partial<Record<TurnMark, number>>;
  durations: {
    stt_ms: number | null;
    llm_ms: number | null;
    tts_generation_ms: number | null;
    tts_ttfb_ms: number | null;
    playback_ms: number | null;
    total_ms: number | null;
  };
  provider: string;
  model: string;
  voiceId: string;
  outputFormat: string;
  bitrateLabel: string;
  sampleRate: string;
  mode: string;
  fallback: boolean;
  fallbackReason: string | null;
}

export class TurnLogger {
  private turnId: string;
  private timestamps: Partial<Record<TurnMark, number>> = {};
  public provider = 'unknown';
  public model = 'unknown';
  public voiceId = 'unknown';
  public outputFormat = 'unknown';
  public bitrateLabel = 'unknown';
  public sampleRate = 'unknown';
  public mode = 'balanced';
  public fallback = false;
  public fallbackReason: string | null = null;

  constructor() {
    this.turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  mark(event: TurnMark): void {
    this.timestamps[event] = Date.now();
  }

  private delta(from: TurnMark, to: TurnMark): number | null {
    const a = this.timestamps[from];
    const b = this.timestamps[to];
    if (a === undefined || b === undefined) return null;
    return b - a;
  }

  snapshot(): TurnSnapshot {
    return {
      turnId: this.turnId,
      timestamps: { ...this.timestamps },
      durations: {
        stt_ms: this.delta('stt_start', 'stt_end'),
        llm_ms: this.delta('llm_start', 'llm_end'),
        tts_generation_ms: this.delta('tts_request_start', 'tts_done'),
        tts_ttfb_ms: this.delta('tts_request_start', 'tts_first_byte'),
        playback_ms: this.delta('playback_start', 'playback_end'),
        total_ms: this.delta('user_speech_end', 'playback_end'),
      },
      provider: this.provider,
      model: this.model,
      voiceId: this.voiceId,
      outputFormat: this.outputFormat,
      bitrateLabel: this.bitrateLabel,
      sampleRate: this.sampleRate,
      mode: this.mode,
      fallback: this.fallback,
      fallbackReason: this.fallbackReason,
    };
  }

  print(): TurnSnapshot {
    const snap = this.snapshot();
    if (!__DEV__) return snap;

    const d = snap.durations;
    const fmt = (v: number | null, unit = 'ms') =>
      v !== null ? `${v}${unit}` : '—';

    const total = d.total_ms;
    const totalLabel = total !== null
      ? total < 2000 ? `✅ ${total}ms`
        : total < 4000 ? `⚠️  ${total}ms`
        : `❌ ${total}ms`
      : '—';

    console.log(
      `\n╔══════════════════════════════════════════════════════╗\n` +
      `║  TURN LOG  ${snap.turnId.padEnd(42)}║\n` +
      `╠══════════════════════════════════════════════════════╣\n` +
      `║  Provider     : ${(snap.provider + ' / ' + snap.model).padEnd(35)}║\n` +
      `║  Voice        : ${snap.voiceId.padEnd(35)}║\n` +
      `║  Format       : ${(snap.outputFormat + ' ' + snap.bitrateLabel).padEnd(35)}║\n` +
      `║  Mode         : ${snap.mode.toUpperCase().padEnd(35)}║\n` +
      `║  Fallback     : ${(snap.fallback ? 'YES — ' + (snap.fallbackReason ?? '?') : 'no').padEnd(35)}║\n` +
      `╠══════════════════════════════════════════════════════╣\n` +
      `║  STT          : ${fmt(d.stt_ms).padEnd(35)}║\n` +
      `║  LLM          : ${fmt(d.llm_ms).padEnd(35)}║\n` +
      `║  TTS TTFB     : ${fmt(d.tts_ttfb_ms).padEnd(35)}║\n` +
      `║  TTS total    : ${fmt(d.tts_generation_ms).padEnd(35)}║\n` +
      `║  Playback     : ${fmt(d.playback_ms).padEnd(35)}║\n` +
      `║  ─────────────────────────────────────────────────  ║\n` +
      `║  TOTAL        : ${totalLabel.padEnd(35)}║\n` +
      `╚══════════════════════════════════════════════════════╝\n`
    );

    return snap;
  }
}
