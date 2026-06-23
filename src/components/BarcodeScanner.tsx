import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<any>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mod = await import('@zxing/browser');
        if (cancelled || !videoRef.current) return;
        const reader = new mod.BrowserMultiFormatReader();
        setStatus('ready');
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result, _err, ctrl) => {
            if (result && !cancelled) {
              cancelled = true;
              ctrl.stop();
              onDetected(result.getText());
            }
          }
        );
        stopRef.current = () => controls.stop();
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(e?.message ?? 'Kamera nicht verfügbar');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopRef.current?.();
    };
  }, []);

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>📷 Barcode scannen</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {status === 'starting' && (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.hint}>Kamera wird gestartet…</Text>
          </View>
        )}

        {React.createElement('video', {
          ref: videoRef,
          autoPlay: true,
          muted: true,
          playsInline: true,
          style: {
            width: '100%',
            maxHeight: 260,
            borderRadius: 12,
            objectFit: 'cover',
            backgroundColor: '#000',
            display: status === 'error' ? 'none' : 'block',
          },
        })}

        {status === 'ready' && (
          <Text style={styles.hint}>Halte den Barcode in die Kamera – wird automatisch erkannt</Text>
        )}

        {status === 'error' && (
          <View style={styles.center}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <View style={styles.divider} />
        <Text style={styles.manualLabel}>Oder Barcode-Nummer eingeben:</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder="z.B. 4001686316405"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.manualBtn, !manualCode.trim() && { opacity: 0.4 }]}
            onPress={() => manualCode.trim() && onDetected(manualCode.trim())}
            disabled={!manualCode.trim()}
          >
            <Text style={styles.manualBtnText}>Suchen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    width: '92%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  closeText: { fontSize: 24, color: COLORS.textSecondary, fontWeight: '700' },
  center: { alignItems: 'center', paddingVertical: 24 },
  hint: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, fontSize: 13, lineHeight: 18 },
  errorText: { color: COLORS.danger, textAlign: 'center', fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  manualLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 8 },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manualBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  manualBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
