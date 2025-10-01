import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PayNowScreen = ({ navigation, route }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(12500.75);
  const [loanDetails, setLoanDetails] = useState(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [newTransaction, setNewTransaction] = useState(null);

  // Get loan application data from navigation params
  const { loanApplication, transactions = [] } = route.params || {};

  useEffect(() => {
    if (loanApplication) {
      // Process the loan application to create billing details
      const billingDetails = calculateBillingDetails(loanApplication);
      setLoanDetails(billingDetails);
    } else {
      // Fallback to static data if no loan application provided
      setLoanDetails({
        applicationId: '-----',
        amount: 'P0.00',
        term: '0 months',
        lender: '------',
        status: '-----',
        totalUsedCreditLimit: 0.00,
        unpaidCharges: 0.00,
        interestDue: 0.00,
        penalties: 0.00,
        totalAmountDue: 0.00,
        dueDate: '---',
        isProcessing: false
      });
    }
  }, [loanApplication]);

  // Function to calculate billing details from loan application
  const calculateBillingDetails = (application) => {
    const isProcessingStatus = application.status === 'PROCESSING';

    // If loan is still processing, show minimal information
    if (isProcessingStatus) {
      return {
        applicationId: application.id || 'N/A',
        amount: application.amount || 'N/A',
        term: application.terms || 'N/A',
        lender: application.lender || 'N/A',
        status: application.status || 'Processing',
        loanType: application.type || 'N/A',
        monthlyIncome: application.monthlyIncome || 'N/A',
        collateral: application.collateral || 'N/A',
        totalUsedCreditLimit: 0,
        unpaidCharges: 0,
        interestDue: 0,
        penalties: 0,
        totalAmountDue: 0,
        dueDate: 'To be determined',
        isProcessing: true,
        applicationDate: application.date || new Date().toLocaleDateString(),
        // Receipt specific fields
        loanAmount: application.loanAmount || 0,
        interestRate: application.interestRate || 0,
        interestType: application.interestType || 'TBD',
        totalInterest: application.totalInterest || 0,
        processingFee: application.processingFee || 0,
        monthlyPayment: application.monthlyPayment || 0,
        totalPayment: application.totalPayment || 0,
        netRelease: application.netRelease || 0
      };
    }

    // For approved loans, use the provided data
    return {
      applicationId: application.id,
      amount: application.amount,
      term: application.terms,
      lender: application.lender,
      status: application.status,
      loanType: application.type || 'New Loan',
      monthlyIncome: application.monthlyIncome || 'N/A',
      collateral: application.collateral || 'N/A',
      totalUsedCreditLimit: application.loanAmount,
      unpaidCharges: parseFloat(application.loanAmount),
      interestDue: application.totalInterest,
      penalties: 0.00,
      totalAmountDue: application.totalPayment,
      monthlyPayment: parseFloat(application.monthlyPayment),
      netRelease: application.netRelease,
      dueDate: application.dueDate || new Date().toLocaleDateString(),
      isProcessing: false,
      applicationDate: application.date || new Date().toLocaleDateString(),
      // Receipt specific fields
      loanAmount: application.loanAmount,
      interestRate: application.interestRate,
      interestType: application.interestType,
      totalInterest: application.totalInterest,
      processingFee: parseFloat(application.processingFee),
      totalPayment: application.totalPayment
    };
  };

  const paymentMethods = [
    {
      id: 'wallet',
      name: 'Lora Wallet',
      icon: 'account-balance-wallet',
      balance: walletBalance,
      available: loanDetails ? walletBalance >= loanDetails.totalAmountDue && !loanDetails.isProcessing : false
    },
    {
      id: 'gcash',
      name: 'GCash',
      icon: 'smartphone',
      subtitle: 'Mobile wallet payment'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: 'account-balance',
      subtitle: 'Online banking'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'credit-card',
      subtitle: 'Visa, Mastercard'
    }
  ];

  const handlePaymentMethodSelect = (method) => {
    if (loanDetails.isProcessing) {
      Alert.alert(
        'Loan Still Processing',
        'Your loan application is still being processed. Payment will be available once your loan is approved and active.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (method.id === 'wallet' && !method.available) {
      Alert.alert(
        'Insufficient Balance',
        'Your wallet balance is insufficient for this payment. Please choose another payment method.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const processPayment = () => {
    if (!selectedPaymentMethod || !loanDetails) {
      Alert.alert('Error', 'Payment method or loan details not available');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);

      // Create new transaction record
      const transactionId = `TXN-${Date.now()}`;
      const currentDate = new Date();
      const newTransactionRecord = {
        id: transactionId,
        type: 'Payment',
        amount: loanDetails.totalAmountDue.toFixed(2),
        date: currentDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        time: currentDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        }),
        status: 'Completed',
        loanId: loanDetails.applicationId,
        transactionId: transactionId,
        paymentMethod: selectedPaymentMethod.name,
        lender: loanDetails.lender,
        loanType: loanDetails.loanType
      };

      setNewTransaction(newTransactionRecord);

      // If paying with wallet, deduct from balance
      if (selectedPaymentMethod.id === 'wallet') {
        setWalletBalance(prev => prev - loanDetails.totalAmountDue);
      }

      setShowConfirmationModal(true);
    }, 2000);
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

  // Function to navigate to Dashboard
  const goToDashboard = () => {
    navigation.navigate('Dashboard');
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
          <MaterialIcons name="hourglass-empty" size={40} color="#4F46E5" />
          <Text style={styles.loadingText}>Loading billing details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header matching the GCredit style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToDashboard}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay for Loan</Text>
        <TouchableOpacity onPress={goToTransactions}>
          <MaterialIcons name="receipt" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Receipt Section */}
        <View style={styles.receiptSection}>
          <View style={styles.receiptHeader}>
            <View style={styles.receiptTitleContainer}>
              <MaterialIcons name="receipt" size={24} color="#4F46E5" />
              <Text style={styles.receiptTitle}>Loan Receipt</Text>
              <View style={styles.statusBadge}>
                <MaterialIcons
                  name={loanDetails.status === 'Approved' ? 'check-circle' : 'hourglass-empty'}
                  size={16}
                  color={loanDetails.status === 'Approved' ? '#10B981' : '#F59E0B'}
                />
                <Text style={[
                  styles.statusText,
                  { color: loanDetails.status === 'Approved' ? '#10B981' : '#F59E0B' }
                ]}>
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
            <Text style={styles.receiptNumber}>Receipt #{loanDetails.applicationId}</Text>
            <Text style={styles.receiptDate}>
              Generated on {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>

          {showReceiptDetails && (
            <View style={styles.receiptDetails}>
              <View style={styles.receiptDivider} />

              {/* Loan Application Details */}
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>Loan Application Details</Text>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Application ID:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.applicationId}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Loan Type:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.loanType}</Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Application Date:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.applicationDate}</Text>
                </View>
              </View>

              <View style={styles.receiptDivider} />

              {/* Lender Information */}
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>Lending Company</Text>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Company Name:</Text>
                  <Text style={styles.receiptDetailValue}>{loanDetails.lender}</Text>
                </View>
                {!loanDetails.isProcessing && (
                  <>
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Interest Type:</Text>
                      <Text style={styles.receiptDetailValue}>{loanDetails.interestType}</Text>
                    </View>
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Interest Rate:</Text>
                      <Text style={styles.receiptDetailValue}>{loanDetails.interestRate}%</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.receiptDivider} />

              {/* Loan Terms & Breakdown */}
              <View style={styles.receiptSection}>
                <Text style={styles.receiptSectionTitle}>Loan Terms & Breakdown</Text>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Principal Amount:</Text>
                  <Text style={styles.receiptDetailValueAmount}>
                    {loanDetails.isProcessing ? '--' : `₱${loanDetails.loanAmount.toLocaleString()}`}
                  </Text>
                </View>
                <View style={styles.receiptDetailRow}>
                  <Text style={styles.receiptDetailLabel}>Loan Term:</Text>
                  <Text style={styles.receiptDetailValue}>
                    {loanDetails.term === 'N/A' ? '--' : loanDetails.term}
                  </Text>
                </View>
                {!loanDetails.isProcessing && (
                  <>
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Total Interest:</Text>
                      <Text style={styles.receiptDetailValueAmount}>₱{loanDetails.totalInterest.toFixed(2)}</Text>
                    </View>
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Processing Fee:</Text>
                      <Text style={styles.receiptDetailValueAmount}>₱{loanDetails.processingFee.toFixed(2)}</Text>
                    </View>
                    <View style={styles.receiptHighlightRow}>
                      <Text style={styles.receiptHighlightLabel}>Net Amount to Receive:</Text>
                      <Text style={styles.receiptNetReleaseValue}>₱{loanDetails.netRelease.toFixed(2)}</Text>
                    </View>
                  </>
                )}
              </View>

              {!loanDetails.isProcessing && (
                <>
                  <View style={styles.receiptDivider} />

                  {/* Payment Information */}
                  <View style={styles.receiptSection}>
                    <Text style={styles.receiptSectionTitle}>Payment Information</Text>
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>First Payment Due:</Text>
                      <Text style={styles.receiptDetailValue}>{loanDetails.dueDate}</Text>
                    </View>
                    <View style={styles.receiptDetailRow}>
                      <Text style={styles.receiptDetailLabel}>Payment Frequency:</Text>
                      <Text style={styles.receiptDetailValue}>Monthly</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Main Amount Display (like GCredit total amount) */}
        <View style={styles.amountDisplaySection}>
          <View style={styles.totalAmountContainer}>
            <Text style={styles.currencyLabel}>PHP</Text>
            <Text style={[
              styles.totalAmount,
              loanDetails.isProcessing && styles.processingAmount
            ]}>
              {loanDetails.isProcessing ? '---.--' : loanDetails.totalAmountDue.toFixed(2)}
            </Text>
            <Text style={styles.totalAmountLabel}>
              {loanDetails.isProcessing ? 'Amount To Be Determined' : 'Total Amount Due'}
            </Text>
          </View>
        </View>

        {/* Processing Status Banner */}
        {loanDetails.isProcessing && (
          <View style={styles.processingBanner}>
            <MaterialIcons name="hourglass-empty" size={20} color="#F59E0B" />
            <Text style={styles.processingBannerText}>
              Your loan is still being processed. Payment details will be available once approved.
            </Text>
          </View>
        )}

        {/* Loan Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionHeader}>My Billing Details</Text>
          <Text style={styles.dateRange}>
            Application ID: {loanDetails.applicationId === 'N/A' ? '--' : loanDetails.applicationId}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Loan Type:</Text>
              <Text style={[
                styles.detailValue,
                loanDetails.isProcessing && styles.processingText
              ]}>
                {loanDetails.loanType === 'N/A' ? '--' : loanDetails.loanType}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={[
                styles.detailAmount,
                loanDetails.isProcessing && styles.processingText
              ]}>
                {loanDetails.amount === 'N/A' ? '--' : loanDetails.amount}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Term:</Text>
              <Text style={[
                styles.detailValue,
                loanDetails.isProcessing && styles.processingText
              ]}>
                {loanDetails.term === 'N/A' ? '--' : loanDetails.term}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lender:</Text>
              <Text style={[
                styles.detailValue,
                loanDetails.isProcessing && styles.processingText
              ]}>
                {loanDetails.lender === 'N/A' ? '--' : loanDetails.lender}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[
                styles.detailValue,
                loanDetails.status === 'Processing' && styles.processingStatusText
              ]}>
                {loanDetails.status}
              </Text>
            </View>

            <View style={styles.separator} />

            {!loanDetails.isProcessing ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Principal Amount</Text>
                  <Text style={styles.detailAmount}>PHP {loanDetails.unpaidCharges.toFixed(2)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailSubLabel}>+ Interest Due</Text>
                  <Text style={styles.detailSubValue}>{loanDetails.interestDue.toFixed(2)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailSubLabel}>+ Penalties</Text>
                  <Text style={styles.detailSubValue}>{loanDetails.penalties.toFixed(2)}</Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.detailRow}>
                  <Text style={styles.totalDueLabel}>Total Amount Due</Text>
                  <Text style={styles.totalDueAmount}>PHP {loanDetails.totalAmountDue.toFixed(2)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Monthly Payment</Text>
                  <Text style={styles.detailAmount}>PHP {loanDetails.monthlyPayment?.toFixed(2) || '0.00'}</Text>
                </View>

                <Text style={styles.dueDateText}>due on {loanDetails.dueDate}</Text>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, styles.processingText]}>Principal Amount</Text>
                  <Text style={[styles.detailAmount, styles.processingText]}>--</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailSubLabel, styles.processingText]}>+ Interest Due</Text>
                  <Text style={[styles.detailSubValue, styles.processingText]}>--</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailSubLabel, styles.processingText]}>+ Penalties</Text>
                  <Text style={[styles.detailSubValue, styles.processingText]}>--</Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.detailRow}>
                  <Text style={[styles.totalDueLabel, styles.processingText]}>Total Amount Due</Text>
                  <Text style={[styles.totalDueAmount, styles.processingText]}>--</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, styles.processingText]}>Monthly Payment</Text>
                  <Text style={[styles.detailAmount, styles.processingText]}>--</Text>
                </View>

                <Text style={[styles.dueDateText, styles.processingText]}>
                  Due date: {loanDetails.dueDate}
                </Text>
              </>
            )}
          </View>

          <Text style={styles.disclaimer}>
            {loanDetails.isProcessing
              ? '*Billing details will be available once your loan is approved'
              : '*Any interest incurred will reflect on your billing date'
            }
          </Text>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            loanDetails.isProcessing && styles.disabledButton
          ]}
          onPress={() => {
            if (loanDetails.isProcessing) {
              Alert.alert(
                'Loan Still Processing',
                'Your loan application is still being processed. Payment will be available once your loan is approved and active.',
                [{ text: 'OK' }]
              );
            } else {
              setShowPaymentModal(true);
            }
          }}
          disabled={false} // Remove disabled prop to allow press for alert
        >
          <Text style={[
            styles.payButtonText,
            loanDetails.isProcessing && styles.disabledButtonText
          ]}>
            {loanDetails.isProcessing ? 'PAYMENT NOT AVAILABLE' : 'PAY FOR LOAN'}
          </Text>
        </TouchableOpacity>

        {/* Additional Options */}
        <View style={styles.additionalOptions}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={goToTransactions}
          >
            <Text style={styles.optionText}>Loan Transaction History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Text style={styles.optionText}>Auto-Payment</Text>
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
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isProcessing && setShowPaymentModal(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.paymentModal}>
            {!isProcessing ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.paymentModalTitle}>Choose Payment Method</Text>
                  <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                    <MaterialIcons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={styles.amountSummary}>
                  <Text style={styles.amountSummaryLabel}>Amount to Pay</Text>
                  <Text style={styles.amountSummaryValue}>
                    PHP {loanDetails.totalAmountDue.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.paymentMethodsList}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodCard,
                        method.id === 'wallet' && !method.available && styles.unavailableMethod
                      ]}
                      onPress={() => {
                        if (method.id === 'wallet' && !method.available) {
                          Alert.alert(
                            'Insufficient Balance',
                            'Your wallet balance is insufficient for this payment. Please choose another payment method.',
                            [{ text: 'OK' }]
                          );
                          return;
                        }
                        setSelectedPaymentMethod(method);
                        processPayment();
                      }}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <MaterialIcons
                          name={method.icon}
                          size={24}
                          color={method.id === 'wallet' && !method.available ? "#9CA3AF" : "#4F46E5"}
                        />
                        <View style={styles.paymentMethodInfo}>
                          <Text style={[
                            styles.paymentMethodName,
                            method.id === 'wallet' && !method.available && styles.unavailableText
                          ]}>
                            {method.name}
                          </Text>
                          {method.balance !== undefined ? (
                            <Text style={[
                              styles.paymentMethodBalance,
                              !method.available && styles.insufficientBalance
                            ]}>
                              Balance: PHP {method.balance.toFixed(2)}
                            </Text>
                          ) : (
                            <Text style={styles.paymentMethodSubtitle}>{method.subtitle}</Text>
                          )}
                        </View>
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={method.id === 'wallet' && !method.available ? "#9CA3AF" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.processingContainer}>
                <MaterialIcons name="hourglass-empty" size={40} color="#4F46E5" />
                <Text style={styles.processingTitle}>Processing Payment...</Text>
                <Text style={styles.processingSubtext}>Please wait while we process your payment</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Success Modal */}
      <Modal
        visible={showConfirmationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={goBackToDashboard}
      >
        <View style={styles.centeredView}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <MaterialIcons name="check" size={40} color="white" />
            </View>

            <Text style={styles.successTitle}>Payment Successful</Text>
            <Text style={styles.successMessage}>
              Your payment has been processed successfully. Your loan balance has been updated.
            </Text>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Transaction ID:</Text>
              <Text style={styles.successDetailValue}>{newTransaction?.transactionId || 'N/A'}</Text>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Amount Paid:</Text>
              <Text style={styles.successDetailValue}>PHP {loanDetails.totalAmountDue.toFixed(2)}</Text>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Payment Method:</Text>
              <Text style={styles.successDetailValue}>{selectedPaymentMethod?.name || 'N/A'}</Text>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.viewTransactionButton}
                onPress={() => {
                  setShowConfirmationModal(false);
                  goToTransactions();
                }}
              >
                <Text style={styles.viewTransactionButtonText}>View Transaction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.successButton}
                onPress={goBackToDashboard}
              >
                <Text style={styles.successButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#4F46E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flexGrow: 1,
  },
  // Receipt Section Styles
  receiptSection: {
    backgroundColor: 'white',
    margin: 16,
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
    backgroundColor: '#F3F4F6',
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
  receiptHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  receiptHighlightLabel: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  receiptNetReleaseValue: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
  },
  amountDisplaySection: {
    backgroundColor: '#4F46E5',
    marginHorizontal: 16,
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
  processingAmount: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  totalAmountLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  processingBanner: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  processingBannerText: {
    color: '#92400E',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  detailsSection: {
    backgroundColor: 'white',
    margin: 16,
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
    color: '#1F2937',
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 5,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  // Processing state styles
  processingText: {
    color: '#9CA3AF',
  },
  processingStatusText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#4F46E5',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#D1D5DB',
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
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  paymentModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  amountSummary: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  amountSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentMethodsList: {
    maxHeight: 300,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
  },
  unavailableMethod: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  unavailableText: {
    color: '#9CA3AF',
  },
  paymentMethodBalance: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 2,
  },
  insufficientBalance: {
    color: '#EF4444',
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  successActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  viewTransactionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  viewTransactionButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  successButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
});

export default PayNowScreen;