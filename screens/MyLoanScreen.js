import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyLoanScreen = ({ route, navigation }) => {
  const { loanId } = route.params;
  
  // Mock loan data - in a real app, this would come from an API
  const loanDetails = {
    id: loanId,
    amount: '150,000.00',
    date: 'Jun 15, 2023',
    status: 'Active',
    interestRate: '12%',
    term: '12 months',
    remainingBalance: '120,000.00',
    nextPayment: 'Aug 5, 2023',
    nextPaymentAmount: '12,500.00',
    payments: [
      { id: '1', date: 'Jul 5, 2023', amount: '12,500.00', status: 'Paid' },
      { id: '2', date: 'Aug 5, 2023', amount: '12,500.00', status: 'Pending' },
      { id: '3', date: 'Sep 5, 2023', amount: '12,500.00', status: 'Pending' },
      { id: '4', date: 'Oct 5, 2023', amount: '12,500.00', status: 'Pending' },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <Text style={styles.loanId}>ID: {loanId}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryAmount}>PHP {loanDetails.amount}</Text>
          <Text style={styles.summaryStatus}>{loanDetails.status} • {loanDetails.term}</Text>
          
          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Interest Rate</Text>
              <Text style={styles.summaryValue}>{loanDetails.interestRate}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining Balance</Text>
              <Text style={styles.summaryValue}>PHP {loanDetails.remainingBalance}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Next Payment</Text>
              <Text style={styles.summaryValue}>{loanDetails.nextPayment}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Payment Amount</Text>
              <Text style={styles.summaryValue}>PHP {loanDetails.nextPaymentAmount}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.payButton}
          onPress={() => navigation.navigate('Payment', { 
            amount: loanDetails.nextPaymentAmount,
            dueDate: loanDetails.nextPayment
          })}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Payment History</Text>
        
        {loanDetails.payments.map(payment => (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentDate}>{payment.date}</Text>
              <Text style={[
                styles.paymentStatus,
                payment.status === 'Paid' ? styles.paymentStatusPaid : styles.paymentStatusPending
              ]}>
                {payment.status}
              </Text>
            </View>
            <Text style={styles.paymentAmount}>PHP {payment.amount}</Text>
            {payment.status === 'Paid' && (
              <TouchableOpacity style={styles.receiptButton}>
                <Text style={styles.receiptButtonText}>View Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  loanId: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  summaryStatus: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  summaryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  payButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paymentStatusPaid: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  paymentStatusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  paymentAmount: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  receiptButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 5,
  },
  receiptButtonText: {
    color: '#1E40AF',
    fontSize: 14,
  },
});

export default MyLoanScreen;