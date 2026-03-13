/**
 * VoiceDebugOverlay.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Development-only debug panel (zero cost in production).
 *
 * Shows per-turn:
 *  • Active provider (ElevenLabs / expo-speech)
 *  • Model name
 *  • Voice ID
 *  • Output format (mp3_44100_128 / mp3_44100_192 / pcm_44100)
 *  • Bitrate / sample rate
 *  • Quality mode (FAST / BALANCED / QUALITY)
 *  • Fallback yes/no + reason
 *  • Time to first audio (ms from tts_start → tts_playback_start)
 *  • Total audio generation time (ms)
 *  • Platform
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { VoiceEvent, QualityMode } from '@/lib/voiceProvider/providerManager';

interface Props {
  events: VoiceEvent[];
}

const MODE_COLOR: Record<QualityMode | 'unknown', string> = {
  fast: '#ffaa00',
  balanced: '#00d4aa',
  quality: '#00b4d8',
  unknown: '#888',
};

export default function VoiceDebugOverlay({ events }: Props) {
  if (!__DEV__) return null;

  const rev = [...events].reverse();

  const lastStart       = rev.find(e => e.type === 'tts_start');
  const lastProvider    = rev.find(e => e.type === 'tts_provider_selected');
  const lastGenDone     = rev.find(e => e.type === 'tts_generation_complete');
  const lastPlayStart   = rev.find(e => e.type === 'tts_playback_start');
  const lastFallback    = rev.find(e => e.type === 'tts_fallback');
  const lastError       = rev.find(e => e.type === 'tts_error');

  const isFallback    = !!lastFallback && lastFallback.turnId === lastStart?.turnId;
  const providerName  = lastProvider?.provider ?? '—';
  const voiceId       = lastGenDone?.voiceId ?? '—';
  const model         = lastGenDone?.model ?? '—';
  const outputFormat  = lastGenDone?.outputFormat ?? '—';
  const bitrateLabel  = lastGenDone?.bitrateLabel ?? '—';
  const sampleRate    = lastGenDone?.sampleRate ?? '—';
  const mode          = (lastGenDone?.mode ?? lastProvider?.mode ?? 'unknown') as QualityMode | 'unknown';
  const genMs         = lastGenDone?.generationMs ?? null;

  const ttfa = (lastPlayStart && lastStart)
    ? lastPlayStart.timestamp - lastStart.timestamp
    : null;

  const modeColor = MODE_COLOR[mode] ?? MODE_COLOR.unknown;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>🎙 Voice Debug</Text>

      <Row label="Provider"   value={providerName}   highlight={isFallback ? 'warn' : 'ok'} />
      <Row label="Model"      value={model} />
      <Row label="Voice"      value={voiceId} />
      <Row label="Format"     value={outputFormat} />
      <Row label="Bitrate"    value={bitrateLabel} />
      <Row label="Sample"     value={sampleRate} />

      <View style={styles.modeBadge}>
        <Text style={[styles.modeText, { color: modeColor }]}>
          ◉ {mode.toUpperCase()} MODE
        </Text>
      </View>

      <Row
        label="Fallback"
        value={isFallback ? `YES — ${lastFallback?.fallbackReason ?? '?'}` : 'no'}
        highlight={isFallback ? 'warn' : 'ok'}
      />
      <Row label="Gen time"   value={genMs !== null ? `${genMs} ms` : '—'} />
      <Row label="TTFA"       value={ttfa !== null ? `+${ttfa} ms` : '—'} />

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
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderRadius: 10,
    padding: 10,
    minWidth: 230,
    zIndex: 9999,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 6,
    letterSpacing: 0.5,
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
    maxWidth: 140,
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
