import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ─── Brand colours ────────────────────────────────────────────────────────────
const P = {
  deep:    '#1C1007',
  mid:     '#2D1A08',
  violet:  '#EA580C',
  purple:  '#FB923C',
  light:   '#FED7AA',
  surface: '#2A1810',
  border:  '#4A2C15',
  white:   '#FFFFFF',
  offwhite:'#FFF7ED',
  sub:     '#FDBA74',
  orange:  '#F97316',
  green:   '#10B981',
  red:     '#EF4444',
};

// ─── Floating orb background decoration ──────────────────────────────────────
const BackgroundOrbs = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[bg.orb, { width: 260, height: 260, borderRadius: 130, top: -60, left: -80, backgroundColor: P.violet + '28' }]} />
    <View style={[bg.orb, { width: 180, height: 180, borderRadius: 90,  top: 120, right: -50, backgroundColor: P.purple + '20' }]} />
    <View style={[bg.orb, { width: 140, height: 140, borderRadius: 70,  bottom: 200, left: 30, backgroundColor: P.violet + '18' }]} />
    <View style={[bg.orb, { width: 220, height: 220, borderRadius: 110, bottom: -80, right: -60, backgroundColor: P.purple + '15' }]} />
  </View>
);
const bg = StyleSheet.create({ orb: { position: 'absolute' } });

// ─── Animated PIN dot ─────────────────────────────────────────────────────────
const PinDot = ({ filled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const prevFilled = useRef(false);

  useEffect(() => {
    if (filled && !prevFilled.current) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
        Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }),
      ]).start();
    }
    prevFilled.current = filled;
  }, [filled]);

  return (
    <Animated.View style={[
      s.pinDot,
      filled && s.pinDotFilled,
      { transform: [{ scale }] },
    ]} />
  );
};

// ─── Number pad key ───────────────────────────────────────────────────────────
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

// ─── Shared sub-screen header ─────────────────────────────────────────────────
const SubHeader = ({ title, onBack }) => (
  <View style={s.subHeader}>
    <TouchableOpacity style={s.subBackBtn} onPress={onBack} activeOpacity={0.75}>
      <Ionicons name="arrow-back" size={20} color={P.light} />
    </TouchableOpacity>
    <Text style={s.subHeaderTitle}>{title}</Text>
    <View style={{ width: 40 }} />
  </View>
);

// ─── Step progress indicator ──────────────────────────────────────────────────
const StepProgress = ({ current, total }) => (
  <View style={s.stepRow}>
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <View style={[s.stepDot, i < current && s.stepDotDone, i === current - 1 && s.stepDotActive]}>
          {i < current - 1
            ? <Ionicons name="checkmark" size={12} color={P.white} />
            : <Text style={[s.stepDotTxt, i === current - 1 && { color: P.white }]}>{i + 1}</Text>
          }
        </View>
        {i < total - 1 && <View style={[s.stepLine, i < current - 1 && s.stepLineDone]} />}
      </React.Fragment>
    ))}
  </View>
);

// ─── Input field ──────────────────────────────────────────────────────────────
const Field = ({ label, ...props }) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput style={s.fieldInput} placeholderTextColor={P.border} {...props} />
  </View>
);

// ─── Primary action button ────────────────────────────────────────────────────
const PrimaryBtn = ({ title, onPress, disabled, icon }) => (
  <TouchableOpacity
    style={[s.primaryBtn, disabled && s.primaryBtnDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
  >
    {icon && <MaterialIcons name={icon} size={18} color={P.white} style={{ marginRight: 6 }} />}
    <Text style={s.primaryBtnTxt}>{title}</Text>
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const LoginScreen = ({ navigation, route }) => {
  const [pin, setPin] = useState('');
  const [currentAccount, setCurrentAccount] = useState('+63949150024');
  const [currentScreen, setCurrentScreen] = useState('login');

  // Switch Account
  const [accounts, setAccounts] = useState([
    { id: '1', phoneNumber: '+63949150024', name: 'John Doe',    isActive: true  },
    { id: '2', phoneNumber: '+63917123456', name: 'Jane Smith',  isActive: false },
    { id: '3', phoneNumber: '+63928765432', name: 'Bob Johnson', isActive: false },
  ]);

  // Forgot PIN
  const [forgotStep,  setForgotStep]  = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp,         setOtp]         = useState('');
  const [newPin,      setNewPin]      = useState('');
  const [confirmPin,  setConfirmPin]  = useState('');

  // Add Existing Account
  const [addExistingStep, setAddExistingStep] = useState(1);
  const [existingPhone,   setExistingPhone]   = useState('');
  const [existingOtp,     setExistingOtp]     = useState('');
  const [existingPin,     setExistingPin]     = useState('');

  // Shake animation for wrong PIN
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn    = useRef(new Animated.Value(0)).current;

  const correctPin = '1111';

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (route.params?.newAccount) {
      setCurrentAccount(route.params.newAccount);
      setPin('');
      navigation.setParams({ newAccount: undefined });
    }
  }, [route.params, navigation]);

  // Auto-login when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      setTimeout(() => {
        if (pin === correctPin) {
          navigation.navigate('Dashboard');
        } else {
          Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8,   duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8,  duration: 50, useNativeDriver: true }),
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
  const handleBackToLogin = () => { setCurrentScreen('login'); setPin(''); };

  const handleSelectAccount = (account) => {
    Alert.alert('Switch Account', `Switch to ${account.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Switch', onPress: () => { setCurrentAccount(account.phoneNumber); setCurrentScreen('login'); setPin(''); } },
    ]);
  };

  const handleAddExistingAccount = () => { setCurrentScreen('addExisting'); setAddExistingStep(1); setExistingPhone(''); setExistingOtp(''); setExistingPin(''); };

  const handleSendExistingOTP = () => {
    if (existingPhone.length < 10) { Alert.alert('Invalid Number', 'Please enter a valid phone number'); return; }
    if (accounts.some(a => a.phoneNumber === existingPhone)) { Alert.alert('Already Added', 'This account is already on this device'); return; }
    Alert.alert('OTP Sent', `Verification code sent to ${existingPhone}`, [{ text: 'OK', onPress: () => setAddExistingStep(2) }]);
  };

  const handleVerifyExistingOTP = () => {
    if (existingOtp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit code'); return; }
    if (existingOtp === '123456') { setAddExistingStep(3); }
    else { Alert.alert('Wrong Code', 'Use 123456 for testing'); }
  };

  const handleVerifyExistingPin = () => {
    if (existingPin.length !== 4) { Alert.alert('Invalid PIN', 'PIN must be 4 digits'); return; }
    if (existingPin === '1111') {
      setAccounts(prev => [...prev, { id: (prev.length + 1).toString(), phoneNumber: existingPhone, name: 'User ' + (prev.length + 1), isActive: false }]);
      Alert.alert('Account Added!', 'Account added successfully', [{ text: 'OK', onPress: () => setCurrentScreen('switch') }]);
    } else { Alert.alert('Wrong PIN', 'Use 1111 for testing'); }
  };

  const handleSendOTP = () => {
    if (phoneNumber.length < 10) { Alert.alert('Invalid Number', 'Please enter a valid phone number'); return; }
    Alert.alert('OTP Sent', `Verification code sent to ${phoneNumber}`, [{ text: 'OK', onPress: () => setForgotStep(2) }]);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) { Alert.alert('Invalid OTP', 'Enter the 6-digit code'); return; }
    if (otp === '123456') { setForgotStep(3); }
    else { Alert.alert('Wrong Code', 'Use 123456 for testing'); }
  };

  const handleResetPin = () => {
    if (newPin.length !== 4)   { Alert.alert('Invalid PIN', 'PIN must be 4 digits'); return; }
    if (newPin !== confirmPin)  { Alert.alert('Mismatch', 'PINs do not match'); return; }
    Alert.alert('PIN Reset!', 'Your MPIN has been reset', [{ text: 'OK', onPress: () => { setCurrentScreen('login'); setPin(''); } }]);
  };

  // ── Masked phone display ────────────────────────────────────────────────────
  const maskPhone = (phone) => {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 4) + ' ···· ' + phone.slice(-4);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  const renderLogin = () => (
    <Animated.View style={[s.loginRoot, { opacity: fadeIn }]}>
      <BackgroundOrbs />

      {/* ── Top brand area ── */}
      <View style={s.brandArea}>
        {/* Logo with glow ring */}
        <View style={s.logoRing}>
          <View style={s.logoRingInner}>
            <Image
              source={require('../assets/LoraLogo.png')}
              style={s.logoImg}
              resizeMode="cover"
            />
          </View>
        </View>

        <Text style={s.brandName}>Lora</Text>
        <Text style={s.brandTagline}>Secure · Fast · Smart Finance</Text>
      </View>

      {/* ── Account chip ── */}
      <TouchableOpacity style={s.accountChip} onPress={() => setCurrentScreen('switch')} activeOpacity={0.8}>
        <View style={s.accountChipAvatar}>
          <Text style={s.accountChipAvatarTxt}>
            {accounts.find(a => a.phoneNumber === currentAccount)?.name?.[0] ?? 'U'}
          </Text>
        </View>
        <View style={s.accountChipMid}>
          <Text style={s.accountChipName}>
            {accounts.find(a => a.phoneNumber === currentAccount)?.name ?? 'User'}
          </Text>
          <Text style={s.accountChipPhone}>{maskPhone(currentAccount)}</Text>
        </View>
        <View style={s.accountChipArrow}>
          <Ionicons name="chevron-down" size={14} color={P.sub} />
        </View>
      </TouchableOpacity>

      {/* ── PIN label ── */}
      <Text style={s.pinLabel}>Enter MPIN</Text>

      {/* ── PIN dots ── */}
      <Animated.View style={[s.pinRow, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map(i => <PinDot key={i} filled={i < pin.length} />)}
      </Animated.View>

      {/* ── Number pad ── */}
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

      {/* ── Footer links ── */}
      <View style={s.footerLinks}>
        <TouchableOpacity onPress={() => navigation.navigate('CreateAccount')} activeOpacity={0.8}>
          <Text style={s.footerLinkBlue}>Create Account</Text>
        </TouchableOpacity>
        <View style={s.footerDivider} />
        <TouchableOpacity onPress={() => { setCurrentScreen('forgot'); setForgotStep(1); setPhoneNumber(''); setOtp(''); setNewPin(''); setConfirmPin(''); }} activeOpacity={0.8}>
          <Text style={s.footerLinkSub}>Forgot MPIN?</Text>
        </TouchableOpacity>
      </View>

      {/* ── Biometric hint ── */}
      <View style={s.biometricRow}>
        <MaterialIcons name="fingerprint" size={20} color={P.sub} />
        <Text style={s.biometricTxt}>or use biometric login</Text>
      </View>
    </Animated.View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SWITCH ACCOUNT SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  const renderSwitch = () => (
    <View style={s.subRoot}>
      <SubHeader title="Switch Account" onBack={handleBackToLogin} />
      <ScrollView contentContainerStyle={s.subContent} showsVerticalScrollIndicator={false}>

        <Text style={s.subSectionLabel}>YOUR ACCOUNTS</Text>

        {accounts.map((account) => {
          const isActive = account.phoneNumber === currentAccount;
          return (
            <TouchableOpacity
              key={account.id}
              style={[s.accountCard, isActive && s.accountCardActive]}
              onPress={() => handleSelectAccount(account)}
              activeOpacity={0.78}
            >
              <View style={[s.accountCardAvatar, { backgroundColor: isActive ? P.violet : P.surface }]}>
                <Text style={s.accountCardAvatarTxt}>{account.name.charAt(0)}</Text>
              </View>
              <View style={s.accountCardMid}>
                <Text style={s.accountCardName}>{account.name}</Text>
                <Text style={s.accountCardPhone}>{account.phoneNumber}</Text>
              </View>
              {isActive ? (
                <View style={s.activeBadge}>
                  <View style={s.activeBadgeDot} />
                  <Text style={s.activeBadgeTxt}>Active</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={P.sub} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add account dashed card */}
        <TouchableOpacity style={s.addAccountCard} onPress={handleAddExistingAccount} activeOpacity={0.75}>
          <View style={s.addAccountIconBox}>
            <Ionicons name="add" size={20} color={P.purple} />
          </View>
          <Text style={s.addAccountTxt}>Add Existing Account</Text>
          <Ionicons name="chevron-forward" size={16} color={P.purple} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // FORGOT PIN SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  const renderForgot = () => (
    <View style={s.subRoot}>
      <SubHeader title="Reset MPIN" onBack={handleBackToLogin} />
      <ScrollView contentContainerStyle={s.subContent} showsVerticalScrollIndicator={false}>

        <StepProgress current={forgotStep} total={3} />

        <Text style={s.subScreenTitle}>
          {forgotStep === 1 ? 'Verify Phone Number' : forgotStep === 2 ? 'Enter OTP Code' : 'Set New MPIN'}
        </Text>
        <Text style={s.subScreenDesc}>
          {forgotStep === 1 ? 'Enter your registered phone number to receive a verification code.'
           : forgotStep === 2 ? `Enter the 6-digit code sent to ${phoneNumber}.`
           : 'Choose a new 4-digit MPIN for your account.'}
        </Text>

        {forgotStep === 1 && (
          <>
            <Field label="Phone Number" placeholder="+63 9XX XXX XXXX" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" maxLength={13} />
            <PrimaryBtn title="Send OTP" onPress={handleSendOTP} icon="send" />
          </>
        )}

        {forgotStep === 2 && (
          <>
            <Field label="Verification Code" placeholder="••••••" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
            <TouchableOpacity style={s.resendBtn} onPress={handleSendOTP} activeOpacity={0.8}>
              <Ionicons name="refresh" size={14} color={P.purple} />
              <Text style={s.resendBtnTxt}>Resend OTP</Text>
            </TouchableOpacity>
            <PrimaryBtn title="Verify Code" onPress={handleVerifyOTP} icon="verified" />
          </>
        )}

        {forgotStep === 3 && (
          <>
            <Field label="New MPIN" placeholder="••••" value={newPin} onChangeText={setNewPin} keyboardType="number-pad" maxLength={4} secureTextEntry />
            <Field label="Confirm MPIN" placeholder="••••" value={confirmPin} onChangeText={setConfirmPin} keyboardType="number-pad" maxLength={4} secureTextEntry />
            <PrimaryBtn title="Reset MPIN" onPress={handleResetPin} icon="lock-reset" />
          </>
        )}

      </ScrollView>
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ADD EXISTING ACCOUNT SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  const renderAddExisting = () => (
    <View style={s.subRoot}>
      <SubHeader title="Add Account" onBack={() => setCurrentScreen('switch')} />
      <ScrollView contentContainerStyle={s.subContent} showsVerticalScrollIndicator={false}>

        <StepProgress current={addExistingStep} total={3} />

        <Text style={s.subScreenTitle}>
          {addExistingStep === 1 ? 'Enter Phone Number' : addExistingStep === 2 ? 'Verify OTP' : 'Confirm Your MPIN'}
        </Text>
        <Text style={s.subScreenDesc}>
          {addExistingStep === 1 ? 'Enter the phone number linked to your existing Lora account.'
           : addExistingStep === 2 ? `Enter the 6-digit code sent to ${existingPhone}.`
           : 'Enter your MPIN to verify account ownership.'}
        </Text>

        {addExistingStep === 1 && (
          <>
            <Field label="Phone Number" placeholder="+63 9XX XXX XXXX" value={existingPhone} onChangeText={setExistingPhone} keyboardType="phone-pad" maxLength={13} />
            <PrimaryBtn title="Send OTP" onPress={handleSendExistingOTP} icon="send" />
          </>
        )}

        {addExistingStep === 2 && (
          <>
            <Field label="Verification Code" placeholder="••••••" value={existingOtp} onChangeText={setExistingOtp} keyboardType="number-pad" maxLength={6} />
            <TouchableOpacity style={s.resendBtn} onPress={handleSendExistingOTP} activeOpacity={0.8}>
              <Ionicons name="refresh" size={14} color={P.purple} />
              <Text style={s.resendBtnTxt}>Resend OTP</Text>
            </TouchableOpacity>
            <PrimaryBtn title="Verify Code" onPress={handleVerifyExistingOTP} icon="verified" />
          </>
        )}

        {addExistingStep === 3 && (
          <>
            <Field label="Enter MPIN" placeholder="••••" value={existingPin} onChangeText={setExistingPin} keyboardType="number-pad" maxLength={4} secureTextEntry />
            <PrimaryBtn title="Verify & Add Account" onPress={handleVerifyExistingPin} icon="person-add" />
          </>
        )}

      </ScrollView>
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ROOT RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={P.deep} />
      {currentScreen === 'login'       && renderLogin()}
      {currentScreen === 'switch'      && renderSwitch()}
      {currentScreen === 'forgot'      && renderForgot()}
      {currentScreen === 'addExisting' && renderAddExisting()}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  container: { flex: 1, backgroundColor: P.deep },

  // ── Login root ──
  loginRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 16,
  },

  // ── Brand area ──
  brandArea: { alignItems: 'center', marginBottom: 28 },

  logoRing: {
    width: 96, height: 96, borderRadius: 30,
    backgroundColor: P.violet + '30',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoRingInner: {
    width: 78, height: 78, borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: P.purple + '60',
  },
  logoImg:  { width: '100%', height: '100%' },

  brandName: {
    fontSize: 32, fontWeight: '900',
    color: P.white, letterSpacing: -1,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 12, color: P.sub, letterSpacing: 1.2,
    fontWeight: '500', textTransform: 'uppercase',
  },

  // ── Account chip ──
  accountChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.surface,
    borderRadius: 18, borderWidth: 1, borderColor: P.border,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 28, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  accountChipAvatar: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: P.violet,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  accountChipAvatarTxt: { fontSize: 15, fontWeight: '800', color: P.white },
  accountChipMid: { flex: 1 },
  accountChipName:  { fontSize: 13, fontWeight: '700', color: P.white, marginBottom: 1 },
  accountChipPhone: { fontSize: 11, color: P.sub },
  accountChipArrow: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── PIN ──
  pinLabel: {
    fontSize: 13, color: P.sub, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 18,
  },
  pinRow: {
    flexDirection: 'row', gap: 18, marginBottom: 36,
  },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: P.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: P.purple,
    borderColor: P.purple,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Number pad ──
  numPad:  { width: '100%', marginBottom: 28 },
  numRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  numKey: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: P.surface,
    borderWidth: 1, borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
  },
  numKeyDelete: {
    backgroundColor: 'transparent', borderColor: 'transparent',
    shadowOpacity: 0,
  },
  numKeyEmpty: { width: 72, height: 72 },
  numKeyTxt: {
    fontSize: 22, fontWeight: '600', color: P.white,
  },

  // ── Footer ──
  footerLinks: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20,
  },
  footerLinkBlue: { fontSize: 14, fontWeight: '600', color: '#FB923C' },
  footerLinkSub:  { fontSize: 14, fontWeight: '500', color: P.sub },
  footerDivider:  { width: 1, height: 14, backgroundColor: P.border },

  biometricRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  biometricTxt: { fontSize: 12, color: P.sub },

  // ─────────────────────────────────────────────────────────────────────────
  // SUB-SCREENS (Switch / Forgot / AddExisting)
  // ─────────────────────────────────────────────────────────────────────────
  subRoot:    { flex: 1 },
  subContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },

  // Sub-screen header
  subHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: P.border,
    backgroundColor: P.surface,
  },
  subBackBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },
  subHeaderTitle: { fontSize: 17, fontWeight: '700', color: P.white },

  // Step progress
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 20, marginBottom: 28,
  },
  stepDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: P.surface,
    borderWidth: 1.5, borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: P.violet, borderColor: P.violet },
  stepDotDone:   { backgroundColor: P.violet, borderColor: P.violet },
  stepDotTxt:    { fontSize: 13, fontWeight: '700', color: P.sub },
  stepLine:      { width: 44, height: 2, backgroundColor: P.border },
  stepLineDone:  { backgroundColor: P.violet },

  subScreenTitle: {
    fontSize: 22, fontWeight: '800', color: P.white,
    marginBottom: 8, textAlign: 'center',
  },
  subScreenDesc: {
    fontSize: 13, color: P.sub, textAlign: 'center',
    lineHeight: 19, marginBottom: 28,
  },

  // Account cards (switch screen)
  subSectionLabel: {
    fontSize: 10, fontWeight: '700', color: P.sub,
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginBottom: 12, marginTop: 4,
  },
  accountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.surface,
    borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1.5,
    borderColor: P.border,
  },
  accountCardActive: {
    borderColor: P.purple,
    backgroundColor: P.violet + '25',
  },
  accountCardAvatar: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  accountCardAvatarTxt: { fontSize: 18, fontWeight: '800', color: P.white },
  accountCardMid:  { flex: 1 },
  accountCardName: { fontSize: 15, fontWeight: '700', color: P.white, marginBottom: 2 },
  accountCardPhone:{ fontSize: 12, color: P.sub },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: P.violet + '40',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: P.purple + '60',
  },
  activeBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.green },
  activeBadgeTxt: { fontSize: 11, fontWeight: '700', color: P.light },

  addAccountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: P.purple + '50',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addAccountIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: P.violet + '30',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  addAccountTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: P.purple },

  // Input field
  fieldWrap:  { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: P.sub,
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: P.surface,
    borderWidth: 1.5, borderColor: P.border,
    borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 16,
    color: P.white,
  },

  // Primary button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: P.violet,
    borderRadius: 14, paddingVertical: 16,
    marginTop: 6,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  primaryBtnDisabled: { backgroundColor: P.border, shadowOpacity: 0 },
  primaryBtnTxt: { color: P.white, fontSize: 16, fontWeight: '700' },

  // Resend
  resendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12, marginBottom: 4,
  },
  resendBtnTxt: { fontSize: 13, fontWeight: '600', color: P.purple },
});

export default LoginScreen;