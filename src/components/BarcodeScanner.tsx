import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { lookupBarcode, FoodProduct } from '../services/openFoodFacts';
import { Meal } from '../types';

interface Props {
  onMealAdded: (meal: Meal) => void;
  onClose: () => void;
}

const CDN_URL = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js';

type Stage = 'loading-lib' | 'scanning' | 'fetching' | 'product' | 'not-found' | 'error' | 'success';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Html5Qrcode) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Scan-Bibliothek konnte nicht geladen werden'));
    document.head.appendChild(s);
  });
}

export default function BarcodeScanner({ onMealAdded, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('loading-lib');
  const [detectedCode, setDetectedCode] = useState('');
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [portionGrams, setPortionGrams] = useState('100');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<any>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        await loadScript(CDN_URL);
        if (cancelled) return;
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = window as any;
        // Enable EAN-13/8 and UPC formats used on food packaging
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ];
        scannerRef.current = new Html5Qrcode('bcs-div', {
          formatsToSupport,
          useBarCodeDetectorIfSupported: true, // native Android Chrome detection
          verbose: false,
        });
        setStage('scanning');
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 280, height: 150 } },
          (text: string) => {
            if (!doneRef.current && !cancelled) {
              doneRef.current = true;
              stopCamera();
              handleBarcode(text);
            }
          },
          () => {}
        );
      } catch (e: any) {
        if (!cancelled) { setStage('error'); setErrorMsg(e?.message ?? 'Kamera-Fehler'); }
      }
    }

    start();
    return () => { cancelled = true; stopCamera(); };
  }, []);

  function stopCamera() {
    scannerRef.current?.stop().catch(() => {});
  }

  async function handleBarcode(code: string) {
    setDetectedCode(code);
    setStage('fetching');
    try {
      const p = await lookupBarcode(code);
      if (p) { setProduct(p); setPortionGrams('100'); setStage('product'); }
      else { setStage('not-found'); }
    } catch {
      setStage('error');
      setErrorMsg('Netzwerkfehler – Open Food Facts nicht erreichbar');
    }
  }

  function addToList() {
    if (!product) return;
    const g = Math.max(1, Number(portionGrams) || 100);
    const f = g / 100;
    const meal: Meal = {
      id: Date.now().toString(),
      name: `${product.name} (${g}g)`,
      calories: Math.round(product.kcalPer100g * f),
      protein: +(product.proteinPer100g * f).toFixed(1),
      carbs: +(product.carbsPer100g * f).toFixed(1),
      fat: +(product.fatPer100g * f).toFixed(1),
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };
    onMealAdded(meal);
    // Stay open briefly so any ghost/phantom tap hits this overlay, not elements below
    setStage('success');
    setTimeout(() => onClose(), 800);
  }

  function rescan() {
    doneRef.current = false;
    setProduct(null);
    setDetectedCode('');
    setManualCode('');
    setStage('loading-lib');
    // Restart scanner
    setTimeout(async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = window as any;
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ];
        scannerRef.current = new Html5Qrcode('bcs-div', {
          formatsToSupport,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        setStage('scanning');
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 280, height: 150 } },
          (text: string) => {
            if (!doneRef.current) {
              doneRef.current = true;
              stopCamera();
              handleBarcode(text);
            }
          },
          () => {}
        );
      } catch (e: any) { setStage('error'); setErrorMsg(e?.message ?? 'Fehler'); }
    }, 100);
  }

  const portionG = Math.max(1, Number(portionGrams) || 100);
  const portionF = portionG / 100;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {stage === 'scanning' ? '📷 Barcode scannen' :
             stage === 'fetching' ? '🔍 Produkt laden…' :
             stage === 'product' ? '✅ Produkt gefunden' :
             stage === 'not-found' ? '❌ Nicht gefunden' :
             stage === 'success' ? '✅ Hinzugefügt!' : '📷 Barcode scannen'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Camera view (only while scanning) */}
        {React.createElement('div', {
          id: 'bcs-div',
          style: {
            width: '100%',
            minHeight: stage === 'scanning' ? 300 : 0,
            display: stage === 'scanning' ? 'block' : 'none',
            borderRadius: 12,
            overflow: 'hidden',
          },
        })}

        {/* Loading library */}
        {stage === 'loading-lib' && (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.hint}>Kamera wird vorbereitet…</Text>
          </View>
        )}

        {stage === 'scanning' && (
          <Text style={styles.hint}>EAN-Barcode in die Kamera halten – wird automatisch erkannt</Text>
        )}

        {/* Fetching product */}
        {stage === 'fetching' && (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.hint}>Barcode: {detectedCode}</Text>
            <Text style={styles.hint}>Produkt wird gesucht…</Text>
          </View>
        )}

        {/* Product found */}
        {stage === 'product' && product && (
          <View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPer100}>
              pro 100g: {product.kcalPer100g} kcal · P {product.proteinPer100g}g · K {product.carbsPer100g}g · F {product.fatPer100g}g
            </Text>
            <View style={styles.portionRow}>
              <Text style={styles.portionLabel}>Portion:</Text>
              <TextInput
                style={styles.portionInput}
                value={portionGrams}
                onChangeText={setPortionGrams}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.portionUnit}>g</Text>
            </View>
            <Text style={styles.portionCalc}>
              = {Math.round(product.kcalPer100g * portionF)} kcal · P {(product.proteinPer100g * portionF).toFixed(1)}g · K {(product.carbsPer100g * portionF).toFixed(1)}g · F {(product.fatPer100g * portionF).toFixed(1)}g
            </Text>
            <TouchableOpacity style={styles.addBtn} onPress={addToList}>
              <Text style={styles.addBtnText}>+ Zur Mahlzeitenliste hinzufügen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rescanBtn} onPress={rescan}>
              <Text style={styles.rescanBtnText}>↺ Nochmal scannen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Not found */}
        {stage === 'not-found' && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Produkt nicht gefunden{'\n'}(Barcode: {detectedCode})</Text>
            <TouchableOpacity style={styles.rescanBtn} onPress={rescan}>
              <Text style={styles.rescanBtnText}>↺ Nochmal scannen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {stage === 'error' && (
          <View style={styles.center}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        {/* Success — stays open briefly to absorb ghost clicks */}
        {stage === 'success' && (
          <View style={styles.center}>
            <Text style={styles.successText}>✅ Mahlzeit wurde zur Liste hinzugefügt!</Text>
          </View>
        )}

        {/* Manual input (only while scanning / not-found / error) */}
        {stage !== 'product' && stage !== 'success' && (
          <>
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
                onPress={() => { if (manualCode.trim()) { stopCamera(); doneRef.current = true; handleBarcode(manualCode.trim()); } }}
                disabled={!manualCode.trim()}
              >
                <Text style={styles.manualBtnText}>Suchen</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '96%',
    maxHeight: '92%' as any,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text, flex: 1 },
  closeText: { fontSize: 24, color: COLORS.textSecondary, fontWeight: '700', marginLeft: 8 },
  center: { alignItems: 'center', paddingVertical: 20 },
  hint: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, fontSize: 13, lineHeight: 18 },
  productName: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  productPer100: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 },
  portionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  portionLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  portionInput: {
    backgroundColor: COLORS.cardLight, borderRadius: 8, padding: 8,
    color: COLORS.text, fontSize: 18, fontWeight: '800',
    width: 80, borderWidth: 1, borderColor: COLORS.border, textAlign: 'center' as any,
  },
  portionUnit: { fontSize: 14, color: COLORS.textSecondary },
  portionCalc: { fontSize: 13, color: COLORS.primaryLight, fontWeight: '700', marginBottom: 14 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  rescanBtn: { alignItems: 'center', padding: 10 },
  rescanBtnText: { color: COLORS.textSecondary, fontSize: 13 },
  errorText: { color: COLORS.danger, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  successText: { color: COLORS.success, fontSize: 16, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  manualLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 8 },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: {
    flex: 1, backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 12,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border,
  },
  manualBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  manualBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
