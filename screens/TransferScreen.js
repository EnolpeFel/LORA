import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TransferScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = () => {
    if (!amount || !accountNumber) {
      Alert.alert('Error', 'Please enter amount and account number');
      return;
    }
    
    const transferAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(transferAmount)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (transferAmount <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    if (accountNumber.length < 10) {
      Alert.alert('Error', 'Account number must be at least 10 digits');
      return;
    }

    setIsProcessing(true);
    
    Alert.alert(
      'Confirm Transfer',
      `Transfer ₱${transferAmount.toLocaleString('en-PH', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })} to account ${accountNumber}?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => setIsProcessing(false)
        },
        { 
          text: 'Confirm', 
          onPress: () => {
            // Simulate API call
            setTimeout(() => {
              setIsProcessing(false);
              Alert.alert(
                'Success', 
                `Transfer of ₱${transferAmount.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} was successful`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            }, 1500);
          }
        }
      ]
    );
  };

  const formatAmount = (text) => {
    // Remove all non-digit characters except decimal point
    let cleanedText = text.replace(/[^0-9.]/g, '');
    
    // Remove extra decimal points
    const decimalSplit = cleanedText.split('.');
    if (decimalSplit.length > 2) {
      cleanedText = decimalSplit[0] + '.' + decimalSplit.slice(1).join('');
    }
    
    // Format with commas
    const num = parseFloat(cleanedText);
    if (!isNaN(num)) {
      setAmount(num.toLocaleString('en-PH', {
        maximumFractionDigits: 2
      }));
    } else {
      setAmount('');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transfer Money</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={formatAmount}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit account number"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Note (Optional)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Add a note (max 30 characters)"
                value={note}
                onChangeText={(text) => setNote(text.slice(0, 30))}
                maxLength={30}
                multiline
                numberOfLines={3}
                returnKeyType="done"
              />
              <Text style={styles.charCount}>{note.length}/30</Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.transferButton,
                isProcessing && styles.disabledButton
              ]} 
              onPress={handleTransfer}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Text style={styles.transferButtonText}>Processing...</Text>
              ) : (
                <Text style={styles.transferButtonText}>Transfer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 24,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingLeft: 14,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  transferButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#C4B5FD',
  },
  transferButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransferScreen;