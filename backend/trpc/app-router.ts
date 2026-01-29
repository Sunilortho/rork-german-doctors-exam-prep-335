import { createTRPCRouter } from "./create-context";
import { ttsRouter } from "./routes/tts";

export const appRouter = createTRPCRouter({
  tts: ttsRouter,
});

export type AppRouter = typeof appRouter;
