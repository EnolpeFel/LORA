import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import client from "../lib/apolloClient";
import { SEND_MPIN, VERIFY_MPIN } from "../graphql/queries/sendVerifyMpin";
import { savePhoneToken } from "../lib/cookies";

const SwitchAccountScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);

  const handleNumberPress = (number) => {
    if (pin.length < 4) {
      setPin(pin + number);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleMobileNumberChange = (text) => {
    // Remove any non-digit characters
    const digits = text.replace(/\D/g, '');
    
    // Limit to 10 digits (after +63)
    if (digits.length <= 10) {
      setMobileNumber(digits);
    }
  };

  const getFullMobileNumber = () => {
    return `+63${mobileNumber}`;
  };

  const validatePhilippineMobileNumber = () => {
    return mobileNumber.length === 10 && mobileNumber.startsWith('9');
  };

  const handleContinue = async () => {
    if (step === 1) {
      if (!validatePhilippineMobileNumber()) {
        Alert.alert(
          'Invalid Mobile Number', 
          'Please enter a valid 10-digit Philippine mobile number starting with 9 (e.g., 9123456789)'
        );
        return;
      }

      setStep(2);
      try {
        // Send MPIN to mobile number
        const sendMpinData = await client.query({
          query: SEND_MPIN,
          variables: { phone: mobileNumber },
          fetchPolicy: 'no-cache'
        });
  
        const responseSendMpin = sendMpinData.data.sendMPIN;
  
        // TO DO: Add loading and success message in UI
        // This is a example
        console.log(responseSendMpin.success, responseSendMpin.message);
  
        if (!responseSendMpin.success) {
          Alert.alert('Error', message);
          return;
        }
      } catch (err) {
        console.log(err);
        return;
      }

    } else {
      try {
        // Verify MPIN
        const verifyMpinData = await client.query({
          query: VERIFY_MPIN,
          variables: { phone: getFullMobileNumber(), code: pin },
          fetchPolicy: 'no-cache'
        });

        const responseVerifyMpin = verifyMpinData.data.verifyMPIN;

        // TO DO: Add loading and success message in UI
        // This is a example
        console.log(responseVerifyMpin.success, responseVerifyMpin.message, responseVerifyMpin.token);

        if (!responseVerifyMpin.success) {
          Alert.alert('Invalid MPIN', 'Please enter the correct 4-digit MPIN');
          setPin('');
          return;
        };

        // Save phone number token
        await savePhoneToken(responseVerifyMpin.token);

        // Pass the new mobile number as a parameter when navigating back
        navigation.navigate({
          name: 'Login',
          params: { newAccount: getFullMobileNumber() },
          merge: true
        });

      } catch (err) {
        console.log(err);
        return;
      }
    }
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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {step === 1 ? 'Switch Account' : 'Verify MPIN'}
        </Text>

        {step === 1 ? (
          <>
            <Text style={styles.label}>Enter Philippine Mobile Number</Text>
            <View style={styles.mobileInputContainer}>
              <View style={styles.prefixContainer}>
                <Text style={styles.prefixText}>+63</Text>
              </View>
              <TextInput
                style={styles.mobileInput}
                placeholder="9123456789"
                placeholderTextColor="#9ca3af"
                value={mobileNumber}
                onChangeText={handleMobileNumberChange}
                keyboardType="phone-pad"
                autoFocus={true}
                maxLength={10}
              />
            </View>
            <Text style={styles.noteText}>
              Enter your 10-digit mobile number starting with 9
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>
              Enter MPIN for {getFullMobileNumber()}
            </Text>
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
          </>
        )}

        <TouchableOpacity 
          style={[
            styles.continueButton, 
            (step === 1 ? !validatePhilippineMobileNumber() : pin.length !== 4) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={(step === 1 ? !validatePhilippineMobileNumber() : pin.length !== 4)}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {step === 1 ? 'Continue' : 'Verify MPIN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  mobileInputContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  prefixContainer: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#d1d5db',
  },
  prefixText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  mobileInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
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
    marginBottom: 30,
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
  continueButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#f97316',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#fbbf77',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});

export default SwitchAccountScreen;