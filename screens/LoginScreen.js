import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from "../lib/apolloClient";
import { LOGIN_ACCOUNT } from '../graphql/mutations/loginAccount';
import { EXTRACT_PHONE_FROM_TOKEN } from "../graphql/queries/extractPhoneToken";
import { saveToken, getPhoneToken } from "../lib/cookies";
import { SEND_MPIN, VERIFY_MPIN, FORGET_PASSWORD } from "../actions/account.action";

const LoginScreen = ({ navigation, route }) => {
  const [pin, setPin] = useState('');
  const [currentAccount, setCurrentAccount] = useState('+63949150024');
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'switch', 'forgot', 'addExisting'
  
  // Switch Account states
  const [accounts, setAccounts] = useState([
    { id: '1', phoneNumber: '+63949150024', name: 'John Doe', isActive: true },
    { id: '2', phoneNumber: '+63917123456', name: 'Jane Smith', isActive: false },
    { id: '3', phoneNumber: '+63928765432', name: 'Bob Johnson', isActive: false },
  ]);
  
  // Forgot Password states
  const [forgotStep, setForgotStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  // Add Existing Account states
  const [addExistingStep, setAddExistingStep] = useState(1);
  const [existingPhone, setExistingPhone] = useState('');
  const [existingOtp, setExistingOtp] = useState('');
  const [existingPin, setExistingPin] = useState('');
  
  const correctPin = '1111';

  useEffect(() => {
    if (route.params?.newAccount) {
      setCurrentAccount(route.params.newAccount);
      setPin('');
      navigation.setParams({ newAccount: undefined });
    }
  }, [route.params, navigation]);

  /*
    On render get token from cookies to get phone number if exist
    else navigate to switch account to enter phone number
  */
  useEffect(() => {
    const onLoad = async () => {
      try {
        const token = await getPhoneToken();

        if (token && typeof token === "string") {
          const { data } = await client.query({
            query: EXTRACT_PHONE_FROM_TOKEN,
            fetchPolicy: 'no-cache',
            context: {
              headers: {
                Authorization: token,
              }
            }
          })
  
          const { success, message, phone } = data.extractPhoneFromToken;

          console.log(success, message, phone);
  
          if (!success) {
            Alert.alert('Error', 'Invalid token');
            navigation.navigate('SwitchAccount');
            return;
          }
          
          setCurrentAccount(phone);
          return;
        }
  
        navigation.navigate('SwitchAccount');
        
      } catch (err) {
        console.log(err);
      }
    }

    onLoad();
  }, [])

  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      setPin(pin + number);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit PIN');
      return;
    }

    try {
      const { data } = await client.mutate({
        mutation: LOGIN_ACCOUNT,
        variables: { phone: currentAccount.replace(" ", ""), pinCode: pin },
        fetchPolicy: 'no-cache'
      });
  
      const { success, message, token } = data.loginAccount;
  
      // TO DO: Add loading and success message in UI
      // This is a example
      console.log(success, message);
  
      if (!success) {
        Alert.alert('Error', message);
        setPin('');
        return;
      };

      await saveToken(token); // as id, role
      
      navigation.navigate('Dashboard');

    } catch (err) {
      // TO DO: Add error message in UI
      console.log(err);
      setPin('');
      return;
    }
  };

  const handleSwitchAccount = () => {
    setCurrentScreen('switch');
  };

  const handleCreateAccount = () => {
    navigation.navigate('CreateAccount');
  };

  const handleForgotPassword = () => {
    setCurrentScreen('forgot');
    setForgotStep(1);
    setPhoneNumber('');
    setOtp('');
    setNewPin('');
    setConfirmPin('');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
    setPin('');
  };

  // Switch Account Functions
  const handleSelectAccount = (account) => {
    Alert.alert(
      'Switch Account',
      `Switch to ${account.phoneNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          onPress: () => {
            setCurrentAccount(account.phoneNumber);
            setCurrentScreen('login');
            setPin('');
          },
        },
      ]
    );
  };

  const handleAddExistingAccount = () => {
    setCurrentScreen('addExisting');
    setAddExistingStep(1);
    setExistingPhone('');
    setExistingOtp('');
    setExistingPin('');
  };

  // Add Existing Account Functions
  const handleSendExistingOTP = () => {
    if (existingPhone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }
    
    // Check if account already exists
    const accountExists = accounts.some(acc => acc.phoneNumber === existingPhone);
    if (accountExists) {
      Alert.alert('Account Already Added', 'This account is already on this device');
      return;
    }
    
    Alert.alert(
      'OTP Sent',
      `A verification code has been sent to ${existingPhone}`,
      [{ text: 'OK', onPress: () => setAddExistingStep(2) }]
    );
  };

  const handleVerifyExistingOTP = () => {
    if (existingOtp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code');
      return;
    }
    
    if (existingOtp === '123456') {
      setAddExistingStep(3);
    } else {
      Alert.alert('Invalid OTP', 'The verification code is incorrect. Use 123456 for testing.');
    }
  };

  const handleVerifyExistingPin = () => {
    if (existingPin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be 4 digits');
      return;
    }
    
    // Mock PIN verification - replace with actual API call
    if (existingPin === '1111') {
      // Add account to list
      const newAccount = {
        id: (accounts.length + 1).toString(),
        phoneNumber: existingPhone,
        name: 'User ' + (accounts.length + 1),
        isActive: false,
      };
      
      setAccounts([...accounts, newAccount]);
      
      Alert.alert(
        'Success',
        'Account added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentScreen('switch');
            },
          },
        ]
      );
    } else {
      Alert.alert('Invalid PIN', 'The PIN is incorrect. Use 1111 for testing.');
    }
  };

  // Forgot Password Functions
  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }

    const { success, message } = await SEND_MPIN(phoneNumber);
    
    if (!success) {
      Alert.alert('Error', message);
      return;
    };

    console.log(success, message);
    
    Alert.alert(
      'OTP Sent',
      `A verification code has been sent to +63 ${phoneNumber}`,
      [{ text: 'OK', onPress: () => setForgotStep(2) }]
    );
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code');
      return;
    };

    const { success, message, token } = await VERIFY_MPIN(phoneNumber, otp);
    
    if (!success) {
      Alert.alert('Invalid OTP', 'The verification code is incorrect.');
      return;
    };

    console.log(success, message, token);

    await saveToken(token); // As phone number

    setForgotStep(3);
  };

  const handleResetPin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be 4 digits');
      return;
    };
    
    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match');
      return;
    }

    const { success, message } = await FORGET_PASSWORD(newPin);
    
    if (!success) {
      Alert.alert(
        'Error', 
        "Account does not exist",
        [
          {
            text: "OK",
            onPress: () => {
              setCurrentScreen('login');
              setPin('');
            }
          }
        ]
      );
      return;
    };

    Alert.alert(
      'Success',
      'Your MPIN has been reset successfully',
      [
        {
          text: 'OK',
          onPress: () => {
            setCurrentScreen('login');
            setPin('');
          },
        },
      ]
    );
  };

  const renderNumberButton = (number) => (
    <TouchableOpacity 
      key={number}
      style={styles.numberButton}
      onPress={() => handleNumberPress(number)}
      activeOpacity={0.7}
    >
      <Text style={styles.numberText}>{number}</Text>
    </TouchableOpacity>
  );

  const renderPinDots = () => (
    <View style={styles.pinContainer}>
      {[0, 1, 2, 3].map((i) => (
        <View 
          key={i} 
          style={[
            styles.pinDot, 
            i < pin.length && styles.pinDotFilled
          ]}
        />
      ))}
    </View>
  );

  // Login Screen
  const renderLoginScreen = () => (
    <View style={styles.content}>
      <Image 
        source={require('../assets/LoraLogo.png')} 
        style={styles.logo}
      />
      
      <Text style={styles.title}>Enter Your MPIN</Text>
      
      <Text style={styles.accountNumberText}>
        {currentAccount}
      </Text>

      <TouchableOpacity 
        style={styles.switchAccountButton}
        onPress={handleSwitchAccount}
        activeOpacity={0.8}
      >
        <Text style={styles.switchAccountText}>Switch Account</Text>
      </TouchableOpacity>

      {renderPinDots()}

      <View style={styles.numberPad}>
        <View style={styles.numberRow}>
          {[1, 2, 3].map(renderNumberButton)}
        </View>
        <View style={styles.numberRow}>
          {[4, 5, 6].map(renderNumberButton)}
        </View>
        <View style={styles.numberRow}>
          {[7, 8, 9].map(renderNumberButton)}
        </View>
        <View style={styles.numberRow}>
          <View style={styles.emptyButton} />
          {renderNumberButton('0')}
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={styles.createAccountButton}
          onPress={handleCreateAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.createAccountText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPasswordButton}
          onPress={handleForgotPassword}
          activeOpacity={0.8}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[
          styles.loginButton, 
          pin.length !== 4 && styles.loginButtonDisabled
        ]}
        onPress={handleLogin}
        disabled={pin.length !== 4}
        activeOpacity={0.8}
      >
        <Text style={styles.loginButtonText}>Log in</Text>
      </TouchableOpacity>
    </View>
  );

  // Switch Account Screen
  const renderSwitchAccountScreen = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Switch Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Your Accounts</Text>
        
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.accountCard,
              account.phoneNumber === currentAccount && styles.accountCardActive,
            ]}
            onPress={() => handleSelectAccount(account)}
            activeOpacity={0.7}
          >
            <View style={styles.accountIcon}>
              <Text style={styles.accountIconText}>
                {account.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountPhone}>{account.phoneNumber}</Text>
            </View>
            {account.phoneNumber === currentAccount && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addAccountButton}
          onPress={handleAddExistingAccount}
          activeOpacity={0.7}
        >
          <Text style={styles.addAccountIcon}>+</Text>
          <Text style={styles.addAccountText}>Add Existing Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Forgot Password Screen
  const renderForgotPasswordScreen = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, forgotStep >= 1 && styles.progressDotActive]}>
            <Text style={[styles.progressText, forgotStep >= 1 && styles.progressTextActive]}>1</Text>
          </View>
          <View style={[styles.progressLine, forgotStep >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, forgotStep >= 2 && styles.progressDotActive]}>
            <Text style={[styles.progressText, forgotStep >= 2 && styles.progressTextActive]}>2</Text>
          </View>
          <View style={[styles.progressLine, forgotStep >= 3 && styles.progressLineActive]} />
          <View style={[styles.progressDot, forgotStep >= 3 && styles.progressDotActive]}>
            <Text style={[styles.progressText, forgotStep >= 3 && styles.progressTextActive]}>3</Text>
          </View>
        </View>

        <Text style={styles.forgotTitle}>
          {forgotStep === 1 ? 'Verify Phone Number' : forgotStep === 2 ? 'Verify OTP' : 'Reset MPIN'}
        </Text>

        {forgotStep === 1 && (
          <>
            <Text style={styles.description}>
              Enter your registered phone number to receive a verification code
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={{ 
                  display: "flex", 
                  flexDirection: "row", 
                  alignItems: "center",
                }}>
                <Text style={styles.prefixNumber}>+63</Text>
                <TextInput
                  style={{
                    ...styles.input, 
                    flexGrow: 1, 
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                   }}
                  placeholder="9876543210"
                  placeholderTextColor="gray"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                  />
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSendOTP}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {forgotStep === 2 && (
          <>
            <Text style={styles.description}>
              Enter the 6-digit verification code sent to {phoneNumber}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendOTP}
              activeOpacity={0.8}
            >
              <Text style={styles.resendButtonText}>Resend OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyOTP}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Verify</Text>
            </TouchableOpacity>
          </>
        )}

        {forgotStep === 3 && (
          <>
            <Text style={styles.description}>
              Create a new 4-digit MPIN for your account
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New MPIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm MPIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleResetPin}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Reset MPIN</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );

  // Add Existing Account Screen
  const renderAddExistingAccountScreen = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentScreen('switch')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Existing Account</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, addExistingStep >= 1 && styles.progressDotActive]}>
            <Text style={[styles.progressText, addExistingStep >= 1 && styles.progressTextActive]}>1</Text>
          </View>
          <View style={[styles.progressLine, addExistingStep >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, addExistingStep >= 2 && styles.progressDotActive]}>
            <Text style={[styles.progressText, addExistingStep >= 2 && styles.progressTextActive]}>2</Text>
          </View>
          <View style={[styles.progressLine, addExistingStep >= 3 && styles.progressLineActive]} />
          <View style={[styles.progressDot, addExistingStep >= 3 && styles.progressDotActive]}>
            <Text style={[styles.progressText, addExistingStep >= 3 && styles.progressTextActive]}>3</Text>
          </View>
        </View>

        <Text style={styles.forgotTitle}>
          {addExistingStep === 1 ? 'Enter Phone Number' : addExistingStep === 2 ? 'Verify OTP' : 'Enter Your MPIN'}
        </Text>

        {addExistingStep === 1 && (
          <>
            <Text style={styles.description}>
              Enter the phone number of your existing account to add it to this device
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center"
              }}>
                <Text style={styles.prefixNumber}>+63</Text>
                <TextInput
                  style={{
                    ...styles.input,
                    flexGrow: 1,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0
                  }}
                  placeholder="9876543210"
                  placeholderTextColor="gray"
                  value={existingPhone}
                  onChangeText={setExistingPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSendExistingOTP}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {addExistingStep === 2 && (
          <>
            <Text style={styles.description}>
              Enter the 6-digit verification code sent to {existingPhone}
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                value={existingOtp}
                onChangeText={setExistingOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendExistingOTP}
              activeOpacity={0.8}
            >
              <Text style={styles.resendButtonText}>Resend OTP</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyExistingOTP}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Verify</Text>
            </TouchableOpacity>
          </>
        )}

        {addExistingStep === 3 && (
          <>
            <Text style={styles.description}>
              Enter your MPIN to verify account ownership
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter MPIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                value={existingPin}
                onChangeText={setExistingPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyExistingPin}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Verify Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'login' && renderLoginScreen()}
      {currentScreen === 'switch' && renderSwitchAccountScreen()}
      {currentScreen === 'forgot' && renderForgotPasswordScreen()}
      {currentScreen === 'addExisting' && renderAddExistingAccountScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  fullScreenContainer: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  accountNumberText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 16,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginHorizontal: 10,
  },
  pinDotFilled: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  numberPad: {
    width: '100%',
    marginBottom: 24,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  numberText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '500',
  },
  emptyButton: {
    width: 70,
    height: 70,
    backgroundColor: 'transparent',
  },
  deleteButton: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#f97316',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#fbbf77',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  switchAccountButton: {
    marginBottom: 24,
  },
  switchAccountText: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    gap: 16,
  },
  createAccountButton: {
    flex: 1,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordButton: {
    flex: 1,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  // Switch Account styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountCardActive: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },
  accountIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  accountPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeBadge: {
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  addAccountIcon: {
    fontSize: 24,
    color: '#f97316',
    fontWeight: '600',
    marginRight: 8,
  },
  addAccountText: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '600',
  },
  // Forgot Password styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  progressTextActive: {
    color: 'white',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#d1d5db',
  },
  progressLineActive: {
    backgroundColor: '#f97316',
  },
  forgotTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  primaryButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  // Prefix Number
  prefixNumber: {
    fontSize: 16,
    fontWeight: 500,
    padding: 16,
    backgroundColor: "#e5e7eb",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 12,
  }
});

export default LoginScreen;