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
    .mutation(async ({ input }: { input: { text: string; gender: 'female' | 'male'; voiceIndex: number } }) => {
      try {
        const voices = ELEVENLABS_VOICES[input.gender as keyof typeof ELEVENLABS_VOICES];
        const voice = voices[input.voiceIndex % voices.length];
        
        console.log(`[ElevenLabs TTS] Generating speech with voice: ${voice.name} (${input.gender}), text length: ${input.text.length}`);
        
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            },
            body: JSON.stringify({
              text: input.text,
              model_id: 'eleven_multilingual_v2',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ElevenLabs TTS] API error:', response.status, errorText);
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        console.log(`[ElevenLabs TTS] Generated audio with ${voice.name}, size: ${base64Audio.length} bytes`);

        return {
          audio: base64Audio,
          mimeType: "audio/mpeg",
          voice: voice.name,
        };
      } catch (error) {
        console.error("[ElevenLabs TTS] Error generating speech:", error);
        throw new Error("Failed to generate speech with ElevenLabs");
      }
    }),
});
