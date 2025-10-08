import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Mock data for loan history
const LoanService = {
  getLoans: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock loan data with proper structure for PayNowScreen
    return [
      {
        id: 'LN-2023-001',
        amount: '150,000.00',
        status: 'Active',
        interestRate: '12',
        term: '12 months',
        remainingBalance: '120,000.00',
        nextPayment: 'Aug 5, 2023',
        nextPaymentAmount: '13,750.00',
        lender: 'Lora Lending',
        type: 'Personal Loan',
        applicationDate: 'Jul 15, 2023',
        dueDate: 'Aug 5, 2023',
        totalAmountDue: '13,750.00',
        loanAmount: 150000,
        totalInterest: 18000,
        interestType: 'Fixed Rate',
        processingFee: 2000,
        monthlyPayment: '13,750.00',
        totalPayment: 150000,
        totalPayableAmount: 168000,
        netRelease: 148000,
        terms: '12 months',
        date: 'Jul 15, 2023',
        paymentBreakdown: [
          { description: 'Principal', amount: '12500.00' },
          { description: 'Interest', amount: '1250.00' }
        ]
      },
      {
        id: 'LN-2023-002',
        amount: '75,000.00',
        status: 'Active',
        interestRate: '10',
        term: '6 months',
        remainingBalance: '45,000.00',
        nextPayment: 'Jul 25, 2023',
        nextPaymentAmount: '13,125.00',
        lender: 'GCredit',
        type: 'Emergency Loan',
        applicationDate: 'Jun 20, 2023',
        dueDate: 'Jul 25, 2023',
        totalAmountDue: '13,125.00',
        loanAmount: 75000,
        totalInterest: 3750,
        interestType: 'Fixed Rate',
        processingFee: 1500,
        monthlyPayment: '13,125.00',
        totalPayment: 75000,
        totalPayableAmount: 78750,
        netRelease: 73500,
        terms: '6 months',
        date: 'Jun 20, 2023',
        paymentBreakdown: [
          { description: 'Principal', amount: '12500.00' },
          { description: 'Interest', amount: '625.00' }
        ]
      },
      {
        id: 'LN-2022-015',
        amount: '200,000.00',
        status: 'Completed',
        interestRate: '15',
        term: '24 months',
        remainingBalance: '0.00',
        nextPayment: 'N/A',
        nextPaymentAmount: '0.00',
        lender: 'Bank of PHP',
        type: 'Business Loan',
        applicationDate: 'Jan 10, 2022',
        dueDate: 'Dec 15, 2023',
        totalAmountDue: '0.00',
        loanAmount: 200000,
        totalInterest: 60000,
        interestType: 'Fixed Rate',
        processingFee: 3000,
        monthlyPayment: '10,833.33',
        totalPayment: 200000,
        totalPayableAmount: 260000,
        netRelease: 197000,
        terms: '24 months',
        date: 'Jan 10, 2022',
        paymentBreakdown: [
          { description: 'Principal', amount: '8333.33' },
          { description: 'Interest', amount: '2500.00' }
        ]
      },
      {
        id: 'LN-2023-003',
        amount: '50,000.00',
        status: 'Processing',
        interestRate: 'TBD',
        term: '3 months',
        remainingBalance: 'N/A',
        nextPayment: 'TBD',
        nextPaymentAmount: 'TBD',
        lender: 'Quick Loans Inc',
        type: 'Short Term Loan',
        applicationDate: 'Aug 1, 2023',
        dueDate: 'TBD',
        totalAmountDue: 'TBD',
        loanAmount: 50000,
        totalInterest: 0,
        interestType: 'TBD',
        processingFee: 0,
        monthlyPayment: 'TBD',
        totalPayment: 0,
        totalPayableAmount: 0,
        netRelease: 0,
        terms: '3 months',
        date: 'Aug 1, 2023',
        paymentBreakdown: []
      }
    ];
  },
};

const MyLoansScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const loanData = await LoanService.getLoans();
      setLoans(loanData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch loans. Please try again.');
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

  const parseAmount = (amountStr) => {
    if (!amountStr || amountStr === 'N/A' || amountStr === 'TBD') return 0;
    const cleanStr = String(amountStr).replace(/,/g, '');
    return parseFloat(cleanStr) || 0;
  };

  const handleLoanPress = (loan) => {
    if (!navigation || typeof navigation.navigate !== 'function') {
      Alert.alert('Error', 'Navigation not available');
      return;
    }

    // For Processing loans, show loan details without payment option
    if (loan.status === 'Processing' || loan.status === 'Pending') {
      Alert.alert(
        'Loan Application',
        `Loan ID: ${loan.id}\nStatus: ${loan.status}\nAmount: ₱${loan.amount}\n\nYour loan is being processed. You will be notified once it's approved.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // For Completed loans, show completion message
    if (loan.status === 'Completed') {
      Alert.alert(
        'Loan Completed',
        `Loan ID: ${loan.id}\n\nThis loan has been fully paid.\n\nOriginal Amount: ₱${loan.amount}\nFinal Payment: ${loan.dueDate}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // For Active loans, don't do anything on card press
    // User must click the Pay Now button
  };

  const handlePayNow = (loan) => {
    if (!navigation || typeof navigation.navigate !== 'function') {
      Alert.alert('Error', 'Navigation not available');
      return;
    }

    // Only allow payment for Active loans
    if (loan.status !== 'Active') {
      return;
    }

    // Parse amounts
    const monthlyPaymentAmount = parseAmount(loan.monthlyPayment);
    const remainingBalanceAmount = parseAmount(loan.remainingBalance);
    
    // Calculate principal and interest from payment breakdown
    let principalAmount = 0;
    let interestAmount = 0;
    
    if (loan.paymentBreakdown && loan.paymentBreakdown.length > 0) {
      const principalBreakdown = loan.paymentBreakdown.find(item => 
        item.description.toLowerCase().includes('principal')
      );
      const interestBreakdown = loan.paymentBreakdown.find(item => 
        item.description.toLowerCase().includes('interest')
      );
      
      if (principalBreakdown) {
        principalAmount = parseAmount(principalBreakdown.amount);
      }
      if (interestBreakdown) {
        interestAmount = parseAmount(interestBreakdown.amount);
      }
    } else {
      // Default calculation if no breakdown
      principalAmount = monthlyPaymentAmount * 0.85;
      interestAmount = monthlyPaymentAmount * 0.15;
    }

    // Calculate payments remaining
    const paymentsRemaining = remainingBalanceAmount > 0 && monthlyPaymentAmount > 0 
      ? Math.ceil(remainingBalanceAmount / principalAmount) 
      : 0;

    // Parse term to get total payments
    const termMatch = (loan.term || '').match(/(\d+)/);
    const totalPayments = termMatch ? parseInt(termMatch[1]) : 12;
    const paymentsCompleted = totalPayments - paymentsRemaining;

    // Map the loan data
    const mappedLoanData = {
      id: loan.id,
      amount: loan.amount,
      status: loan.status,
      interestRate: loan.interestRate,
      terms: loan.term,
      lender: loan.lender,
      type: loan.type,
      dueDate: loan.dueDate,
      date: loan.applicationDate,
      loanAmount: loan.loanAmount,
      totalInterest: loan.totalInterest,
      interestType: loan.interestType,
      processingFee: loan.processingFee,
      monthlyPayment: loan.monthlyPayment,
      totalPayment: loan.totalPayment,
      totalPayableAmount: loan.totalPayableAmount,
      netRelease: loan.netRelease,
      paymentBreakdown: loan.paymentBreakdown || [],
      remainingBalance: remainingBalanceAmount,
      nextPayment: loan.nextPayment,
      nextPaymentAmount: loan.nextPaymentAmount,
      totalAmountDue: parseAmount(loan.totalAmountDue),
      nextDueDate: loan.dueDate,
      paymentsCompleted: paymentsCompleted > 0 ? paymentsCompleted : 1,
      paymentsRemaining: paymentsRemaining > 0 ? paymentsRemaining : totalPayments - 1
    };

    // Create billing info
    const billingInfo = {
      basePayment: monthlyPaymentAmount,
      principalAmount: principalAmount,
      interestAmount: interestAmount,
      lateFees: 0,
      totalAmountDue: monthlyPaymentAmount,
      daysLate: 0
    };

    // Navigate to PayNow
    navigation.navigate('PayNow', { 
      loanApplication: mappedLoanData,
      billingInfo: billingInfo,
      transactions: []
    });
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'active':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'processing':
      case 'pending':
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
      case 'completed':
        return { backgroundColor: '#EFF6FF', color: '#1E40AF' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
    }
  };

  const calculateMonthlyInterest = (loan) => {
    if (!loan || loan.status !== 'Active' || loan.interestRate === 'TBD') {
      return 'N/A';
    }
    
    try {
      const remainingBalanceStr = (loan.remainingBalance || '0').replace(/,/g, '');
      const principal = parseFloat(remainingBalanceStr) || loan.loanAmount || 0;
      const interestRateNum = parseFloat(loan.interestRate);
      
      if (isNaN(principal) || isNaN(interestRateNum) || principal <= 0) {
        return 'N/A';
      }
      
      const annualRate = interestRateNum / 100;
      const monthlyRate = annualRate / 12;
      const monthlyInterest = principal * monthlyRate;
      
      return `₱${monthlyInterest.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } catch (error) {
      console.error('Error calculating monthly interest:', error);
      return 'N/A';
    }
  };

  const formatCurrency = (value) => {
    if (!value || value === 'N/A' || value === 'TBD') return value;
    return `₱${value}`;
  };

  const renderLoanCard = (loan) => {
    if (!loan) return null;

    const statusColors = getStatusColor(loan.status);

    return (
      <View 
        key={loan.id}
        style={styles.loanCard}
      >
        <TouchableOpacity 
          onPress={() => handleLoanPress(loan)}
          activeOpacity={loan.status === 'Active' ? 1 : 0.7}
        >
          <View style={styles.loanHeader}>
            <Text style={styles.loanId}>{loan.id || 'N/A'}</Text>
            <View style={[styles.loanStatus, { backgroundColor: statusColors.backgroundColor }]}>
              <Text style={[styles.loanStatusText, { color: statusColors.color }]}>
                {loan.status || 'Unknown'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
          
          <View style={styles.loanDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Lender</Text>
              <Text style={styles.detailValue}>{loan.lender || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{loan.type || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Term</Text>
              <Text style={styles.detailValue}>{loan.term || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Interest Rate</Text>
              <Text style={styles.detailValue}>
                {loan.interestRate === 'TBD' ? 'TBD' : `${loan.interestRate}%`}
              </Text>
            </View>
          </View>
          
          <View style={styles.loanDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Application Date</Text>
              <Text style={styles.detailValue}>{loan.applicationDate || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>{loan.dueDate || 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Remaining Balance</Text>
              <Text style={styles.detailValue}>
                {loan.remainingBalance === 'N/A' ? 'N/A' : formatCurrency(loan.remainingBalance)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Monthly Payment</Text>
              <Text style={styles.detailValue}>
                {loan.monthlyPayment === 'TBD' ? 'TBD' : formatCurrency(loan.monthlyPayment)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        {loan.status === 'Active' && (
          <TouchableOpacity
            style={styles.payNowButton}
            onPress={() => handlePayNow(loan)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack && navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>My Loans</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && loans.length === 0 ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading loans...</Text>
          </View>
        ) : loans.length > 0 ? (
          loans.map(loan => renderLoanCard(loan))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No loans found</Text>
            <Text style={styles.emptyStateSubtext}>
              You don't have any loans yet. Apply for your first loan to get started.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loanCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loanStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loanStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loanAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loanDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    width: '48%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  payNowButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  viewButton: {
    backgroundColor: '#4F46E5',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyLoansScreen;