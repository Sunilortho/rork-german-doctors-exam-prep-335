/**
 * VoiceDebugOverlay.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Development-only debug panel (zero cost in production).
 *
 * FEMALE STRATEGY REPLACEMENT additions:
 *  • Female preset toggle (🛡 Safe / ⚖ Balanced / ✦ Expressive)
 *  • Bake-off winner badge: Sarah (Germany German) shown when balanced active
 *  • Per-turn: stability, similarity, style, speaker_boost, voice base
 *  • Female preset badge with active voice name
 *  • Preset toggle only shown when isFemaleScenario=true
 *
 * Existing fields:
 *  • Active provider (ElevenLabs / expo-speech)
 *  • Model name, Voice ID, Output format, Bitrate, Sample rate
 *  • Quality mode (FAST / BALANCED / QUALITY)
 *  • Fallback yes/no + reason
 *  • TTFA, generation time
 *  • Platform
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import type { VoiceEvent, QualityMode } from '@/lib/voiceProvider/providerManager';
import type { FemalePresetName } from '@/lib/voiceProvider/femaleVoicePresets';
import { FEMALE_PRESETS } from '@/lib/voiceProvider/femaleVoicePresets';

interface Props {
  events: VoiceEvent[];
  femalePreset: FemalePresetName;
  onFemalePresetChange: (preset: FemalePresetName) => void;
  isFemaleScenario: boolean;
}

const MODE_COLOR: Record<QualityMode | 'unknown', string> = {
  fast: '#ffaa00',
  balanced: '#00d4aa',
  quality: '#00b4d8',
  unknown: '#888',
};

const PRESET_COLOR: Record<FemalePresetName, string> = {
  safe: '#88cc88',
  balanced: '#00d4aa',
  expressive: '#d488ff',
};

const PRESET_NAMES: FemalePresetName[] = ['safe', 'balanced', 'expressive'];

export default function VoiceDebugOverlay({
  events,
  femalePreset,
  onFemalePresetChange,
  isFemaleScenario,
}: Props) {
  if (!__DEV__) return null;

  const rev = [...events].reverse();
  const lastStart     = rev.find(e => e.type === 'tts_start');
  const lastProvider  = rev.find(e => e.type === 'tts_provider_selected');
  const lastGenDone   = rev.find(e => e.type === 'tts_generation_complete');
  const lastPlayStart = rev.find(e => e.type === 'tts_playback_start');
  const lastFallback  = rev.find(e => e.type === 'tts_fallback');
  const lastError     = rev.find(e => e.type === 'tts_error');

  const isFallback   = !!lastFallback && lastFallback.turnId === lastStart?.turnId;
  const providerName = lastProvider?.provider ?? '—';
  const voiceId      = lastGenDone?.voiceId ?? '—';
  const model        = lastGenDone?.model ?? '—';
  const outputFormat = lastGenDone?.outputFormat ?? '—';
  const bitrateLabel = lastGenDone?.bitrateLabel ?? '—';
  const sampleRate   = lastGenDone?.sampleRate ?? '—';
  const mode         = (lastGenDone?.mode ?? lastProvider?.mode ?? 'unknown') as QualityMode | 'unknown';
  const genMs        = lastGenDone?.generationMs ?? null;

  // Extended fields from female strategy replacement (cast via any — tRPC response)
  const extGen = lastGenDone as any;
  const stability      = extGen?.stability ?? null;
  const similarityVal  = extGen?.similarityBoost ?? null;
  const styleVal       = extGen?.style ?? null;
  const speakerBoost   = extGen?.speakerBoost ?? null;
  const voiceBase      = extGen?.voiceBase ?? null;
  const resolvedPreset = extGen?.femalePreset as FemalePresetName | null;

  const ttfa = (lastPlayStart && lastStart)
    ? lastPlayStart.timestamp - lastStart.timestamp
    : null;

  const modeColor   = MODE_COLOR[mode] ?? MODE_COLOR.unknown;
  const presetColor = resolvedPreset ? PRESET_COLOR[resolvedPreset] : '#888';

  // Show bake-off winner badge when balanced preset is active
  const isWinnerActive = resolvedPreset === 'balanced' || femalePreset === 'balanced';

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Text style={styles.title}>🎙 Voice Debug</Text>

      {/* ── Female preset toggle (dev-only, female scenarios only) ── */}
      {isFemaleScenario && (
        <View style={styles.presetSection}>
          <Text style={styles.presetSectionLabel}>♀ Female Preset</Text>
          <View style={styles.presetRow}>
            {PRESET_NAMES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.presetBtn,
                  femalePreset === p && {
                    backgroundColor: PRESET_COLOR[p] + '33',
                    borderColor: PRESET_COLOR[p],
                  },
                ]}
                onPress={() => onFemalePresetChange(p)}
              >
                <Text style={[
                  styles.presetBtnText,
                  femalePreset === p && { color: PRESET_COLOR[p] },
                ]}>
                  {FEMALE_PRESETS[p].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {resolvedPreset && (
            <Text style={[styles.presetActive, { color: presetColor }]}>
              Active: {resolvedPreset.toUpperCase()} — {FEMALE_PRESETS[resolvedPreset]?.voiceName ?? '?'}
              {resolvedPreset === 'balanced' ? ' ★' : ''}
            </Text>
          )}
          {isWinnerActive && (
            <Text style={styles.winnerBadge}>
              ★ Bake-off winner · Germany German
            </Text>
          )}
        </View>
      )}

      {/* ── Provider / model / voice ── */}
      <Row label="Provider"  value={providerName} highlight={isFallback ? 'warn' : 'ok'} />
      <Row label="Model"     value={model} />
      <Row label="Voice"     value={voiceId} />
      {voiceBase && <Row label="Base" value={voiceBase} />}
      <Row label="Format"    value={outputFormat} />
      <Row label="Bitrate"   value={bitrateLabel} />
      <Row label="Sample"    value={sampleRate} />

      {/* ── Mode badge ── */}
      <View style={styles.modeBadge}>
        <Text style={[styles.modeText, { color: modeColor }]}>
          ◉ {mode.toUpperCase()} MODE
        </Text>
      </View>

      {/* ── Voice settings (female strategy replacement) ── */}
      {stability !== null && (
        <>
          <Text style={styles.sectionLabel}>Voice Settings</Text>
          <Row label="Stability"  value={String(stability)} />
          <Row label="Similarity" value={String(similarityVal)} />
          <Row label="Style"      value={String(styleVal)} />
          <Row
            label="Spkr Boost"
            value={speakerBoost === true ? 'ON' : speakerBoost === false ? 'OFF' : '—'}
            highlight={speakerBoost === true ? 'warn' : 'ok'}
          />
        </>
      )}

      {/* ── Fallback / timing ── */}
      <Row
        label="Fallback"
        value={isFallback ? `YES — ${lastFallback?.fallbackReason ?? '?'}` : 'no'}
        highlight={isFallback ? 'warn' : 'ok'}
      />
      <Row label="Gen time" value={genMs !== null ? `${genMs} ms` : '—'} />
      <Row label="TTFA"     value={ttfa !== null ? `+${ttfa} ms` : '—'} />

      {lastError && (
        <Row label="Error" value={lastError.error ?? '?'} highlight="error" />
      )}

      <Text style={styles.platform}>Platform: {Platform.OS}</Text>
    </View>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'ok' | 'warn' | 'error';
}) {
  const valueColor =
    highlight === 'error' ? '#ff5555'
    : highlight === 'warn' ? '#ffaa00'
    : '#88ff88';
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 130,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderRadius: 10,
    padding: 10,
    minWidth: 240,
    zIndex: 9999,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  presetSection: {
    marginBottom: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 6,
  },
  presetSectionLabel: {
    color: '#aaa',
    fontSize: 9,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 4,
  },
  presetBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    paddingVertical: 3,
    alignItems: 'center',
  },
  presetBtnText: {
    color: '#888',
    fontSize: 9,
    fontWeight: '600',
  },
  presetActive: {
    fontSize: 9,
    marginTop: 3,
    fontWeight: '600',
  },
  winnerBadge: {
    fontSize: 8,
    color: '#00d4aa',
    marginTop: 2,
    fontStyle: 'italic',
  },
  sectionLabel: {
    color: '#666',
    fontSize: 9,
    marginTop: 4,
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    color: '#aaa',
    fontSize: 10,
    marginRight: 6,
    flexShrink: 0,
  },
  value: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: 150,
  },
  modeBadge: {
    marginVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 3,
  },
  modeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  platform: {
    color: '#555',
    fontSize: 9,
    marginTop: 4,
  },
});
