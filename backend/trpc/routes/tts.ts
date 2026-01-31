import OpenAI from "openai";
import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const ttsRouter = createTRPCRouter({
  speak: publicProcedure
    .input(
      z.object({
        text: z.string(),
        voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]),
        speed: z.number().min(0.25).max(4.0).optional().default(1.0),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`[TTS] Generating speech with voice: ${input.voice}, text length: ${input.text.length}`);
        
        const response = await openai.audio.speech.create({
          model: "tts-1-hd",
          voice: input.voice,
          input: input.text,
          speed: input.speed,
        });

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        console.log(`[TTS] Generated audio, size: ${base64Audio.length} bytes`);

        return {
          audio: base64Audio,
          mimeType: "audio/mpeg",
        };
      } catch (error) {
        console.error("[TTS] Error generating speech:", error);
        throw new Error("Failed to generate speech");
      }
    }),
});
