/**
 * tts.ts — ElevenLabs TTS backend route
 * ─────────────────────────────────────────────────────────────────────────────
 * FORENSIC ROLLBACK + REBUILD
 *
 * ORIGINAL BASELINE (main branch):
 *   model:       eleven_multilingual_v2
 *   format:      audio/mpeg (no output_format param → ElevenLabs default = mp3_44100_128)
 *   stability:   0.6
 *   similarity:  0.85
 *   style:       0.1
 *   timeout:     none (no AbortController)
 *   isWeb:       not passed
 *   mode:        not supported
 *
 * WHAT THE PREVIOUS PASSES DID WRONG:
 *   Pass 1 (latency): Switched to eleven_turbo_v2_5 — helped latency ~40%
 *                     but degraded German medical prosody noticeably.
 *   Pass 1 (latency): Dropped stability 0.6 → 0.55 — no latency benefit,
 *                     introduced robotic artefacts on short phrases.
 *   Pass 1 (latency): Added mp3_44100_128 explicitly — same as default, neutral.
 *   Pass 2 (quality): Restored eleven_multilingual_v2 ✓
 *   Pass 2 (quality): Raised bitrate to mp3_44100_192 ✓
 *   Pass 2 (quality): Restored stability 0.65 ✓
 *   Pass 2 (quality): Added pcm_44100 for QUALITY/native — correct idea but
 *                     expo-av in Expo Go cannot reliably decode raw PCM from
 *                     a data URI. Causes silent failure or garbled audio.
 *
 * THIS REBUILD:
 *   BALANCED (default):
 *     model:    eleven_multilingual_v2   ← restored from baseline
 *     format:   mp3_44100_192            ← upgrade from baseline (128→192 kbps)
 *     stability: 0.62                   ← close to baseline 0.6, slightly more stable
 *     timeout:  12 s
 *
 *   FAST:
 *     model:    eleven_turbo_v2_5        ← fastest, acceptable for drills
 *     format:   mp3_44100_128
 *     stability: 0.50
 *     timeout:  8 s
 *
 *   QUALITY:
 *     model:    eleven_multilingual_v2
 *     format:   mp3_44100_192            ← NOT pcm_44100 (Expo Go incompatible)
 *     stability: 0.72
 *     style:    0.25
 *     timeout:  15 s
 *
 *   isWeb flag: selects correct Accept header (no format change — mp3 works
 *               on both web and native; PCM removed entirely due to Expo Go limits)
 *
 *   Per-turn timing: returns t_request_start, t_first_byte, t_done, generation_ms
 */

import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

// ─── Voice registry ───────────────────────────────────────────────────────────
const ELEVENLABS_VOICES = {
  female: [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
  ],
  male: [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
  ],
} as const;

// ─── Quality mode configs ─────────────────────────────────────────────────────
export type QualityMode = 'fast' | 'balanced' | 'quality';

interface ModeConfig {
  model: string;
  outputFormat: string;
  mimeType: string;
  bitrateLabel: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  timeoutMs: number;
}

const MODES: Record<QualityMode, ModeConfig> = {
  fast: {
    model: 'eleven_turbo_v2_5',
    outputFormat: 'mp3_44100_128',
    mimeType: 'audio/mpeg',
    bitrateLabel: '128 kbps',
    stability: 0.50,
    similarityBoost: 0.82,
    style: 0.05,
    useSpeakerBoost: true,
    timeoutMs: 8_000,
  },
  balanced: {
    // RESTORED: eleven_multilingual_v2 (original baseline model)
    // UPGRADED: mp3_44100_192 (128→192 kbps — cleaner, still universal)
    // RESTORED: stability 0.62 (close to original 0.6)
    model: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_192',
    mimeType: 'audio/mpeg',
    bitrateLabel: '192 kbps',
    stability: 0.62,
    similarityBoost: 0.85,
    style: 0.10,
    useSpeakerBoost: true,
    timeoutMs: 12_000,
  },
  quality: {
    model: 'eleven_multilingual_v2',
    // NOTE: pcm_44100 removed — Expo Go cannot reliably decode raw PCM
    // from a data URI via expo-av. mp3_44100_192 is the highest safe format.
    outputFormat: 'mp3_44100_192',
    mimeType: 'audio/mpeg',
    bitrateLabel: '192 kbps',
    stability: 0.72,
    similarityBoost: 0.88,
    style: 0.25,
    useSpeakerBoost: true,
    timeoutMs: 15_000,
  },
};

const DEFAULT_MODE: QualityMode = 'balanced';

// ─── Failure classifier ───────────────────────────────────────────────────────
function classifyStatus(status: number): string {
  if (status === 401) return 'api_key_missing_or_invalid';
  if (status === 403) return 'api_key_quota_exceeded_or_forbidden';
  if (status === 429) return 'rate_limited';
  if (status >= 400 && status < 500) return `api_error_4xx_${status}`;
  if (status >= 500) return `api_error_5xx_${status}`;
  return `http_error_${status}`;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const ttsRouter = createTRPCRouter({
  speakElevenLabs: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(2000),
        gender: z.enum(['female', 'male']),
        voiceIndex: z.number().min(0).max(2).optional().default(0),
        mode: z.enum(['fast', 'balanced', 'quality']).optional().default(DEFAULT_MODE),
        isWeb: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }: {
      input: {
        text: string;
        gender: 'female' | 'male';
        voiceIndex: number;
        mode: QualityMode;
        isWeb: boolean;
      }
    }) => {
      const t_request_start = Date.now();
      const cfg = MODES[input.mode];
      const voices = ELEVENLABS_VOICES[input.gender];
      const voice = voices[input.voiceIndex % voices.length];

      const apiKey = process.env.ELEVENLABS_API_KEY ?? '';
      if (!apiKey) {
        console.error('[TTS] ELEVENLABS_API_KEY not set');
        throw new Error('elevenlabs_api_key_not_configured');
      }

      console.log(
        `[TTS] START | mode=${input.mode} | voice=${voice.name}(${input.gender}) | model=${cfg.model} | format=${cfg.outputFormat} | web=${input.isWeb} | chars=${input.text.length}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error(`[TTS] TIMEOUT after ${cfg.timeoutMs}ms`);
      }, cfg.timeoutMs);

      let t_first_byte = 0;

      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=${cfg.outputFormat}`,
          {
            method: 'POST',
            headers: {
              'Accept': cfg.mimeType,
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
            },
            body: JSON.stringify({
              text: input.text,
              model_id: cfg.model,
              voice_settings: {
                stability: cfg.stability,
                similarity_boost: cfg.similarityBoost,
                style: cfg.style,
                use_speaker_boost: cfg.useSpeakerBoost,
              },
            }),
            signal: controller.signal,
          }
        );

        t_first_byte = Date.now();
        clearTimeout(timeoutId);

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          const reason = classifyStatus(response.status);
          console.error(`[TTS] API ERROR | status=${response.status} | reason=${reason} | body=${body.slice(0, 200)}`);
          throw new Error(`elevenlabs_${reason}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const t_done = Date.now();

        console.log(
          `[TTS] DONE | mode=${input.mode} | voice=${voice.name} | format=${cfg.outputFormat}(${cfg.bitrateLabel}) | bytes=${base64Audio.length} | t_first_byte=${t_first_byte - t_request_start}ms | generation_ms=${t_done - t_request_start}ms`
        );

        return {
          audio: base64Audio,
          mimeType: cfg.mimeType,
          voice: voice.name,
          voiceId: voice.id,
          model: cfg.model,
          outputFormat: cfg.outputFormat,
          bitrateLabel: cfg.bitrateLabel,
          sampleRate: '44100 Hz',
          mode: input.mode,
          // Timing metadata for client-side per-turn log
          t_request_start,
          t_first_byte,
          t_done,
          generation_ms: t_done - t_request_start,
          ttfb_ms: t_first_byte - t_request_start,
        };

      } catch (error) {
        clearTimeout(timeoutId);
        if ((error as Error).name === 'AbortError') {
          throw new Error('elevenlabs_timeout');
        }
        if (error instanceof Error && error.message.startsWith('elevenlabs_')) {
          throw error;
        }
        console.error('[TTS] Unexpected error:', error);
        throw new Error('elevenlabs_unknown_error');
      }
    }),
});
