/**
 * tts.ts — ElevenLabs TTS backend route
 * ─────────────────────────────────────────────────────────────────────────────
 * Quality Recovery Pass — Three modes with a hard quality floor.
 *
 * QUALITY REGRESSION AUDIT (from previous latency pass):
 *  1. Model: eleven_multilingual_v2 → eleven_turbo_v2_5
 *     - Helped latency ~40%, but turbo is noticeably less natural on German
 *       medical speech (shorter prosody model, less expressive).
 *     - Decision: REVERT for BALANCED/QUALITY; keep for FAST only.
 *
 *  2. Voice stability: 0.6 → 0.55
 *     - Lower stability increases variation per token, causing robotic
 *       artefacts on short medical phrases.
 *     - Decision: RESTORE to 0.65 (BALANCED) / 0.72 (QUALITY).
 *
 *  3. Output format: unspecified → mp3_44100_128
 *     - 128 kbps is acceptable but ElevenLabs supports 192 kbps and PCM.
 *     - Decision: BALANCED = mp3_44100_192, QUALITY = pcm_44100 (native) /
 *       mp3_44100_192 (web — PCM not universally decodable in browsers).
 *
 * MODES
 *  FAST      — eleven_turbo_v2_5 + mp3_44100_128 + stability 0.50
 *              Best time-to-first-audio, acceptable quality for quick drills.
 *
 *  BALANCED  — eleven_multilingual_v2 + mp3_44100_192 + stability 0.65  ← DEFAULT
 *              Restores naturalness, keeps latency within conversational range.
 *
 *  QUALITY   — eleven_multilingual_v2 + pcm_44100 (native) / mp3_44100_192 (web)
 *              + stability 0.72 + style 0.20
 *              Best fidelity, slightly higher latency (~+0.5 s).
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

// ─── Quality mode definitions ─────────────────────────────────────────────────
export type QualityMode = 'fast' | 'balanced' | 'quality';

interface ModeConfig {
  model: string;
  outputFormatNative: string;
  outputFormatWeb: string;
  mimeTypeNative: string;
  mimeTypeWeb: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  timeoutMs: number;
  label: string;
}

const MODE_CONFIGS: Record<QualityMode, ModeConfig> = {
  fast: {
    model: 'eleven_turbo_v2_5',
    outputFormatNative: 'mp3_44100_128',
    outputFormatWeb: 'mp3_44100_128',
    mimeTypeNative: 'audio/mpeg',
    mimeTypeWeb: 'audio/mpeg',
    stability: 0.50,
    similarityBoost: 0.82,
    style: 0.05,
    useSpeakerBoost: true,
    timeoutMs: 8_000,
    label: 'FAST',
  },
  balanced: {
    // Reverted to eleven_multilingual_v2 for natural German prosody.
    // mp3_44100_192: 44.1 kHz / 192 kbps — significantly better than 128 kbps,
    // universally supported on web and native.
    model: 'eleven_multilingual_v2',
    outputFormatNative: 'mp3_44100_192',
    outputFormatWeb: 'mp3_44100_192',
    mimeTypeNative: 'audio/mpeg',
    mimeTypeWeb: 'audio/mpeg',
    stability: 0.65,
    similarityBoost: 0.85,
    style: 0.12,
    useSpeakerBoost: true,
    timeoutMs: 12_000,
    label: 'BALANCED',
  },
  quality: {
    // pcm_44100: lossless 16-bit PCM — zero transcoding loss on native.
    // Web falls back to mp3_44100_192 because PCM is not reliably decodable
    // in all browsers without a custom AudioContext pipeline.
    model: 'eleven_multilingual_v2',
    outputFormatNative: 'pcm_44100',
    outputFormatWeb: 'mp3_44100_192',
    mimeTypeNative: 'audio/wav',
    mimeTypeWeb: 'audio/mpeg',
    stability: 0.72,
    similarityBoost: 0.88,
    style: 0.20,
    useSpeakerBoost: true,
    timeoutMs: 15_000,
    label: 'QUALITY',
  },
};

// DEFAULT — BALANCED restores quality while keeping conversational latency.
const DEFAULT_MODE: QualityMode = 'balanced';

// ─── Failure reason classifier ────────────────────────────────────────────────
function classifyHttpStatus(status: number): string {
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
      const t0 = Date.now();
      const voices = ELEVENLABS_VOICES[input.gender];
      const voice = voices[input.voiceIndex % voices.length];
      const cfg = MODE_CONFIGS[input.mode];

      // Select format based on platform
      const outputFormat = input.isWeb ? cfg.outputFormatWeb : cfg.outputFormatNative;
      const mimeType = input.isWeb ? cfg.mimeTypeWeb : cfg.mimeTypeNative;

      const apiKey = process.env.ELEVENLABS_API_KEY ?? '';
      if (!apiKey) {
        console.error('[ElevenLabs TTS] ELEVENLABS_API_KEY is not set');
        throw new Error('elevenlabs_api_key_not_configured');
      }

      console.log(
        `[ElevenLabs TTS] Generating | mode: ${cfg.label} | voice: ${voice.name} (${input.gender}) | model: ${cfg.model} | format: ${outputFormat} | web: ${input.isWeb} | text_len: ${input.text.length}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error(`[ElevenLabs TTS] Request timed out after ${cfg.timeoutMs} ms`);
      }, cfg.timeoutMs);

      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=${outputFormat}`,
          {
            method: 'POST',
            headers: {
              'Accept': mimeType,
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

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          const reason = classifyHttpStatus(response.status);
          console.error(`[ElevenLabs TTS] API error | status: ${response.status} | reason: ${reason} | body: ${errorText.slice(0, 200)}`);
          throw new Error(`elevenlabs_${reason}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const generationMs = Date.now() - t0;

        const bitrateLabel = outputFormat.includes('192') ? '192 kbps'
          : outputFormat.includes('128') ? '128 kbps'
          : outputFormat.includes('pcm') ? 'PCM lossless'
          : 'unknown';

        console.log(
          `[ElevenLabs TTS] Done | mode: ${cfg.label} | voice: ${voice.name} | format: ${outputFormat} (${bitrateLabel}) | size: ${base64Audio.length} bytes | generation_ms: ${generationMs}`
        );

        return {
          audio: base64Audio,
          mimeType,
          voice: voice.name,
          voiceId: voice.id,
          model: cfg.model,
          outputFormat,
          bitrateLabel,
          sampleRate: '44100 Hz',
          mode: input.mode,
          generationMs,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        if ((error as Error).name === 'AbortError') {
          console.error('[ElevenLabs TTS] Request aborted (timeout)');
          throw new Error('elevenlabs_timeout');
        }

        if (error instanceof Error && error.message.startsWith('elevenlabs_')) {
          throw error;
        }

        console.error('[ElevenLabs TTS] Unexpected error:', error);
        throw new Error('elevenlabs_unknown_error');
      }
    }),
});
