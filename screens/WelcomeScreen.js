import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ─── Brand palette (shared across all auth screens) ───────────────────────────
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
  orange:  '#F97316',
  green:   '#10B981',
};

// ─── Background orbs ──────────────────────────────────────────────────────────
const BackgroundOrbs = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[s.orb, { width: 320, height: 320, borderRadius: 160, top: -100, left: -100, backgroundColor: P.violet + '25' }]} />
    <View style={[s.orb, { width: 200, height: 200, borderRadius: 100, top: 200, right: -60,  backgroundColor: P.purple + '18' }]} />
    <View style={[s.orb, { width: 260, height: 260, borderRadius: 130, bottom: -80, right: -80, backgroundColor: P.mid + '40' }]} />
    <View style={[s.orb, { width: 140, height: 140, borderRadius: 70,  bottom: 160, left: -40,  backgroundColor: P.violet + '20' }]} />
  </View>
);

const WelcomeScreen = ({ navigation }) => {
  // Staggered entrance animations
  const logoFade   = useRef(new Animated.Value(0)).current;
  const logoSlide  = useRef(new Animated.Value(-30)).current;
  const textFade   = useRef(new Animated.Value(0)).current;
  const textSlide  = useRef(new Animated.Value(20)).current;
  const btnFade    = useRef(new Animated.Value(0)).current;
  const btnSlide   = useRef(new Animated.Value(30)).current;
  const taglineFade = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo bounces in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.timing(logoFade,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(logoSlide, { toValue: 0, friction: 8,  useNativeDriver: true }),
      ]),
      // Tagline fades in
      Animated.timing(taglineFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Text block slides up
      Animated.parallel([
        Animated.timing(textFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(textSlide, { toValue: 0, friction: 8,   useNativeDriver: true }),
      ]),
      // Buttons appear
      Animated.parallel([
        Animated.timing(btnFade,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(btnSlide, { toValue: 0, friction: 8,   useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={P.deep} />
      <BackgroundOrbs />

      <View style={s.content}>

        {/* ── Logo area ── */}
        <Animated.View style={[s.logoArea, {
          opacity: logoFade,
          transform: [{ translateY: logoSlide }, { scale: logoScale }],
        }]}>
          {/* Glow ring */}
          <View style={s.logoRing}>
            <View style={s.logoRingInner}>
              <Image
                source={require('../assets/LoraLogo.png')}
                style={s.logoImg}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Brand name */}
          <Text style={s.brandName}>Lora</Text>
        </Animated.View>

        {/* ── Tagline ── */}
        <Animated.View style={{ opacity: taglineFade, alignItems: 'center', marginBottom: 48 }}>
          <View style={s.taglineRow}>
            {['Secure', 'Fast', 'Smart Finance'].map((word, i) => (
              <React.Fragment key={word}>
                {i > 0 && <View style={s.taglineDot} />}
                <Text style={s.taglineWord}>{word}</Text>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* ── Hero text ── */}
        <Animated.View style={[s.heroBlock, {
          opacity: textFade,
          transform: [{ translateY: textSlide }],
        }]}>
          <Text style={s.heroTitle}>Your money,{'\n'}your way.</Text>
          <Text style={s.heroSub}>
            Apply for loans, manage payments, and build your credit — all in one secure place.
          </Text>
        </Animated.View>

        {/* ── Feature pills ── */}
        <Animated.View style={[s.pillRow, { opacity: textFade }]}>
          {[
            { icon: '🏦', label: 'Instant Loans' },
            { icon: '💳', label: 'Smart Wallet' },
            { icon: '📊', label: 'Credit Score' },
          ].map(pill => (
            <View key={pill.label} style={s.pill}>
              <Text style={s.pillIcon}>{pill.icon}</Text>
              <Text style={s.pillLabel}>{pill.label}</Text>
            </View>
          ))}
        </Animated.View>

      </View>

      {/* ── Bottom CTA block ── */}
      <Animated.View style={[s.ctaBlock, {
        opacity: btnFade,
        transform: [{ translateY: btnSlide }],
      }]}>
        {/* Create account — primary */}
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => navigation.navigate('CreateAccount')}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnTxt}>Create Account</Text>
        </TouchableOpacity>

        {/* Log in — secondary ghost */}
        <TouchableOpacity
          style={s.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={s.secondaryBtnTxt}>Log In</Text>
        </TouchableOpacity>

        {/* Fine print */}
        <Text style={s.finePrint}>
          By continuing, you agree to our{' '}
          <Text style={s.finePrintLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={s.finePrintLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>

    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: P.deep },
  orb:       { position: 'absolute' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },

  // ── Logo ──
  logoArea: { alignItems: 'center', marginBottom: 12 },
  logoRing: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: P.violet + '35',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 14,
  },
  logoRingInner: {
    width: 90, height: 90, borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: P.purple + '70',
  },
  logoImg:   { width: '100%', height: '100%' },
  brandName: {
    fontSize: 38, fontWeight: '900',
    color: P.white, letterSpacing: -1.5,
  },

  // ── Tagline ──
  taglineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taglineDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: P.border },
  taglineWord:{ fontSize: 11, color: P.sub, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },

  // ── Hero text ──
  heroBlock: { alignItems: 'center', marginBottom: 28 },
  heroTitle: {
    fontSize: 34, fontWeight: '900', color: P.white,
    textAlign: 'center', lineHeight: 42, letterSpacing: -0.8,
    marginBottom: 14,
  },
  heroSub: {
    fontSize: 15, color: P.sub, textAlign: 'center',
    lineHeight: 22, maxWidth: 280,
  },

  // ── Feature pills ──
  pillRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: P.surface,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: P.border,
  },
  pillIcon:  { fontSize: 13 },
  pillLabel: { fontSize: 11, fontWeight: '600', color: P.light },

  // ── CTA block ──
  ctaBlock: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: P.violet,
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16, elevation: 10,
  },
  primaryBtnTxt: { color: P.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  secondaryBtn: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: P.border,
    backgroundColor: P.surface,
  },
  secondaryBtnTxt: { color: P.light, fontSize: 16, fontWeight: '700' },

  finePrint:     { fontSize: 11, color: P.border, textAlign: 'center', lineHeight: 17 },
  finePrintLink: { color: P.sub, textDecorationLine: 'underline' },
});

export default WelcomeScreen;