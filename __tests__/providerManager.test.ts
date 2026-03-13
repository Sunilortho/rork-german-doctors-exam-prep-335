/**
 * __tests__/providerManager.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for lib/voiceProvider/providerManager.ts
 *
 * Run with: npx jest __tests__/providerManager.test.ts
 *
 * These tests mock expo-av, expo-speech, and react-native Platform so they
 * can run in a Node environment without a device.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

jest.mock('expo-speech', () => ({
  stop: jest.fn(),
  speak: jest.fn((_text: string, opts: any) => {
    // Immediately call onDone to simulate instant speech
    if (opts?.onDone) opts.onDone();
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  speak,
  cancelActiveTurn,
  VoiceEvent,
  SpeakOptions,
} from '../lib/voiceProvider/providerManager';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeMockSound = () => {
  let statusCallback: ((s: any) => void) | null = null;
  const sound = {
    setOnPlaybackStatusUpdate: jest.fn((cb: any) => { statusCallback = cb; }),
    playAsync: jest.fn(async () => {
      // Simulate playback finishing
      if (statusCallback) statusCallback({ isLoaded: true, didJustFinish: true });
    }),
    stopAsync: jest.fn(),
    unloadAsync: jest.fn(),
  };
  return sound;
};

const makeElevenLabsCaller = (overrides?: Partial<{ audio: string; mimeType: string; voice: string }>) =>
  jest.fn(async () => ({
    audio: 'base64audiodata',
    mimeType: 'audio/mpeg',
    voice: 'Rachel',
    ...overrides,
  }));

const makeFailingCaller = (errorMsg = 'ElevenLabs API error: 500') =>
  jest.fn(async () => { throw new Error(errorMsg); });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('providerManager — provider selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module-level state by cancelling any active turn
    cancelActiveTurn();
  });

  test('uses ElevenLabs when caller succeeds', async () => {
    const mockSound = makeMockSound();
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({ sound: mockSound });

    const caller = makeElevenLabsCaller();
    const events: VoiceEvent[] = [];

    const result = await speak({
      text: 'Guten Tag',
      gender: 'female',
      elevenLabsCaller: caller,
      onEvent: (e) => events.push(e),
    });

    expect(result.provider).toBe('elevenlabs');
    expect(result.fallback).toBe(false);
    expect(caller).toHaveBeenCalledTimes(1);
    expect(Speech.speak).not.toHaveBeenCalled();

    const types = events.map(e => e.type);
    expect(types).toContain('tts_start');
    expect(types).toContain('tts_provider_selected');
    expect(types).toContain('tts_generation_complete');
    expect(types).toContain('tts_playback_start');
    expect(types).toContain('tts_playback_complete');
  });

  test('falls back to expo-speech on ElevenLabs 5xx error', async () => {
    const caller = makeFailingCaller('ElevenLabs API error: 500');
    const events: VoiceEvent[] = [];

    const result = await speak({
      text: 'Hallo',
      gender: 'male',
      elevenLabsCaller: caller,
      onEvent: (e) => events.push(e),
    });

    expect(result.provider).toBe('expo-speech');
    expect(result.fallback).toBe(true);
    expect(Speech.speak).toHaveBeenCalledTimes(1);

    const fallbackEvent = events.find(e => e.type === 'tts_fallback');
    expect(fallbackEvent).toBeDefined();
    expect(fallbackEvent?.fallbackReason).toBeDefined();
  });

  test('retries once on 5xx before falling back', async () => {
    const caller = makeFailingCaller('ElevenLabs API error: 503');
    const events: VoiceEvent[] = [];

    await speak({
      text: 'Test',
      gender: 'female',
      elevenLabsCaller: caller,
      onEvent: (e) => events.push(e),
    });

    // Should have been called twice (original + 1 retry)
    expect(caller).toHaveBeenCalledTimes(2);
  });

  test('does NOT retry on 4xx error', async () => {
    const caller = makeFailingCaller('ElevenLabs API error: 401');
    const events: VoiceEvent[] = [];

    await speak({
      text: 'Test',
      gender: 'female',
      elevenLabsCaller: caller,
      onEvent: (e) => events.push(e),
    });

    // Should have been called only once (no retry on 4xx)
    expect(caller).toHaveBeenCalledTimes(1);
  });
});

describe('providerManager — stale cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelActiveTurn();
  });

  test('cancels previous turn when a new speak() is called', async () => {
    const mockSound = makeMockSound();
    // First call: never finishes (simulates slow audio)
    let firstResolve: (() => void) | null = null;
    (Audio.Sound.createAsync as jest.Mock)
      .mockResolvedValueOnce({
        sound: {
          ...mockSound,
          playAsync: jest.fn(() => new Promise<void>(r => { firstResolve = r; })),
        },
      })
      .mockResolvedValue({ sound: makeMockSound() });

    const caller = makeElevenLabsCaller();
    const events: VoiceEvent[] = [];

    // Start first turn (don't await — it's intentionally slow)
    const turn1 = speak({ text: 'First', gender: 'female', elevenLabsCaller: caller, onEvent: (e) => events.push(e) });

    // Immediately start second turn
    const turn2 = speak({ text: 'Second', gender: 'female', elevenLabsCaller: caller, onEvent: (e) => events.push(e) });

    await Promise.all([turn1, turn2]);

    const staleEvents = events.filter(e => e.type === 'tts_stale_cancelled');
    expect(staleEvents.length).toBeGreaterThanOrEqual(1);
  });
});

describe('providerManager — duplicate prevention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelActiveTurn();
  });

  test('each speak() call generates exactly one turn ID', async () => {
    const mockSound = makeMockSound();
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({ sound: mockSound });

    const caller = makeElevenLabsCaller();
    const events: VoiceEvent[] = [];

    await speak({ text: 'Test', gender: 'female', elevenLabsCaller: caller, onEvent: (e) => events.push(e) });

    const startEvents = events.filter(e => e.type === 'tts_start');
    expect(startEvents).toHaveLength(1);

    const playbackEvents = events.filter(e => e.type === 'tts_playback_start');
    expect(playbackEvents).toHaveLength(1);
  });
});

describe('providerManager — fallback observability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelActiveTurn();
  });

  test('fallback event includes reason and error message', async () => {
    const caller = makeFailingCaller('network error: fetch failed');
    const events: VoiceEvent[] = [];

    await speak({ text: 'Test', gender: 'female', elevenLabsCaller: caller, onEvent: (e) => events.push(e) });

    const fallback = events.find(e => e.type === 'tts_fallback');
    expect(fallback).toBeDefined();
    expect(fallback?.fallbackReason).toBe('network_error');
    expect(fallback?.error).toBeTruthy();
  });

  test('no tts_fallback event when ElevenLabs succeeds', async () => {
    const mockSound = makeMockSound();
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({ sound: mockSound });

    const caller = makeElevenLabsCaller();
    const events: VoiceEvent[] = [];

    await speak({ text: 'Test', gender: 'female', elevenLabsCaller: caller, onEvent: (e) => events.push(e) });

    const fallback = events.find(e => e.type === 'tts_fallback');
    expect(fallback).toBeUndefined();
  });
});

describe('providerManager — interrupted turn handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelActiveTurn();
  });

  test('cancelActiveTurn stops expo-speech', async () => {
    const caller = makeFailingCaller('500');
    await speak({ text: 'Test', gender: 'female', elevenLabsCaller: caller, onEvent: () => {} });
    await cancelActiveTurn('user_interrupt');
    expect(Speech.stop).toHaveBeenCalled();
  });
});
