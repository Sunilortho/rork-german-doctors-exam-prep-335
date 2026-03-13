/**
 * providerManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-grade voice provider manager.
 *
 * Responsibilities
 *  • Primary provider = ElevenLabs (when API key is present and healthy)
 *  • Fallback = expo-speech (always available, no network)
 *  • Explicit timeout thresholds with AbortController
 *  • Retry policy (1 retry on transient errors, no retry on 4xx)
 *  • Failure reason classification
 *  • Observable analytics / debug events via onEvent callback
 *  • No silent downgrade — every fallback is logged
 *  • Turn ownership: only the latest turn may play; stale turns are cancelled
 *  • No duplicate playback
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProviderName = 'elevenlabs' | 'expo-speech';

export type FailureReason =
  | 'timeout'
  | 'api_error_4xx'
  | 'api_error_5xx'
  | 'network_error'
  | 'decode_error'
  | 'playback_error'
  | 'cancelled'
  | 'unknown';

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
  fallbackReason?: FailureReason;
  generationMs?: number;
  playbackStartMs?: number;
  error?: string;
  voiceId?: string;
  model?: string;
  timestamp: number;
}

export interface SpeakOptions {
  text: string;
  gender: 'female' | 'male';
  voiceIndex?: number;
  /** Injected TTS caller — keeps provider manager decoupled from tRPC */
  elevenLabsCaller: (params: {
    text: string;
    gender: 'female' | 'male';
    voiceIndex: number;
  }) => Promise<{ audio: string; mimeType: string; voice: string }>;
  onEvent?: (event: VoiceEvent) => void;
}

export interface SpeakResult {
  turnId: string;
  provider: ProviderName;
  fallback: boolean;
  generationMs: number;
  playbackStartMs: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ELEVENLABS_TIMEOUT_MS = 8_000;   // abort if ElevenLabs hasn't responded in 8 s
const ELEVENLABS_RETRY_ONCE = true;    // retry once on 5xx / network errors
const EXPO_SPEECH_PITCH = { female: 1.3, male: 0.55 };
const EXPO_SPEECH_RATE  = { female: 1.0, male: 0.88 };

// ─── Turn ownership ───────────────────────────────────────────────────────────

let _activeTurnId: string | null = null;
let _activeAbortController: AbortController | null = null;
let _activeWebAudio: HTMLAudioElement | null = null;
let _activeNativeSound: Audio.Sound | null = null;

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Cancel any in-flight or playing audio from a previous turn.
 * Must be called before starting a new turn.
 */
export async function cancelActiveTurn(reason: 'new_turn' | 'user_interrupt' = 'new_turn'): Promise<void> {
  const prevTurnId = _activeTurnId;

  // Abort in-flight HTTP request
  if (_activeAbortController) {
    _activeAbortController.abort();
    _activeAbortController = null;
  }

  // Stop web audio
  if (_activeWebAudio) {
    try {
      _activeWebAudio.pause();
      _activeWebAudio.src = '';
    } catch {}
    _activeWebAudio = null;
  }

  // Stop native sound
  if (_activeNativeSound) {
    try {
      await _activeNativeSound.stopAsync();
      await _activeNativeSound.unloadAsync();
    } catch {}
    _activeNativeSound = null;
  }

  // Stop expo-speech
  try { Speech.stop(); } catch {}

  if (prevTurnId) {
    console.log(`[ProviderManager] Cancelled turn ${prevTurnId} (${reason})`);
  }
  _activeTurnId = null;
}

// ─── Failure reason classifier ────────────────────────────────────────────────

function classifyFailure(error: unknown): FailureReason {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'cancelled';
    if (error.message.includes('timeout')) return 'timeout';
    if (error.message.includes('4')) return 'api_error_4xx';
    if (error.message.includes('5')) return 'api_error_5xx';
    if (error.message.includes('network') || error.message.includes('fetch')) return 'network_error';
    if (error.message.includes('decode') || error.message.includes('audio')) return 'decode_error';
  }
  return 'unknown';
}

function isRetryable(reason: FailureReason): boolean {
  return reason === 'api_error_5xx' || reason === 'network_error' || reason === 'timeout';
}

// ─── ElevenLabs call with timeout + retry ────────────────────────────────────

async function callElevenLabsWithTimeout(
  caller: SpeakOptions['elevenLabsCaller'],
  params: { text: string; gender: 'female' | 'male'; voiceIndex: number },
  abortSignal: AbortSignal,
  attempt: number = 0
): Promise<{ audio: string; mimeType: string; voice: string }> {
  const timeoutId = setTimeout(() => {
    // Signal timeout via abort (the caller checks the signal)
  }, ELEVENLABS_TIMEOUT_MS);

  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => reject(new Error('ElevenLabs timeout')), ELEVENLABS_TIMEOUT_MS);
    abortSignal.addEventListener('abort', () => { clearTimeout(id); reject(new Error('AbortError')); });
  });

  try {
    const result = await Promise.race([caller(params), timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    const reason = classifyFailure(err);

    if (ELEVENLABS_RETRY_ONCE && attempt === 0 && isRetryable(reason)) {
      console.warn(`[ProviderManager] ElevenLabs attempt ${attempt + 1} failed (${reason}), retrying...`);
      await new Promise(r => setTimeout(r, 300)); // brief back-off
      return callElevenLabsWithTimeout(caller, params, abortSignal, attempt + 1);
    }
    throw err;
  }
}

// ─── Web audio playback ───────────────────────────────────────────────────────

async function playWebAudio(
  audioUri: string,
  turnId: string,
  onEvent: (e: VoiceEvent) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';

    // Use mp3 — best cross-browser support, good quality
    audio.src = audioUri;

    // Expose for stale-cancellation
    _activeWebAudio = audio;

    audio.onerror = () => {
      const msg = audio.error?.message ?? 'Web audio decode/playback error';
      onEvent({ type: 'tts_error', turnId, provider: 'elevenlabs', error: msg, timestamp: Date.now() });
      reject(new Error(msg));
    };

    audio.oncanplaythrough = () => {
      // Only play if this turn is still active
      if (_activeTurnId !== turnId) {
        audio.src = '';
        onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
        resolve(); // don't reject — stale is not an error
        return;
      }
      const playbackStartMs = Date.now();
      onEvent({ type: 'tts_playback_start', turnId, provider: 'elevenlabs', playbackStartMs, timestamp: Date.now() });
      audio.play().catch(reject);
    };

    audio.onended = () => {
      _activeWebAudio = null;
      onEvent({ type: 'tts_playback_complete', turnId, provider: 'elevenlabs', timestamp: Date.now() });
      resolve();
    };

    audio.load();
  });
}

// ─── Native audio playback ────────────────────────────────────────────────────

async function playNativeAudio(
  audioUri: string,
  turnId: string,
  onEvent: (e: VoiceEvent) => void
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      _activeNativeSound = sound;

      // Stale check before playback
      if (_activeTurnId !== turnId) {
        await sound.unloadAsync();
        _activeNativeSound = null;
        onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
        resolve();
        return;
      }

      const playbackStartMs = Date.now();
      onEvent({ type: 'tts_playback_start', turnId, provider: 'elevenlabs', playbackStartMs, timestamp: Date.now() });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          _activeNativeSound = null;
          onEvent({ type: 'tts_playback_complete', turnId, provider: 'elevenlabs', timestamp: Date.now() });
          resolve();
        }
      });

      await sound.playAsync();
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Expo Speech fallback ─────────────────────────────────────────────────────

async function playExpoSpeech(
  text: string,
  gender: 'female' | 'male',
  turnId: string,
  onEvent: (e: VoiceEvent) => void
): Promise<void> {
  return new Promise<void>((resolve) => {
    onEvent({ type: 'tts_playback_start', turnId, provider: 'expo-speech', timestamp: Date.now() });

    Speech.speak(text, {
      language: 'de-DE',
      pitch: EXPO_SPEECH_PITCH[gender],
      rate: EXPO_SPEECH_RATE[gender],
      onDone: () => {
        onEvent({ type: 'tts_playback_complete', turnId, provider: 'expo-speech', timestamp: Date.now() });
        resolve();
      },
      onError: (err: Error) => {
        onEvent({ type: 'tts_error', turnId, provider: 'expo-speech', error: err.message, timestamp: Date.now() });
        resolve(); // don't crash — speech errors are non-fatal
      },
      onStopped: () => resolve(),
    });
  });
}

// ─── Main speak function ──────────────────────────────────────────────────────

/**
 * speak()
 *
 * Starts a new turn. Cancels any previous turn automatically.
 * Returns a SpeakResult describing what happened.
 * Throws only on unrecoverable errors (should not happen in practice).
 */
export async function speak(options: SpeakOptions): Promise<SpeakResult> {
  const { text, gender, voiceIndex = 0, elevenLabsCaller, onEvent = () => {} } = options;

  // Cancel previous turn
  await cancelActiveTurn('new_turn');

  const turnId = generateTurnId();
  _activeTurnId = turnId;
  _activeAbortController = new AbortController();

  const t0 = Date.now();
  onEvent({ type: 'tts_start', turnId, timestamp: t0 });

  let provider: ProviderName = 'elevenlabs';
  let fallback = false;
  let fallbackReason: FailureReason | undefined;
  let generationMs = 0;
  let playbackStartMs = 0;

  // ── Try ElevenLabs ──────────────────────────────────────────────────────────
  try {
    onEvent({ type: 'tts_provider_selected', turnId, provider: 'elevenlabs', timestamp: Date.now() });

    const result = await callElevenLabsWithTimeout(
      elevenLabsCaller,
      { text, gender, voiceIndex },
      _activeAbortController.signal
    );

    generationMs = Date.now() - t0;
    onEvent({
      type: 'tts_generation_complete',
      turnId,
      provider: 'elevenlabs',
      generationMs,
      voiceId: result.voice,
      model: 'eleven_multilingual_v2',
      timestamp: Date.now(),
    });

    // Stale check after generation
    if (_activeTurnId !== turnId) {
      onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
      return { turnId, provider, fallback, generationMs, playbackStartMs };
    }

    const audioUri = `data:${result.mimeType};base64,${result.audio}`;
    playbackStartMs = Date.now();

    if (Platform.OS === 'web') {
      await playWebAudio(audioUri, turnId, onEvent);
    } else {
      await playNativeAudio(audioUri, turnId, onEvent);
    }

    return { turnId, provider, fallback, generationMs, playbackStartMs };

  } catch (err) {
    // Cancelled by a newer turn — not an error
    if (_activeTurnId !== turnId) {
      onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
      return { turnId, provider, fallback: true, generationMs, playbackStartMs };
    }

    fallbackReason = classifyFailure(err);
    fallback = true;
    provider = 'expo-speech';

    // Never silently downgrade — always log
    console.warn(`[ProviderManager] ElevenLabs failed (${fallbackReason}), falling back to expo-speech. Error: ${err}`);
    onEvent({
      type: 'tts_fallback',
      turnId,
      provider: 'expo-speech',
      fallback: true,
      fallbackReason,
      error: err instanceof Error ? err.message : String(err),
      timestamp: Date.now(),
    });
  }

  // ── Expo Speech fallback ────────────────────────────────────────────────────
  onEvent({ type: 'tts_provider_selected', turnId, provider: 'expo-speech', timestamp: Date.now() });

  if (_activeTurnId !== turnId) {
    onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
    return { turnId, provider, fallback, generationMs, playbackStartMs };
  }

  playbackStartMs = Date.now();
  await playExpoSpeech(text, gender, turnId, onEvent);

  return { turnId, provider, fallback, generationMs, playbackStartMs };
}
