import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GET_CURRENT_LOAN_DATA } from "../actions/loans.action";
import { format, addMonths, differenceInDays, setDate } from 'date-fns';

// Billing calculation utility - centralized calculation for consistency
const calculateBillingAmount = (loanData) => {
  // Parse base monthly payment
  // const basePayment = parseFloat(loanData.monthlyPayment.replace(/[₱,]/g, ''));
  const basePayment = loanData.monthlyPayment;
  
  // Calculate interest for current period
  const remainingBalance = loanData.remainingBalance;
  const monthlyInterestRate = loanData.interestRate / 100;
  const interestAmount = remainingBalance * monthlyInterestRate;
  
  // Calculate principal payment
  const principalAmount = basePayment - interestAmount;
  
  // Check for late fees
  const today = new Date();
  const dayOfActivedAt = new Date(loanData.activedAt).getDate();
  const adjustedDate =  setDate(today, dayOfActivedAt);
  const dueDate =  addMonths(adjustedDate, 1);
  const daysRemaining = differenceInDays(dueDate, today);
  let lateFees = 0;
  
  if (today > dueDate) {
    const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    lateFees = daysLate * 50; // ₱50 per day late fee
  }
  
  // Calculate total amount due
  const totalAmountDue = basePayment + lateFees;
  
  return {
    basePayment,
    principalAmount,
    interestAmount,
    lateFees,
    totalAmountDue,
    daysLate: lateFees > 0 ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0,
  };
};

const CurrentLoanScreen = ({ navigation }) => {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [daysUntilDue, setDaysUntilDue] = useState(0);

  const [loanData,  setLoanData] = useState({
    id: 'LN-2025-001234',
    amount: '₱150,000.00',
    terms: '36 months',
    lender: 'ABC Lending Corp',
    status: 'Approved',
    type: 'Personal Loan',
    date: 'April 1, 2025',
    monthlyIncome: '₱50,000.00',
    collateral: 'None',
    loanAmount: 150000.00,
    interestRate: 8.5,
    interestType: 'Reducing Balance',
    totalInterest: 19125.00,
    processingFee: 3000.00,
    monthlyPayment: '₱5,250.00',
    totalPayment: 169125.00,
    netRelease: 147000.00,
    remainingBalance: 132000.00,
    paidAmount: 18000.00,
    nextDueDate: 'August 5, 2025',
    loanTerm: 36,
    paymentsCompleted: 4,
    paymentsRemaining: 32,
    loanStartDate: 'April 1, 2025',
    loanEndDate: 'April 1, 2028',
    dueDate: 'August 5, 2025',
  });

  const [paymentHistory, setPaymentHistory] = useState([
    {
      id: 1,
      date: 'July 5, 2025',
      amount: 5250.00,
      principal: 4000.00,
      interest: 1250.00,
      status: 'Completed',
      paymentMethod: 'Wallet',
    },
    {
      id: 2,
      date: 'June 5, 2025',
      amount: 5250.00,
      principal: 3950.00,
      interest: 1300.00,
      status: 'Completed',
      paymentMethod: 'Bank Transfer',
    },
    {
      id: 3,
      date: 'May 5, 2025',
      amount: 5250.00,
      principal: 3900.00,
      interest: 1350.00,
      status: 'Completed',
      paymentMethod: 'Wallet',
    },
    {
      id: 4,
      date: 'April 5, 2025',
      amount: 7000.00,
      principal: 5750.00,
      interest: 1250.00,
      status: 'Completed',
      paymentMethod: 'GCash',
    },
  ]);

  // Calculate billing info using the centralized method
  const billingInfo = calculateBillingAmount(loanData);

  useEffect(() => {
    calculateDaysUntilDue();
  }, [loanData]);

  const calculateProgress = () => {
    return (loanData.paidAmount / loanData.loanAmount) * 100;
  };

  const calculateDaysUntilDue = () => {
    const today = new Date();
    const dayOfActivedAt = new Date(loanData.activedAt).getDate();
    const adjustedDate = setDate(today, dayOfActivedAt);
    const dueDate = addMonths(adjustedDate, 1);
    
    const diffDays = differenceInDays(dueDate, today);

    setDaysUntilDue(diffDays);
  };

  const goToPayNow = () => {
    // Pass complete billing info to PayNow screen
    // This ensures the amount shown here matches exactly what PayNow will display
    navigation.navigate('PayNow', {
      loanApplication: {
        ...loanData,
        // Add the actual amount due for PayNow to use directly
        actualAmountDue: billingInfo.totalAmountDue,
      },
      transactions: [],
      billingInfo: {
        basePayment: billingInfo.basePayment,
        principalAmount: billingInfo.principalAmount,
        interestAmount: billingInfo.interestAmount,
        lateFees: billingInfo.lateFees,
        totalAmountDue: billingInfo.totalAmountDue,
        daysLate: billingInfo.daysLate,
      },
    });
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to reach us:',
      [
        { 
          text: 'Call Us', 
          onPress: () => Alert.alert('Calling', '1-800-LOAN-HELP')
        },
        { 
          text: 'Email', 
          onPress: () => Alert.alert('Email', 'support@abclending.com')
        },
        { 
          text: 'Live Chat', 
          onPress: () => Alert.alert('Chat', 'Opening live chat...') 
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const isUrgent = daysUntilDue <= 7 || billingInfo.lateFees > 0;

  useEffect(() => {
    const fetchCurrentLoanData = async () => {
      const { message, success, currentLoan } = await GET_CURRENT_LOAN_DATA();

      if (success) {
        const totalPayment = currentLoan.transactions.reduce((total, transaction) => total + transaction.amount, 0);
        const paymentsCompleted = currentLoan.transactions.length;
        const paymentsRemaining = parseInt(currentLoan.terms.replace(' months', '')) - paymentsCompleted;

        const formattedLoanData = {
          ...currentLoan,
          lender: currentLoan.lendingCompany.name,
          collateral: 'None Collateral', // For now
          totalPayment,
          paidAmount: parseFloat(totalPayment),
          nextDueDate: currentLoan.dueDate,
          loanTerm: currentLoan.terms,
          paymentsCompleted,
          paymentsRemaining,
          loanStartDate: format(currentLoan.activedAt, "MMM dd, yyyy"),
          loanEndDate: format(addMonths(currentLoan.activedAt, parseInt(currentLoan.terms.replace(' months', ''))), "MMM dd, yyyy")
        };

        const formattedTransactionHistories = currentLoan.transactions.map((tx) => {
          return {
            ...tx,
            date: format(tx.createdAt, 'MMM dd, yyyy'),
            principal: tx.amount - (tx.amount * (currentLoan.interestRate / 100)),
            interest: tx.amount * (currentLoan.interestRate / 100),
            paymentMethod: tx.method
          }
        })

        setLoanData(formattedLoanData);
        setPaymentHistory(formattedTransactionHistories);
      };
      
    };

    fetchCurrentLoanData();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Loan</Text>
        <TouchableOpacity onPress={() => setShowLoanDetails(true)}>
          <MaterialIcons name="info-outline" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Urgent Payment Alert */}
        {isUrgent && (
          <View style={styles.urgentAlert}>
            <MaterialIcons name="warning" size={24} color="#F97316" />
            <View style={styles.urgentTextContainer}>
              <Text style={styles.urgentTitle}>
                {billingInfo.lateFees > 0 ? 'Payment Overdue!' : 'Payment Due Soon!'}
              </Text>
              <Text style={styles.urgentText}>
                {billingInfo.lateFees > 0 
                  ? `${billingInfo.daysLate} days overdue. Late fee: ₱${billingInfo.lateFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : `${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'} remaining to avoid late fees`
                }
              </Text>
            </View>
          </View>
        )}

        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={styles.balanceLabel}>Remaining Balance</Text>
              <Text style={styles.balanceAmount}>
                ₱{parseFloat(loanData.remainingBalance).toLocaleString('en-PH', { currency: 'PHP' ,minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles.activeStatus]}>
              <MaterialIcons name="check-circle" size={16} color="#059669" />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          {/* Visual Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>
                  {loanData.paymentsCompleted}
                </Text>
                <Text style={styles.progressLabel}>Paid</Text>
              </View>
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${calculateProgress()}%` }]}
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {calculateProgress().toFixed(0)}% Complete
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>
                  {loanData.paymentsRemaining}
                </Text>
                <Text style={styles.progressLabel}>Remaining</Text>
              </View>
            </View>
          </View>

          <View style={styles.amountBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Original Amount</Text>
              <Text style={styles.breakdownValue}>
                ₱{loanData.loanAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Amount Paid</Text>
              <Text style={styles.breakdownValuePaid}>
                ₱{loanData.paidAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Next Payment Card - Shows exact amount user will pay */}
        <View style={[styles.paymentCard, isUrgent && styles.paymentCardUrgent]}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconContainer}>
                <MaterialIcons 
                  name="calendar-today" 
                  size={24} 
                  color={isUrgent ? "#F97316" : "#8B5CF6"} 
                />
              </View>
              <View>
                <Text style={styles.paymentLabel}>Next Payment</Text>
                <Text style={styles.paymentDateText}>{loanData.nextDueDate}</Text>
                <Text style={[styles.paymentDaysText, isUrgent && styles.paymentDaysTextUrgent]}>
                  {
                    daysUntilDue === 0 
                      ? 'Today'
                      : daysUntilDue === 1 
                        ? 'Tomorrow'
                        : `${daysUntilDue} days`
                  }
                </Text>
              </View>
            </View>
            <View style={styles.paymentRight}>
              <Text style={[styles.paymentAmountLarge, isUrgent && styles.paymentAmountUrgent]}>
                ₱{billingInfo.totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              {billingInfo.lateFees > 0 && (
                <Text style={styles.paymentNote}>
                  Includes ₱{billingInfo.lateFees.toFixed(2)} late fee
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.payNowButton, isUrgent && styles.payNowButtonUrgent]}
            onPress={goToPayNow}
          >
            <MaterialIcons name="payment" size={20} color="white" />
            <Text style={styles.payNowButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Payments */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity onPress={() => setShowPaymentHistory(true)}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {paymentHistory.slice(0, 3).map((payment) => (
            <View key={payment.id} style={styles.historyItem}>
              <View style={styles.historyIconWrapper}>
                <MaterialIcons name="check-circle" size={24} color="#10B981" />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyDate}>{payment.date}</Text>
                <Text style={styles.historyMethod}>via {payment.paymentMethod}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>
                  ₱{payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Helpful Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="lightbulb" size={20} color="#F59E0B" />
            <Text style={styles.tipsTitle}>Helpful Tips</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Set up auto-pay to never miss a payment
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Pay early to reduce your interest charges
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Contact support if you need payment assistance
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment History Modal */}
      <Modal
        visible={showPaymentHistory}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPaymentHistory(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowPaymentHistory(false)}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment History</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.historySummary}>
              <Text style={styles.historySummaryLabel}>Total Paid</Text>
              <Text style={styles.historySummaryAmount}>
                ₱{loanData.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.historySummarySubtext}>
                {loanData.paymentsCompleted} payments completed
              </Text>
            </View>

            {paymentHistory.map((payment) => (
              <View key={payment.id} style={styles.fullHistoryItem}>
                <View style={styles.fullHistoryHeader}>
                  <View style={styles.fullHistoryLeft}>
                    <MaterialIcons name="check-circle" size={24} color="#10B981" />
                    <View style={styles.fullHistoryInfo}>
                      <Text style={styles.fullHistoryDate}>{payment.date}</Text>
                      <Text style={styles.fullHistoryMethod}>
                        via {payment.paymentMethod}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.fullHistoryTotal}>
                    ₱{parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                
                <View style={styles.paymentBreakdown}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabelDetail}>Principal Payment</Text>
                    <Text style={styles.breakdownAmount}>
                      ₱{parseFloat(payment.principal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabelDetail}>Interest Payment</Text>
                    <Text style={styles.breakdownAmount}>
                      ₱{parseFloat(payment.interest).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Loan Details Modal */}
      <Modal
        visible={showLoanDetails}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowLoanDetails(false)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowLoanDetails(false)}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loan Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Basic Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan ID</Text>
                <Text style={styles.detailValue}>{loanData.id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lender</Text>
                <Text style={styles.detailValue}>{loanData.lender}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan Type</Text>
                <Text style={styles.detailValue}>{loanData.type}</Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Loan Terms</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Original Amount</Text>
                <Text style={styles.detailValueBold}>
                  ₱{loanData.loanAmount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Interest Rate</Text>
                <Text style={styles.detailValue}>{loanData.interestRate}% per annum</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan Term</Text>
                <Text style={styles.detailValue}>{loanData.terms}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly Payment</Text>
                <Text style={styles.detailValueBold}>{loanData.monthlyPayment}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Current Amount Due</Text>
                <Text style={styles.detailValueBold}>
                  ₱{billingInfo.totalAmountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              {billingInfo.lateFees > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Late Fees</Text>
                  <Text style={[styles.detailValueBold, { color: '#DC2626' }]}>
                    ₱{billingInfo.lateFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Payment Breakdown</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Base Payment</Text>
                <Text style={styles.detailValue}>
                  ₱{billingInfo.basePayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Principal Amount</Text>
                <Text style={styles.detailValue}>
                  ₱{billingInfo.principalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Interest Amount</Text>
                <Text style={styles.detailValue}>
                  ₱{billingInfo.interestAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              {billingInfo.lateFees > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Late Fees ({billingInfo.daysLate} days)</Text>
                  <Text style={[styles.detailValue, { color: '#DC2626' }]}>
                    ₱{billingInfo.lateFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Important Dates</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>{loanData.loanStartDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Maturity Date</Text>
                <Text style={styles.detailValue}>{loanData.loanEndDate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Due Date</Text>
                <Text style={styles.detailValueBold}>{loanData.nextDueDate}</Text>
              </View>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Payment Progress</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payments Made</Text>
                <Text style={styles.detailValue}>
                  {loanData.paymentsCompleted} of {loanData.loanTerm}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remaining Payments</Text>
                <Text style={styles.detailValue}>{loanData.paymentsRemaining}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  urgentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  urgentTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  urgentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 4,
  },
  urgentText: {
    fontSize: 14,
    color: '#9A3412',
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeStatus: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBarWrapper: {
    flex: 1,
    marginHorizontal: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  amountBreakdown: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  breakdownValuePaid: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  paymentCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#DDD6FE',
  },
  paymentCardUrgent: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentDaysText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  paymentDaysTextUrgent: {
    color: '#F97316',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmountLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  paymentAmountUrgent: {
    color: '#F97316',
  },
  paymentNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  payNowButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowButtonUrgent: {
    backgroundColor: '#F97316',
  },
  payNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyIconWrapper: {
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  historyMethod: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#F59E0B',
    marginRight: 8,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 13,
    color: '#78350F',
    flex: 1,
    lineHeight: 18,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  historySummary: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  historySummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  historySummaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  historySummarySubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  fullHistoryItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  fullHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fullHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fullHistoryInfo: {
    marginLeft: 12,
  },
  fullHistoryDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  fullHistoryMethod: {
    fontSize: 12,
    color: '#6B7280',
  },
  fullHistoryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentBreakdown: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabelDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  detailsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#8B5CF6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    textAlign: 'right',
    flex: 1,
  },
});

export default CurrentLoanScreen;