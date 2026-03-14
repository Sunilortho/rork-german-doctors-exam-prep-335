/**
 * femaleVoicePresets.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FEMALE-VOICE-ONLY tuning configuration.
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
 * WHY THESE VALUES:
 *   The original female voice (Rachel, 21m00Tcm4TlvDq8ikWAM) with the shared
 *   BALANCED config (stability 0.62, similarity 0.85, speaker_boost ON) sounds
 *   worse than the male voice because:
 *     1. High similarity (0.85) on Rachel causes sibilant distortion on German
 *        fricatives (sch, ch, z) — Rachel is trained on English, not German.
 *     2. Speaker boost amplifies high-frequency content — on female voices this
 *        adds harshness, not clarity.
 *     3. Stability 0.62 is fine for male voices but female voices benefit from
 *        slightly lower stability (more natural prosody variation in German).
 *
 * FEMALE VOICE CATALOGUE (ElevenLabs):
 *   Primary candidates for German medical dialogue:
 *   - Rachel (21m00Tcm4TlvDq8ikWAM): American English base, warm, clear.
 *     Works for German but sibilant distortion at high similarity.
 *   - Bella (EXAVITQu4vr4xnSDxMaL): American English base, softer, slightly
 *     breathy. Better for anxious/pain states. Lower distortion at 0.62 sim.
 *   - Elli (MF3mGyEYCl7XYWbV9V6O): American English base, younger, brighter.
 *     Best for young patient profiles. Can sound thin on elderly scenarios.
 *   - Charlotte (XB0fDUnXU5powFXDhCwa): British English base, professional,
 *     neutral. Closest to a clinical German accent. Best overall candidate.
 *   - Freya (jsCqWAovK2LkecY7zXl4): American English, warm, conversational.
 *     Good for middle-aged patient profiles.
 *
 * PRESET DESIGN:
 *   SAFE:       Closest to original baseline. Minimal risk. Good for regression.
 *   BALANCED:   Tuned for German medical speech. Default female candidate.
 *               speaker_boost OFF (reduces harshness on female voices).
 *               similarity 0.62 (avoids sibilant distortion).
 *   EXPRESSIVE: More emotional range. For pain/anxiety states. More variation.
 *               speaker_boost OFF. Lower stability = more prosody variation.
 *
 * VOICE SELECTION STRATEGY:
 *   Primary: Charlotte (XB0fDUnXU5powFXDhCwa) — British English, most neutral
 *            for German, least sibilant distortion.
 *   Fallback: Bella (EXAVITQu4vr4xnSDxMaL) — softer, less harsh.
 *   Last resort: Rachel (21m00Tcm4TlvDq8ikWAM) — original, known baseline.
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
  charlotte: { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', base: 'British English' },
  bella:     { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',     base: 'American English' },
  rachel:    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',    base: 'American English' },
  elli:      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',      base: 'American English' },
  freya:     { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya',     base: 'American English' },
} as const;

// ─── Presets ──────────────────────────────────────────────────────────────────

export const FEMALE_PRESETS: Record<FemalePresetName, FemaleVoicePreset> = {
  /**
   * SAFE — closest to original baseline.
   * Use this to confirm the pipeline works before testing tuned presets.
   * Rachel + original settings + speaker_boost ON (as in original).
   * If this sounds bad, the issue is the base voice, not the settings.
   */
  safe: {
    name: 'safe',
    label: '🛡 Safe',
    description: 'Closest to original baseline. Rachel + original settings.',
    voiceId: FEMALE_VOICES.rachel.id,
    voiceName: FEMALE_VOICES.rachel.name,
    voiceBase: FEMALE_VOICES.rachel.base,
    stability: 0.60,
    similarityBoost: 0.65,
    style: 0.05,
    useSpeakerBoost: true,
    speed: 0.98,
    notes: 'Baseline regression preset. Slightly lower similarity (0.65 vs 0.85) to reduce sibilant distortion on German.',
  },

  /**
   * BALANCED — default female candidate.
   * Charlotte (British English base) — most neutral for German medical speech.
   * speaker_boost OFF — reduces harshness on female voices.
   * similarity 0.62 — avoids sibilant distortion on German fricatives.
   * stability 0.50 — more natural prosody variation than male (0.62).
   */
  balanced: {
    name: 'balanced',
    label: '⚖ Balanced',
    description: 'Charlotte + tuned for German medical dialogue. Default candidate.',
    voiceId: FEMALE_VOICES.charlotte.id,
    voiceName: FEMALE_VOICES.charlotte.name,
    voiceBase: FEMALE_VOICES.charlotte.base,
    stability: 0.50,
    similarityBoost: 0.62,
    style: 0.08,
    useSpeakerBoost: false,
    speed: 0.97,
    notes: 'speaker_boost OFF reduces harshness. Charlotte base is more neutral for German than Rachel. Lower similarity avoids distortion.',
  },

  /**
   * EXPRESSIVE — for emotional states (pain, anxiety, confusion).
   * Bella (softer, slightly breathy) — better for distress states.
   * Lower stability = more prosody variation = more emotional range.
   * speaker_boost OFF — Bella is already bright, boost adds harshness.
   */
  expressive: {
    name: 'expressive',
    label: '✦ Expressive',
    description: 'Bella + tuned for emotional states. Pain/anxiety/confusion.',
    voiceId: FEMALE_VOICES.bella.id,
    voiceName: FEMALE_VOICES.bella.name,
    voiceBase: FEMALE_VOICES.bella.base,
    stability: 0.42,
    similarityBoost: 0.58,
    style: 0.15,
    useSpeakerBoost: false,
    speed: 0.96,
    notes: 'Lower stability allows more emotional prosody variation. Bella is softer/breathier than Rachel — better for pain/anxiety states.',
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

// ─── Test utterances (10 scenarios) ──────────────────────────────────────────
// Used by the automated test runner in femalePresetTest.ts
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
];
