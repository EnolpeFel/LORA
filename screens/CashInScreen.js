import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CashInScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const cashInMethods = [
    { 
      id: 1, 
      name: 'GCash', 
      icon: 'account-balance-wallet',
      color: '#007DFF',
      gradient: ['#007DFF', '#0051D5'],
      fee: 'No fee',
      deepLink: 'gcash://cashin',
      webLink: 'https://m.gcash.com',
      packageName: 'com.globe.gcash.android'
    },
    { 
      id: 2, 
      name: 'Maya', 
      icon: 'account-balance-wallet',
      color: '#00D632',
      gradient: ['#00D632', '#00A826'],
      fee: 'No fee',
      deepLink: 'maya://cashin',
      webLink: 'https://maya.ph',
      packageName: 'com.paymaya'
    },
  ];

  const openEWalletApp = async (method, cashInAmount) => {
    try {
      const canOpen = await Linking.canOpenURL(method.deepLink);
      
      if (canOpen) {
        await Linking.openURL(method.deepLink);
        
        Alert.alert(
          'Complete Payment',
          `Please complete your ₱${cashInAmount.toFixed(2)} cash-in transaction in the ${method.name} app.`,
          [
            {
              text: 'Done',
              onPress: () => {
                Alert.alert('Success', `Cash in of ₱${cashInAmount.toFixed(2)} via ${method.name} is being processed`);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          `${method.name} Not Installed`,
          `The ${method.name} app is not installed. Would you like to:`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Open Web Version',
              onPress: () => Linking.openURL(method.webLink)
            },
            {
              text: 'Install App',
              onPress: () => {
                const storeUrl = Platform.OS === 'ios' 
                  ? `https://apps.apple.com/app/${method.packageName}`
                  : `https://play.google.com/store/apps/details?id=${method.packageName}`;
                Linking.openURL(storeUrl);
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', `Unable to open ${method.name}. Please try again.`);
      console.error('Deep link error:', error);
    }
  };

  const handleCashIn = () => {
    if (!amount || !selectedMethod) {
      Alert.alert('Error', 'Please select a method and enter amount');
      return;
    }
    
    const cashInAmount = parseFloat(amount);
    if (isNaN(cashInAmount) || cashInAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    Alert.alert(
      'Confirm Cash In',
      `Cash in ₱${cashInAmount.toFixed(2)} via ${selectedMethod.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => openEWalletApp(selectedMethod, cashInAmount)
        }
      ]
    );
  };

  const setQuickAmount = (value) => {
    setAmount(value.toString());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash In</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Enter Amount</Text>
          <View style={styles.amountInputWrapper}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
          
          {/* Quick Amount Buttons */}
          <View style={styles.quickAmountsContainer}>
            {quickAmounts.map((value) => (
              <TouchableOpacity
                key={value}
                style={styles.quickAmountButton}
                onPress={() => setQuickAmount(value)}
              >
                <Text style={styles.quickAmountText}>₱{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          {cashInMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod?.id === method.id && styles.selectedMethodCard
              ]}
              onPress={() => setSelectedMethod(method)}
              activeOpacity={0.7}
            >
              <View style={styles.methodContent}>
                <View style={[styles.iconContainer, { backgroundColor: method.color + '15' }]}>
                  <MaterialIcons 
                    name={method.icon} 
                    size={28} 
                    color={method.color} 
                  />
                </View>
                <View style={styles.methodDetails}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodFee}>{method.fee}</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedMethod?.id === method.id && styles.radioButtonSelected
                ]}>
                  {selectedMethod?.id === method.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            You will be redirected to complete the payment in your selected e-wallet app
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[
            styles.cashInButton,
            (!amount || !selectedMethod) && styles.disabledButton
          ]}
          onPress={handleCashIn}
          disabled={!amount || !selectedMethod}
          activeOpacity={0.8}
        >
          <Text style={styles.cashInButtonText}>
            Continue to {selectedMethod ? selectedMethod.name : 'Payment'}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  amountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 0,
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  methodsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedMethodCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodDetails: {
    flex: 1,
    marginLeft: 16,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  methodFee: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#3B82F6',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 18,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  cashInButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  cashInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CashInScreen;