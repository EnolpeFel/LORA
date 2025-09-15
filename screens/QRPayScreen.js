import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const QRPayScreen = ({ navigation }) => {
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [amount, setAmount] = useState('100.00');

  const generateQRCode = () => {
    setQrCodeGenerated(true);
    Alert.alert('QR Code Generated', 'Your payment QR code is now active');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay with QR</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {qrCodeGenerated ? (
          <>
            <View style={styles.qrContainer}>
              <Image 
                source={require("../assets/qr-placeholder.png")} 
                style={styles.qrCode}
              />
              <Text style={styles.amountText}>₱{amount}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Alert.alert('QR Code Scanned', 'Payment received successfully')}
            >
              <Text style={styles.actionButtonText}>Simulate QR Scan</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.instructions}>
              Generate a QR code to receive payments. The payer will scan this code to send you money.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.generateButton}
              onPress={generateQRCode}
            >
              <Text style={styles.generateButtonText}>Generate QR Code</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRPayScreen;