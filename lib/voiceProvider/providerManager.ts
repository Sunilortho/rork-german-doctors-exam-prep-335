/**
 * providerManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FORENSIC REBUILD — clean provider manager.
 *
 * WHAT WAS WRONG IN PREVIOUS PASSES:
 *   1. PCM format (pcm_44100): Added in quality pass. Expo Go cannot reliably
 *      decode raw PCM from a data URI via expo-av. Removed entirely.
 *   2. Web audio: Previous pass added canplaythrough wait — this is CORRECT
 *      and is kept. The original code called audio.play() immediately after
 *      audio.load() which caused choppy starts on slow connections.
 *   3. expo-speech pitch: Original was female=1.3/male=0.55 (too extreme,
 *      sounds robotic). Previous pass tuned to 1.15/0.80 — kept.
 *   4. Turn ownership: Previous pass introduced _cancelFn pattern that was
 *      inconsistent. Rebuilt with single _activeTurnId + explicit abort refs.
 *
 * ARCHITECTURE:
 *   - speak() always cancels previous turn before starting.
 *   - ElevenLabs is primary. expo-speech is fallback. Never silent downgrade.
 *   - TurnLogger is injected so voice-fsp.tsx owns the log lifecycle.
 *   - All timing marks set here: tts_request_start, tts_first_byte, tts_done,
 *     playback_start, playback_end.
 *
 * LATENCY ANALYSIS (from forensic audit):
 *   The dominant latency sources in order:
 *   1. LLM generation (~1–3 s) — cannot be eliminated, only parallelised
 *   2. TTS generation (~0.8–2 s for eleven_multilingual_v2)
 *   3. Audio decode + expo-av createAsync (~100–300 ms on native)
 *   4. STT round-trip (~300–800 ms via rork.com)
 *   5. Race conditions / stale turns (now fixed)
 *
 *   The biggest win available without changing providers:
 *   - Start TTS request as soon as LLM first token arrives (streaming LLM).
 *     This is NOT implemented here (requires LLM streaming support in the
 *     backend) but is documented as the primary remaining bottleneck.
 *   - Use shouldPlay:true in expo-av createAsync to start playback during
 *     decode (already done in original, kept here).
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { TurnLogger } from './turnLogger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProviderName = 'elevenlabs' | 'expo-speech';
export type QualityMode = 'fast' | 'balanced' | 'quality';

export type EventType =
  | 'tts_start'
  | 'tts_provider_selected'
  | 'tts_generation_complete'
  | 'tts_playback_start'
  | 'tts_playback_complete'
  | 'tts_fallback'
  | 'tts_error'
  | 'tts_cancelled'
  | 'tts_stale_cancelled';

export interface VoiceEvent {
  type: EventType;
  turnId: string;
  provider?: ProviderName;
  fallback?: boolean;
  fallbackReason?: string;
  generationMs?: number;
  ttfbMs?: number;
  playbackStartMs?: number;
  error?: string;
  voiceId?: string;
  model?: string;
  outputFormat?: string;
  bitrateLabel?: string;
  sampleRate?: string;
  mode?: QualityMode;
  timestamp: number;
}

export interface TTSResult {
  audio: string;
  mimeType: string;
  voice: string;
  voiceId?: string;
  model?: string;
  outputFormat?: string;
  bitrateLabel?: string;
  sampleRate?: string;
  mode?: string;
  generation_ms?: number;
  ttfb_ms?: number;
  t_request_start?: number;
  t_first_byte?: number;
  t_done?: number;
}

export interface SpeakOptions {
  text: string;
  gender: 'female' | 'male';
  voiceIndex?: number;
  mode?: QualityMode;
  turnLogger?: TurnLogger;
  elevenLabsCaller: (params: {
    text: string;
    gender: 'female' | 'male';
    voiceIndex: number;
    mode: QualityMode;
    isWeb: boolean;
  }) => Promise<TTSResult>;
  onEvent?: (event: VoiceEvent) => void;
}

export interface SpeakResult {
  turnId: string;
  provider: ProviderName;
  fallback: boolean;
}

// ─── Turn ownership ───────────────────────────────────────────────────────────

let _activeTurnId: string | null = null;
let _activeAbortController: AbortController | null = null;
let _activeWebAudio: HTMLAudioElement | null = null;
let _activeNativeSound: Audio.Sound | null = null;

function makeTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function cancelActiveTurn(reason = 'cancelled'): Promise<void> {
  const prev = _activeTurnId;
  _activeTurnId = null;

  if (_activeAbortController) {
    _activeAbortController.abort();
    _activeAbortController = null;
  }
  if (_activeWebAudio) {
    try { _activeWebAudio.pause(); _activeWebAudio.src = ''; } catch {}
    _activeWebAudio = null;
  }
  if (_activeNativeSound) {
    try {
      await _activeNativeSound.stopAsync();
      await _activeNativeSound.unloadAsync();
    } catch {}
    _activeNativeSound = null;
  }
  try { Speech.stop(); } catch {}

  if (prev) console.log(`[ProviderManager] Cancelled turn ${prev} (${reason})`);
}

// ─── Failure classifier ───────────────────────────────────────────────────────

function classifyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (err instanceof Error && err.name === 'AbortError') return 'cancelled';
  if (msg.includes('timeout')) return 'timeout';
  if (msg.includes('api_key') || msg.includes('401') || msg.includes('403')) return 'api_key_error';
  if (msg.includes('429') || msg.includes('rate_limited')) return 'rate_limited';
  if (msg.includes('5xx') || msg.includes('500') || msg.includes('503')) return 'api_error_5xx';
  if (msg.includes('4xx') || msg.includes('400') || msg.includes('422')) return 'api_error_4xx';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) return 'network_error';
  if (msg.includes('decode') || msg.includes('audio')) return 'decode_error';
  return 'unknown_error';
}

function isRetryable(reason: string): boolean {
  return reason === 'api_error_5xx' || reason === 'network_error' || reason === 'timeout';
}

// ─── Web audio playback ───────────────────────────────────────────────────────

async function playWebAudio(
  audioUri: string,
  turnId: string,
  logger: TurnLogger | undefined,
  onEvent: (e: VoiceEvent) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Use window.Audio to avoid collision with expo-av Audio import
    const audio = new (window as any).Audio() as HTMLAudioElement;
    audio.preload = 'auto';
    _activeWebAudio = audio;

    audio.onerror = () => {
      const msg = audio.error?.message ?? 'web audio error';
      onEvent({ type: 'tts_error', turnId, provider: 'elevenlabs', error: msg, timestamp: Date.now() });
      reject(new Error(msg));
    };

    // Wait for canplaythrough before playing — prevents choppy start
    // (original code called play() immediately after load() which was wrong)
    audio.oncanplaythrough = () => {
      if (_activeTurnId !== turnId) {
        audio.src = '';
        onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
        resolve();
        return;
      }
      const now = Date.now();
      logger?.mark('playback_start');
      onEvent({ type: 'tts_playback_start', turnId, provider: 'elevenlabs', playbackStartMs: now, timestamp: now });
      audio.play().catch(reject);
    };

    audio.onended = () => {
      logger?.mark('playback_end');
      _activeWebAudio = null;
      onEvent({ type: 'tts_playback_complete', turnId, provider: 'elevenlabs', timestamp: Date.now() });
      resolve();
    };

    audio.src = audioUri;
    audio.load();
  });
}

// ─── Native audio playback ────────────────────────────────────────────────────

async function playNativeAudio(
  audioUri: string,
  turnId: string,
  logger: TurnLogger | undefined,
  onEvent: (e: VoiceEvent) => void
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      // shouldPlay:true starts playback during decode — reduces latency vs
      // createAsync + playAsync separately
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      _activeNativeSound = sound;

      if (_activeTurnId !== turnId) {
        await sound.unloadAsync();
        _activeNativeSound = null;
        onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
        resolve();
        return;
      }

      const now = Date.now();
      logger?.mark('playback_start');
      onEvent({ type: 'tts_playback_start', turnId, provider: 'elevenlabs', playbackStartMs: now, timestamp: now });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          logger?.mark('playback_end');
          sound.unloadAsync();
          _activeNativeSound = null;
          onEvent({ type: 'tts_playback_complete', turnId, provider: 'elevenlabs', timestamp: Date.now() });
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// ─── expo-speech fallback ─────────────────────────────────────────────────────

async function playExpoSpeech(
  text: string,
  gender: 'female' | 'male',
  turnId: string,
  logger: TurnLogger | undefined,
  onEvent: (e: VoiceEvent) => void
): Promise<void> {
  return new Promise<void>((resolve) => {
    // Tuned pitch/rate: original (1.3/0.55) was too extreme → robotic
    // New values (1.15/0.80) sound more natural for German medical speech
    const pitch = gender === 'female' ? 1.15 : 0.80;
    const rate  = gender === 'female' ? 0.95 : 0.88;

    const now = Date.now();
    logger?.mark('playback_start');
    onEvent({ type: 'tts_playback_start', turnId, provider: 'expo-speech', playbackStartMs: now, timestamp: now });

    Speech.speak(text, {
      language: 'de-DE',
      pitch,
      rate,
      onDone: () => {
        logger?.mark('playback_end');
        onEvent({ type: 'tts_playback_complete', turnId, provider: 'expo-speech', timestamp: Date.now() });
        resolve();
      },
      onError: (err: Error) => {
        onEvent({ type: 'tts_error', turnId, provider: 'expo-speech', error: err.message, timestamp: Date.now() });
        resolve();
      },
      onStopped: () => resolve(),
    });
  });
}

// ─── Main speak function ──────────────────────────────────────────────────────

export async function speak(options: SpeakOptions): Promise<SpeakResult> {
  const {
    text,
    gender,
    voiceIndex = 0,
    mode = 'balanced',
    turnLogger,
    elevenLabsCaller,
    onEvent = () => {},
  } = options;

  // Cancel any previous turn
  await cancelActiveTurn('new_turn');

  const turnId = makeTurnId();
  _activeTurnId = turnId;
  _activeAbortController = new AbortController();
  const isWeb = Platform.OS === 'web';

  onEvent({ type: 'tts_start', turnId, mode, timestamp: Date.now() });

  // ── Try ElevenLabs ──────────────────────────────────────────────────────────
  let attempt = 0;
  const MAX_ATTEMPTS = 2;

  while (attempt < MAX_ATTEMPTS) {
    if (_activeTurnId !== turnId) {
      onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
      return { turnId, provider: 'elevenlabs', fallback: false };
    }

    try {
      onEvent({ type: 'tts_provider_selected', turnId, provider: 'elevenlabs', mode, timestamp: Date.now() });
      turnLogger?.mark('tts_request_start');

      const result = await elevenLabsCaller({ text, gender, voiceIndex, mode, isWeb });

      // Use server-side timing if available, otherwise measure client-side
      if (result.t_first_byte) turnLogger?.mark('tts_first_byte');
      turnLogger?.mark('tts_done');

      if (_activeTurnId !== turnId) {
        onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
        return { turnId, provider: 'elevenlabs', fallback: false };
      }

      const genMs = result.generation_ms ?? 0;
      const ttfbMs = result.ttfb_ms ?? 0;

      // Update logger metadata
      if (turnLogger) {
        turnLogger.provider = 'elevenlabs';
        turnLogger.model = result.model ?? 'unknown';
        turnLogger.voiceId = result.voiceId ?? result.voice;
        turnLogger.outputFormat = result.outputFormat ?? 'unknown';
        turnLogger.bitrateLabel = result.bitrateLabel ?? 'unknown';
        turnLogger.sampleRate = result.sampleRate ?? 'unknown';
        turnLogger.mode = result.mode ?? mode;
        turnLogger.fallback = false;
      }

      onEvent({
        type: 'tts_generation_complete',
        turnId,
        provider: 'elevenlabs',
        model: result.model,
        voiceId: result.voiceId ?? result.voice,
        outputFormat: result.outputFormat,
        bitrateLabel: result.bitrateLabel,
        sampleRate: result.sampleRate,
        mode: (result.mode as QualityMode) ?? mode,
        generationMs: genMs,
        ttfbMs,
        timestamp: Date.now(),
      });

      const audioUri = `data:${result.mimeType};base64,${result.audio}`;

      if (isWeb) {
        await playWebAudio(audioUri, turnId, turnLogger, onEvent);
      } else {
        await playNativeAudio(audioUri, turnId, turnLogger, onEvent);
      }

      if (_activeTurnId === turnId) {
        _activeTurnId = null;
        _activeAbortController = null;
      }

      return { turnId, provider: 'elevenlabs', fallback: false };

    } catch (err) {
      const reason = classifyError(err);
      attempt++;

      if (_activeTurnId !== turnId) {
        onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
        return { turnId, provider: 'elevenlabs', fallback: false };
      }

      if (attempt < MAX_ATTEMPTS && isRetryable(reason)) {
        console.warn(`[ProviderManager] ElevenLabs attempt ${attempt} failed (${reason}), retrying...`);
        await new Promise(r => setTimeout(r, 400));
        continue;
      }

      console.warn(`[ProviderManager] ElevenLabs failed after ${attempt} attempt(s) | reason: ${reason} | err:`, err);
      onEvent({
        type: 'tts_fallback',
        turnId,
        provider: 'expo-speech',
        fallback: true,
        fallbackReason: reason,
        error: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      });

      if (turnLogger) {
        turnLogger.fallback = true;
        turnLogger.fallbackReason = reason;
      }
      break;
    }
  }

  // ── expo-speech fallback ────────────────────────────────────────────────────
  if (_activeTurnId !== turnId) {
    onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
    return { turnId, provider: 'expo-speech', fallback: true };
  }

  if (turnLogger) {
    turnLogger.provider = 'expo-speech';
    turnLogger.model = 'expo-speech';
  }

  onEvent({ type: 'tts_provider_selected', turnId, provider: 'expo-speech', timestamp: Date.now() });
  await playExpoSpeech(text, gender, turnId, turnLogger, onEvent);

  if (_activeTurnId === turnId) {
    _activeTurnId = null;
    _activeAbortController = null;
  }

  return { turnId, provider: 'expo-speech', fallback: true };
}
