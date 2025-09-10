import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoansScreen = ({ navigation }) => {
  const loans = [
    {
      id: '1',
      amount: '150,000.00',
      date: 'Jun 15, 2023',
      status: 'Active',
      remaining: '120,000.00',
      payments: '6 of 12',
    },
    {
      id: '2',
      amount: '50,000.00',
      date: 'Jan 10, 2023',
      status: 'Completed',
      remaining: '0.00',
      payments: '6 of 6',
    },
    {
      id: '3',
      amount: '75,000.00',
      date: 'Sep 5, 2022',
      status: 'Completed',
      remaining: '0.00',
      payments: '9 of 9',
    },
  ];

  const renderLoanItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.loanCard}
      onPress={() => navigation.navigate('MyLoan', { loanId: item.id })}
    >
      <View style={styles.loanHeader}>
        <Text style={styles.loanAmount}>PHP {item.amount}</Text>
        <Text style={[
          styles.loanStatus,
          item.status === 'Active' ? styles.statusActive : styles.statusCompleted
        ]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.loanDate}>Disbursed: {item.date}</Text>
      <View style={styles.loanDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Remaining Balance</Text>
          <Text style={styles.detailValue}>PHP {item.remaining}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Payments</Text>
          <Text style={styles.detailValue}>{item.payments}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>My Loans</Text>
        
        <FlatList
          data={loans}
          renderItem={renderLoanItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.loanList}
        />

        <TouchableOpacity 
          style={styles.newLoanButton}
          onPress={() => navigation.navigate('LoanApplication')}
        >
          <Text style={styles.newLoanButtonText}>+ Apply for New Loan</Text>
        </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loanList: {
    marginBottom: 20,
  },
  loanCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loanStatus: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  statusCompleted: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
  },
  loanDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  newLoanButton: {
    backgroundColor: '#8B5CF6',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  newLoanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoansScreen;