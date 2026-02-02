import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const ELEVENLABS_CONFIG = {
  model_id: "eleven_multilingual_v2",
  output_format: "mp3_44100_128",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  },
} as const;

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

export const ttsRouter = createTRPCRouter({
  speakElevenLabs: publicProcedure
    .input(
      z.object({
        text: z.string().min(1).max(5000),
        gender: z.enum(["female", "male"]),
        voiceIndex: z.number().min(0).max(2).optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      console.log('[ElevenLabs TTS] Request received');
      console.log('[ElevenLabs TTS] Model:', ELEVENLABS_CONFIG.model_id);
      console.log('[ElevenLabs TTS] Format:', ELEVENLABS_CONFIG.output_format);
      console.log('[ElevenLabs TTS] API key status:', apiKey ? `configured (${apiKey.length} chars)` : 'MISSING');
      
      if (!apiKey || apiKey.trim() === '') {
        console.error('[ElevenLabs TTS] API key not configured');
        throw new Error('ELEVENLABS_API_KEY_NOT_CONFIGURED');
      }
      
      const trimmedKey = apiKey.trim();
      if (trimmedKey.length < 20) {
        console.error('[ElevenLabs TTS] API key appears invalid (too short)');
        throw new Error('ELEVENLABS_API_KEY_INVALID');
      }
      
      const voices = ELEVENLABS_VOICES[input.gender];
      const voice = voices[input.voiceIndex % voices.length];
      
      console.log(`[ElevenLabs TTS] Voice: ${voice.name} (${voice.id}), Gender: ${input.gender}`);
      console.log(`[ElevenLabs TTS] Text length: ${input.text.length} chars`);
      
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=${ELEVENLABS_CONFIG.output_format}`;
      
      const requestBody = {
        text: input.text,
        model_id: ELEVENLABS_CONFIG.model_id,
        voice_settings: ELEVENLABS_CONFIG.voice_settings,
      };
      
      console.log('[ElevenLabs TTS] Calling API...');
      
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': trimmedKey,
          },
          body: JSON.stringify(requestBody),
        });
      } catch (fetchError: any) {
        console.error('[ElevenLabs TTS] Network error:', fetchError?.message);
        throw new Error('ELEVENLABS_NETWORK_ERROR');
      }

      console.log('[ElevenLabs TTS] Response status:', response.status);
      const contentType = response.headers.get('content-type') || '';
      console.log('[ElevenLabs TTS] Content-Type:', contentType);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {
          errorText = 'Could not read error response';
        }
        
        console.error('[ElevenLabs TTS] API error:', response.status, errorText.substring(0, 500));
        
        if (response.status === 401) {
          throw new Error('ELEVENLABS_UNAUTHORIZED');
        }
        if (response.status === 403) {
          throw new Error('ELEVENLABS_FORBIDDEN');
        }
        if (response.status === 429) {
          throw new Error('ELEVENLABS_RATE_LIMITED');
        }
        if (response.status === 400) {
          throw new Error('ELEVENLABS_BAD_REQUEST');
        }
        
        if (errorText.includes('quota') || errorText.includes('limit') || errorText.includes('exceeded')) {
          throw new Error('ELEVENLABS_QUOTA_EXCEEDED');
        }
        
        if (errorText.startsWith('<') || errorText.includes('<!DOCTYPE')) {
          throw new Error('ELEVENLABS_HTML_RESPONSE');
        }
        
        throw new Error(`ELEVENLABS_ERROR_${response.status}`);
      }

      if (!contentType.includes('audio')) {
        let bodyText = '';
        try {
          bodyText = await response.text();
        } catch {
          bodyText = '';
        }
        console.error('[ElevenLabs TTS] Non-audio response:', contentType, bodyText.substring(0, 200));
        
        if (bodyText.startsWith('<') || bodyText.includes('<!DOCTYPE')) {
          throw new Error('ELEVENLABS_HTML_RESPONSE');
        }
        
        throw new Error('ELEVENLABS_INVALID_CONTENT_TYPE');
      }

      let arrayBuffer: ArrayBuffer;
      try {
        arrayBuffer = await response.arrayBuffer();
      } catch (bufferError: any) {
        console.error('[ElevenLabs TTS] Buffer error:', bufferError?.message);
        throw new Error('ELEVENLABS_BUFFER_ERROR');
      }
      
      if (arrayBuffer.byteLength < 1000) {
        console.error('[ElevenLabs TTS] Audio too small:', arrayBuffer.byteLength, 'bytes');
        throw new Error('ELEVENLABS_AUDIO_TOO_SMALL');
      }
      
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      console.log(`[ElevenLabs TTS] Success! Voice: ${voice.name}, Size: ${arrayBuffer.byteLength} bytes, Base64: ${base64Audio.length} chars`);

      return {
        audio: base64Audio,
        mimeType: "audio/mpeg",
        voice: voice.name,
        format: ELEVENLABS_CONFIG.output_format,
        model: ELEVENLABS_CONFIG.model_id,
      };
    }),
});
