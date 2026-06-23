import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const rafRef = useRef<any>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'unsupported' | 'error'>('starting');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let cancelled = false;

    function stopAll() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t: any) => t.stop());
    }

    async function start() {
      if (!('BarcodeDetector' in window)) {
        setStatus('unsupported');
        return;
      }
      try {
        const stream = await (navigator.mediaDevices as any).getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) { stream.getTracks().forEach((t: any) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
        });
        setStatus('scanning');

        const scan = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const found = await detector.detect(videoRef.current);
            if (found.length > 0 && !cancelled) {
              cancelled = true;
              stopAll();
              onDetected(found[0].rawValue);
              return;
            }
          } catch { /* frame not ready yet */ }
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } catch (e: any) {
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(e?.message ?? 'Kamera nicht verfügbar');
        }
      }
    }

    start();
    return () => { cancelled = true; stopAll(); };
  }, []);

  const videoEl = React.createElement('video', {
    ref: videoRef,
    muted: true,
    playsInline: true,
    style: {
      width: '100%',
      maxHeight: 260,
      borderRadius: 12,
      objectFit: 'cover',
      backgroundColor: '#000',
      display: status === 'scanning' || status === 'starting' ? 'block' : 'none',
    },
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>📷 Barcode scannen</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {videoEl}

        {status === 'starting' && <Text style={styles.hint}>Kamera wird gestartet…</Text>}
        {status === 'scanning' && <Text style={styles.hint}>Barcode in die Kamera halten – wird automatisch erkannt</Text>}
        {(status === 'unsupported' || status === 'error') && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {status === 'unsupported'
                ? '📱 Kamera-Scan wird auf diesem Browser nicht unterstützt.\nBitte Barcode-Nummer unten eingeben.'
                : `⚠️ ${errorMsg}`}
            </Text>
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
  hint: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, fontSize: 13, lineHeight: 18 },
  infoBox: { backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 14, marginTop: 8 },
  infoText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
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
