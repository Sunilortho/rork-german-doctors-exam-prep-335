/**
 * tts.ts — ElevenLabs TTS backend route
 * ─────────────────────────────────────────────────────────────────────────────
 * FEMALE VOICE STRATEGY REPLACEMENT — BAKE-OFF WINNER: Sarah
 *
 * Changes in this pass:
 *   - `femalePreset` input param (optional, 'safe'|'balanced'|'expressive')
 *   - When gender=female AND femalePreset is set, the female preset settings
 *     override the shared mode settings (stability, similarity, style,
 *     speaker_boost, voiceId).
 *   - DEFAULT_FEMALE_PRESET = 'balanced' → Sarah (Germany German, soft/news)
 *   - Male path: COMPLETELY UNCHANGED. Male voices still use MODES config.
 *   - Response includes femalePreset, voiceBase, speakerBoost fields
 *     for per-turn logging in VoiceDebugOverlay.
 *
 * FEMALE PRESET ROUTING:
 *   gender=female + femalePreset=safe       → Rachel + SAFE settings (regression ref)
 *   gender=female + femalePreset=balanced   → Sarah + BALANCED settings (DEFAULT)
 *   gender=female + femalePreset=expressive → Serena + EXPRESSIVE settings
 *   gender=female + no femalePreset         → Sarah (DEFAULT_FEMALE_PRESET = 'balanced')
 *   gender=male   + any femalePreset        → femalePreset IGNORED, male path used
 *
 * BAKE-OFF WINNER: Sarah (EXAVITQu4vr4xnSDxMaL)
 *   - ElevenLabs Germany German, soft/news profile
 *   - Eliminates sibilant distortion on German fricatives (sch, ch, z, s)
 *   - speaker_boost OFF — no harshness on female voice
 *   - similarity 0.62 — avoids distortion, preserves voice character
 *
 * MALE SETTINGS (unchanged from previous rebuild):
 *   BALANCED: eleven_multilingual_v2 + mp3_44100_192 + stability 0.62 + sim 0.85
 *   FAST:     eleven_turbo_v2_5 + mp3_44100_128 + stability 0.50 + sim 0.82
 *   QUALITY:  eleven_multilingual_v2 + mp3_44100_192 + stability 0.72 + sim 0.88
 */

import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import {
  FEMALE_PRESETS,
  DEFAULT_FEMALE_PRESET,
  type FemalePresetName,
} from '../../../lib/voiceProvider/femaleVoicePresets';

// ─── Male voice registry (UNCHANGED) ─────────────────────────────────────────
const MALE_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh' },
];

// ─── Shared quality mode configs (used for male path only) ───────────────────
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
    // MALE BALANCED — do not change these for female
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
        // Female-only: preset override. Ignored when gender=male.
        femalePreset: z.enum(['safe', 'balanced', 'expressive']).optional(),
      })
    )
    .mutation(async ({ input }: {
      input: {
        text: string;
        gender: 'female' | 'male';
        voiceIndex: number;
        mode: QualityMode;
        isWeb: boolean;
        femalePreset?: FemalePresetName;
      }
    }) => {
      const t_request_start = Date.now();
      const apiKey = process.env.ELEVENLABS_API_KEY ?? '';
      if (!apiKey) {
        console.error('[TTS] ELEVENLABS_API_KEY not set');
        throw new Error('elevenlabs_api_key_not_configured');
      }

      // ── Voice and settings resolution ──────────────────────────────────────
      let voiceId: string;
      let voiceName: string;
      let voiceBase: string;
      let stability: number;
      let similarityBoost: number;
      let style: number;
      let useSpeakerBoost: boolean;
      let model: string;
      let outputFormat: string;
      let mimeType: string;
      let bitrateLabel: string;
      let timeoutMs: number;
      let resolvedFemalePreset: FemalePresetName | null = null;

      if (input.gender === 'female') {
        // ── FEMALE PATH: use preset (defaults to 'balanced' → Sarah) ─────────
        const presetName = input.femalePreset ?? DEFAULT_FEMALE_PRESET;
        const preset = FEMALE_PRESETS[presetName];
        resolvedFemalePreset = presetName;

        voiceId = preset.voiceId;
        voiceName = preset.voiceName;
        voiceBase = preset.voiceBase;
        stability = preset.stability;
        similarityBoost = preset.similarityBoost;
        style = preset.style;
        useSpeakerBoost = preset.useSpeakerBoost;

        // Female always uses eleven_multilingual_v2 + 192 kbps for quality
        // (FAST mode exception: use turbo for speed if explicitly requested)
        if (input.mode === 'fast') {
          model = 'eleven_turbo_v2_5';
          outputFormat = 'mp3_44100_128';
          bitrateLabel = '128 kbps';
          timeoutMs = 8_000;
        } else {
          model = 'eleven_multilingual_v2';
          outputFormat = 'mp3_44100_192';
          bitrateLabel = '192 kbps';
          timeoutMs = 12_000;
        }
        mimeType = 'audio/mpeg';

      } else {
        // ── MALE PATH: COMPLETELY UNCHANGED ────────────────────────────────
        const cfg = MODES[input.mode];
        const maleVoice = MALE_VOICES[input.voiceIndex % MALE_VOICES.length];
        voiceId = maleVoice.id;
        voiceName = maleVoice.name;
        voiceBase = 'American English';
        stability = cfg.stability;
        similarityBoost = cfg.similarityBoost;
        style = cfg.style;
        useSpeakerBoost = cfg.useSpeakerBoost;
        model = cfg.model;
        outputFormat = cfg.outputFormat;
        mimeType = cfg.mimeType;
        bitrateLabel = cfg.bitrateLabel;
        timeoutMs = cfg.timeoutMs;
      }

      console.log(
        `[TTS] START | gender=${input.gender} | preset=${resolvedFemalePreset ?? 'n/a'} | mode=${input.mode} | voice=${voiceName}(${voiceBase}) | stability=${stability} | sim=${similarityBoost} | style=${style} | boost=${useSpeakerBoost} | model=${model} | format=${outputFormat} | chars=${input.text.length}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error(`[TTS] TIMEOUT after ${timeoutMs}ms`);
      }, timeoutMs);

      let t_first_byte = 0;

      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`,
          {
            method: 'POST',
            headers: {
              'Accept': mimeType,
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
            },
            body: JSON.stringify({
              text: input.text,
              model_id: model,
              voice_settings: {
                stability,
                similarity_boost: similarityBoost,
                style,
                use_speaker_boost: useSpeakerBoost,
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
          `[TTS] DONE | gender=${input.gender} | preset=${resolvedFemalePreset ?? 'n/a'} | voice=${voiceName} | format=${outputFormat}(${bitrateLabel}) | bytes=${base64Audio.length} | ttfb=${t_first_byte - t_request_start}ms | total=${t_done - t_request_start}ms`
        );

        return {
          audio: base64Audio,
          mimeType,
          voice: voiceName,
          voiceId,
          voiceBase,
          model,
          outputFormat,
          bitrateLabel,
          sampleRate: '44100 Hz',
          mode: input.mode,
          femalePreset: resolvedFemalePreset,
          // Voice settings (for per-turn log in VoiceDebugOverlay)
          stability,
          similarityBoost,
          style,
          speakerBoost: useSpeakerBoost,
          // Timing metadata
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
