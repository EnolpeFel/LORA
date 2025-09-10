import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CashInScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);

  const cashInMethods = [
    { id: 1, name: 'Bank Transfer', icon: 'account-balance', fee: 'No fee' },
    { id: 2, name: 'Credit/Debit Card', icon: 'credit-card', fee: '2% fee' },
    { id: 3, name: 'Over-the-Counter', icon: 'store', fee: 'Php 15.00 fee' },
    { id: 4, name: 'E-Wallet', icon: 'account-balance-wallet', fee: 'No fee' },
  ];

  const handleCashIn = () => {
    if (!amount || !selectedMethod) {
      Alert.alert('Error', 'Please select a method and enter amount');
      return;
    }
    
    const cashInAmount = parseFloat(amount);
    if (isNaN(cashInAmount)) {
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
          onPress: () => {
            Alert.alert('Success', `Cash in of ₱${cashInAmount.toFixed(2)} is being processed`);
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cash In</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Cash In Method</Text>
        
        {cashInMethods.map(method => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod?.id === method.id && styles.selectedMethodCard
            ]}
            onPress={() => setSelectedMethod(method)}
          >
            <MaterialIcons 
              name={method.icon} 
              size={24} 
              color={selectedMethod?.id === method.id ? '#8B5CF6' : '#6B7280'} 
            />
            <View style={styles.methodInfo}>
              <Text style={[
                styles.methodName,
                selectedMethod?.id === method.id && styles.selectedMethodText
              ]}>
                {method.name}
              </Text>
              <Text style={styles.methodFee}>{method.fee}</Text>
            </View>
            {selectedMethod?.id === method.id && (
              <MaterialIcons name="check-circle" size={24} color="#8B5CF6" />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={[
            styles.cashInButton,
            (!amount || !selectedMethod) && styles.disabledButton
          ]}
          onPress={handleCashIn}
          disabled={!amount || !selectedMethod}
        >
          <Text style={styles.cashInButtonText}>Cash In</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    paddingBottom: 24,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedMethodCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 16,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  selectedMethodText: {
    color: '#8B5CF6',
  },
  methodFee: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  cashInButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  cashInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CashInScreen;