import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Brand palette ────────────────────────────────────────────────────────────
const P = {
  deep:    '#1C1007',
  mid:     '#2D1A08',
  violet:  '#EA580C',
  purple:  '#FB923C',
  light:   '#FED7AA',
  surface: '#2A1810',
  border:  '#4A2C15',
  white:   '#FFFFFF',
  sub:     '#FDBA74',
  green:   '#10B981',
  red:     '#EF4444',
};

const BackgroundOrbs = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[s.orb, { width: 240, height: 240, borderRadius: 120, top: -60, right: -60, backgroundColor: P.violet + '22' }]} />
    <View style={[s.orb, { width: 160, height: 160, borderRadius: 80,  bottom: 100, left: -40, backgroundColor: P.purple + '18' }]} />
  </View>
);

// Animated PIN dot (same as LoginScreen)
const PinDot = ({ filled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const prev  = useRef(false);
  useEffect(() => {
    if (filled && !prev.current) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
        Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }),
      ]).start();
    }
    prev.current = filled;
  }, [filled]);
  return (
    <Animated.View style={[s.pinDot, filled && s.pinDotFilled, { transform: [{ scale }] }]} />
  );
};

// Number pad key
const NumKey = ({ label, onPress, isDelete, isEmpty }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 70, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };
  if (isEmpty) return <View style={s.numKeyEmpty} />;
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[s.numKey, isDelete && s.numKeyDelete, { transform: [{ scale }] }]}>
        {isDelete
          ? <Ionicons name="backspace-outline" size={22} color={P.sub} />
          : <Text style={s.numKeyTxt}>{label}</Text>
        }
      </Animated.View>
    </TouchableOpacity>
  );
};

const SwitchAccountScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin,          setPin]          = useState('');
  const [step,         setStep]         = useState(1);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const correctPin = '1111';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  // Auto-verify when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      setTimeout(() => {
        if (pin === correctPin) {
          navigation.navigate({ name: 'Login', params: { newAccount: getFullMobileNumber() }, merge: true });
        } else {
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
          ]).start();
          setTimeout(() => setPin(''), 300);
          Alert.alert('Incorrect MPIN', 'Please try again. Hint: use 1111');
        }
      }, 120);
    }
  }, [pin]);

  const handleNumberPress = (n) => { if (pin.length < 4) setPin(p => p + n); };
  const handleDelete      = () => setPin(p => p.slice(0, -1));

  const handleMobileNumberChange = (text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) setMobileNumber(digits);
  };

  const getFullMobileNumber = () => `+63${mobileNumber}`;

  const validatePhilippineMobileNumber = () =>
    mobileNumber.length === 10 && mobileNumber.startsWith('9');

  const handleContinue = () => {
    if (!validatePhilippineMobileNumber()) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit PH mobile number starting with 9');
      return;
    }
    setStep(2);
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={P.deep} />
      <BackgroundOrbs />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color={P.light} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{step === 1 ? 'Switch Account' : 'Verify MPIN'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
        >

          {step === 1 ? (
            /* ── Step 1: Phone number ── */
            <>
              <View style={s.stepIconWrap}>
                <Ionicons name="phone-portrait-outline" size={36} color={P.light} />
              </View>
              <Text style={s.stepTitle}>Enter Mobile Number</Text>
              <Text style={s.stepDesc}>Enter the phone number linked to the account you want to switch to.</Text>

              {/* Phone input card */}
              <View style={s.phoneCard}>
                <Text style={s.fieldLabel}>Philippine Mobile Number</Text>
                <View style={s.phoneRow}>
                  <View style={s.prefixBox}>
                    <Text style={s.flagEmoji}>🇵🇭</Text>
                    <Text style={s.prefixTxt}>+63</Text>
                  </View>
                  <TextInput
                    style={s.phoneInput}
                    placeholder="9XXXXXXXXX"
                    placeholderTextColor={P.border}
                    value={mobileNumber}
                    onChangeText={handleMobileNumberChange}
                    keyboardType="phone-pad"
                    autoFocus
                    maxLength={10}
                  />
                </View>
                <Text style={s.phoneHint}>10-digit number starting with 9</Text>
              </View>

              <TouchableOpacity
                style={[s.primaryBtn, !validatePhilippineMobileNumber() && s.primaryBtnDisabled]}
                onPress={handleContinue}
                disabled={!validatePhilippineMobileNumber()}
                activeOpacity={0.85}
              >
                <Text style={s.primaryBtnTxt}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={P.white} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </>
          ) : (
            /* ── Step 2: PIN ── */
            <>
              <View style={s.stepIconWrap}>
                <Ionicons name="lock-closed-outline" size={36} color={P.light} />
              </View>
              <Text style={s.stepTitle}>Verify MPIN</Text>
              <Text style={s.stepDesc}>
                Enter the MPIN for{'\n'}
                <Text style={s.phoneHighlight}>+63 {mobileNumber}</Text>
              </Text>

              {/* PIN dots */}
              <Text style={s.pinLabel}>Enter MPIN</Text>
              <Animated.View style={[s.pinRow, { transform: [{ translateX: shakeAnim }] }]}>
                {[0,1,2,3].map(i => <PinDot key={i} filled={i < pin.length} />)}
              </Animated.View>

              {/* Number pad */}
              <View style={s.numPad}>
                {[[1,2,3],[4,5,6],[7,8,9]].map((row, ri) => (
                  <View key={ri} style={s.numRow}>
                    {row.map(n => <NumKey key={n} label={String(n)} onPress={() => handleNumberPress(String(n))} />)}
                  </View>
                ))}
                <View style={s.numRow}>
                  <NumKey isEmpty />
                  <NumKey label="0" onPress={() => handleNumberPress('0')} />
                  <NumKey isDelete onPress={handleDelete} />
                </View>
              </View>
            </>
          )}

          {/* Cancel link */}
          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <Text style={s.cancelTxt}>Cancel</Text>
          </TouchableOpacity>

        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.deep },
  orb:       { position: 'absolute' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: P.border,
    backgroundColor: P.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: P.white },

  content: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40 },

  stepIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: P.violet + '30',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  stepTitle: { fontSize: 24, fontWeight: '800', color: P.white, marginBottom: 10, textAlign: 'center' },
  stepDesc:  { fontSize: 14, color: P.sub, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  phoneHighlight: { color: P.light, fontWeight: '700' },

  // Phone card
  phoneCard: {
    backgroundColor: P.surface,
    borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: P.border,
    width: '100%', marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: P.sub,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
  },
  phoneRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  prefixBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: P.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  flagEmoji: { fontSize: 16 },
  prefixTxt: { fontSize: 15, fontWeight: '700', color: P.white },
  phoneInput: {
    flex: 1, backgroundColor: P.deep,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 18, fontWeight: '600', color: P.white,
    borderWidth: 1, borderColor: P.border,
  },
  phoneHint: { fontSize: 11, color: P.sub },

  // Primary button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: P.violet,
    borderRadius: 16, paddingVertical: 16,
    width: '100%', marginBottom: 16,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  primaryBtnDisabled: { backgroundColor: P.border, shadowOpacity: 0 },
  primaryBtnTxt: { color: P.white, fontSize: 16, fontWeight: '700' },

  // PIN
  pinLabel: {
    fontSize: 12, color: P.sub, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 18,
  },
  pinRow:   { flexDirection: 'row', gap: 18, marginBottom: 36 },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: P.border,
  },
  pinDotFilled: {
    backgroundColor: P.purple, borderColor: P.purple,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 4,
  },

  // Number pad
  numPad:    { width: '100%', marginBottom: 28 },
  numRow:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  numKey: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: P.surface,
    borderWidth: 1, borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
  },
  numKeyDelete: { backgroundColor: 'transparent', borderColor: 'transparent', shadowOpacity: 0 },
  numKeyEmpty:  { width: 72, height: 72 },
  numKeyTxt:    { fontSize: 22, fontWeight: '600', color: P.white },

  cancelBtn: { paddingVertical: 12 },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: P.sub },
});

export default SwitchAccountScreen;