# Voice Pipeline — Manual QA Checklist

Use this checklist after every significant change to the voice pipeline.

---

## 1. Expo Go Latency

| Check | Expected | Pass? |
|---|---|---|
| Tap mic, speak, release — time to first patient audio | < 3 s on good WiFi | |
| Second turn after first completes | < 3 s | |
| Turn after ElevenLabs fallback (kill API key) | < 1 s (expo-speech) | |
| Debug overlay shows `Gen time` | Visible in `__DEV__` | |

---

## 2. Web Playback Quality

| Check | Expected | Pass? |
|---|---|---|
| Open in Chrome / Safari on desktop | Audio plays without distortion | |
| Check Network tab — audio format | `audio/mpeg` (mp3_44100_128) | |
| Debug overlay shows provider = `elevenlabs` | Yes | |
| Fallback to expo-speech on web when ElevenLabs fails | `expo-speech` in overlay | |
| No crackling / clipping | Clean playback | |

---

## 3. Fallback Visibility

| Check | Expected | Pass? |
|---|---|---|
| Remove ELEVENLABS_API_KEY env var, run session | Fallback event logged, expo-speech plays | |
| Debug overlay shows `Fallback: YES — api_key_missing_or_invalid` | Yes | |
| Console shows `[ProviderManager] ElevenLabs failed` | Yes | |
| No silent downgrade (no audio at all) | Never | |

---

## 4. Interrupted Speech Behavior

| Check | Expected | Pass? |
|---|---|---|
| Tap mic while patient is speaking | Patient audio stops immediately | |
| Start new session while audio plays | Audio stops, session resets | |
| Tap mic twice quickly | No duplicate recording starts | |
| Tap mic while AI is generating (isProcessing) | Mic disabled (button greyed out) | |

---

## 5. Repeated Tap / Replay / Restart

| Check | Expected | Pass? |
|---|---|---|
| Tap replay (Volume2 button) while audio plays | Previous audio stops, replay starts | |
| Tap reset (RefreshCw) mid-session | All audio stops, settings screen shown | |
| Tap mic rapidly 3 times | Only last recording processed | |
| Complete a full session, start new one | No audio bleed from previous session | |

---

## 6. Slow Network Behavior

| Check | Expected | Pass? |
|---|---|---|
| Throttle network to 3G in DevTools | ElevenLabs times out in ~8 s, fallback plays | |
| Throttle to Offline | Fallback to expo-speech, no crash | |
| Network recovers mid-session | Next turn uses ElevenLabs again | |

---

## 7. Platform Differences

| Feature | Expo Go | Custom Dev Build | Production Build |
|---|---|---|---|
| ElevenLabs TTS | ✓ | ✓ | ✓ |
| expo-speech fallback | ✓ | ✓ | ✓ |
| Web mic recording | ✗ (blocked by Alert) | ✗ | ✗ |
| Native mic recording | ✓ | ✓ | ✓ |
| Debug overlay | ✓ (`__DEV__`) | ✓ (`__DEV__`) | ✗ (hidden) |
| Audio interruption on mic tap | ✓ | ✓ | ✓ |
| Stale turn cancellation | ✓ | ✓ | ✓ |

---

## 8. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `ELEVENLABS_API_KEY` | Yes (for ElevenLabs) | Backend TTS API key |
| `EXPO_PUBLIC_RORK_API_BASE_URL` | Yes | tRPC backend base URL |

---

## Notes

- The debug overlay is **only visible in development** (`__DEV__ === true`). It is a no-op in production builds.
- ElevenLabs uses `eleven_turbo_v2_5` model (lowest latency) with `mp3_44100_128` output format.
- Fallback chain: ElevenLabs → expo-speech (1 retry on 5xx/network errors, no retry on 4xx).
- Turn ownership is enforced globally in `providerManager.ts` — only the latest `speak()` call may play.
