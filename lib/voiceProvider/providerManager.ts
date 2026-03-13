/**
 * providerManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Quality Recovery Pass — provider manager with mode support.
 *
 * Changes from previous latency pass:
 *  - Passes `mode` and `isWeb` to ElevenLabs caller so backend selects the
 *    correct model/format/bitrate per platform.
 *  - Web audio path: waits for `canplaythrough` before playing (prevents
 *    choppy playback caused by starting before buffer is ready).
 *  - expo-speech fallback: pitch/rate tuned per gender for more natural sound.
 *  - VoiceEvent extended with outputFormat, bitrateLabel, sampleRate, mode.
 *  - Default mode: 'balanced' (eleven_multilingual_v2 + mp3_44100_192).
 *
 * Turn ownership rules (unchanged):
 *  - Only the latest speak() call may play.
 *  - Every new speak() cancels the previous turn before starting.
 *  - cancelActiveTurn() stops all audio paths cleanly.
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProviderName = 'elevenlabs' | 'expo-speech';
export type QualityMode = 'fast' | 'balanced' | 'quality';

export type FailureReason =
  | 'timeout'
  | 'api_key_missing_or_invalid'
  | 'rate_limited'
  | 'api_error_4xx'
  | 'api_error_5xx'
  | 'network_error'
  | 'decode_error'
  | 'playback_error'
  | 'cancelled'
  | 'unknown_error';

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
  outputFormat?: string;
  bitrateLabel?: string;
  sampleRate?: string;
  mode?: QualityMode;
  timestamp: number;
}

export interface SpeakOptions {
  text: string;
  gender: 'female' | 'male';
  voiceIndex?: number;
  mode?: QualityMode;
  /** Injected TTS caller — keeps provider manager decoupled from tRPC */
  elevenLabsCaller: (params: {
    text: string;
    gender: 'female' | 'male';
    voiceIndex: number;
    mode: QualityMode;
    isWeb: boolean;
  }) => Promise<{
    audio: string;
    mimeType: string;
    voice: string;
    voiceId?: string;
    model?: string;
    outputFormat?: string;
    bitrateLabel?: string;
    sampleRate?: string;
    mode?: string;
    generationMs?: number;
  }>;
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

// Timeout per mode (client-side guard, server also has its own timeout)
const CLIENT_TIMEOUT_MS: Record<QualityMode, number> = {
  fast: 8_000,
  balanced: 12_000,
  quality: 15_000,
};

// expo-speech fallback — tuned for natural German medical speech
const EXPO_SPEECH_PITCH = { female: 1.15, male: 0.80 };
const EXPO_SPEECH_RATE  = { female: 0.95, male: 0.88 };

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
 */
export async function cancelActiveTurn(reason: 'new_turn' | 'user_interrupt' = 'new_turn'): Promise<void> {
  const prevTurnId = _activeTurnId;

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

  if (prevTurnId) {
    console.log(`[ProviderManager] Cancelled turn ${prevTurnId} (${reason})`);
  }
  _activeTurnId = null;
}

// ─── Failure reason classifier ────────────────────────────────────────────────

function classifyFailure(error: unknown): FailureReason {
  if (error instanceof Error) {
    const msg = error.message;
    if (error.name === 'AbortError') return 'cancelled';
    if (msg.includes('timeout')) return 'timeout';
    if (msg.includes('api_key') || msg.includes('401') || msg.includes('403')) return 'api_key_missing_or_invalid';
    if (msg.includes('429') || msg.includes('rate_limited')) return 'rate_limited';
    if (msg.includes('4xx') || msg.includes('400') || msg.includes('422')) return 'api_error_4xx';
    if (msg.includes('5xx') || msg.includes('500') || msg.includes('503')) return 'api_error_5xx';
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) return 'network_error';
    if (msg.includes('decode') || msg.includes('audio')) return 'decode_error';
  }
  return 'unknown_error';
}

function isRetryable(reason: FailureReason): boolean {
  return reason === 'api_error_5xx' || reason === 'network_error' || reason === 'timeout';
}

// ─── ElevenLabs call with timeout + retry ────────────────────────────────────

async function callElevenLabsWithTimeout(
  caller: SpeakOptions['elevenLabsCaller'],
  params: { text: string; gender: 'female' | 'male'; voiceIndex: number; mode: QualityMode; isWeb: boolean },
  abortSignal: AbortSignal,
  attempt: number = 0
): Promise<ReturnType<SpeakOptions['elevenLabsCaller']> extends Promise<infer T> ? T : never> {
  const timeoutMs = CLIENT_TIMEOUT_MS[params.mode];

  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => reject(new Error('ElevenLabs timeout')), timeoutMs);
    abortSignal.addEventListener('abort', () => { clearTimeout(id); reject(new Error('AbortError')); });
  });

  try {
    const result = await Promise.race([caller(params), timeoutPromise]);
    return result as any;
  } catch (err) {
    const reason = classifyFailure(err);

    if (attempt === 0 && isRetryable(reason)) {
      console.warn(`[ProviderManager] ElevenLabs attempt ${attempt + 1} failed (${reason}), retrying...`);
      await new Promise(r => setTimeout(r, 300));
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
    // Use window.Audio to avoid collision with expo-av Audio import
    const audio = new (window as any).Audio() as HTMLAudioElement;
    audio.preload = 'auto';
    _activeWebAudio = audio;

    audio.onerror = () => {
      const msg = audio.error?.message ?? 'Web audio decode/playback error';
      onEvent({ type: 'tts_error', turnId, provider: 'elevenlabs', error: msg, timestamp: Date.now() });
      reject(new Error(msg));
    };

    // Wait for canplaythrough — prevents choppy start on slow connections
    audio.oncanplaythrough = () => {
      if (_activeTurnId !== turnId) {
        audio.src = '';
        onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
        resolve();
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

    audio.src = audioUri;
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
        resolve();
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
 * Passes mode and isWeb to the ElevenLabs caller for quality-aware synthesis.
 */
export async function speak(options: SpeakOptions): Promise<SpeakResult> {
  const {
    text,
    gender,
    voiceIndex = 0,
    mode = 'balanced',
    elevenLabsCaller,
    onEvent = () => {},
  } = options;

  await cancelActiveTurn('new_turn');

  const turnId = generateTurnId();
  _activeTurnId = turnId;
  _activeAbortController = new AbortController();

  const t0 = Date.now();
  const isWeb = Platform.OS === 'web';

  onEvent({ type: 'tts_start', turnId, timestamp: t0 });

  let provider: ProviderName = 'elevenlabs';
  let fallback = false;
  let fallbackReason: FailureReason | undefined;
  let generationMs = 0;
  let playbackStartMs = 0;

  // ── Try ElevenLabs ────────────────────────────────────────────────────────
  try {
    onEvent({ type: 'tts_provider_selected', turnId, provider: 'elevenlabs', mode, timestamp: Date.now() });

    const result = await callElevenLabsWithTimeout(
      elevenLabsCaller,
      { text, gender, voiceIndex, mode, isWeb },
      _activeAbortController.signal
    );

    generationMs = result.generationMs ?? (Date.now() - t0);
    onEvent({
      type: 'tts_generation_complete',
      turnId,
      provider: 'elevenlabs',
      generationMs,
      voiceId: result.voiceId ?? result.voice,
      model: result.model,
      outputFormat: result.outputFormat,
      bitrateLabel: result.bitrateLabel,
      sampleRate: result.sampleRate,
      mode: (result.mode as QualityMode) ?? mode,
      timestamp: Date.now(),
    });

    if (_activeTurnId !== turnId) {
      onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
      return { turnId, provider, fallback, generationMs, playbackStartMs };
    }

    const audioUri = `data:${result.mimeType};base64,${result.audio}`;
    playbackStartMs = Date.now();

    if (isWeb) {
      await playWebAudio(audioUri, turnId, onEvent);
    } else {
      await playNativeAudio(audioUri, turnId, onEvent);
    }

    return { turnId, provider, fallback, generationMs, playbackStartMs };

  } catch (err) {
    if (_activeTurnId !== turnId) {
      onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
      return { turnId, provider, fallback: true, generationMs, playbackStartMs };
    }

    fallbackReason = classifyFailure(err);
    fallback = true;
    provider = 'expo-speech';

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

  // ── Expo Speech fallback ──────────────────────────────────────────────────
  onEvent({ type: 'tts_provider_selected', turnId, provider: 'expo-speech', timestamp: Date.now() });

  if (_activeTurnId !== turnId) {
    onEvent({ type: 'tts_stale_cancelled', turnId, timestamp: Date.now() });
    return { turnId, provider, fallback, generationMs, playbackStartMs };
  }

  playbackStartMs = Date.now();
  await playExpoSpeech(text, gender, turnId, onEvent);

  return { turnId, provider, fallback, generationMs, playbackStartMs };
}
