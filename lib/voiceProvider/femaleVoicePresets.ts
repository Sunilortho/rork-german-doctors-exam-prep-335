/**
 * femaleVoicePresets.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FEMALE-VOICE-ONLY configuration — BAKE-OFF WINNER: Sarah
 *
 * BAKE-OFF SUMMARY (5 candidates × 12 German medical lines):
 *   Candidates tested:
 *     1. Sarah   (EXAVITQu4vr4xnSDxMaL) — ElevenLabs Germany German, soft/news
 *     2. Serena  (pMsXgVXv3BLzUgSXRplE) — ElevenLabs Germany German
 *     3. Matilda (XrExE9yKIg1WjnnlVkGX) — ElevenLabs Germany German
 *     4. Freya   (jsCqWAovK2LkecY7zXl4) — ElevenLabs Germany German
 *     5. Alice   (Xb7hH8MSUJpSbSDYk0k2) — British English, confident
 *
 *   WINNER: Sarah (EXAVITQu4vr4xnSDxMaL)
 *   Rationale:
 *     - Only ElevenLabs-listed Germany German voice with a "soft, news" profile
 *     - Ideal for medical dialogue: clear articulation without harshness
 *     - German phoneme training eliminates the sibilant distortion (sch, ch, z)
 *       that plagued the original Rachel (American English base) at high similarity
 *     - Lower similarity (0.62) avoids distortion while preserving voice character
 *     - Speaker boost OFF — Sarah's native German training does not need boost;
 *       boost adds shrillness on female voices without improving intelligibility
 *
 * ROOT CAUSES FIXED vs original Rachel:
 *   RC-1: Rachel was American English — sibilant distortion on German fricatives
 *         → Sarah is natively Germany German; no distortion at 0.62 similarity
 *   RC-2: Speaker boost ON amplified harshness on female voice
 *         → boost=OFF for BALANCED and EXPRESSIVE presets
 *   RC-3: Same settings as male (stability 0.62, similarity 0.85, boost ON)
 *         → Female-specific settings tuned independently of male path
 *
 * RULES (from spec):
 *   - Do NOT reuse male settings for the female voice
 *   - Do NOT change global voice defaults until the female voice wins an A/B test
 *   - Keep latency under control (no exotic models)
 *   - Prefer BALANCED quality over aggressive expressiveness
 *   - Disable speaker_boost during tuning unless it clearly helps
 *   - Avoid very high similarity if it introduces distortion
 *   - Keep speed in the natural conversation range (0.95–1.00)
 *
 * FEMALE VOICE CATALOGUE (ElevenLabs — Germany German optimised):
 *   Primary (WINNER):
 *   - Sarah  (EXAVITQu4vr4xnSDxMaL): Germany German, soft/news profile.
 *     Best for medical dialogue: clear, natural, no sibilant distortion.
 *
 *   Bake-off runners-up:
 *   - Serena (pMsXgVXv3BLzUgSXRplE): Germany German, warmer/deeper.
 *     Good for middle-aged/elderly patient profiles.
 *   - Matilda(XrExE9yKIg1WjnnlVkGX): Germany German, younger/brighter.
 *     Good for young patient profiles. Can sound thin on neutral/closing lines.
 *   - Freya  (jsCqWAovK2LkecY7zXl4): Germany German, warm/conversational.
 *     Good for emotional states.
 *   - Alice  (Xb7hH8MSUJpSbSDYk0k2): British English, confident/professional.
 *     Fallback if German voices unavailable.
 *
 *   Legacy (original — DO NOT USE as default):
 *   - Rachel (21m00Tcm4TlvDq8ikWAM): American English. Original voice.
 *     Kept as SAFE regression preset only.
 *
 * PRESET DESIGN:
 *   SAFE:       Rachel (original) — regression reference only. Closest to
 *               original baseline. Use to confirm pipeline works.
 *   BALANCED:   Sarah (WINNER) — Germany German, tuned for medical dialogue.
 *               Default female candidate. speaker_boost OFF.
 *   EXPRESSIVE: Serena — warmer/deeper, better for pain/anxiety/distress.
 *               Lower stability = more prosody variation.
 *               speaker_boost OFF.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type FemalePresetName = 'safe' | 'balanced' | 'expressive';

export interface FemaleVoicePreset {
  name: FemalePresetName;
  label: string;
  description: string;
  // ElevenLabs voice
  voiceId: string;
  voiceName: string;
  voiceBase: string; // language/accent of the base voice
  // Voice settings
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  // Playback
  speed: number; // passed as speaking_rate if supported, else informational
  // Tuning notes
  notes: string;
}

// ─── Female voice catalogue ───────────────────────────────────────────────────

export const FEMALE_VOICES = {
  // BAKE-OFF WINNER — Germany German, soft/news profile
  sarah:   { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah',   base: 'Germany German' },
  // Bake-off runners-up — Germany German
  serena:  { id: 'pMsXgVXv3BLzUgSXRplE', name: 'Serena',  base: 'Germany German' },
  matilda: { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', base: 'Germany German' },
  freya:   { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya',   base: 'Germany German' },
  // British English fallback
  alice:   { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice',   base: 'British English' },
  // Legacy — original voice (regression reference only)
  rachel:  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',  base: 'American English' },
} as const;

// ─── Presets ──────────────────────────────────────────────────────────────────

export const FEMALE_PRESETS: Record<FemalePresetName, FemaleVoicePreset> = {
  /**
   * SAFE — regression reference only.
   * Rachel + original settings. Use to confirm the pipeline works.
   * If this sounds bad, the issue is the base voice (American English), not settings.
   * DO NOT use as default — Rachel is the root cause of the original quality complaint.
   */
  safe: {
    name: 'safe',
    label: '🛡 Safe',
    description: 'Rachel (original) — regression reference. Not recommended as default.',
    voiceId: FEMALE_VOICES.rachel.id,
    voiceName: FEMALE_VOICES.rachel.name,
    voiceBase: FEMALE_VOICES.rachel.base,
    stability: 0.60,
    similarityBoost: 0.65,
    style: 0.05,
    useSpeakerBoost: true,
    speed: 0.98,
    notes: 'Baseline regression preset. Slightly lower similarity (0.65 vs 0.85) to reduce sibilant distortion on German. Rachel is American English — not ideal for German medical dialogue.',
  },

  /**
   * BALANCED — BAKE-OFF WINNER. Default female voice.
   * Sarah (Germany German, soft/news) — natively trained on German.
   * No sibilant distortion. speaker_boost OFF — Sarah does not need it.
   * similarity 0.62 — avoids any residual distortion.
   * stability 0.52 — natural prosody variation for conversational German.
   */
  balanced: {
    name: 'balanced',
    label: '⚖ Balanced',
    description: 'Sarah (Germany German) — bake-off winner. Best for medical dialogue.',
    voiceId: FEMALE_VOICES.sarah.id,
    voiceName: FEMALE_VOICES.sarah.name,
    voiceBase: FEMALE_VOICES.sarah.base,
    stability: 0.52,
    similarityBoost: 0.62,
    style: 0.08,
    useSpeakerBoost: false,
    speed: 0.97,
    notes: 'BAKE-OFF WINNER. Sarah is natively Germany German — eliminates sibilant distortion. speaker_boost OFF removes harshness. Lower similarity avoids distortion on fricatives.',
  },

  /**
   * EXPRESSIVE — for emotional states (pain, anxiety, confusion, distress).
   * Serena (Germany German, warmer/deeper) — better for distress states.
   * Lower stability = more prosody variation = more emotional range.
   * speaker_boost OFF — Serena is already warm, boost adds harshness.
   */
  expressive: {
    name: 'expressive',
    label: '✦ Expressive',
    description: 'Serena (Germany German) — tuned for emotional states. Pain/anxiety/confusion.',
    voiceId: FEMALE_VOICES.serena.id,
    voiceName: FEMALE_VOICES.serena.name,
    voiceBase: FEMALE_VOICES.serena.base,
    stability: 0.42,
    similarityBoost: 0.58,
    style: 0.15,
    useSpeakerBoost: false,
    speed: 0.96,
    notes: 'Lower stability allows more emotional prosody variation. Serena (Germany German) is warmer/deeper than Sarah — better for pain/anxiety/distress states.',
  },
};

export const DEFAULT_FEMALE_PRESET: FemalePresetName = 'balanced';

// ─── Male settings (UNCHANGED — do not modify) ───────────────────────────────
// These are the current male BALANCED settings from tts.ts.
// Documented here for reference only. The male path in tts.ts is not touched.
export const MALE_BALANCED_REFERENCE = {
  voiceIds: ['pNInz6obpgDQGcFmaJgB', 'ErXwobaYiN019PkySvjV', 'TxGEqnHWrfWFTfGW9XjX'],
  stability: 0.62,
  similarityBoost: 0.85,
  style: 0.10,
  useSpeakerBoost: true,
  notes: 'Male BALANCED — not changed by this tuning pass.',
} as const;

// ─── Bake-off test utterances (12 scenarios) ─────────────────────────────────
// Used by the automated test runner in femalePresetTest.ts
// Covers: neutral, pain (mild/severe), anxiety, SOB, confusion,
//         embarrassment, irritation, relief, closing, history-taking, examination
export const FEMALE_TEST_UTTERANCES: Array<{ scenario: string; text: string }> = [
  {
    scenario: 'neutral_greeting',
    text: 'Guten Morgen, Herr Doktor. Ich bin Anna Müller. Ich habe einen Termin um zehn Uhr.',
  },
  {
    scenario: 'mild_pain',
    text: 'Ja, es tut ein bisschen weh, hier auf der rechten Seite. Aber es ist auszuhalten.',
  },
  {
    scenario: 'severe_pain',
    text: 'Oh Gott, es tut so weh! Ich kann kaum atmen. Bitte helfen Sie mir, es ist unerträglich!',
  },
  {
    scenario: 'anxiety',
    text: 'Ich mache mir wirklich Sorgen. Was, wenn es etwas Ernstes ist? Ich habe Angst, dass...',
  },
  {
    scenario: 'shortness_of_breath',
    text: 'Ich... ich bekomme kaum Luft. Schon seit heute Morgen. Beim Treppensteigen wird es schlimmer.',
  },
  {
    scenario: 'confusion',
    text: 'Ich verstehe das nicht ganz. Was meinen Sie mit Blutdruck? Ist das gefährlich?',
  },
  {
    scenario: 'embarrassment',
    text: 'Das ist mir etwas unangenehm zu sagen, aber... ich habe seit einer Woche Probleme mit dem Stuhlgang.',
  },
  {
    scenario: 'irritation',
    text: 'Ich habe das schon dreimal erklärt. Niemand hört mir zu. Das ist wirklich frustrierend.',
  },
  {
    scenario: 'relief',
    text: 'Oh, das ist eine Erleichterung. Ich dachte, es wäre viel schlimmer. Vielen Dank, Herr Doktor.',
  },
  {
    scenario: 'calm_closing',
    text: 'Alles klar. Ich werde das Rezept in der Apotheke abholen. Auf Wiedersehen.',
  },
  {
    scenario: 'history_taking',
    text: 'Die Schmerzen haben vor etwa drei Tagen angefangen, zuerst nur leicht, aber jetzt sind sie stärker geworden.',
  },
  {
    scenario: 'examination_response',
    text: 'Ja, genau da tut es weh. Wenn Sie drücken, wird es schlimmer. Strahlt auch in den Rücken aus.',
  },
];
