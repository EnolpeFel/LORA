import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Alert, Image, Keyboard, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, TouchableWithoutFeedback,
  View, ActivityIndicator, Dimensions, Platform, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
  amber:   '#F59E0B',
  red:     '#EF4444',
  card:    '#221206',
};

// All 7 steps
const STEPS = ['Phone', 'OTP', 'Details', 'Address', 'Employment', 'PIN', 'Face'];
const STEP_SCREENS = ['registration', 'verification', 'details', 'address', 'employment', 'pin', 'face'];

// ─── Shared header with logo ─────────────────────────────────────────────────
const Header = ({ title, onBack, profileImage, onPickImage, currentStep }) => (
  <View style={s.header}>
    {onBack ? (
      <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.75}>
        <Ionicons name="arrow-back" size={20} color={P.light} />
      </TouchableOpacity>
    ) : <View style={{ width: 40 }} />}

    <View style={s.headerMid}>
      <Text style={s.headerTitle}>{title}</Text>
      {currentStep !== undefined && (
        <Text style={s.headerStep}>Step {currentStep + 1} of {STEPS.length}</Text>
      )}
    </View>

    <TouchableOpacity onPress={onPickImage} activeOpacity={0.8} style={s.avatarBtn}>
      {profileImage ? (
        <Image source={{ uri: profileImage }} style={s.avatarImg} />
      ) : (
        <View style={s.avatarPlaceholder}>
          <Image source={require('../assets/LoraLogo.png')} style={s.avatarLogo} resizeMode="cover" />
        </View>
      )}
    </TouchableOpacity>
  </View>
);

// ─── Step progress bar ────────────────────────────────────────────────────────
const StepBar = ({ current }) => (
  <View style={s.stepBar}>
    {STEPS.map((label, i) => {
      const done   = i < current;
      const active = i === current;
      return (
        <View key={label} style={s.stepBarItem}>
          <View style={[s.stepBarDot, done && s.stepBarDotDone, active && s.stepBarDotActive]}>
            {done
              ? <Ionicons name="checkmark" size={10} color={P.white} />
              : <Text style={[s.stepBarNum, active && { color: P.white }]}>{i + 1}</Text>}
          </View>
          <Text style={[s.stepBarLabel, active && s.stepBarLabelActive, done && s.stepBarLabelDone]}>
            {label}
          </Text>
        </View>
      );
    })}
  </View>
);

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionHead = ({ title }) => (
  <View style={s.sectionHead}>
    <View style={s.sectionHeadLine} />
    <Text style={s.sectionHeadTxt}>{title}</Text>
    <View style={s.sectionHeadLine} />
  </View>
);

// ─── Text input ───────────────────────────────────────────────────────────────
const Field = ({ label, optional, ...props }) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}{optional ? <Text style={s.fieldOpt}> (optional)</Text> : null}</Text>
    <TextInput style={s.fieldInput} placeholderTextColor={P.border} {...props} />
  </View>
);

// ─── Checkbox row ─────────────────────────────────────────────────────────────
const CheckRow = ({ checked, onPress, children }) => (
  <TouchableOpacity style={s.checkRow} onPress={onPress} activeOpacity={0.8}>
    <View style={[s.checkbox, checked && s.checkboxOn]}>
      {checked && <Ionicons name="checkmark" size={12} color={P.white} />}
    </View>
    <Text style={s.checkTxt}>{children}</Text>
  </TouchableOpacity>
);

// ─── Primary button ───────────────────────────────────────────────────────────
const PrimaryBtn = ({ title, onPress, disabled, loading, icon }) => (
  <TouchableOpacity
    style={[s.primaryBtn, disabled && s.primaryBtnDisabled]}
    onPress={onPress} disabled={disabled || loading}
    activeOpacity={0.85}
  >
    {loading
      ? <ActivityIndicator color={P.white} />
      : <>
          {icon && <Ionicons name={icon} size={18} color={P.white} style={{ marginRight: 8 }} />}
          <Text style={s.primaryBtnTxt}>{title}</Text>
        </>
    }
  </TouchableOpacity>
);

// ─── Reminder info box ────────────────────────────────────────────────────────
const InfoBox = ({ icon, title, children, color = P.amber }) => (
  <View style={[s.infoBox, { borderColor: color + '40', backgroundColor: color + '12' }]}>
    <View style={[s.infoIconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      {title ? <Text style={[s.infoTitle, { color }]}>{title}</Text> : null}
      <Text style={[s.infoText, { color: color === P.amber ? '#FDE68A' : P.light }]}>{children}</Text>
    </View>
  </View>
);

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const DropdownField = ({ label, value, placeholder, icon, isOpen, onToggle, options, onSelect, getOptionIcon }) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TouchableOpacity style={[s.dropdownTrigger, isOpen && s.dropdownTriggerOpen]} onPress={onToggle} activeOpacity={0.85}>
      <View style={s.dropdownTriggerLeft}>
        <View style={s.dropdownIconBox}>
          <Text>{icon}</Text>
        </View>
        <Text style={value ? s.dropdownValue : s.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
      </View>
      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={isOpen ? P.purple : P.sub} />
    </TouchableOpacity>
    {isOpen && (
      <View style={s.dropdownList}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt}
            style={[s.dropdownItem, i === options.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.75}
          >
            <View style={s.dropdownIconBox}>
              <Text>{getOptionIcon ? getOptionIcon(opt) : icon}</Text>
            </View>
            <Text style={s.dropdownItemTxt}>{opt}</Text>
            {value === opt && <Ionicons name="checkmark" size={16} color={P.purple} />}
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const CreateAccountScreen = ({ navigation }) => {

  const [screen, setScreen] = useState('registration');

  // Registration
  const [phoneNumber,   setPhoneNumber]   = useState('+63');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP
  const [otp,       setOtp]       = useState(['', '', '', '', '', '']);
  const [timer,     setTimer]     = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef([]);

  // Personal details
  const [userDetails, setUserDetails] = useState({
    firstName: '', middleName: '', lastName: '', suffix: '',
    birthdate: '', gender: '', nationality: '', email: '', agreedDetails: false,
  });

  // Address
  const [address, setAddress] = useState({
    country: '', province: '', municipality: '', barangay: '',
    street: '', zipCode: '', agreedAddress: false,
  });

  // Employment
  const [employment, setEmployment] = useState({
    status: '', employerName: '', jobTitle: '', monthlyIncome: '',
    yearsEmployed: '', agreedEmployment: false,
  });

  // PIN
  const [pin,        setPin]        = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const pinRefs        = useRef([]);
  const confirmPinRefs = useRef([]);
  const [pinError, setPinError] = useState('');

  // Profile image
  const [profileImage, setProfileImage] = useState(null);

  // Face registration
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef       = useRef(null);
  const [faceCapturing, setFaceCapturing]   = useState(false);
  const [faceImageUri,  setFaceImageUri]    = useState(null);
  const [faceScanStep,  setFaceScanStep]    = useState('idle');
  const [countdown,     setCountdown]       = useState(3);
  const [faceHints,     setFaceHints]       = useState('Position your face inside the oval');
  const [cameraReady,   setCameraReady]     = useState(false);
  const countdownInterval = useRef(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scanLineLoop = useRef(null);
  const ovalPulse    = useRef(new Animated.Value(1)).current;
  const ovalPulseLoop = useRef(null);

  // Dropdowns
  const [showGenderDropdown,     setShowGenderDropdown]     = useState(false);
  const [showNationalityDropdown,setShowNationalityDropdown]= useState(false);
  const [showCountryDropdown,    setShowCountryDropdown]    = useState(false);
  const [showProvinceDropdown,   setShowProvinceDropdown]   = useState(false);
  const [showMunicipalityDropdown,setShowMunicipalityDropdown]=useState(false);
  const [showBarangayDropdown,   setShowBarangayDropdown]   = useState(false);
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState(false);

  const genderOptions     = ['Male', 'Female', 'Prefer not to say'];
  const nationalityOptions= ['Filipino', 'Others'];
  const countryOptions    = ['Philippines', 'Others'];
  const provinceOptions   = ['Cebu', 'Metro Manila', 'Davao', 'Iloilo', 'Others'];
  const municipalityOptions=['Cebu City', 'Mandaue', 'Lapu-Lapu', 'Talisay', 'Others'];
  const barangayOptions   = ['Mambaling', 'Duljo', 'Pasil', 'Labangon', 'Pardo', 'Others'];
  const employmentOptions = ['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired'];

  const closeDropdowns = () => {
    setShowGenderDropdown(false); setShowNationalityDropdown(false);
    setShowCountryDropdown(false); setShowProvinceDropdown(false);
    setShowMunicipalityDropdown(false); setShowBarangayDropdown(false);
    setShowEmploymentDropdown(false);
  };

  // OTP timer
  useEffect(() => {
    let interval;
    if (screen === 'verification' && timer > 0) {
      interval = setInterval(() => setTimer(p => p - 1), 1000);
    } else if (timer === 0) setCanResend(true);
    return () => clearInterval(interval);
  }, [screen, timer]);

  // Cleanup face scan
  useEffect(() => {
    return () => {
      clearInterval(countdownInterval.current);
      if (scanLineLoop.current)  scanLineLoop.current.stop();
      if (ovalPulseLoop.current) ovalPulseLoop.current.stop();
    };
  }, []);

  const formatTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  // ── Scan line animation ───────────────────────────────────────────────────
  const startScanLineAnimation = useCallback(() => {
    scanLineAnim.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    scanLineLoop.current = loop;
    loop.start();
  }, [scanLineAnim]);

  const stopScanLineAnimation = useCallback(() => {
    if (scanLineLoop.current) { scanLineLoop.current.stop(); scanLineLoop.current = null; }
  }, []);

  const startOvalPulse = useCallback(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(ovalPulse, { toValue: 1.04, duration: 700, useNativeDriver: true }),
      Animated.timing(ovalPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ]));
    ovalPulseLoop.current = loop;
    loop.start();
  }, [ovalPulse]);

  const stopOvalPulse = useCallback(() => {
    if (ovalPulseLoop.current) { ovalPulseLoop.current.stop(); ovalPulseLoop.current = null; ovalPulse.setValue(1); }
  }, [ovalPulse]);

  // ── Registration ─────────────────────────────────────────────────────────
  const handleNext = () => {
    const digits = phoneNumber.replace('+63', '').replace(/\D/g, '');
    if (digits.length !== 10) { Alert.alert('Invalid Number', 'Enter a valid 10-digit PH mobile number.'); return; }
    if (!agreedToTerms) { Alert.alert('Terms Required', 'Please agree to the Terms & Conditions to continue.'); return; }
    setScreen('verification'); setTimer(300); setCanResend(false);
    Keyboard.dismiss();
  };

  // ── OTP ───────────────────────────────────────────────────────────────────
  const handleOtpChange = (text, index) => {
    const newOtp = [...otp]; newOtp[index] = text.replace(/[^0-9]/g, ''); setOtp(newOtp);
    if (text && index < 5 && otpRefs.current[index + 1]) otpRefs.current[index + 1].focus();
    if (text && index === 5) Keyboard.dismiss();
  };
  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };
  const handleVerify = () => {
    if (otp.join('').length < 6) { Alert.alert('Incomplete OTP', 'Enter the full 6-digit OTP.'); return; }
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setScreen('details'); }, 1000);
  };
  const handleResend = () => {
    Alert.alert('OTP Sent', `New code sent to ${phoneNumber}`);
    setTimer(300); setCanResend(false); setOtp(['', '', '', '', '', '']);
    otpRefs.current[0]?.focus();
  };

  // ── Personal details ──────────────────────────────────────────────────────
  const formatBirthdate = (text) => {
    let c = text.replace(/[^0-9]/g, '').slice(0, 8);
    let f = c.slice(0, 2);
    if (c.length > 2) f += '/' + c.slice(2, 4);
    if (c.length > 4) f += '/' + c.slice(4, 8);
    setUserDetails(p => ({ ...p, birthdate: f }));
  };
  const validateBirthdate = (bd) => {
    if (!bd || bd.length < 10) return false;
    const [m, d, y] = bd.split('/').map(Number);
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const year = new Date().getFullYear();
    return y >= 1900 && y <= year && year - y >= 18;
  };
  const handleSubmitDetails = () => {
    if (!userDetails.firstName.trim())  { Alert.alert('Required', 'Enter your first name.'); return; }
    if (!userDetails.lastName.trim())   { Alert.alert('Required', 'Enter your last name.'); return; }
    if (!validateBirthdate(userDetails.birthdate)) { Alert.alert('Invalid Birthdate', 'Enter a valid birthdate. Must be 18+.'); return; }
    if (userDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email)) { Alert.alert('Invalid Email', 'Enter a valid email.'); return; }
    if (!userDetails.agreedDetails) { Alert.alert('Confirmation Required', 'Please confirm your information is accurate.'); return; }
    setScreen('address');
  };

  // ── Address ───────────────────────────────────────────────────────────────
  const handleSubmitAddress = () => {
    if (!address.country)            { Alert.alert('Required', 'Select your country.'); return; }
    if (!address.province)           { Alert.alert('Required', 'Select your province.'); return; }
    if (!address.municipality)       { Alert.alert('Required', 'Select your city.'); return; }
    if (!address.barangay)           { Alert.alert('Required', 'Select your barangay.'); return; }
    if (!address.street.trim())      { Alert.alert('Required', 'Enter your street address.'); return; }
    if (!address.agreedAddress)      { Alert.alert('Confirmation Required', 'Please confirm your address.'); return; }
    setScreen('employment');
  };

  // ── Employment ────────────────────────────────────────────────────────────
  const handleSubmitEmployment = () => {
    if (!employment.status) { Alert.alert('Required', 'Select your employment status.'); return; }
    const needsEmployer = ['Employed', 'Self-Employed'].includes(employment.status);
    if (needsEmployer) {
      if (!employment.employerName.trim()) { Alert.alert('Required', 'Enter employer/business name.'); return; }
      if (!employment.jobTitle.trim())     { Alert.alert('Required', 'Enter job title.'); return; }
    }
    if (!employment.monthlyIncome.trim()) { Alert.alert('Required', 'Enter approximate monthly income.'); return; }
    if (isNaN(Number(employment.monthlyIncome.replace(/,/g, '')))) { Alert.alert('Invalid', 'Monthly income must be a number.'); return; }
    if (!employment.agreedEmployment) { Alert.alert('Confirmation Required', 'Please confirm your employment info.'); return; }
    setScreen('pin');
  };

  // ── PIN ───────────────────────────────────────────────────────────────────
  const handlePinChange = (text, index, isConfirm = false) => {
    const arr = isConfirm ? [...confirmPin] : [...pin];
    arr[index] = text.replace(/[^0-9]/g, '');
    isConfirm ? setConfirmPin(arr) : setPin(arr);
    setPinError('');
    if (text && index < 3) (isConfirm ? confirmPinRefs : pinRefs).current[index + 1]?.focus();
  };
  const handlePinKeyPress = (e, index, isConfirm = false) => {
    const arr = isConfirm ? confirmPin : pin;
    if (e.nativeEvent.key === 'Backspace' && !arr[index] && index > 0) {
      (isConfirm ? confirmPinRefs : pinRefs).current[index - 1]?.focus();
    }
  };
  const handleSubmitPin = () => {
    const p = pin.join(''), cp = confirmPin.join('');
    if (p.length < 4) { setPinError('Please enter a 4-digit PIN.'); return; }
    const bad = ['0123','1234','2345','3456','4567','5678','6789','9876','8765','7654','6543','5432','4321','3210','0000','1111','2222','3333','4444','5555','6666','7777','8888','9999'];
    if (bad.includes(p)) { setPinError('PIN is too simple. Avoid sequential or repeated digits.'); return; }
    if (p !== cp) { setPinError('PINs do not match. Please try again.'); setConfirmPin(['', '', '', '']); confirmPinRefs.current[0]?.focus(); return; }
    setPinError('');
    setScreen('face');
  };

  // ── Face ──────────────────────────────────────────────────────────────────
  const resetFaceScan = () => {
    clearInterval(countdownInterval.current);
    stopScanLineAnimation(); stopOvalPulse();
    setFaceCapturing(false); setFaceImageUri(null);
    setFaceScanStep('idle'); setCountdown(3);
    setFaceHints('Position your face inside the oval');
    setCameraReady(false);
  };
  const startFaceScan = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) { Alert.alert('Camera Required', 'Enable camera in settings.'); return; }
    }
    resetFaceScan();
    setTimeout(() => { setFaceScanStep('ready'); setFaceHints('Look straight, then tap Capture'); }, 50);
  };
  const handleCameraReady = () => { setCameraReady(true); startScanLineAnimation(); startOvalPulse(); };
  const startCountdown = () => {
    if (!cameraReady) { Alert.alert('Camera Not Ready', 'Please wait…'); return; }
    if (faceCapturing) return;
    setFaceScanStep('countdown'); setCountdown(3); setFaceHints('Hold still…');
    let c = 3;
    countdownInterval.current = setInterval(() => {
      c -= 1;
      if (c > 0) { setCountdown(c); }
      else { clearInterval(countdownInterval.current); setCountdown(0); capturePhoto(); }
    }, 1000);
  };
  const capturePhoto = async () => {
    if (!cameraRef.current || faceCapturing) return;
    try {
      setFaceCapturing(true); setFaceScanStep('capturing'); setFaceHints('Capturing…');
      stopScanLineAnimation(); stopOvalPulse();
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85, base64: false, exif: false,
        ...(Platform.OS === 'android' ? { skipProcessing: true } : {}),
      });
      setFaceImageUri(photo.uri); setFaceHints('Face captured successfully!');
      setFaceScanStep('done'); setFaceCapturing(false);
    } catch (e) {
      setFaceCapturing(false); setFaceScanStep('ready'); setFaceHints('Capture failed — try again');
      Alert.alert('Capture Error', 'Could not take photo. Please try again.');
    }
  };
  const retakeFace = () => { resetFaceScan(); setTimeout(() => { setFaceScanStep('ready'); setFaceHints('Look straight, then tap Capture'); }, 50); };
  const handleCompleteRegistration = () => {
    if (!faceImageUri) { Alert.alert('Face Required', 'Complete face registration to continue.'); return; }
    Alert.alert('🎉 Registration Complete!', 'Your account is ready. You can now log in.', [{ text: 'Go to Login', onPress: () => navigation.navigate('Welcome') }]);
  };

  // Profile image picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'We need photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const currentStepIndex = STEP_SCREENS.indexOf(screen);

  // ═══════════════════════════════════════════════════════════════════════════
  // FACE REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'face') {
    const granted   = cameraPermission?.granted;
    const isDone    = faceScanStep === 'done' && faceImageUri;
    const showCam   = (faceScanStep === 'ready' || faceScanStep === 'countdown' || faceScanStep === 'capturing') && granted;
    const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] });

    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={P.deep} />
        <Header title="Face Registration" onBack={() => { resetFaceScan(); setScreen('pin'); }} profileImage={profileImage} onPickImage={pickImage} currentStep={currentStepIndex} />
        <StepBar current={currentStepIndex} />
        <ScrollView contentContainerStyle={s.faceContent} showsVerticalScrollIndicator={false}>

          <InfoBox icon="information-circle-outline" title="Register Your Face">
            Used for secure password-free login. Ensure good lighting and look directly at camera.
          </InfoBox>

          {!isDone ? (
            <View style={s.faceOvalWrapper}>
              {showCam && (
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" onCameraReady={handleCameraReady} />
              )}
              {faceScanStep === 'idle' && (
                <View style={s.faceIdlePlaceholder}>
                  <Ionicons name="person-circle-outline" size={80} color={'rgba(165,180,252,0.4)'} />
                  <Text style={s.faceIdleText}>{!granted ? 'Camera permission required' : 'Tap "Start Scan" to begin'}</Text>
                </View>
              )}
              {faceScanStep === 'capturing' && (
                <View style={s.faceCaptureLoader}>
                  <ActivityIndicator size="large" color={P.purple} />
                  <Text style={s.faceCapturingText}>Processing…</Text>
                </View>
              )}
              {(faceScanStep === 'ready' || faceScanStep === 'countdown') && (
                <TouchableOpacity style={s.faceOvalOverlay} onPress={faceScanStep === 'ready' ? startCountdown : undefined} activeOpacity={faceScanStep === 'ready' ? 0.8 : 1}>
                  <Animated.View style={[s.faceOval, faceScanStep === 'ready' && s.faceOvalReady, faceScanStep === 'countdown' && s.faceOvalCountdown, { transform: [{ scale: ovalPulse }] }]}>
                    {faceScanStep === 'countdown' && countdown > 0 && (
                      <View style={s.countdownBox}>
                        <Text style={s.countdownNum}>{countdown}</Text>
                      </View>
                    )}
                    {faceScanStep === 'ready' && cameraReady && (
                      <View style={s.tapHintBox}>
                        <Text style={s.tapHintTxt}>Tap to{'\n'}Capture</Text>
                      </View>
                    )}
                    {faceScanStep === 'ready' && !cameraReady && <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />}
                  </Animated.View>
                  {cameraReady && (
                    <View style={s.scanLineClip} pointerEvents="none">
                      <Animated.View style={[s.faceScanLine, { transform: [{ translateY: scanLineY }] }]} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <View style={s.faceHintBar}>
                <Text style={[s.faceHintTxt, faceScanStep === 'countdown' && { color: P.amber }]}>
                  {faceScanStep === 'idle' ? 'Tap "Start Scan" to begin' : faceHints}
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.faceDoneWrap}>
              <Image source={{ uri: faceImageUri }} style={s.faceDonePreview} />
              <View style={s.faceDoneBadge}>
                <Ionicons name="checkmark-circle" size={16} color={P.deep} />
                <Text style={s.faceDoneBadgeTxt}>Face Registered</Text>
              </View>
            </View>
          )}

          {/* Tips */}
          <View style={s.faceTipsRow}>
            {[{ icon: '💡', label: 'Good lighting' }, { icon: '👁', label: 'Look ahead' }, { icon: '🚫', label: 'No glasses' }].map(t => (
              <View key={t.label} style={s.faceTip}>
                <Text style={s.faceTipIcon}>{t.icon}</Text>
                <Text style={s.faceTipTxt}>{t.label}</Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={s.faceActions}>
            {faceScanStep === 'idle' && (
              <PrimaryBtn title="Start Scan" onPress={startFaceScan} icon="scan-outline" />
            )}
            {(faceScanStep === 'ready' || faceScanStep === 'countdown') && (
              <View style={s.faceActionRow}>
                <TouchableOpacity style={s.outlineBtn} onPress={resetFaceScan}>
                  <Text style={s.outlineBtnTxt}>Cancel</Text>
                </TouchableOpacity>
                {faceScanStep === 'ready' && (
                  <TouchableOpacity style={[s.primaryBtn, { flex: 2 }, !cameraReady && s.primaryBtnDisabled]} onPress={startCountdown} disabled={!cameraReady}>
                    <Text style={s.primaryBtnTxt}>{cameraReady ? 'Capture' : 'Initializing…'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {isDone && (
              <View style={s.faceActionRow}>
                <TouchableOpacity style={[s.outlineBtn, { flex: 1 }]} onPress={retakeFace}>
                  <Text style={s.outlineBtnTxt}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.primaryBtn, { flex: 2 }]} onPress={handleCompleteRegistration}>
                  <Text style={s.primaryBtnTxt}>Complete Registration</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <InfoBox icon="shield-checkmark-outline" title={null} color={P.green}>
            Your face data is encrypted and used only for identity verification within this app.
          </InfoBox>
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PIN
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'pin') {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={P.deep} />
        <Header title="Set Your PIN" onBack={() => setScreen('employment')} profileImage={profileImage} onPickImage={pickImage} currentStep={currentStepIndex} />
        <StepBar current={currentStepIndex} />
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Text style={s.screenDesc}>Create a 4-digit MPIN for secure login.</Text>

          <Text style={s.fieldLabel}>Enter PIN</Text>
          <View style={s.pinBoxRow}>
            {[0,1,2,3].map(i => (
              <TextInput
                key={`pin-${i}`}
                ref={r => (pinRefs.current[i] = r)}
                style={[s.pinBox, pin[i] && s.pinBoxFilled]}
                value={pin[i]}
                onChangeText={t => handlePinChange(t, i)}
                onKeyPress={e => handlePinKeyPress(e, i)}
                placeholder="•"
                placeholderTextColor={P.border}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                textAlign="center"
              />
            ))}
          </View>

          <Text style={s.fieldLabel}>Confirm PIN</Text>
          <View style={s.pinBoxRow}>
            {[0,1,2,3].map(i => (
              <TextInput
                key={`conf-${i}`}
                ref={r => (confirmPinRefs.current[i] = r)}
                style={[s.pinBox, confirmPin[i] && s.pinBoxFilled]}
                value={confirmPin[i]}
                onChangeText={t => handlePinChange(t, i, true)}
                onKeyPress={e => handlePinKeyPress(e, i, true)}
                placeholder="•"
                placeholderTextColor={P.border}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                textAlign="center"
              />
            ))}
          </View>

          {pinError ? (
            <View style={s.errorBox}>
              <Ionicons name="warning-outline" size={15} color={P.red} />
              <Text style={s.errorTxt}>{pinError}</Text>
            </View>
          ) : null}

          <InfoBox icon="warning-outline" title="Security Reminders">
            {'• Do not share your PIN with anyone, including Lora staff.\n• Avoid sequential (1234) or repeated digits (1111).\n• You can change your PIN anytime from Profile settings.'}
          </InfoBox>

          <PrimaryBtn title="Continue to Face Registration" onPress={handleSubmitPin} icon="arrow-forward" />
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYMENT
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'employment') {
    const needsEmployer = ['Employed', 'Self-Employed'].includes(employment.status);
    return (
      <TouchableWithoutFeedback onPress={closeDropdowns}>
        <View style={s.root}>
          <StatusBar barStyle="light-content" backgroundColor={P.deep} />
          <Header title="Employment" onBack={() => setScreen('address')} profileImage={profileImage} onPickImage={pickImage} currentStep={currentStepIndex} />
          <StepBar current={currentStepIndex} />
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <InfoBox icon="information-circle-outline" title="Why we ask">
              Employment info is used to assess your loan eligibility.
            </InfoBox>
            <SectionHead title="EMPLOYMENT INFORMATION" />
            <DropdownField
              label="Employment Status *" value={employment.status} placeholder="Select employment status"
              icon="💼" isOpen={showEmploymentDropdown}
              onToggle={() => { closeDropdowns(); setShowEmploymentDropdown(!showEmploymentDropdown); }}
              options={employmentOptions}
              onSelect={val => { setEmployment(p => ({ ...p, status: val })); setShowEmploymentDropdown(false); }}
            />
            {needsEmployer && (<>
              <Field label={employment.status === 'Self-Employed' ? 'Business Name *' : 'Employer / Company Name *'}
                placeholder={employment.status === 'Self-Employed' ? 'Enter business name' : 'Enter company name'}
                value={employment.employerName}
                onChangeText={t => setEmployment(p => ({ ...p, employerName: t }))} />
              <Field label={employment.status === 'Self-Employed' ? 'Nature of Business *' : 'Job Title / Position *'}
                placeholder={employment.status === 'Self-Employed' ? 'Nature of business' : 'Job title'}
                value={employment.jobTitle}
                onChangeText={t => setEmployment(p => ({ ...p, jobTitle: t }))} />
              <Field label="Years in Current Job / Business" optional
                placeholder="e.g. 3"
                value={employment.yearsEmployed}
                onChangeText={t => setEmployment(p => ({ ...p, yearsEmployed: t.replace(/[^0-9]/g, '') }))}
                keyboardType="number-pad" maxLength={2} />
            </>)}
            <SectionHead title="INCOME INFORMATION" />
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Approximate Monthly Income (PHP) *</Text>
              <View style={s.currencyRow}>
                <Text style={s.currencySymbol}>₱</Text>
                <TextInput
                  style={s.currencyInput}
                  placeholder="0.00"
                  placeholderTextColor={P.border}
                  value={employment.monthlyIncome}
                  onChangeText={t => setEmployment(p => ({ ...p, monthlyIncome: t.replace(/[^0-9.]/g, '') }))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <CheckRow checked={employment.agreedEmployment} onPress={() => setEmployment(p => ({ ...p, agreedEmployment: !p.agreedEmployment }))}>
              I confirm that the employment and income information provided is accurate and complete.
            </CheckRow>
            <PrimaryBtn title="Next" onPress={handleSubmitEmployment} icon="arrow-forward" />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDRESS
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'address') {
    return (
      <TouchableWithoutFeedback onPress={closeDropdowns}>
        <View style={s.root}>
          <StatusBar barStyle="light-content" backgroundColor={P.deep} />
          <Header title="Address" onBack={() => setScreen('details')} profileImage={profileImage} onPickImage={pickImage} currentStep={currentStepIndex} />
          <StepBar current={currentStepIndex} />
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <SectionHead title="CURRENT ADDRESS" />
            <DropdownField label="Country *" value={address.country} placeholder="Select country" icon="🌍" isOpen={showCountryDropdown}
              onToggle={() => { closeDropdowns(); setShowCountryDropdown(!showCountryDropdown); }}
              options={countryOptions} onSelect={v => { setAddress(p => ({ ...p, country: v })); setShowCountryDropdown(false); }}
              getOptionIcon={o => o === 'Philippines' ? '🇵🇭' : '🌍'} />
            <DropdownField label="Province *" value={address.province} placeholder="Select province" icon="🏙️" isOpen={showProvinceDropdown}
              onToggle={() => { closeDropdowns(); setShowProvinceDropdown(!showProvinceDropdown); }}
              options={provinceOptions} onSelect={v => { setAddress(p => ({ ...p, province: v })); setShowProvinceDropdown(false); }} />
            <DropdownField label="City / Municipality *" value={address.municipality} placeholder="Select city" icon="🏘️" isOpen={showMunicipalityDropdown}
              onToggle={() => { closeDropdowns(); setShowMunicipalityDropdown(!showMunicipalityDropdown); }}
              options={municipalityOptions} onSelect={v => { setAddress(p => ({ ...p, municipality: v })); setShowMunicipalityDropdown(false); }} />
            <DropdownField label="Barangay *" value={address.barangay} placeholder="Select barangay" icon="🏡" isOpen={showBarangayDropdown}
              onToggle={() => { closeDropdowns(); setShowBarangayDropdown(!showBarangayDropdown); }}
              options={barangayOptions} onSelect={v => { setAddress(p => ({ ...p, barangay: v })); setShowBarangayDropdown(false); }} />
            <Field label="Unit / House No. / Building / Street *" placeholder="e.g. Unit 3B, 123 Rizal Street"
              value={address.street} onChangeText={t => setAddress(p => ({ ...p, street: t }))} />
            <Field label="ZIP / Postal Code" optional placeholder="e.g. 6000"
              value={address.zipCode}
              onChangeText={t => setAddress(p => ({ ...p, zipCode: t.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad" maxLength={4} />
            <CheckRow checked={address.agreedAddress} onPress={() => setAddress(p => ({ ...p, agreedAddress: !p.agreedAddress }))}>
              I confirm that the above address information is true and complete.
            </CheckRow>
            <PrimaryBtn title="Next" onPress={handleSubmitAddress} icon="arrow-forward" />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONAL DETAILS
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'details') {
    return (
      <TouchableWithoutFeedback onPress={closeDropdowns}>
        <View style={s.root}>
          <StatusBar barStyle="light-content" backgroundColor={P.deep} />
          <Header title="Personal Details" onBack={() => setScreen('verification')} profileImage={profileImage} onPickImage={pickImage} currentStep={currentStepIndex} />
          <StepBar current={currentStepIndex} />
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <InfoBox icon="document-text-outline" title="Reminder">
              All required fields (*) must match your valid government-issued ID.
            </InfoBox>
            <SectionHead title="BASIC DETAILS" />
            <Field label="First Name *" placeholder="Enter first name" value={userDetails.firstName}
              onChangeText={t => setUserDetails(p => ({ ...p, firstName: t }))} autoCapitalize="words" />
            <Field label="Middle Name" optional placeholder="Enter middle name" value={userDetails.middleName}
              onChangeText={t => setUserDetails(p => ({ ...p, middleName: t }))} autoCapitalize="words" />
            <Field label="Last Name *" placeholder="Enter last name" value={userDetails.lastName}
              onChangeText={t => setUserDetails(p => ({ ...p, lastName: t }))} autoCapitalize="words" />
            <Field label="Suffix" optional placeholder="Jr., Sr., II, III" value={userDetails.suffix}
              onChangeText={t => setUserDetails(p => ({ ...p, suffix: t }))} autoCapitalize="words" />
            <Field label="Birthdate * (MM/DD/YYYY — must be 18+)" placeholder="MM/DD/YYYY"
              value={userDetails.birthdate} onChangeText={formatBirthdate} keyboardType="number-pad" maxLength={10} />
            <SectionHead title="CONTACT INFORMATION" />
            <Field label="Email Address" optional placeholder="example@email.com"
              value={userDetails.email}
              onChangeText={t => setUserDetails(p => ({ ...p, email: t }))}
              keyboardType="email-address" autoCapitalize="none" />
            <SectionHead title="ADDITIONAL INFORMATION" />
            <DropdownField label="Gender (optional)" value={userDetails.gender} placeholder="Select gender" icon="👤" isOpen={showGenderDropdown}
              onToggle={() => { closeDropdowns(); setShowGenderDropdown(!showGenderDropdown); }}
              options={genderOptions} onSelect={v => { setUserDetails(p => ({ ...p, gender: v })); setShowGenderDropdown(false); }}
              getOptionIcon={o => o === 'Male' ? '👨' : o === 'Female' ? '👩' : '👤'} />
            <DropdownField label="Nationality" value={userDetails.nationality} placeholder="Select nationality" icon="🌍" isOpen={showNationalityDropdown}
              onToggle={() => { closeDropdowns(); setShowNationalityDropdown(!showNationalityDropdown); }}
              options={nationalityOptions} onSelect={v => { setUserDetails(p => ({ ...p, nationality: v })); setShowNationalityDropdown(false); }}
              getOptionIcon={o => o === 'Filipino' ? '🇵🇭' : '🌍'} />
            <CheckRow checked={userDetails.agreedDetails} onPress={() => setUserDetails(p => ({ ...p, agreedDetails: !p.agreedDetails }))}>
              I confirm the above information is true and complete, matching my valid government-issued ID.
            </CheckRow>
            <PrimaryBtn title="Next" onPress={handleSubmitDetails} icon="arrow-forward" />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OTP VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'verification') {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor={P.deep} />
        <Header title="Verify OTP" onBack={() => setScreen('registration')} profileImage={profileImage} onPickImage={pickImage} currentStep={currentStepIndex} />
        <StepBar current={currentStepIndex} />
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.otpIconBox}>
            <Ionicons name="mail-outline" size={36} color={P.light} />
          </View>
          <Text style={s.screenDesc}>
            We sent a 6-digit code to{'\n'}
            <Text style={s.phoneHighlight}>{phoneNumber}</Text>
          </Text>

          <Text style={s.fieldLabel}>Verification Code</Text>
          <View style={s.otpRow}>
            {[0,1,2,3,4,5].map(i => (
              <TextInput
                key={i}
                ref={r => (otpRefs.current[i] = r)}
                style={[s.otpBox, otp[i] && s.otpBoxFilled]}
                value={otp[i]}
                onChangeText={t => handleOtpChange(t, i)}
                onKeyPress={e => handleOtpKeyPress(e, i)}
                placeholder="•"
                placeholderTextColor={P.border}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                textAlign="center"
              />
            ))}
          </View>

          <View style={s.otpResendRow}>
            <Text style={s.otpTimer}>
              {canResend ? 'Code expired.' : `Expires in ${formatTime(timer)}`}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend} activeOpacity={0.75}
              style={[!canResend && { opacity: 0.4 }]}>
              <Text style={s.otpResendTxt}>Resend OTP</Text>
            </TouchableOpacity>
          </View>

          <InfoBox icon="warning-outline" title="Security Notice">
            Never share your OTP with anyone. Lora will never ask for your OTP via call or message.
          </InfoBox>

          <PrimaryBtn title="Verify" onPress={handleVerify} loading={verifying} icon="checkmark-circle-outline" />
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRATION (default — screen 1)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={P.deep} />
      <Header title="Create Account" onBack={() => navigation.goBack()} profileImage={profileImage} onPickImage={pickImage} currentStep={0} />
      <StepBar current={0} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <View style={s.registrationHero}>
          <Ionicons name="person-add-outline" size={32} color={P.light} />
          <Text style={s.heroTitle}>Join Lora</Text>
          <Text style={s.heroDesc}>Create your account to access smart loans, fast payments, and financial tools.</Text>
        </View>

        <View style={s.fieldWrap}>
          <Text style={s.fieldLabel}>Mobile Number *</Text>
          <View style={s.phoneRow}>
            <View style={s.prefixBox}>
              <Text style={s.flagEmoji}>🇵🇭</Text>
              <Text style={s.prefixTxt}>+63</Text>
            </View>
            <TextInput
              style={s.phoneInput}
              placeholder="9XXXXXXXXX"
              placeholderTextColor={P.border}
              value={phoneNumber}
              onChangeText={text => {
                if (!text.startsWith('+63')) {
                  const nums = text.replace(/[^0-9]/g, '');
                  setPhoneNumber('+63' + nums.slice(0, 10));
                } else {
                  setPhoneNumber('+63' + text.slice(3).replace(/[^0-9]/g, '').slice(0, 10));
                }
              }}
              keyboardType="phone-pad"
              maxLength={13}
            />
          </View>
          <Text style={s.fieldHint}>10-digit Philippine mobile number (e.g. +639171234567)</Text>
        </View>

        <CheckRow checked={agreedToTerms} onPress={() => setAgreedToTerms(!agreedToTerms)}>
          I agree to the{' '}
          <Text style={s.linkTxt}>Terms & Conditions</Text>
          {' '}and{' '}
          <Text style={s.linkTxt}>Privacy Policy</Text>
        </CheckRow>

        <PrimaryBtn title="Send OTP" onPress={handleNext} icon="send" />

        <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('Welcome')} activeOpacity={0.75}>
          <Text style={s.loginLinkTxt}>
            Already have an account?{' '}
            <Text style={s.linkTxt}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: P.deep },
  content: { padding: 20, paddingBottom: 48 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: P.surface,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: P.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: P.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerMid:   { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: P.white },
  headerStep:  { fontSize: 10, color: P.sub, marginTop: 1 },
  avatarBtn:   { marginLeft: 8 },
  avatarImg:   { width: 38, height: 38, borderRadius: 12, borderWidth: 2, borderColor: P.purple },
  avatarPlaceholder: {
    width: 38, height: 38, borderRadius: 12,
    borderWidth: 2, borderColor: P.purple + '60',
    backgroundColor: P.violet + '30',
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },
  avatarLogo: { width: 42, height: 42 },

  // Step bar
  stepBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: P.surface,
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: P.border,
  },
  stepBarItem:   { alignItems: 'center', flex: 1 },
  stepBarDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: P.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 2,
  },
  stepBarDotActive: { backgroundColor: P.violet },
  stepBarDotDone:   { backgroundColor: P.green },
  stepBarNum:       { fontSize: 9, fontWeight: '700', color: P.sub },
  stepBarLabel:     { fontSize: 7.5, color: P.sub, textAlign: 'center' },
  stepBarLabelActive: { color: P.light, fontWeight: '700' },
  stepBarLabelDone:   { color: P.green },

  // Section heading
  sectionHead:    { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  sectionHeadLine:{ flex: 1, height: 1, backgroundColor: P.border },
  sectionHeadTxt: { fontSize: 10, fontWeight: '800', color: P.sub, letterSpacing: 1.2, marginHorizontal: 10 },

  // Field
  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: P.sub, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  fieldOpt:   { color: P.border, fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  fieldInput: {
    backgroundColor: P.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: P.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: P.white,
  },
  fieldHint: { fontSize: 11, color: P.sub, marginTop: 5 },

  // Currency input
  currencyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: P.border,
  },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: P.sub, paddingLeft: 16 },
  currencyInput:  { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 15, color: P.white },

  // Dropdown
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: P.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: P.border,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  dropdownTriggerOpen: { borderColor: P.purple, backgroundColor: P.violet + '18' },
  dropdownTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dropdownIconBox: { width: 26, height: 26, borderRadius: 8, backgroundColor: P.border + '80', justifyContent: 'center', alignItems: 'center' },
  dropdownValue:      { fontSize: 15, color: P.white, fontWeight: '500' },
  dropdownPlaceholder:{ fontSize: 15, color: P.border, fontStyle: 'italic' },
  dropdownList: {
    backgroundColor: P.card, borderRadius: 12,
    borderWidth: 1, borderColor: P.border,
    marginTop: 4, marginBottom: 8,
    overflow: 'hidden', maxHeight: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 13, borderBottomWidth: 1, borderBottomColor: P.border,
  },
  dropdownItemTxt: { fontSize: 14, color: P.white, fontWeight: '500', flex: 1 },

  // Checkbox
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  checkbox:  {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: P.border,
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxOn: { backgroundColor: P.violet, borderColor: P.violet },
  checkTxt:   { fontSize: 13, color: P.sub, flex: 1, lineHeight: 19 },
  linkTxt:    { color: P.light, fontWeight: '600' },

  // Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 16,
  },
  infoIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  infoTitle:   { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  infoText:    { fontSize: 12, lineHeight: 18 },

  // Primary button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: P.violet,
    borderRadius: 16, paddingVertical: 16, marginBottom: 8,
    shadowColor: P.purple,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  primaryBtnDisabled: { backgroundColor: P.border, shadowOpacity: 0 },
  primaryBtnTxt:      { color: P.white, fontSize: 16, fontWeight: '700' },

  outlineBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: P.border,
    backgroundColor: P.surface,
  },
  outlineBtnTxt: { color: P.light, fontSize: 14, fontWeight: '600' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: P.red + '18',
    borderRadius: 12, borderWidth: 1, borderColor: P.red + '40',
    padding: 12, marginBottom: 14,
  },
  errorTxt: { color: P.red, fontSize: 13, flex: 1, lineHeight: 18 },

  // OTP
  otpIconBox: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: P.violet + '30',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 16, marginTop: 8,
  },
  screenDesc:    { fontSize: 15, color: P.sub, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  phoneHighlight:{ color: P.light, fontWeight: '700' },
  otpRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  otpBox:  {
    width: (width - 64) / 6, height: 56,
    backgroundColor: P.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: P.border,
    fontSize: 22, fontWeight: '700', color: P.white, textAlign: 'center',
  },
  otpBoxFilled: { borderColor: P.purple, backgroundColor: P.violet + '25' },
  otpResendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  otpTimer:     { fontSize: 12, color: P.sub },
  otpResendTxt: { fontSize: 13, color: P.purple, fontWeight: '600' },

  // PIN
  pinBoxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pinBox: {
    width: (width - 72) / 4, height: 62,
    backgroundColor: P.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: P.border,
    fontSize: 24, fontWeight: '700', color: P.white, textAlign: 'center',
  },
  pinBoxFilled: { borderColor: P.purple, backgroundColor: P.violet + '25' },

  // Phone input
  phoneRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  prefixBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: P.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
  },
  flagEmoji: { fontSize: 16 },
  prefixTxt: { fontSize: 15, fontWeight: '700', color: P.white },
  phoneInput: {
    flex: 1, backgroundColor: P.surface,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontWeight: '600', color: P.white,
    borderWidth: 1.5, borderColor: P.border,
  },

  // Registration hero
  registrationHero: {
    alignItems: 'center', marginBottom: 28, marginTop: 8,
    backgroundColor: P.surface,
    borderRadius: 18, padding: 24,
    borderWidth: 1, borderColor: P.border,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: P.white, marginTop: 10, marginBottom: 6 },
  heroDesc:  { fontSize: 13, color: P.sub, textAlign: 'center', lineHeight: 19 },

  loginLink:    { alignItems: 'center', paddingVertical: 14 },
  loginLinkTxt: { fontSize: 13, color: P.sub },

  // Face scan
  faceContent: { padding: 16, paddingBottom: 40 },
  faceOvalWrapper: {
    height: 360, backgroundColor: '#100a04',
    borderRadius: 22, overflow: 'hidden',
    justifyContent: 'flex-end', alignItems: 'center',
    marginBottom: 14,
    shadowColor: P.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    borderWidth: 1, borderColor: P.border,
  },
  faceIdlePlaceholder: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 12 },
  faceIdleText:        { color: 'rgba(165,180,252,0.7)', fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  faceCaptureLoader:   { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', gap: 10 },
  faceCapturingText:   { color: P.white, fontSize: 14, fontWeight: '600' },
  faceOvalOverlay:     { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  faceOval: {
    width: 200, height: 260, borderRadius: 100,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
  faceOvalReady:     { borderColor: P.purple, borderStyle: 'solid', shadowColor: P.purple, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 16 },
  faceOvalCountdown: { borderColor: P.amber,  borderStyle: 'solid', borderWidth: 4, shadowColor: P.amber, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20 },
  countdownBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245,158,11,0.25)', justifyContent: 'center', alignItems: 'center' },
  countdownNum: { fontSize: 52, fontWeight: '900', color: P.amber },
  tapHintBox:   { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(234,88,12,0.35)', borderRadius: 12 },
  tapHintTxt:   { color: P.white, fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  scanLineClip: { position: 'absolute', width: 200, height: 260, borderRadius: 100, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  faceScanLine: { width: 190, height: 2, backgroundColor: 'rgba(251,146,60,0.85)', borderRadius: 1, shadowColor: P.purple, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  faceHintBar:  { width: '100%', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center' },
  faceHintTxt:  { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '500' },
  faceDoneWrap:    { alignItems: 'center', marginBottom: 14 },
  faceDonePreview: { width: width - 32, height: 300, borderRadius: 20, borderWidth: 3, borderColor: P.green },
  faceDoneBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: P.green, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: -14 },
  faceDoneBadgeTxt:{ color: P.deep, fontWeight: '700', fontSize: 13 },
  faceTipsRow:  { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  faceTip:      { alignItems: 'center', gap: 4 },
  faceTipIcon:  { fontSize: 22 },
  faceTipTxt:   { fontSize: 11, color: P.sub, fontWeight: '500' },
  faceActions:  { marginBottom: 16 },
  faceActionRow:{ flexDirection: 'row', gap: 10 },
});

export default CreateAccountScreen;