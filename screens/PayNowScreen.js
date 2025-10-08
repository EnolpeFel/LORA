import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PayNowScreen = ({ navigation, route }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(12500.75);
  const [loanDetails, setLoanDetails] = useState(null);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);
  const [newTransaction, setNewTransaction] = useState(null);
  const [transactionFee, setTransactionFee] = useState(0);
  const [totalWithFee, setTotalWithFee] = useState(0);

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
        paymentsCompleted: loanApplication.paymentsCompleted || 1,
        paymentsRemaining: loanApplication.paymentsRemaining || 35,
      };
      setLoanDetails(details);
      setTotalWithFee(billingInfo.totalAmountDue || 1500);
    } else if (loanApplication) {
      const isProcessingStatus = loanApplication.status === 'Processing' || loanApplication.status === 'Pending';
      
      if (isProcessingStatus) {
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
        setTotalWithFee(0);
      }
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
      setTotalWithFee(1500);
    }
  }, [loanApplication, billingInfo]);

  const paymentMethods = [
    {
      id: 'wallet',
      name: 'Lora Wallet',
      icon: 'account-balance-wallet',
      balance: walletBalance,
      fee: 0,
      available: loanDetails ? walletBalance >= loanDetails.totalAmountDue && !loanDetails.isProcessing : false,
      description: 'Instant payment with no fees'
    },
    {
      id: 'gcash',
      name: 'GCash',
      icon: 'smartphone',
      fee: 1,
      description: 'Mobile wallet payment'
    },
    {
      id: 'maya',
      name: 'Maya',
      icon: 'smartphone',
      fee: 1,
      description: 'Digital wallet payment'
    },
    {
      id: 'bpi',
      name: 'BPI',
      icon: 'account-balance',
      fee: 1,
      description: 'Bank of the Philippine Islands'
    },
    {
      id: 'bdo',
      name: 'BDO',
      icon: 'account-balance',
      fee: 1,
      description: 'BDO Unibank'
    },
    {
      id: 'metrobank',
      name: 'Metrobank',
      icon: 'account-balance',
      fee: 1,
      description: 'Metropolitan Bank & Trust Co.'
    },
    {
      id: 'landbank',
      name: 'Landbank',
      icon: 'account-balance',
      fee: 1,
      description: 'Land Bank of the Philippines'
    },
    {
      id: 'unionbank',
      name: 'UnionBank',
      icon: 'account-balance',
      fee: 1,
      description: 'Union Bank of the Philippines'
    },
    {
      id: 'rcbc',
      name: 'RCBC',
      icon: 'account-balance',
      fee: 1,
      description: 'Rizal Commercial Banking Corporation'
    },
    {
      id: 'chinabank',
      name: 'China Bank',
      icon: 'account-balance',
      fee: 1,
      description: 'China Banking Corporation'
    },
    {
      id: 'pnb',
      name: 'PNB',
      icon: 'account-balance',
      fee: 1,
      description: 'Philippine National Bank'
    },
    {
      id: 'securitybank',
      name: 'Security Bank',
      icon: 'account-balance',
      fee: 1,
      description: 'Security Bank Corporation'
    },
    {
      id: 'visa',
      name: 'Visa',
      icon: 'credit-card',
      fee: 1,
      description: 'Visa Credit/Debit Card'
    },
    {
      id: 'mastercard',
      name: 'Mastercard',
      icon: 'credit-card',
      fee: 1,
      description: 'Mastercard Credit/Debit'
    },
    {
      id: 'amex',
      name: 'American Express',
      icon: 'credit-card',
      fee: 1,
      description: 'American Express Card'
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

    // Calculate transaction fee and total amount
    const fee = method.fee || 0;
    const totalAmount = loanDetails.totalAmountDue + fee;
    
    setTransactionFee(fee);
    setTotalWithFee(totalAmount);
    setSelectedPaymentMethod(method);
    
    // Process payment immediately after selection
    processPayment();
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
      
      let transactionStatus = 'Completed';
      let processingMessage = null;
      
      if (selectedPaymentMethod.id !== 'wallet') {
        transactionStatus = 'Pending';
        processingMessage = `Your payment via ${selectedPaymentMethod.name} is being processed. This may take 1-3 business days.`;
      }
      
      const newTransactionRecord = {
        id: transactionId,
        type: 'Payment',
        amount: loanDetails.totalAmountDue.toFixed(2),
        fee: transactionFee,
        totalAmount: totalWithFee.toFixed(2),
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
        status: transactionStatus,
        loanId: loanDetails.applicationId,
        transactionId: transactionId,
        paymentMethod: selectedPaymentMethod.name,
        lender: loanDetails.lender,
        loanType: loanDetails.loanType,
        processingMessage: processingMessage,
        isPending: transactionStatus === 'Pending',
        applicationDate: loanDetails.applicationDate,
        interestRate: loanDetails.interestRate,
        interestType: loanDetails.interestType,
        loanAmount: loanDetails.loanAmount,
        term: loanDetails.term,
        totalInterest: loanDetails.totalInterest,
        processingFee: loanDetails.processingFee,
        netRelease: loanDetails.netRelease,
        dueDate: loanDetails.dueDate,
        monthlyPayment: loanDetails.basePayment
      };

      setNewTransaction(newTransactionRecord);

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

  const goToDashboard = () => {
    navigation.goBack();
  };

  const goToTransactions = () => {
    const updatedTransactions = newTransaction ? [newTransaction, ...transactions] : transactions;
    setShowConfirmationModal(false);
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
          onPress={() => setShowPaymentModal(true)}
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
                  <TouchableOpacity 
                    onPress={() => setShowPaymentModal(false)}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View style={styles.amountSummary}>
                  <Text style={styles.amountSummaryLabel}>Amount to Pay</Text>
                  <Text style={styles.amountSummaryValue}>
                    ₱{loanDetails?.totalAmountDue.toFixed(2)}
                  </Text>
                  <Text style={styles.amountSummarySubtext}>Monthly Payment</Text>
                  
                  <View style={styles.feeNotice}>
                    <MaterialIcons name="info-outline" size={16} color="#6B7280" />
                    <Text style={styles.feeNoticeText}>
                      All payment methods except Lora Wallet have ₱1 transaction fee
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentMethodsContainer}>
                  <ScrollView 
                    style={styles.paymentMethodsScrollView}
                    showsVerticalScrollIndicator={true}
                  >
                    {paymentMethods.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.paymentMethodCard,
                          method.id === 'wallet' && !method.available && styles.unavailableMethod
                        ]}
                        onPress={() => handlePaymentMethodSelect(method)}
                        disabled={method.id === 'wallet' && !method.available}
                      >
                        <View style={styles.paymentMethodLeft}>
                          <View style={[
                            styles.methodIconContainer,
                            method.id === 'wallet' && !method.available && styles.unavailableIcon
                          ]}>
                            <MaterialIcons
                              name={method.icon}
                              size={22}
                              color={method.id === 'wallet' && !method.available ? "#9CA3AF" : "#8B5CF6"}
                            />
                          </View>
                          <View style={styles.paymentMethodInfo}>
                            <View style={styles.methodHeader}>
                              <Text style={[
                                styles.paymentMethodName,
                                method.id === 'wallet' && !method.available && styles.unavailableText
                              ]}>
                                {method.name}
                              </Text>
                              {method.fee > 0 ? (
                                <View style={styles.feeBadge}>
                                  <Text style={styles.feeBadgeText}>+₱{method.fee.toFixed(2)} fee</Text>
                                </View>
                              ) : (
                                <View style={styles.noFeeBadge}>
                                  <Text style={styles.noFeeBadgeText}>No fee</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.paymentMethodDescription}>
                              {method.description}
                            </Text>
                            {method.balance !== undefined && (
                              <Text style={[
                                styles.paymentMethodBalance,
                                !method.available && styles.insufficientBalance
                              ]}>
                                Balance: ₱{method.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        {method.id === 'wallet' && !method.available ? (
                          <MaterialIcons
                            name="error-outline"
                            size={20}
                            color="#EF4444"
                          />
                        ) : (
                          <MaterialIcons
                            name="chevron-right"
                            size={20}
                            color="#6B7280"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.modalFooter}>
                  <Text style={styles.footerText}>
                    💡 <Text style={styles.footerHighlight}>Save ₱1</Text> by using Lora Wallet
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.processingContainer}>
                <MaterialIcons name="hourglass-empty" size={40} color="#8B5CF6" />
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
              {selectedPaymentMethod?.id === 'wallet' 
                ? 'Payment Successful!' 
                : 'Payment Submitted!'}
            </Text>
            <Text style={styles.successMessage}>
              {selectedPaymentMethod?.id === 'wallet'
                ? 'Your monthly payment has been processed successfully.'
                : `Your payment via ${selectedPaymentMethod?.name} is being processed. This may take 1-3 business days to complete.`}
            </Text>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Status:</Text>
              <View style={styles.statusBadgeInline}>
                <MaterialIcons
                  name={selectedPaymentMethod?.id === 'wallet' ? 'check-circle' : 'schedule'}
                  size={16}
                  color={selectedPaymentMethod?.id === 'wallet' ? '#10B981' : '#F59E0B'}
                />
                <Text style={[
                  styles.successDetailValue,
                  { color: selectedPaymentMethod?.id === 'wallet' ? '#10B981' : '#F59E0B' }
                ]}>
                  {selectedPaymentMethod?.id === 'wallet' ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Transaction ID:</Text>
              <Text style={styles.successDetailValue}>{newTransaction?.transactionId || 'N/A'}</Text>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Loan Payment:</Text>
              <Text style={styles.successDetailValue}>₱{loanDetails.totalAmountDue.toFixed(2)}</Text>
            </View>

            {transactionFee > 0 && (
              <View style={styles.successDetails}>
                <Text style={styles.successDetailLabel}>Transaction Fee:</Text>
                <Text style={styles.successDetailValue}>₱{transactionFee.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.successDetails}>
              <Text style={[styles.successDetailLabel, styles.totalAmountLabel]}>Total Amount:</Text>
              <Text style={[styles.successDetailValue, styles.totalAmountValue]}>₱{totalWithFee.toFixed(2)}</Text>
            </View>

            <View style={styles.successDetails}>
              <Text style={styles.successDetailLabel}>Payment Method:</Text>
              <Text style={styles.successDetailValue}>{selectedPaymentMethod?.name || 'N/A'}</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  paymentModal: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  paymentModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  amountSummary: {
    backgroundColor: '#F5F3FF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  amountSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  amountSummaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  amountSummarySubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    width: '100%',
  },
  feeNoticeText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
    fontWeight: '500',
  },
  paymentMethodsContainer: {
    flex: 1,
    marginBottom: 10,
  },
  paymentMethodsScrollView: {
    flex: 1,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'white',
    minHeight: 80,
  },
  unavailableMethod: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  methodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unavailableIcon: {
    backgroundColor: '#F3F4F6',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  feeBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  feeBadgeText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  noFeeBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noFeeBadgeText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  paymentMethodDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentMethodBalance: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  insufficientBalance: {
    color: '#EF4444',
  },
  unavailableText: {
    color: '#9CA3AF',
  },
  modalFooter: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footerHighlight: {
    color: '#16A34A',
    fontWeight: '600',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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
    lineHeight: 20,
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
  totalAmountLabel: {
    fontSize: 16,
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
});

export default PayNowScreen;