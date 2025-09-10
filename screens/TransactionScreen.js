import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TransactionsScreen = ({ navigation }) => {
  const transactions = [
    {
      id: '1',
      type: 'Payment',
      amount: '12,500.00',
      date: 'Jul 5, 2023',
      time: '10:45 AM',
      status: 'Completed',
      loanId: 'LN-2023-001',
    },
    {
      id: '2',
      type: 'Loan Disbursement',
      amount: '150,000.00',
      date: 'Jun 15, 2023',
      time: '2:30 PM',
      status: 'Completed',
      loanId: 'LN-2023-001',
    },
    {
      id: '3',
      type: 'Payment',
      amount: '5,250.00',
      date: 'May 5, 2023',
      time: '9:15 AM',
      status: 'Completed',
      loanId: 'LN-2023-002',
    },
    {
      id: '4',
      type: 'Payment Failed',
      amount: '12,500.00',
      date: 'Apr 5, 2023',
      time: '11:20 AM',
      status: 'Failed',
      loanId: 'LN-2023-001',
    },
  ];

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
    >
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionIconText}>
          {item.type.includes('Payment') ? '💸' : '🏦'}
        </Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionType}>{item.type}</Text>
        <Text style={styles.transactionDate}>{item.date} • {item.time}</Text>
        <Text style={styles.transactionLoan}>Loan: {item.loanId}</Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={[
          styles.transactionAmount,
          item.status === 'Failed' && styles.transactionAmountFailed
        ]}>
          PHP {item.amount}
        </Text>
        <Text style={[
          styles.transactionStatus,
          item.status === 'Completed' && styles.statusCompleted,
          item.status === 'Failed' && styles.statusFailed
        ]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Transaction History</Text>
        
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.transactionList}
        />
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
  transactionList: {
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionIconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  transactionLoan: {
    fontSize: 12,
    color: '#8B5CF6',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmountFailed: {
    color: '#EF4444',
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
});

export default TransactionsScreen;