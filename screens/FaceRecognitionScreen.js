import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FaceRecognitionScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const cameraRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    let interval;
    if (showCountdown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && showCountdown) {
      handleCapture();
    }
    return () => clearInterval(interval);
  }, [showCountdown, countdown]);

  useEffect(() => {
    if (showCountdown) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [showCountdown]);

  useEffect(() => {
    if (!isProcessing && !showCountdown) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isProcessing, showCountdown]);

  const startCapture = () => {
    if (!isProcessing && permission?.granted) {
      setCountdown(3);
      setShowCountdown(true);
    }
  };

  const handleCapture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      setShowCountdown(false);
      
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          skipProcessing: true,
        });
        
        // Simulate face recognition processing
        setTimeout(() => {
          setIsProcessing(false);
          Alert.alert(
            'Face Recognition Complete',
            'Your face has been successfully registered!',
            [
              {
                text: 'Continue',
                onPress: () => navigation.navigate('Dashboard')
              }
            ]
          );
        }, 2000);
      } catch (error) {
        console.error('Error capturing photo:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        setIsProcessing(false);
        setShowCountdown(false);
        setCountdown(3);
      }
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Face Recognition',
      'You can set up face recognition later in settings. Continue to dashboard?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => navigation.navigate('Dashboard') }
      ]
    );
  };

  const resetCapture = () => {
    setShowCountdown(false);
    setCountdown(3);
    setIsProcessing(false);
  };

  const scanLinePosition = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera-outline" size={64} color="#9333ea" />
          </View>
          <Text style={styles.messageText}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please allow camera access to enable face recognition for secure login
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Face Recognition</Text>
        <Text style={styles.headerSubtitle}>Secure biometric setup</Text>
      </View>

      <View style={styles.instructionContainer}>
        <View style={styles.instructionIcon}>
          <Ionicons name="scan-outline" size={24} color="#9333ea" />
        </View>
        <Text style={styles.instructionTitle}>Position Your Face</Text>
        <Text style={styles.instructionText}>
          Center your face within the frame and ensure good lighting
        </Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          zoom={0}
        >
          <View style={styles.overlay}>
            {/* Face Frame */}
            <View style={styles.faceFrame}>
              {/* Corner Borders */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              
              {/* Scanning Line */}
              {!showCountdown && !isProcessing && (
                <Animated.View 
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLinePosition }] }
                  ]} 
                />
              )}
              
              {/* Countdown */}
              {showCountdown && (
                <Animated.View 
                  style={[
                    styles.countdownContainer,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <View style={styles.countdownCircle}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                  </View>
                  <Text style={styles.countdownLabel}>Capturing in</Text>
                </Animated.View>
              )}
            </View>

            {/* Processing Indicator */}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <View style={styles.processingSpinner}>
                  <Ionicons name="sync" size={32} color="white" />
                </View>
                <Text style={styles.processingText}>Processing your face...</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge, 
          isProcessing ? styles.statusProcessing : styles.statusReady
        ]}>
          <Ionicons 
            name={isProcessing ? "time-outline" : "checkmark-circle"} 
            size={16} 
            color="white" 
          />
          <Text style={styles.statusText}>
            {isProcessing ? 'Processing...' : 'Ready to Capture'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {showCountdown ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetCapture}
          >
            <Ionicons name="close-circle" size={20} color="white" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.disabledButton]}
            onPress={startCapture}
            disabled={isProcessing}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.captureButtonText}>
              {isProcessing ? 'Processing...' : 'Capture Face'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.skipButtonBottom, isProcessing && styles.disabledButton]}
          onPress={handleSkip}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-forward" size={18} color="#9333ea" />
          <Text style={styles.skipButtonBottomText}>Skip Setup</Text>
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for best results:</Text>
          <View style={styles.tipsGrid}>
            <View style={styles.tipItem}>
              <Ionicons name="sunny-outline" size={16} color="#666" />
              <Text style={styles.tipsText}>Good lighting</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.tipsText}>Look directly</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="glasses-outline" size={16} color="#666" />
              <Text style={styles.tipsText}>No glasses</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="happy-outline" size={16} color="#666" />
              <Text style={styles.tipsText}>Neutral face</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#9333ea',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  instructionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraContainer: {
    width: width - 48,
    height: width - 48,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 280,
    height: 320,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'white',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#9333ea',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  countdownContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    alignItems: 'center',
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(147, 51, 234, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  countdownText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  countdownLabel: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  processingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -80,
    marginTop: -40,
    alignItems: 'center',
  },
  processingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(147, 51, 234, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  processingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  statusReady: {
    backgroundColor: '#22c55e',
  },
  statusProcessing: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    padding: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  skipButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9333ea',
    gap: 8,
    marginBottom: 20,
  },
  skipButtonBottomText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#9333ea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  permissionButton: {
    backgroundColor: '#9333ea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  messageText: {
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
    gap: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default FaceRecognitionScreen;