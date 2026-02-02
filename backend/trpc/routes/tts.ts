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
};

export const ttsRouter = createTRPCRouter({
  speakElevenLabs: publicProcedure
    .input(
      z.object({
        text: z.string(),
        gender: z.enum(["female", "male"]),
        voiceIndex: z.number().min(0).max(2).optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      console.log('[ElevenLabs TTS] Starting TTS request');
      console.log('[ElevenLabs TTS] API key status:', apiKey ? `present (${apiKey.length} chars, starts with ${apiKey.substring(0, 4)})` : 'MISSING');
      
      if (!apiKey || apiKey.trim() === '') {
        console.error('[ElevenLabs TTS] ELEVENLABS_API_KEY is not configured or empty');
        throw new Error('ElevenLabs API key is not configured');
      }
      
      const voices = ELEVENLABS_VOICES[input.gender];
      const voice = voices[input.voiceIndex % voices.length];
      
      console.log(`[ElevenLabs TTS] Using voice: ${voice.name} (${voice.id}), gender: ${input.gender}`);
      console.log(`[ElevenLabs TTS] Text length: ${input.text.length} chars`);
      
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=mp3_44100_128`;
      
      const requestBody = {
        text: input.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      };
      
      console.log('[ElevenLabs TTS] Calling API:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey.trim(),
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[ElevenLabs TTS] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ElevenLabs TTS] API error response:', response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      console.log(`[ElevenLabs TTS] Success! Generated audio with ${voice.name}, size: ${base64Audio.length} bytes`);

      return {
        audio: base64Audio,
        mimeType: "audio/mpeg",
        voice: voice.name,
      };
    }),
});
