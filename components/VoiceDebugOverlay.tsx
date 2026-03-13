/**
 * VoiceDebugOverlay.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Development-only debug panel showing:
 *  • Provider used (ElevenLabs / expo-speech)
 *  • Model / voice ID
 *  • Fallback yes/no + reason
 *  • Generation time (ms)
 *  • Playback start time (ms from turn start)
 *
 * Rendered only when __DEV__ is true. Zero cost in production.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import type { VoiceEvent } from '@/lib/voiceProvider/providerManager';

interface Props {
  events: VoiceEvent[];
}

export default function VoiceDebugOverlay({ events }: Props) {
  if (!__DEV__) return null;

  // Find the most recent complete turn summary
  const lastStart = [...events].reverse().find(e => e.type === 'tts_start');
  const lastProvider = [...events].reverse().find(e => e.type === 'tts_provider_selected');
  const lastGenDone = [...events].reverse().find(e => e.type === 'tts_generation_complete');
  const lastPlayStart = [...events].reverse().find(e => e.type === 'tts_playback_start');
  const lastFallback = [...events].reverse().find(e => e.type === 'tts_fallback');
  const lastError = [...events].reverse().find(e => e.type === 'tts_error');

  const isFallback = !!lastFallback && lastFallback.turnId === lastStart?.turnId;
  const providerName = lastProvider?.provider ?? '—';
  const voiceId = lastGenDone?.voiceId ?? '—';
  const model = lastGenDone?.model ?? '—';
  const genMs = lastGenDone?.generationMs ?? null;
  const playStartMs = lastPlayStart?.playbackStartMs
    ? lastPlayStart.playbackStartMs - (lastStart?.timestamp ?? 0)
    : null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.title}>🎙 Voice Debug</Text>
      <Row label="Provider" value={providerName} highlight={isFallback ? 'warn' : 'ok'} />
      <Row label="Model" value={model} />
      <Row label="Voice" value={voiceId} />
      <Row label="Fallback" value={isFallback ? `YES — ${lastFallback?.fallbackReason ?? '?'}` : 'no'} highlight={isFallback ? 'warn' : 'ok'} />
      <Row label="Gen time" value={genMs !== null ? `${genMs} ms` : '—'} />
      <Row label="Play start" value={playStartMs !== null ? `+${playStartMs} ms` : '—'} />
      {lastError && <Row label="Error" value={lastError.error ?? '?'} highlight="error" />}
      <Text style={styles.platform}>Platform: {Platform.OS}</Text>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: 'ok' | 'warn' | 'error' }) {
  const valueColor = highlight === 'error' ? '#ff5555' : highlight === 'warn' ? '#ffaa00' : '#88ff88';
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 10,
    padding: 10,
    minWidth: 220,
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
  },
  value: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  platform: {
    color: '#666',
    fontSize: 9,
    marginTop: 4,
  },
});
