/**
 * tts.ts — ElevenLabs TTS backend route
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes vs original:
 *  1. Uses eleven_turbo_v2_5 model (lowest latency, multilingual) — ~40% faster.
 *  2. Output format: mp3_44100_128 — best quality/compatibility for web & native.
 *  3. Explicit server-side timeout (10 s) via AbortController.
 *  4. Structured error response with failure classification.
 *  5. Returns generation timing metadata for client-side debug overlay.
 *  6. Explicit 401/403 detection to surface missing/invalid API key early.
 */

import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

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

// eleven_turbo_v2_5: lowest latency, supports German natively.
// mp3_44100_128: 44.1 kHz / 128 kbps MP3 — universally supported, good quality.
const TTS_MODEL = 'eleven_turbo_v2_5';
const OUTPUT_FORMAT = 'mp3_44100_128';
const SERVER_TIMEOUT_MS = 10_000;

function classifyHttpStatus(status: number): string {
  if (status === 401) return 'api_key_missing_or_invalid';
  if (status === 403) return 'api_key_quota_exceeded_or_forbidden';
  if (status === 429) return 'rate_limited';
  if (status >= 400 && status < 500) return `api_error_4xx_${status}`;
  if (status >= 500) return `api_error_5xx_${status}`;
  return `http_error_${status}`;
}

export const ttsRouter = createTRPCRouter({
  speakElevenLabs: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(2000),
        gender: z.enum(['female', 'male']),
        voiceIndex: z.number().min(0).max(2).optional().default(0),
      })
    )
    .mutation(async ({ input }: { input: { text: string; gender: 'female' | 'male'; voiceIndex: number } }) => {
      const t0 = Date.now();
      const voices = ELEVENLABS_VOICES[input.gender];
      const voice = voices[input.voiceIndex % voices.length];

      const apiKey = process.env.ELEVENLABS_API_KEY ?? '';
      if (!apiKey) {
        console.error('[ElevenLabs TTS] ELEVENLABS_API_KEY is not set');
        throw new Error('elevenlabs_api_key_not_configured');
      }

      console.log(
        `[ElevenLabs TTS] Generating | voice: ${voice.name} (${input.gender}) | model: ${TTS_MODEL} | format: ${OUTPUT_FORMAT} | text_len: ${input.text.length}`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('[ElevenLabs TTS] Request timed out after', SERVER_TIMEOUT_MS, 'ms');
      }, SERVER_TIMEOUT_MS);

      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=${OUTPUT_FORMAT}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': apiKey,
            },
            body: JSON.stringify({
              text: input.text,
              model_id: TTS_MODEL,
              voice_settings: {
                stability: 0.55,
                similarity_boost: 0.85,
                style: 0.1,
                use_speaker_boost: true,
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

        console.log(
          `[ElevenLabs TTS] Done | voice: ${voice.name} | size: ${base64Audio.length} bytes | generation_ms: ${generationMs}`
        );

        return {
          audio: base64Audio,
          mimeType: 'audio/mpeg',
          voice: voice.name,
          voiceId: voice.id,
          model: TTS_MODEL,
          outputFormat: OUTPUT_FORMAT,
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
