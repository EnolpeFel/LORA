import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from "../lib/apolloClient";
import { LOGIN_ACCOUNT } from '../graphql/mutations/loginAccount';
import { saveToken, getToken } from "../lib/cookies";

const LoginScreen = ({ navigation, route }) => {
  const [pin, setPin] = useState('');
  const [currentAccount, setCurrentAccount] = useState('+63949150024');

  useEffect(() => {
    if (route.params?.newAccount) {
      setCurrentAccount(route.params.newAccount);
      setPin('');
      navigation.setParams({ newAccount: undefined });
    }
  }, [route.params, navigation]);

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

      // Save token if token does not exist
      const isToken = await getToken();
      !isToken && await saveToken(token); 
      
      navigation.navigate('Dashboard');

    } catch (err) {
      // TO DO: Add error message in UI
      console.log(err);
      setPin('');
      return;
    }
  };

  const handleSwitchAccount = () => {
    navigation.navigate('SwitchAccount');
  };

  const handleCreateAccount = () => {
    // Navigate to create account screen
    navigation.navigate('CreateAccount');
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image 
          source={require('../assets/LoraLogo.png')} 
          style={styles.logo}
        />
        
        <Text style={styles.title}>Enter Your MPIN</Text>
        
        {/* Account Number Display */}
        <Text style={styles.accountNumberText}>
          {currentAccount}
        </Text>

        {/* Switch Account Button - Moved below account number */}
        <TouchableOpacity 
          style={styles.switchAccountButton}
          onPress={handleSwitchAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.switchAccountText}>Switch Account</Text>
        </TouchableOpacity>

        {/* PIN Display Dots */}
        {renderPinDots()}

        {/* Number Pad */}
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

        {/* Create Account Button - Added above login button */}
        <TouchableOpacity 
          style={styles.createAccountButton}
          onPress={handleCreateAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.createAccountText}>Create Account</Text>
        </TouchableOpacity>

        {/* Login Button */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
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
  createAccountButton: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  createAccountText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen;