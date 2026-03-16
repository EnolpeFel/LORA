import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from './DashboardScreen';

const { width } = Dimensions.get('window');

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current, total, color }) => (
  <View style={si.row}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={si.item}>
        <View
          style={[
            si.dot,
            {
              backgroundColor: i < current ? color : 'transparent',
              borderColor: i < current ? color : '#CBD5E1',
              width: i === current - 1 ? 22 : 8,
            },
          ]}
        />
        {i < total - 1 && (
          <View style={[si.line, { backgroundColor: i < current - 1 ? color : '#CBD5E1' }]} />
        )}
      </View>
    ))}
  </View>
);

const si = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  item: { flexDirection: 'row', alignItems: 'center' },
  dot: { height: 8, borderRadius: 4, borderWidth: 1.5 },
  line: { width: 28, height: 1.5, marginHorizontal: 4 },
});

// ─── Animated QR frame ────────────────────────────────────────────────────────
const QRScanFrame = ({ color }) => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  const corner = (pos) => {
    const isTop = pos.includes('top');
    const isLeft = pos.includes('left');
    return (
      <View
        style={[
          qf.corner,
          isTop ? { top: -1 } : { bottom: -1 },
          isLeft ? { left: -1 } : { right: -1 },
          {
            borderTopWidth: isTop ? 3 : 0,
            borderBottomWidth: !isTop ? 3 : 0,
            borderLeftWidth: isLeft ? 3 : 0,
            borderRightWidth: !isLeft ? 3 : 0,
            borderColor: color,
          },
        ]}
      />
    );
  };

  return (
    <View style={qf.wrapper}>
      {corner('top-left')}
      {corner('top-right')}
      {corner('bottom-left')}
      {corner('bottom-right')}

      {/* Checkerboard placeholder */}
      <View style={qf.grid}>
        {Array.from({ length: 64 }).map((_, i) => (
          <View
            key={i}
            style={[
              qf.cell,
              { backgroundColor: Math.random() > 0.5 ? 'rgba(0,0,0,0.08)' : 'transparent' },
            ]}
          />
        ))}
      </View>

      {/* Scan line */}
      <Animated.View
        style={[qf.scanLine, { backgroundColor: color, transform: [{ translateY }] }]}
      />

      {/* Center icon */}
      <View style={[qf.centerIcon, { backgroundColor: color }]}>
        <MaterialIcons name="qr-code" size={22} color="#fff" />
      </View>
    </View>
  );
};

const qf = StyleSheet.create({
  wrapper: { width: 160, height: 160, alignSelf: 'center', marginVertical: 8, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 22, height: 22, borderRadius: 2 },
  grid: { position: 'absolute', width: 144, height: 144, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.15 },
  cell: { width: 18, height: 18 },
  scanLine: { position: 'absolute', left: 8, right: 8, height: 2, borderRadius: 1, opacity: 0.7, top: 16 },
  centerIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
const QRPayScreen = ({ navigation, route }) => {
  const { dark } = useContext(ThemeContext);
  const [qrStep, setQrStep] = useState(1);
  const [qrAmount, setQrAmount] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const C = {
    bg:          dark ? '#0A0F1E' : '#F0F4FF',
    card:        dark ? '#131929' : '#FFFFFF',
    cardAlt:     dark ? '#1A2540' : '#F7F9FF',
    border:      dark ? '#1E2D4A' : '#E2E8FF',
    text:        dark ? '#E8EFFF' : '#0F172A',
    subtext:     dark ? '#6B7FA3' : '#64748B',
    faint:       dark ? '#111827' : '#F8FAFF',
    headerBg:    dark ? '#0D1526' : '#FFFFFF',
    inputBg:     dark ? '#0A0F1E' : '#F8FAFF',
    inputBorder: dark ? '#1E2D4A' : '#CBD5FF',
    accent:      '#6366F1',        // indigo
    accentLight: dark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
    accentSoft:  dark ? '#1E1B4B' : '#EEF2FF',
    success:     '#10B981',
    danger:      '#EF4444',
    amber:       '#F59E0B',
  };

  const balance = route.params?.balance || 0;
  const amt = parseFloat(qrAmount) || 0;
  const isValidAmt = qrAmount && amt > 0 && amt <= balance;

  const goToStep = (step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: step === 2 ? -20 : 20, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setQrStep(step);
      slideAnim.setValue(step === 2 ? 20 : -20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleQRPay = () => {
    if (!qrAmount || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (amt > balance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance for this transaction.');
      return;
    }
    if (route.params?.onQRPay) {
      route.params.onQRPay({ amount: amt, date: new Date().toISOString() });
    }
    Alert.alert(
      '✓ Payment Successful',
      `₱${amt.toFixed(2)} sent via QR Code`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: C.cardAlt }]}
        >
          <MaterialIcons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>QR Payment</Text>
          <Text style={[styles.headerSub, { color: C.subtext }]}>
            {qrStep === 1 ? 'Scan a merchant code' : 'Enter payment amount'}
          </Text>
        </View>
        <View style={[styles.stepBadge, { backgroundColor: C.accentSoft }]}>
          <Text style={[styles.stepBadgeTxt, { color: C.accent }]}>{qrStep}/2</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step progress */}
        <StepIndicator current={qrStep} total={2} color={C.accent} />

        {/* Balance pill */}
        <View style={[styles.balPill, { backgroundColor: C.accentLight, borderColor: C.border }]}>
          <View style={[styles.balDot, { backgroundColor: C.success }]} />
          <Text style={[styles.balLabel, { color: C.subtext }]}>Available</Text>
          <Text style={[styles.balValue, { color: C.text }]}>₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
        </View>

        {/* Animated step content */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {qrStep === 1 ? (
            // ── STEP 1: Scan ──
            <View>
              <View style={[styles.scanCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={[styles.scanCardHeader, { borderBottomColor: C.border }]}>
                  <View style={[styles.liveBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <View style={[styles.liveDot, { backgroundColor: C.success }]} />
                    <Text style={[styles.liveTxt, { color: C.success }]}>Camera Ready</Text>
                  </View>
                </View>

                <View style={styles.scanArea}>
                  <QRScanFrame color={C.accent} />
                </View>

                <Text style={[styles.scanHint, { color: C.subtext }]}>
                  Align the QR code within the frame above
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.divRow}>
                <View style={[styles.divLine, { backgroundColor: C.border }]} />
                <Text style={[styles.divTxt, { color: C.subtext }]}>or</Text>
                <View style={[styles.divLine, { backgroundColor: C.border }]} />
              </View>

              {/* Manual entry trigger */}
              <TouchableOpacity
                style={[styles.manualBtn, { backgroundColor: C.cardAlt, borderColor: C.border }]}
                onPress={() => goToStep(2)}
                activeOpacity={0.7}
              >
                <View style={[styles.manualIcon, { backgroundColor: C.accentLight }]}>
                  <MaterialIcons name="edit" size={18} color={C.accent} />
                </View>
                <View style={styles.manualTextCol}>
                  <Text style={[styles.manualTitle, { color: C.text }]}>Enter Amount Manually</Text>
                  <Text style={[styles.manualSub, { color: C.subtext }]}>Type the payment amount directly</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={C.subtext} />
              </TouchableOpacity>

              {/* Trust indicators */}
              <View style={styles.trustRow}>
                {[
                  { icon: 'lock', label: 'Encrypted' },
                  { icon: 'shield', label: 'Secure' },
                  { icon: 'verified', label: 'Verified' },
                ].map(({ icon, label }) => (
                  <View key={label} style={styles.trustItem}>
                    <MaterialIcons name={icon} size={13} color={C.success} />
                    <Text style={[styles.trustTxt, { color: C.subtext }]}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            // ── STEP 2: Amount ──
            <View>
              {/* Merchant card */}
              <View style={[styles.merchantCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={[styles.merchantAvatar, { backgroundColor: C.accentSoft }]}>
                  <MaterialIcons name="storefront" size={26} color={C.accent} />
                </View>
                <View style={styles.merchantInfo}>
                  <Text style={[styles.merchantName, { color: C.text }]}>QR Merchant</Text>
                  <Text style={[styles.merchantId, { color: C.subtext }]}>Verified · ID #QR-2024</Text>
                </View>
                <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <MaterialIcons name="check-circle" size={14} color={C.success} />
                  <Text style={[styles.verifiedTxt, { color: C.success }]}>Safe</Text>
                </View>
              </View>

              {/* Amount input */}
              <View style={[styles.amtCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={[styles.amtCardLabel, { color: C.subtext }]}>Payment Amount</Text>
                <View style={[
                  styles.amtInputRow,
                  { borderColor: qrAmount && amt > balance ? C.danger : C.inputBorder, backgroundColor: C.inputBg },
                ]}>
                  <Text style={[styles.currPfx, { color: isValidAmt ? C.accent : C.text }]}>₱</Text>
                  <TextInput
                    style={[styles.amtInput, { color: C.text }]}
                    placeholder="0.00"
                    placeholderTextColor={C.subtext}
                    keyboardType="decimal-pad"
                    value={qrAmount}
                    onChangeText={setQrAmount}
                    autoFocus
                  />
                  {qrAmount ? (
                    <TouchableOpacity onPress={() => setQrAmount('')} style={styles.clearBtn}>
                      <MaterialIcons name="cancel" size={18} color={C.subtext} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Validation feedback */}
                {qrAmount && (
                  <View style={styles.validRow}>
                    {amt > balance ? (
                      <>
                        <MaterialIcons name="error-outline" size={13} color={C.danger} />
                        <Text style={[styles.validTxt, { color: C.danger }]}>Exceeds available balance</Text>
                      </>
                    ) : amt > 0 ? (
                      <>
                        <MaterialIcons name="check-circle-outline" size={13} color={C.success} />
                        <Text style={[styles.validTxt, { color: C.success }]}>Amount looks good</Text>
                      </>
                    ) : null}
                  </View>
                )}
              </View>

              {/* Quick amounts */}
              <Text style={[styles.quickLabel, { color: C.subtext }]}>Quick select</Text>
              <View style={styles.quickGrid}>
                {[100, 250, 500, 1000, 2000, 5000].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[
                      styles.quickChip,
                      {
                        backgroundColor: parseFloat(qrAmount) === v ? C.accent : C.cardAlt,
                        borderColor: parseFloat(qrAmount) === v ? C.accent : C.border,
                      },
                    ]}
                    onPress={() => setQrAmount(v.toString())}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.quickChipTxt,
                      { color: parseFloat(qrAmount) === v ? '#fff' : C.text },
                    ]}>
                      ₱{v >= 1000 ? `${v / 1000}K` : v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary row */}
              {isValidAmt && (
                <View style={[styles.summaryBox, { backgroundColor: C.accentLight, borderColor: C.border }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryKey, { color: C.subtext }]}>You pay</Text>
                    <Text style={[styles.summaryVal, { color: C.text }]}>₱{amt.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: C.border }]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryKey, { color: C.subtext }]}>Remaining balance</Text>
                    <Text style={[styles.summaryVal, { color: C.success }]}>₱{(balance - amt).toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: C.card, borderTopColor: C.border }]}>
        {qrStep === 2 && (
          <TouchableOpacity
            style={[styles.backBtnBottom, { backgroundColor: C.cardAlt, borderColor: C.border }]}
            onPress={() => {
              goToStep(1);
              setQrAmount('');
            }}
          >
            <MaterialIcons name="arrow-back" size={18} color={C.text} />
            <Text style={[styles.backBtnTxt, { color: C.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            qrStep === 1 && { flex: 1 },
            { backgroundColor: C.accent },
            (qrStep === 2 && !isValidAmt) && [styles.disabledBtn, { backgroundColor: dark ? '#312E81' : '#C7D2FE' }],
          ]}
          onPress={() => (qrStep === 1 ? goToStep(2) : handleQRPay())}
          disabled={qrStep === 2 && !isValidAmt}
          activeOpacity={0.85}
        >
          {qrStep === 1 ? (
            <>
              <MaterialIcons name="keyboard" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnTxt}>Enter Manually</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="payment" size={18} color={isValidAmt ? '#fff' : (dark ? '#6366F1' : '#818CF8')} style={{ marginRight: 6 }} />
              <Text style={[styles.primaryBtnTxt, !isValidAmt && { color: dark ? '#6366F1' : '#818CF8' }]}>
                {isValidAmt ? `Pay ₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'Pay'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, marginTop: 1 },
  stepBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  stepBadgeTxt: { fontSize: 12, fontWeight: '700' },

  scrollContent: { padding: 16, paddingBottom: 110 },

  // Balance pill
  balPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 22, borderWidth: 1, alignSelf: 'flex-start',
  },
  balDot: { width: 7, height: 7, borderRadius: 4 },
  balLabel: { fontSize: 12 },
  balValue: { fontSize: 13, fontWeight: '700' },

  // Scan card
  scanCard: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16,
  },
  scanCardHeader: {
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, alignItems: 'flex-end',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveTxt: { fontSize: 11, fontWeight: '600' },
  scanArea: { paddingVertical: 28, alignItems: 'center' },
  scanHint: { textAlign: 'center', fontSize: 12, paddingBottom: 16, paddingHorizontal: 20 },

  // Divider
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  divLine: { flex: 1, height: 1 },
  divTxt: { fontSize: 12, fontWeight: '500' },

  // Manual button
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  manualIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  manualTextCol: { flex: 1 },
  manualTitle: { fontSize: 14, fontWeight: '600' },
  manualSub: { fontSize: 11, marginTop: 1 },

  // Trust row
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustTxt: { fontSize: 11 },

  // Merchant card
  merchantCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  merchantAvatar: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 15, fontWeight: '700' },
  merchantId: { fontSize: 11, marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  verifiedTxt: { fontSize: 11, fontWeight: '600' },

  // Amount input
  amtCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
  },
  amtCardLabel: { fontSize: 12, fontWeight: '500', marginBottom: 10 },
  amtInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12, paddingLeft: 14,
  },
  currPfx: { fontSize: 22, fontWeight: '800', marginRight: 2 },
  amtInput: { flex: 1, fontSize: 26, fontWeight: '700', paddingVertical: 12 },
  clearBtn: { padding: 12 },
  validRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  validTxt: { fontSize: 12 },

  // Quick amounts
  quickLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  quickChipTxt: { fontSize: 13, fontWeight: '600' },

  // Summary
  summaryBox: {
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  summaryKey: { fontSize: 13 },
  summaryVal: { fontSize: 13, fontWeight: '700' },
  summaryDivider: { height: 1, marginVertical: 8 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 28, borderTopWidth: 1,
  },
  backBtnBottom: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  backBtnTxt: { fontWeight: '600', fontSize: 14 },
  primaryBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 15, borderRadius: 14,
  },
  primaryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disabledBtn: {},
});

export default QRPayScreen;