import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const CDN_URL = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Html5Qrcode) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Scan-Bibliothek konnte nicht geladen werden (kein Internet?)'));
    document.head.appendChild(s);
  });
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const [status, setStatus] = useState<'loading' | 'scanning' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<any>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        await loadScript(CDN_URL);
        if (cancelled) return;

        const Html5Qrcode = (window as any).Html5Qrcode;
        scannerRef.current = new Html5Qrcode('barcode-scanner-div');
        setStatus('scanning');

        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 130 } },
          (text: string) => {
            if (!doneRef.current && !cancelled) {
              doneRef.current = true;
              stopScanner();
              onDetected(text);
            }
          },
          () => { /* ignore per-frame errors */ }
        );
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(e?.message ?? 'Kamera konnte nicht gestartet werden');
        }
      }
    }

    function stopScanner() {
      scannerRef.current?.stop().catch(() => {});
    }

    start();

    return () => {
      cancelled = true;
      stopScanner();
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

        {status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.hint}>Wird geladen…</Text>
          </View>
        )}

        {/* Scanner container – html5-qrcode renders camera preview here */}
        {React.createElement('div', {
          id: 'barcode-scanner-div',
          style: {
            width: '100%',
            display: status === 'scanning' ? 'block' : 'none',
            borderRadius: 12,
            overflow: 'hidden',
          },
        })}

        {status === 'scanning' && (
          <Text style={styles.hint}>EAN-Barcode in die Kamera halten – wird automatisch erkannt</Text>
        )}

        {status === 'error' && (
          <View style={styles.infoBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            <Text style={styles.hint}>Bitte Barcode-Nummer unten manuell eingeben.</Text>
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
  infoBox: { alignItems: 'center', paddingVertical: 12 },
  errorText: { color: COLORS.danger, fontSize: 13, textAlign: 'center', marginBottom: 6 },
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
