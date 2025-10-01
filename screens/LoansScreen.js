import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_LOANS_DATA } from "../actions/loans.action";

// Mock data for loan history
const LoanService = {
  getLoans: async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
        nextPaymentAmount: '12,500.00',
        lender: 'Lora Lending',
        type: 'Personal Loan',
        applicationDate: 'Jul 15, 2023',
        dueDate: 'Aug 5, 2023',
        totalAmountDue: '12,500.00',
        // Additional fields needed for PayNowScreen
        loanAmount: 150000,
        totalInterest: 1250, // Monthly interest portion
        interestType: 'Fixed Rate',
        processingFee: 0, // No processing fee for monthly payments
        monthlyPayment: '12,500.00',
        totalPayment: 12500, // Monthly payment amount
        netRelease: 148000,
        terms: '12 months',
        date: 'Jul 15, 2023'
      },
      {
        id: 'LN-2023-002',
        amount: '75,000.00',
        status: 'Active',
        interestRate: '10',
        term: '6 months',
        remainingBalance: '45,000.00',
        nextPayment: 'Jul 25, 2023',
        nextPaymentAmount: '7,500.00',
        lender: 'GCredit',
        type: 'Emergency Loan',
        applicationDate: 'Jun 20, 2023',
        dueDate: 'Jul 25, 2023',
        totalAmountDue: '7,500.00',
        // Additional fields needed for PayNowScreen
        loanAmount: 75000,
        totalInterest: 625, // Monthly interest portion
        interestType: 'Fixed Rate',
        processingFee: 0, // No processing fee for monthly payments
        monthlyPayment: '7,500.00',
        totalPayment: 7500, // Monthly payment amount
        netRelease: 74000,
        terms: '6 months',
        date: 'Jun 20, 2023'
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
        // Additional fields needed for PayNowScreen
        loanAmount: 200000,
        totalInterest: 60000,
        interestType: 'Fixed Rate',
        processingFee: 3000,
        monthlyPayment: '0.00',
        totalPayment: 260000,
        netRelease: 197000,
        terms: '24 months',
        date: 'Jan 10, 2022'
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
        // Additional fields needed for PayNowScreen
        loanAmount: 50000,
        totalInterest: 0,
        interestType: 'TBD',
        processingFee: 0,
        monthlyPayment: 'TBD',
        totalPayment: 0,
        netRelease: 0,
        terms: '3 months',
        date: 'Aug 1, 2023'
      }
    ];
  },
};

const MyLoansScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const { success, message, loans } = await GET_LOANS_DATA();

      if (!success) {
        throw new Error(message);
      }

      // Mock loans data
      // const loans = await LoanService.getLoans();

      setLoans(loans);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch loans. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

  const handleLoanPress = (loan) => {
    // Map the loan data to the format expected by PayNowScreen
    const mappedLoanData = {
      id: loan.id,
      amount: loan.amount,
      status: loan.status,
      interestRate: loan.interestRate,
      terms: loan.term, // Map 'term' to 'terms'
      lender: loan.lender,
      type: loan.type,
      dueDate: loan.dueDate,
      date: loan.applicationDate, // Map applicationDate to date
      loanAmount: loan.loanAmount,
      totalInterest: loan.totalInterest,
      interestType: loan.interestType,
      processingFee: loan.processingFee,
      monthlyPayment: loan.monthlyPayment,
      totalPayment: loan.totalPayment,
      netRelease: loan.netRelease,
      // Additional fields for billing calculation
      monthlyIncome: 'N/A',
      collateral: 'N/A'
    };

    // Navigate to PayNow with the properly mapped loan data
    navigation.navigate('PayNow', { 
      loanApplication: mappedLoanData 
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  const renderLoanCard = (loan) => (
    <TouchableOpacity 
      key={loan.id}
      style={styles.loanCard}
      onPress={() => handleLoanPress(loan)}
    >
      <View style={styles.loanHeader}>
        <Text style={styles.loanId}>{loan.id}</Text>
        <Text style={[styles.loanStatus, getStatusColor(loan.status)]}>
          {loan.status}
        </Text>
      </View>
      
      <Text style={styles.loanAmount}>PHP {parseFloat(loan.amount).toLocaleString({ style: 'currency' })}</Text>
      
      <View style={styles.loanDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Lender</Text>
          <Text style={styles.detailValue}>{loan.lender}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type</Text>
          <Text style={styles.detailValue}>{loan.type}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Term</Text>
          <Text style={styles.detailValue}>{loan.term}</Text>
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
          <Text style={styles.detailValue}>{loan.applicationDate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Due Date</Text>
          <Text style={styles.detailValue}>{loan.dueDate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Remaining Balance</Text>
          <Text style={styles.detailValue}>
            {loan.remainingBalance === 'N/A' ? 'N/A' : `PHP ${(parseFloat(loan.remainingBalance)).toLocaleString({ style: "currency" })}`}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Next Payment</Text>
          <Text style={styles.detailValue}>
            {loan.nextPaymentAmount === 'TBD' ? 'TBD' : `PHP ${parseFloat(loan.nextPaymentAmount).toLocaleString({ style: "currency" })}`}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.actionButton,
          loan.status.toLowerCase() === 'active' ? styles.payNowButton : 
          loan.status.toLowerCase() === 'processing' ? styles.viewButton : styles.viewButton
        ]}
        onPress={() => handleLoanPress(loan)}
      >
        <Text style={[
          styles.actionButtonText,
          loan.status.toLowerCase() === 'active' ? styles.payNowButtonText : styles.viewButtonText
        ]}>
          {loan.status.toLowerCase() === 'active' ? 'Pay Now' : 
           loan.status.toLowerCase() === 'processing' ? 'View Details' : 'View Receipt'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.header}>My Loans</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading your loans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>My Loans</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loans.length > 0 ? (
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
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  },
  viewButton: {
    backgroundColor: '#4F46E5',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  payNowButtonText: {
    color: 'white',
  },
  viewButtonText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
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
