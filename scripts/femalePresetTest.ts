/**
 * femalePresetTest.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated A/B test runner: calls ElevenLabs for all 3 female presets × 12
 * utterances and logs per-test parameters + latency.
 *
 * BAKE-OFF WINNER: Sarah (EXAVITQu4vr4xnSDxMaL) — Germany German, soft/news
 * Default preset: BALANCED (Sarah)
 *
 * Run with:
 *   npx ts-node --project tsconfig.json scripts/femalePresetTest.ts
 *
 * Requires: ELEVENLABS_API_KEY in environment.
 * Output: scripts/femalePresetTestResults.json + console table.
 *
 * Total API calls: 3 presets × 12 utterances = 36 calls
 */

import {
  FEMALE_PRESETS,
  FEMALE_TEST_UTTERANCES,
  DEFAULT_FEMALE_PRESET,
  type FemalePresetName,
} from '../lib/voiceProvider/femaleVoicePresets';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  preset: FemalePresetName;
  scenario: string;
  voiceId: string;
  voiceName: string;
  voiceBase: string;
  model: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speakerBoost: boolean;
  speed: number;
  outputFormat: string;
  bitrateLabel: string;
  textLength: number;
  ttfb_ms: number | null;
  generation_ms: number | null;
  audioBytes: number | null;
  status: 'ok' | 'error' | 'timeout';
  error?: string;
}

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? '';
const MODEL = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_192';
const TIMEOUT_MS = 15_000;

async function testPreset(
  presetName: FemalePresetName,
  utterance: { scenario: string; text: string }
): Promise<TestResult> {
  const preset = FEMALE_PRESETS[presetName];
  const t_start = Date.now();
  let t_first_byte = 0;

  const base: Omit<TestResult, 'ttfb_ms' | 'generation_ms' | 'audioBytes' | 'status' | 'error'> = {
    preset: presetName,
    scenario: utterance.scenario,
    voiceId: preset.voiceId,
    voiceName: preset.voiceName,
    voiceBase: preset.voiceBase,
    model: MODEL,
    stability: preset.stability,
    similarityBoost: preset.similarityBoost,
    style: preset.style,
    speakerBoost: preset.useSpeakerBoost,
    speed: preset.speed,
    outputFormat: OUTPUT_FORMAT,
    bitrateLabel: '192 kbps',
    textLength: utterance.text.length,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${preset.voiceId}?output_format=${OUTPUT_FORMAT}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: utterance.text,
          model_id: MODEL,
          voice_settings: {
            stability: preset.stability,
            similarity_boost: preset.similarityBoost,
            style: preset.style,
            use_speaker_boost: preset.useSpeakerBoost,
          },
        }),
        signal: controller.signal,
      }
    );

    t_first_byte = Date.now();
    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        ...base,
        ttfb_ms: t_first_byte - t_start,
        generation_ms: null,
        audioBytes: null,
        status: 'error',
        error: `HTTP ${response.status}: ${body.slice(0, 100)}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const t_done = Date.now();

    return {
      ...base,
      ttfb_ms: t_first_byte - t_start,
      generation_ms: t_done - t_start,
      audioBytes: arrayBuffer.byteLength,
      status: 'ok',
    };

  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = (err as Error).name === 'AbortError';
    return {
      ...base,
      ttfb_ms: null,
      generation_ms: null,
      audioBytes: null,
      status: isTimeout ? 'timeout' : 'error',
      error: isTimeout ? 'timeout' : String(err),
    };
  }
}

async function runAll(): Promise<void> {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY not set. Export it before running.');
    process.exit(1);
  }

  const presets: FemalePresetName[] = ['safe', 'balanced', 'expressive'];
  const results: TestResult[] = [];
  const totalCalls = presets.length * FEMALE_TEST_UTTERANCES.length;

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  FEMALE VOICE STRATEGY REPLACEMENT — A/B TEST`);
  console.log(`  ${presets.length} presets × ${FEMALE_TEST_UTTERANCES.length} utterances = ${totalCalls} calls`);
  console.log(`  Default preset: ${DEFAULT_FEMALE_PRESET.toUpperCase()} (${FEMALE_PRESETS[DEFAULT_FEMALE_PRESET].voiceName} — ${FEMALE_PRESETS[DEFAULT_FEMALE_PRESET].voiceBase})`);
  console.log(`${'═'.repeat(80)}\n`);

  for (const preset of presets) {
    const p = FEMALE_PRESETS[preset];
    const isDefault = preset === DEFAULT_FEMALE_PRESET;
    console.log(`\n── PRESET: ${preset.toUpperCase()}${isDefault ? ' ★ DEFAULT (BAKE-OFF WINNER)' : ''} ─────────────────────────`);
    console.log(`   Voice:      ${p.voiceName} (${p.voiceBase})`);
    console.log(`   Voice ID:   ${p.voiceId}`);
    console.log(`   Stability:  ${p.stability}`);
    console.log(`   Similarity: ${p.similarityBoost}`);
    console.log(`   Style:      ${p.style}`);
    console.log(`   Spkr Boost: ${p.useSpeakerBoost ? 'ON' : 'OFF'}`);
    console.log(`   Speed:      ${p.speed}`);
    console.log(`   Notes:      ${p.notes}\n`);

    for (const utterance of FEMALE_TEST_UTTERANCES) {
      process.stdout.write(`   [${preset.padEnd(10)}] ${utterance.scenario.padEnd(22)} ... `);
      const result = await testPreset(preset, utterance);
      results.push(result);

      if (result.status === 'ok') {
        const ttfb = result.ttfb_ms !== null ? `TTFB ${result.ttfb_ms}ms` : '';
        const gen  = result.generation_ms !== null ? `total ${result.generation_ms}ms` : '';
        const bytes = result.audioBytes !== null ? `${Math.round(result.audioBytes / 1024)}KB` : '';
        console.log(`✅  ${ttfb} | ${gen} | ${bytes}`);
      } else {
        console.log(`❌  ${result.status.toUpperCase()} — ${result.error ?? '?'}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // ── Summary table ──────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(80)}`);
  console.log('  SUMMARY — Average latency per preset');
  console.log(`${'═'.repeat(80)}`);

  for (const preset of presets) {
    const presetResults = results.filter(r => r.preset === preset && r.status === 'ok');
    const avgTtfb = presetResults.length
      ? Math.round(presetResults.reduce((s, r) => s + (r.ttfb_ms ?? 0), 0) / presetResults.length)
      : null;
    const avgGen = presetResults.length
      ? Math.round(presetResults.reduce((s, r) => s + (r.generation_ms ?? 0), 0) / presetResults.length)
      : null;
    const errors = results.filter(r => r.preset === preset && r.status !== 'ok').length;
    const p = FEMALE_PRESETS[preset];
    const isDefault = preset === DEFAULT_FEMALE_PRESET;

    console.log(
      `  ${preset.toUpperCase().padEnd(12)}${isDefault ? '★' : ' '} | ${p.voiceName.padEnd(10)} (${p.voiceBase.padEnd(16)}) | ` +
      `stability=${p.stability} sim=${p.similarityBoost} style=${p.style} boost=${p.useSpeakerBoost ? 'ON' : 'OFF'} | ` +
      `avg TTFB ${avgTtfb ?? '—'}ms | avg total ${avgGen ?? '—'}ms | errors: ${errors}`
    );
  }

  // ── Speaker boost analysis ─────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(80)}`);
  console.log('  SPEAKER BOOST ANALYSIS');
  console.log(`${'═'.repeat(80)}`);
  const boostOn  = results.filter(r => r.speakerBoost === true  && r.status === 'ok');
  const boostOff = results.filter(r => r.speakerBoost === false && r.status === 'ok');
  const avgBoostOn  = boostOn.length  ? Math.round(boostOn.reduce((s, r) => s + (r.generation_ms ?? 0), 0) / boostOn.length) : null;
  const avgBoostOff = boostOff.length ? Math.round(boostOff.reduce((s, r) => s + (r.generation_ms ?? 0), 0) / boostOff.length) : null;
  console.log(`  Speaker Boost ON  (${boostOn.length} calls):  avg total ${avgBoostOn ?? '—'}ms`);
  console.log(`  Speaker Boost OFF (${boostOff.length} calls): avg total ${avgBoostOff ?? '—'}ms`);
  if (avgBoostOn !== null && avgBoostOff !== null) {
    const diff = avgBoostOn - avgBoostOff;
    console.log(`  Latency difference: ${diff > 0 ? '+' : ''}${diff}ms (${diff > 0 ? 'boost is slower' : 'boost is faster'})`);
  }

  // ── Write JSON results ─────────────────────────────────────────────────────
  const outPath = path.join(__dirname, 'femalePresetTestResults.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n  Results saved to: ${outPath}`);
  console.log(`${'═'.repeat(80)}\n`);
}

runAll().catch(console.error);
