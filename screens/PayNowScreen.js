import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WALLET_PAYMENT, GET_WALLET_BALANCE } from "../actions/wallets.action";

const { width, height } = Dimensions.get('window');

const PayNowScreen = ({ navigation, route }) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [loanDetails, setLoanDetails] = useState(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [newTransaction, setNewTransaction] = useState(null);

  // Get loan application data and billing info from navigation params
  const { loanApplication, transactions = [], billingInfo } = route.params || {};

  useEffect(() => {
    if (loanApplication && billingInfo) {
      const details = {
        applicationId: loanApplication.id || 'N/A',
        amount: loanApplication.amount || 'N/A',
        term: loanApplication.terms || 'N/A',
        lender: loanApplication.lender || 'N/A',
        status: loanApplication.status || 'Active',
        loanType: loanApplication.type || 'Personal Loan',
        monthlyIncome: loanApplication.monthlyIncome || 'N/A',
        collateral: loanApplication.collateral || 'N/A',
        
        basePayment: billingInfo.basePayment || 1500,
        principalAmount: billingInfo.principalAmount || 1200,
        interestAmount: billingInfo.interestAmount || 300,
        lateFees: billingInfo.lateFees || 0,
        totalAmountDue: billingInfo.totalAmountDue || 1500,
        daysLate: billingInfo.daysLate || 0,
        
        dueDate: loanApplication.nextDueDate || loanApplication.dueDate || '2024-01-15',
        isProcessing: false,
        applicationDate: loanApplication.date || loanApplication.loanStartDate || '2024-01-01',
        
        loanAmount: loanApplication.loanAmount || 50000,
        remainingBalance: loanApplication.remainingBalance || 45000,
        interestRate: loanApplication.interestRate || '12.5',
        interestType: loanApplication.interestType || 'Fixed',
        totalInterest: loanApplication.totalInterest || 7500,
        processingFee: loanApplication.processingFee || 500,
        totalPayment: loanApplication.totalPayment || 57500,
        netRelease: loanApplication.netRelease || 49500,
        paymentsCompleted: loanApplication.paymentsCompleted,
        paymentsRemaining: loanApplication.paymentsRemaining || 35,
      };
      setLoanDetails(details);
    } else if (loanApplication) {
      
      if (loanApplication.status === 'PROCESSING') {
        setLoanDetails({
          applicationId: loanApplication.id || 'N/A',
          amount: loanApplication.amount || 'N/A',
          term: loanApplication.terms || 'N/A',
          lender: loanApplication.lender || 'N/A',
          status: loanApplication.status || 'Processing',
          loanType: loanApplication.type || 'N/A',
          totalAmountDue: 0,
          dueDate: 'To be determined',
          isProcessing: true,
        });
      } else if (loanApplication.status === 'ACTIVE') {
        const monthlyInterest = (loanApplication.monthlyPayment * (loanApplication.interestRate / 100)) / 12;

        const details = {
          applicationId: loanApplication.id || 'N/A',
          amount: loanApplication.amount || 'N/A',
          term: loanApplication.term || 'N/A',
          lender: loanApplication.lender || 'N/A',
          status: loanApplication.status || 'Active',
          loanType: loanApplication.type || 'Personal Loan',
          monthlyIncome: loanApplication.monthlyIncome || 'N/A',
          collateral: loanApplication.collateral || 'N/A',
          
          basePayment: loanApplication.monthlyPayment,
          principalAmount: loanApplication.monthlyPayment - monthlyInterest,
          interestAmount: monthlyInterest,
          lateFees: 0,
          totalAmountDue: loanApplication.monthlyPayment,
          daysLate: 0,
          
          dueDate: loanApplication.dueDate || '2024-01-15',
          isProcessing: false,
          applicationDate: loanApplication.applicationDate,
          
          loanAmount: loanApplication.loanAmount || 50000,
          remainingBalance: loanApplication.remainingBalance || 45000,
          interestRate: loanApplication.interestRate || '12.5',
          interestType: loanApplication.interestType || 'Fixed',
          totalInterest: loanApplication.totalInterest || 7500,
          processingFee: loanApplication.processingFee || 500,
          totalPayment: loanApplication.totalPayment || 57500,
          netRelease: loanApplication.netRelease || 49500,
          paymentsCompleted: loanApplication.transactions.length,
          paymentsRemaining: parseInt(loanApplication.term.replace(' months', '')) - loanApplication.transactions.length,
      };

      setLoanDetails(details);
      };

    } else {
      // Default data for testing
      setLoanDetails({
        applicationId: 'LN-2024-001',
        amount: '50,000',
        term: '36 months',
        lender: 'Lora Finance',
        status: 'Active',
        loanType: 'Personal Loan',
        basePayment: 1500,
        principalAmount: 1200,
        interestAmount: 300,
        lateFees: 0,
        totalAmountDue: 1500,
        daysLate: 0,
        dueDate: '2024-01-15',
        isProcessing: false,
        applicationDate: '2024-01-01',
        loanAmount: 50000,
        remainingBalance: 45000,
        interestRate: '12.5',
        interestType: 'Fixed',
        totalInterest: 7500,
        processingFee: 500,
        totalPayment: 57500,
        netRelease: 49500,
        paymentsCompleted: 1,
        paymentsRemaining: 35,
      });
    }
  }, [loanApplication, billingInfo]);

  // Check if returning from payment method screen with new transaction
  useEffect(() => {
    if (route.params?.newTransaction) {
      setNewTransaction(route.params.newTransaction);
      setShowConfirmationModal(true);
    }
  }, [route.params?.newTransaction]);

  const handlePayNow = () => {
    if (loanDetails.isProcessing) {
      Alert.alert(
        'Loan Still Processing',
        'Your loan application is still being processed. Payment will be available once your loan is approved and active.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show payment method modal instead of navigating
    setShowPaymentMethodModal(true);
  };

  const handlePaymentComplete = (transaction) => {
    setNewTransaction(transaction);
    setShowPaymentMethodModal(false);
    setShowConfirmationModal(true);
  };

  const goBackToDashboard = () => {
    setShowConfirmationModal(false);
    
    // Navigate back with updated transaction data
    const updatedTransactions = newTransaction ? [newTransaction, ...transactions] : transactions;
    
    navigation.navigate('Dashboard', { 
      newTransaction: newTransaction,
      updatedTransactions: updatedTransactions
    });
  };

  const goToDashboard = () => {
    navigation.goBack();
  };

  // Function to navigate to transactions
  const goToTransactions = () => {
    const updatedTransactions = newTransaction ? [newTransaction, ...transactions] : transactions;
    navigation.navigate('Transactions', { 
      transactions: updatedTransactions 
    });
  };

  // Show loading while processing loan application data
  if (!loanDetails) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goToDashboard}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay for Loan</Text>
          <TouchableOpacity>
            <MaterialIcons name="info-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="hourglass-empty" size={40} color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading billing details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToDashboard}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay for Loan</Text>
        <TouchableOpacity onPress={goToTransactions}>
          <MaterialIcons name="receipt" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Section */}
        <View style={styles.receiptSection}>
          <View style={styles.receiptHeader}>
            <View style={styles.receiptTitleContainer}>
              <MaterialIcons name="receipt" size={24} color="#8B5CF6" />
              <Text style={styles.receiptTitle}>Payment Details</Text>
              <View style={styles.statusBadge}>
                <MaterialIcons
                  name="check-circle"
                  size={16}
                  color="#10B981"
                />
                <Text style={[styles.statusText, { color: '#10B981' }]}>
                  {loanDetails.status}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowReceiptDetails(!showReceiptDetails)}
            >
              <MaterialIcons
                name={showReceiptDetails ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.receiptSummary}>
            <Text style={styles.receiptNumber}>Loan #{loanDetails.applicationId}</Text>
            <Text style={styles.receiptDate}>
              Due on {loanDetails.dueDate}
            </Text>
          </View>

          {showReceiptDetails && (
            <View style={styles.receiptDetails}>
              <View style={styles.receiptDivider} />

              {/* Loan Information */}
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>Loan Information</Text>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Loan ID:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.applicationId}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Loan Type:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.loanType}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Lender:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.lender}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Remaining Balance:</Text>
                  <Text style={styles.receiptDetailValueAmount}>
                    ₱{loanDetails.remainingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptDivider} />

              {/* Payment Progress */}
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>Payment Progress</Text>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Payments Completed:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.paymentsCompleted}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Payments Remaining:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.paymentsRemaining}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Main Amount Display - Monthly Payment Due */}
        <View style={styles.amountDisplaySection}>
          <View style={styles.totalAmountContainer}>
            <Text style={styles.currencyLabel}>PHP</Text>
            <Text style={styles.totalAmount}>
              {loanDetails.totalAmountDue.toFixed(2)}
            </Text>
            <Text style={styles.totalAmountLabel}>Monthly Payment Due</Text>
            {loanDetails.lateFees > 0 && (
              <Text style={styles.lateFeeWarning}>
                (Includes ₱{loanDetails.lateFees.toFixed(2)} late fee)
              </Text>
            )}
          </View>
        </View>

        {/* Late Fee Warning */}
        {loanDetails.lateFees > 0 && (
          <View style={styles.warningBanner}>
            <MaterialIcons name="warning" size={20} color="#F97316" />
            <Text style={styles.warningBannerText}>
              Payment is {loanDetails.daysLate} days overdue. Late fee of ₱{loanDetails.lateFees.toFixed(2)} has been applied.
            </Text>
          </View>
        )}

        {/* Payment Breakdown Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionHeader}>Payment Breakdown</Text>
          <Text style={styles.dateRange}>
            Due Date: {loanDetails.dueDate}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Base Monthly Payment</Text>
              <Text style={styles.detailAmount}>₱{loanDetails.basePayment?.toFixed(2)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailSubLabel}>• Principal</Text>
              <Text style={styles.detailSubValue}>₱{loanDetails.principalAmount?.toFixed(2)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailSubLabel}>• Interest</Text>
              <Text style={styles.detailSubValue}>₱{loanDetails.interestAmount?.toFixed(2)}</Text>
            </View>

            {loanDetails.lateFees > 0 && (
              <>
                <View style={styles.separator} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: '#DC2626' }]}>
                    Late Fee ({loanDetails.daysLate} days)
                  </Text>
                  <Text style={[styles.detailAmount, { color: '#DC2626' }]}>
                    ₱{loanDetails.lateFees.toFixed(2)}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <Text style={styles.totalDueLabel}>Total Amount Due</Text>
              <Text style={styles.totalDueAmount}>₱{loanDetails.totalAmountDue.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.disclaimer}>
            *This payment covers your monthly installment for {loanDetails.dueDate}
          </Text>
        </View>

        {/* Loan Summary */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionHeader}>Loan Summary</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Original Loan Amount</Text>
              <Text style={styles.detailValue}>₱{loanDetails.loanAmount?.toLocaleString()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining Balance</Text>
              <Text style={styles.detailAmount}>
                ₱{loanDetails.remainingBalance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interest Rate</Text>
              <Text style={styles.detailValue}>{loanDetails.interestRate}% per annum</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Loan Term</Text>
              <Text style={styles.detailValue}>{loanDetails.term}</Text>
            </View>
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            loanDetails.isProcessing && styles.disabledButton
          ]}
          onPress={handlePayNow}
          disabled={loanDetails.isProcessing}
        >
          <MaterialIcons name="payment" size={20} color="white" />
          <Text style={styles.payButtonText}>
            {loanDetails.isProcessing ? 'PROCESSING...' : `PAY ₱${loanDetails.totalAmountDue.toFixed(2)}`}
          </Text>
        </TouchableOpacity>

        {/* Additional Options */}
        <View style={styles.additionalOptions}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={goToTransactions}
          >
            <Text style={styles.optionText}>Payment History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Text style={styles.optionText}>Auto-Payment Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Text style={styles.optionText}>Download Receipt</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Payment Method Selection Modal */}
      <Modal
        visible={showPaymentMethodModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPaymentMethodModal(false)}
      >
        <PaymentMethodModalContent
          loanDetails={loanDetails}
          paymentAmount={loanDetails?.totalAmountDue || 0}
          transactions={transactions}
          onClose={() => setShowPaymentMethodModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      </Modal>

      {/* Payment Success Modal */}
      <Modal
        visible={showConfirmationModal}
        animationType="fade"
        transparent={true}
        onRequestClose={goBackToDashboard}
      >
        <View style={styles.centeredView}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check" size={40} color="white" />
            </View>

            <Text style={styles.successTitle}>
              {newTransaction?.status === 'Completed'
                ? 'Payment Successful!' 
                : 'Payment Submitted!'}
            </Text>
            <Text style={styles.successMessage}>
              {newTransaction?.processingMessage || 'Your payment has been processed successfully.'}
            </Text>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Status:</Text>
              <View style={styles.statusBadgeInline}>
                <MaterialIcons
                  name={newTransaction?.status === 'Completed' ? 'check-circle' : 'schedule'}
                  size={16}
                  color={newTransaction?.status === 'Completed' ? '#10B981' : '#F59E0B'}
                />
                <Text style={[
                  styles.successDetailValue,
                  { color: newTransaction?.status === 'Completed' ? '#10B981' : '#F59E0B' }
                ]}>
                  {newTransaction?.status || 'Completed'}
                </Text>
              </View>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Transaction ID:</Text>
              <Text style={styles.successDetailValue}>{newTransaction?.transactionId || 'N/A'}</Text>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Loan Payment:</Text>
              <Text style={styles.successDetailValue}>₱{newTransaction?.amount || '0.00'}</Text>
            </View>

            {newTransaction?.fee > 0 && (
              <View style={styles.successDetails}>
                <Text style={styles.successDetailLabel}>Transaction Fee:</Text>
                <Text style={styles.successDetailValue}>₱{newTransaction?.fee.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.successDetails}>
              <Text style={[styles.successDetailLabel, styles.totalAmountLabel]}>Total Amount:</Text>
              <Text style={[styles.successDetailValue, styles.totalAmountValue]}>
                ₱{newTransaction?.totalAmount || '0.00'}
              </Text>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Payment Method:</Text>
              <Text style={styles.successDetailValue}>{newTransaction?.paymentMethod || 'N/A'}</Text>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.viewTransactionButton}
                onPress={goToTransactions}
              >
                <Text style={styles.viewTransactionButtonText}>View Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successButton}
                onPress={goBackToDashboard}
              >
                <Text style={styles.successButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Payment Method Modal Content Component
const PaymentMethodModalContent = ({ loanDetails, paymentAmount, transactions, onClose, onPaymentComplete }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select', 'qr', 'form', 'receipt'
  
  // Form states
  const [transactionCode, setTransactionCode] = useState('');
  const [bankForm, setBankForm] = useState({ accountNumber: '', accountName: '', bankBranch: '', referenceNumber: '' });
  const [cardForm, setCardForm] = useState({ cardNumber: '', cardholderName: '', expiryDate: '', cvv: '' });
  const [receiptImage, setReceiptImage] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch wallet balance for lora wallet
  useEffect(() => {
    const fetchWalletBalance = async () => {
      const { success, balance } = await GET_WALLET_BALANCE();

      if (success) {
        setWalletBalance(balance);
      };
    };

    fetchWalletBalance();
  } , []);

  const paymentMethods = [
    { id: 'wallet', name: 'Lora Wallet', icon: 'account-balance-wallet', category: 'wallet', fee: 0, description: 'Instant payment with no fees' },
    { id: 'gcash', name: 'GCash', icon: 'smartphone', category: 'ewallet', fee: 1, description: 'Mobile wallet payment' },
    { id: 'maya', name: 'Maya', icon: 'smartphone', category: 'ewallet', fee: 1, description: 'Digital wallet payment' },
    { id: 'bpi', name: 'BPI', icon: 'account-balance', category: 'bank', fee: 1, description: 'Bank of the Philippine Islands' },
    { id: 'bdo', name: 'BDO', icon: 'account-balance', category: 'bank', fee: 1, description: 'BDO Unibank' },
    { id: 'metrobank', name: 'Metrobank', icon: 'account-balance', category: 'bank', fee: 1, description: 'Metropolitan Bank & Trust Co.' },
    { id: 'landbank', name: 'Landbank', icon: 'account-balance', category: 'bank', fee: 1, description: 'Land Bank of the Philippines' },
    { id: 'unionbank', name: 'UnionBank', icon: 'account-balance', category: 'bank', fee: 1, description: 'Union Bank of the Philippines' },
    { id: 'visa', name: 'Visa', icon: 'credit-card', category: 'card', fee: 1, description: 'Visa Credit/Debit Card' },
    { id: 'mastercard', name: 'Mastercard', icon: 'credit-card', category: 'card', fee: 1, description: 'Mastercard Credit/Debit' },
  ];

  const validateForm = () => {
    if (selectedMethod.id === 'gcash' || selectedMethod.id === 'maya') {
      if (!transactionCode || transactionCode.length < 8) {
        Alert.alert('Invalid Code', 'Please enter a valid transaction reference number (at least 8 characters)');
        return false;
      }
    } else if (selectedMethod.category === 'bank') {
      if (!bankForm.referenceNumber || !receiptImage) {
        Alert.alert('Required Fields', 'Please upload payment receipt and enter reference number');
        return false;
      }
    } else if (selectedMethod.category === 'card') {
      if (!cardForm.cardNumber || !cardForm.cardholderName || !cardForm.expiryDate || !cardForm.cvv) {
        Alert.alert('Required Fields', 'Please fill in all card details');
        return false;
      }
      if (cardForm.cardNumber.replace(/\s/g, '').length < 15) {
        Alert.alert('Invalid Card', 'Please enter a valid card number');
        return false;
      }
      if (cardForm.cvv.length < 3) {
        Alert.alert('Invalid CVV', 'Please enter a valid CVV');
        return false;
      }
    }
    return true;
  };

  const processPayment = () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method');
      return;
    }

    // For wallet, proceed directly
    if (selectedMethod.id === 'wallet') {
      Alert.alert(
        'Confirm Payment',
        `Process payment of ₱${(paymentAmount + selectedMethod.fee).toFixed(2)} via ${selectedMethod.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => executePayment() }
        ]
      );
      return;
    }

    // For e-wallets, show QR code
    if (selectedMethod.id === 'gcash' || selectedMethod.id === 'maya') {
      setPaymentStep('qr');
      return;
    }

    // For banks, show receipt upload
    if (selectedMethod.category === 'bank') {
      setPaymentStep('receipt');
      return;
    }

    // For cards, validate and proceed
    if (selectedMethod.category === 'card') {
      if (!validateForm()) return;
      Alert.alert(
        'Confirm Payment',
        `Process payment of ₱${(paymentAmount + selectedMethod.fee).toFixed(2)} via ${selectedMethod.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => executePayment() }
        ]
      );
    }
  };

  const handleUploadReceipt = () => {
    // Simulate image picker
    Alert.alert(
      'Upload Receipt',
      'Choose upload method',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            // Simulate camera
            setReceiptImage({ uri: 'camera_image', name: 'receipt_photo.jpg', type: 'image/jpeg' });
            Alert.alert('Success', 'Receipt photo captured successfully');
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            // Simulate gallery
            setReceiptImage({ uri: 'gallery_image', name: 'receipt_upload.jpg', type: 'image/jpeg' });
            Alert.alert('Success', 'Receipt uploaded from gallery');
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const submitPaymentWithReceipt = () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirm Submission',
      `Submit payment with uploaded receipt?\n\nYour payment will be verified within 1-3 business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => executePayment() }
      ]
    );
  };

  const submitPaymentWithCode = () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirm Payment',
      `Submit payment with reference number:\n${transactionCode}?\n\nYour payment will be verified within 1-3 business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => executePayment() }
      ]
    );
  };

  const executePayment = async () => {
    setIsProcessing(true);

    if (walletBalance < paymentAmount + selectedMethod.fee) {
      setIsProcessing(false);
      Alert.alert('Error', 'Insufficient wallet balance');
      return;
    };
    
    const { success, message, transactionId, referenceNumber } = await WALLET_PAYMENT(loanDetails.applicationId);
    
    if (!success) {
      setIsProcessing(false);
      Alert.alert('Error', message);
      return;
    };

    const currentDate = new Date();
    
    const newTransaction = {
      id: transactionId,
      type: 'Payment',
      amount: paymentAmount.toFixed(2),
      fee: selectedMethod.fee,
      totalAmount: (paymentAmount + selectedMethod.fee).toFixed(2),
      date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: selectedMethod.id === 'wallet' ? 'Completed' : 'Pending',
      loanId: loanDetails.applicationId,
      transactionId: transactionId,
      paymentMethod: selectedMethod.name,
      lender: loanDetails.lender,
      loanType: loanDetails.loanType,
      isPending: selectedMethod.id !== 'wallet',
      referenceNumber,
      processingMessage: selectedMethod.id !== 'wallet' 
        ? `Your payment via ${selectedMethod.name} is being processed. This may take 1-3 business days.`
        : null,
    };

    setIsProcessing(false);
    onPaymentComplete(newTransaction);

  };

  const renderForm = () => {
    if (!selectedMethod) return null;

    // Wallet payment
    if (selectedMethod.id === 'wallet') {
      return (
        <View style={styles.modalFormSection}>
          <View style={styles.walletInfo}>
            <MaterialIcons name="account-balance-wallet" size={48} color="#8B5CF6" />
            <Text style={styles.walletTitle}>Lora Wallet</Text>
            <Text style={styles.walletSubtext}>Instant payment with no fees</Text>
            <View style={styles.walletBalance}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>₱{walletBalance}</Text>
            </View>
          </View>
        </View>
      );
    }

    // E-wallet QR Code Step
    if ((selectedMethod.id === 'gcash' || selectedMethod.id === 'maya') && paymentStep === 'qr') {
      return (
        <View style={styles.modalFormSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setPaymentStep('select')}
          >
            <MaterialIcons name="arrow-back" size={20} color="#8B5CF6" />
            <Text style={styles.backButtonText}>Back to payment methods</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>Scan QR Code</Text>
          <Text style={styles.instructionText}>
            1. Open your {selectedMethod.name} app{'\n'}
            2. Scan the QR code below{'\n'}
            3. Complete the payment{'\n'}
            4. Enter the transaction reference number
          </Text>

          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <MaterialIcons name="qr-code-2" size={120} color="#8B5CF6" />
              <Text style={styles.qrText}>QR Code for {selectedMethod.name}</Text>
            </View>
            <View style={styles.qrDetails}>
              <Text style={styles.qrDetailLabel}>Send to:</Text>
              <Text style={styles.qrDetailValue}>0999 999 9999</Text>
              <Text style={styles.qrDetailLabel}>Amount:</Text>
              <Text style={styles.qrDetailValueAmount}>₱{(paymentAmount + selectedMethod.fee).toFixed(2)}</Text>
            </View>
          </View>

          <Text style={styles.orDividerText}>OR Send directly to</Text>
          <View style={styles.sendToCard}>
            <MaterialIcons name="smartphone" size={24} color="#8B5CF6" />
            <Text style={styles.sendToNumber}>0999 999 9999</Text>
          </View>

          <Text style={styles.formSubtitle}>Enter Transaction Reference Number</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g. GC12345678 or REF123456"
            value={transactionCode}
            onChangeText={setTransactionCode}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.submitButton, !transactionCode && styles.disabledButton]}
            onPress={submitPaymentWithCode}
            disabled={!transactionCode}
          >
            <Text style={styles.submitButtonText}>Submit Payment</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Bank Receipt Upload Step
    if (selectedMethod.category === 'bank' && paymentStep === 'receipt') {
      return (
        <View style={styles.modalFormSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setPaymentStep('select')}
          >
            <MaterialIcons name="arrow-back" size={20} color="#8B5CF6" />
            <Text style={styles.backButtonText}>Back to payment methods</Text>
          </TouchableOpacity>

          <Text style={styles.formTitle}>{selectedMethod.name} Payment</Text>
          <Text style={styles.instructionText}>
            Transfer payment to our {selectedMethod.name} account and upload the receipt
          </Text>

          <View style={styles.bankDetailsCard}>
            <Text style={styles.bankDetailLabel}>Bank Name:</Text>
            <Text style={styles.bankDetailValue}>{selectedMethod.name}</Text>
            <Text style={styles.bankDetailLabel}>Account Name:</Text>
            <Text style={styles.bankDetailValue}>Lora Finance Corporation</Text>
            <Text style={styles.bankDetailLabel}>Account Number:</Text>
            <Text style={styles.bankDetailValue}>1234 5678 9012</Text>
            <Text style={styles.bankDetailLabel}>Amount to Transfer:</Text>
            <Text style={styles.bankDetailValueAmount}>₱{(paymentAmount + selectedMethod.fee).toFixed(2)}</Text>
          </View>

          <View style={styles.uploadSection}>
            <Text style={styles.formSubtitle}>Upload Payment Receipt</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadReceipt}
            >
              <MaterialIcons 
                name={receiptImage ? "check-circle" : "cloud-upload"} 
                size={24} 
                color={receiptImage ? "#10B981" : "#8B5CF6"} 
              />
              <Text style={[styles.uploadButtonText, receiptImage && styles.uploadedText]}>
                {receiptImage ? 'Receipt Uploaded ✓' : 'Upload Receipt (Photo/PDF)'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder="Reference Number (from receipt)"
            value={bankForm.referenceNumber}
            onChangeText={(text) => setBankForm({...bankForm, referenceNumber: text})}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.submitButton, (!receiptImage || !bankForm.referenceNumber) && styles.disabledButton]}
            onPress={submitPaymentWithReceipt}
            disabled={!receiptImage || !bankForm.referenceNumber}
          >
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          </TouchableOpacity>

          <Text style={styles.verificationNote}>
            ⓘ Payment will be verified within 1-3 business days
          </Text>
        </View>
      );
    }

    // Card payment form
    if (selectedMethod.category === 'card') {
      return (
        <View style={styles.modalFormSection}>
          <Text style={styles.formTitle}>{selectedMethod.name} Card Details</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Card Number"
            keyboardType="number-pad"
            maxLength={19}
            value={cardForm.cardNumber}
            onChangeText={(text) => {
              const formatted = text.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
              setCardForm({...cardForm, cardNumber: formatted});
            }}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Cardholder Name"
            autoCapitalize="characters"
            value={cardForm.cardholderName}
            onChangeText={(text) => setCardForm({...cardForm, cardholderName: text})}
          />
          <View style={styles.cardRow}>
            <TextInput
              style={[styles.modalInput, {flex: 1, marginRight: 8}]}
              placeholder="MM/YY"
              keyboardType="number-pad"
              maxLength={5}
              value={cardForm.expiryDate}
              onChangeText={(text) => {
                let formatted = text.replace(/\D/g, '');
                if (formatted.length >= 2) {
                  formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4);
                }
                setCardForm({...cardForm, expiryDate: formatted});
              }}
            />
            <TextInput
              style={[styles.modalInput, {flex: 1, marginLeft: 8}]}
              placeholder="CVV"
              keyboardType="number-pad"
              maxLength={3}
              secureTextEntry
              value={cardForm.cvv}
              onChangeText={(text) => setCardForm({...cardForm, cvv: text})}
            />
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.modalHeaderTitle}>Choose Payment Method</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        {paymentStep === 'select' && (
          <>
            <View style={styles.modalAmountSection}>
              <Text style={styles.modalAmountLabel}>Amount to Pay</Text>
              <Text style={styles.modalAmountValue}>₱{paymentAmount.toFixed(2)}</Text>
              {selectedMethod && selectedMethod.fee > 0 && (
                <Text style={styles.modalFeeText}>+ ₱{selectedMethod.fee.toFixed(2)} transaction fee</Text>
              )}
            </View>

            <View style={styles.methodsGrid}>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCardModal,
                    selectedMethod?.id === method.id && styles.methodCardSelected
                  ]}
                  onPress={() => setSelectedMethod(method)}
                >
                  <MaterialIcons
                    name={method.icon}
                    size={24}
                    color={selectedMethod?.id === method.id ? '#8B5CF6' : '#6B7280'}
                  />
                  <Text style={[
                    styles.methodNameModal,
                    selectedMethod?.id === method.id && styles.methodNameSelected
                  ]}>
                    {method.name}
                  </Text>
                  {selectedMethod?.id === method.id && (
                    <MaterialIcons name="check-circle" size={16} color="#8B5CF6" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {renderForm()}
      </ScrollView>

      <View style={styles.modalFooter}>
        {paymentStep === 'select' && (
          <TouchableOpacity
            style={[styles.payNowButton, (!selectedMethod || isProcessing) && styles.disabledButton]}
            onPress={processPayment}
            disabled={!selectedMethod || isProcessing}
          >
            <Text style={styles.payNowButtonText}>
              {isProcessing ? 'Processing...' : selectedMethod?.id === 'wallet' 
                ? `Pay ₱${(paymentAmount + (selectedMethod?.fee || 0)).toFixed(2)}`
                : 'Continue'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#8B5CF6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  receiptSection: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  toggleButton: {
    padding: 4,
  },
  receiptSummary: {
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  receiptDetails: {
    marginTop: 12,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  receiptDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  receiptDetailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  receiptDetailValueAmount: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  amountDisplaySection: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 16,
  },
  totalAmountContainer: {
    alignItems: 'center',
  },
  currencyLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  totalAmount: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  totalAmountLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  lateFeeWarning: {
    color: '#FED7AA',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  warningBanner: {
    backgroundColor: '#FFF7ED',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  warningBannerText: {
    color: '#9A3412',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  detailsSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  dateRange: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  detailAmount: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailSubLabel: {
    fontSize: 14,
    color: '#6B7280',
    paddingLeft: 10,
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalDueLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalDueAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  payButton: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  additionalOptions: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  successDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  successDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  successDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  successActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  viewTransactionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  viewTransactionButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#8B5CF6',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  modalContent: {
    flex: 1,
  },
  modalAmountSection: {
    backgroundColor: '#8B5CF6',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalAmountLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 8,
  },
  modalAmountValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  modalFeeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingTop: 8,
  },
  methodCardModal: {
    width: (width - 48) / 3,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    margin: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 90,
    position: 'relative',
  },
  methodCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  methodNameModal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 8,
  },
  methodNameSelected: {
    color: '#8B5CF6',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  modalFormSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
  },
  walletInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  walletTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  walletSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  walletBalance: {
    backgroundColor: '#F5F3FF',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payNowButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrPlaceholder: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  qrText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
  qrDetails: {
    width: '100%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  qrDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  qrDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  qrDetailValueAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  orDividerText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginVertical: 16,
  },
  sendToCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  sendToNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginLeft: 12,
  },
  formSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bankDetailsCard: {
    backgroundColor: '#F5F3FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  bankDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  bankDetailValueAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
    marginLeft: 8,
  },
  uploadedText: {
    color: '#10B981',
  },
  verificationNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default PayNowScreen;