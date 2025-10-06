import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { GET_LOAN_TRANSACTIONS } from "../actions/loans.action";

const TransactionsScreen = ({ navigation, route }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [transactionDatas, setTransactionDatas] = useState([]);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      const { success, message, loanTransactions  } = await GET_LOAN_TRANSACTIONS();

      if (success) {
        setTransactionDatas(loanTransactions);
      };
    };

    fetchTransactions();
  }, [])

  // Use transactions from route params if available, otherwise use default data
  const transactions = route.params?.transactions || [
    {
      id: '1',
      type: 'Payment',
      amount: '12,500.00',
      date: 'Jul 5, 2023',
      time: '10:45 AM',
      status: 'Completed',
      loanId: 'LN-2023-001',
      transactionId: 'TXN-001',
      paymentMethod: 'Lora Wallet',
      lender: 'GCash',
      loanType: 'Personal Loan',
      applicationDate: 'Jun 1, 2023',
      interestRate: 5,
      interestType: 'Fixed',
      loanAmount: 150000,
      term: '12 months',
      totalInterest: 15000,
      processingFee: 1000,
      netRelease: 134000,
      dueDate: 'Jul 5, 2023',
      monthlyPayment: 12500
    },
    {
      id: '2',
      type: 'Loan Disbursement',
      amount: '150,000.00',
      date: 'Jun 15, 2023',
      time: '2:30 PM',
      status: 'Completed',
      loanId: 'LN-2023-001',
      transactionId: 'TXN-002',
      paymentMethod: 'Bank Transfer',
      lender: 'GCash',
      loanType: 'Personal Loan',
      applicationDate: 'Jun 1, 2023',
      interestRate: 5,
      interestType: 'Fixed',
      loanAmount: 150000,
      term: '12 months',
      totalInterest: 15000,
      processingFee: 1000,
      netRelease: 134000,
      dueDate: 'Jul 5, 2023',
      monthlyPayment: 12500
    },
    {
      id: '3',
      type: 'Payment',
      amount: '5,250.00',
      date: 'May 5, 2023',
      time: '9:15 AM',
      status: 'Completed',
      loanId: 'LN-2023-002',
      transactionId: 'TXN-003',
      paymentMethod: 'Debit Card',
      lender: 'MoneyTree Lending',
      loanType: 'Business Loan',
      applicationDate: 'Apr 10, 2023',
      interestRate: 7,
      interestType: 'Reducing',
      loanAmount: 75000,
      term: '18 months',
      totalInterest: 9450,
      processingFee: 800,
      netRelease: 68750,
      dueDate: 'May 5, 2023',
      monthlyPayment: 5250
    },
    {
      id: '4',
      type: 'Payment Failed',
      amount: '12,500.00',
      date: 'Apr 5, 2023',
      time: '11:20 AM',
      status: 'Failed',
      loanId: 'LN-2023-001',
      transactionId: 'TXN-004',
      paymentMethod: 'Credit Card',
      lender: 'GCash',
      loanType: 'Personal Loan',
      applicationDate: 'Jun 1, 2023',
      interestRate: 5,
      interestType: 'Fixed',
      loanAmount: 150000,
      term: '12 months',
      totalInterest: 15000,
      processingFee: 1000,
      netRelease: 134000,
      dueDate: 'Jul 5, 2023',
      monthlyPayment: 12500,
      failureReason: 'Insufficient funds'
    },
    {
      id: '5',
      type: 'Payment',
      amount: '8,750.00',
      date: 'Aug 10, 2023',
      time: '4:30 PM',
      status: 'Completed',
      loanId: 'LN-2023-003',
      transactionId: 'TXN-005',
      paymentMethod: 'GCash',
      lender: 'QuickCash Philippines',
      loanType: 'Emergency Loan',
      applicationDate: 'Jul 15, 2023',
      interestRate: 6.5,
      interestType: 'Fixed',
      loanAmount: 50000,
      term: '6 months',
      totalInterest: 3250,
      processingFee: 500,
      netRelease: 46250,
      dueDate: 'Aug 10, 2023',
      monthlyPayment: 8750
    }
  ];

  // Function to generate HTML content for PDF
  const generateReceiptHTML = (transaction) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4F46E5; padding-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 10px; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
          .receipt-number { font-size: 14px; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #4F46E5; border-bottom: 1px solid #EEE; padding-bottom: 5px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .detail-label { font-weight: 500; color: #666; }
          .detail-value { font-weight: 500; }
          .amount { color: #8B5CF6; font-weight: bold; }
          .highlight { background-color: #F0F9FF; padding: 10px; border-radius: 5px; margin-top: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #EEE; padding-top: 15px; }
          .status { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .status-completed { background-color: #DCFCE7; color: #166534; }
          .status-failed { background-color: #FEE2E2; color: #B91C1C; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">LORA FINANCE</div>
          <div class="title">Loan Transaction Receipt</div>
          <div class="receipt-number">Receipt #${transaction.transactionId || transaction.id}</div>
          <div class="receipt-number">Date: ${transaction.date} • ${transaction.time}</div>
          <div class="status status-${transaction.status.toLowerCase()}">${transaction.status}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Transaction Details</div>
          <div class="detail-row">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${transaction.type}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value amount">₱${transaction.amount}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">${transaction.paymentMethod || 'N/A'}</span>
          </div>
          ${transaction.status === 'Failed' && transaction.failureReason ? `
          <div class="detail-row">
            <span class="detail-label">Failure Reason:</span>
            <span class="detail-value" style="color: #EF4444;">${transaction.failureReason}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">Loan Information</div>
          <div class="detail-row">
            <span class="detail-label">Loan ID:</span>
            <span class="detail-value">${transaction.loanId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Loan Type:</span>
            <span class="detail-value">${transaction.loanType || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Lender:</span>
            <span class="detail-value">${transaction.lender || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Application Date:</span>
            <span class="detail-value">${transaction.applicationDate || 'N/A'}</span>
          </div>
        </div>
        
        ${transaction.loanAmount ? `
        <div class="section">
          <div class="section-title">Loan Terms & Breakdown</div>
          <div class="detail-row">
            <span class="detail-label">Principal Amount:</span>
            <span class="detail-value amount">₱${transaction.loanAmount.toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Loan Term:</span>
            <span class="detail-value">${transaction.term || 'N/A'}</span>
          </div>
          ${transaction.interestRate ? `
          <div class="detail-row">
            <span class="detail-label">Interest Rate:</span>
            <span class="detail-value">${transaction.interestRate}%</span>
          </div>
          ` : ''}
          ${transaction.interestType ? `
          <div class="detail-row">
            <span class="detail-label">Interest Type:</span>
            <span class="detail-value">${transaction.interestType}</span>
          </div>
          ` : ''}
          ${transaction.totalInterest ? `
          <div class="detail-row">
            <span class="detail-label">Total Interest:</span>
            <span class="detail-value amount">₱${transaction.totalInterest.toFixed(2)}</span>
          </div>
          ` : ''}
          ${transaction.processingFee ? `
          <div class="detail-row">
            <span class="detail-label">Processing Fee:</span>
            <span class="detail-value amount">₱${transaction.processingFee.toFixed(2)}</span>
          </div>
          ` : ''}
          ${transaction.netRelease ? `
          <div class="highlight">
            <div class="detail-row">
              <span class="detail-label">Net Amount Received:</span>
              <span class="detail-value amount">₱${transaction.netRelease.toFixed(2)}</span>
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for your transaction with Lora Finance</p>
          <p>This receipt is proof of your transaction. Please keep it for your records.</p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Function to download receipt as PDF
  const downloadReceiptAsPDF = async (transaction) => {
    try {
      setIsDownloading(true);
      
      // Generate HTML content
      const html = generateReceiptHTML(transaction);
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Create a filename
      const filename = `Receipt_${transaction.transactionId || transaction.id}_${new Date().getTime()}.pdf`;
      const newPath = `${FileSystem.documentDirectory}${filename}`;
      
      // Move the file to a permanent location
      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });
      
      // Share the PDF file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'Download Complete',
          `Receipt has been saved to: ${newPath}`,
          [{ text: 'OK' }]
        );
      }
      
      setIsDownloading(false);
      setReceiptVisible(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsDownloading(false);
      Alert.alert(
        'Error',
        'Failed to generate receipt PDF. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'Failed') return 'close-circle';
    return type.includes('Payment') ? 'cash-outline' : 'business-outline';
  };

  const getIconColor = (status) => {
    return status === 'Failed' ? '#EF4444' : '#8B5CF6';
  };

  const viewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setReceiptVisible(true);
  };

  const renderTransactionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => viewReceipt(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.transactionIcon, { backgroundColor: getIconColor(item.status) + '20' }]}>
        <Ionicons 
          name={getTransactionIcon(item.type, item.status)} 
          size={24} 
          color={getIconColor(item.status)} 
        />
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
          ₱{item.amount}
        </Text>
        <View style={[
          styles.transactionStatus,
          item.status === 'Completed' && styles.statusCompleted,
          item.status === 'Failed' && styles.statusFailed
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Completed' && styles.statusTextCompleted,
            item.status === 'Failed' && styles.statusTextFailed
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ReceiptModal = () => (
    <Modal
      visible={receiptVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setReceiptVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Transaction Receipt</Text>
            <TouchableOpacity 
              onPress={() => setReceiptVisible(false)}
              style={styles.closeButton}
              disabled={isDownloading}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.receiptContent}>
            {selectedTransaction && (
              <>
                <View style={styles.receiptSection}>
                  <View style={styles.receiptTitleContainer}>
                    <MaterialIcons name="receipt" size={24} color="#4F46E5" />
                    <Text style={styles.receiptTitle}>Loan Receipt</Text>
                    <View style={styles.statusBadge}>
                      <MaterialIcons
                        name={selectedTransaction.status === 'Completed' ? 'check-circle' : 'close-circle'}
                        size={16}
                        color={selectedTransaction.status === 'Completed' ? '#10B981' : '#EF4444'}
                      />
                      <Text style={[
                        styles.statusText,
                        { color: selectedTransaction.status === 'Completed' ? '#10B981' : '#EF4444' }
                      ]}>
                        {selectedTransaction.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.receiptSummary}>
                    <Text style={styles.receiptNumber}>Receipt #{selectedTransaction.transactionId || selectedTransaction.id}</Text>
                    <Text style={styles.receiptDate}>
                      {selectedTransaction.date} • {selectedTransaction.time}
                    </Text>
                  </View>
                </View>

                <View style={styles.receiptDivider} />

                {/* Transaction Details */}
                <View style={styles.receiptSection}>
                  <Text style={styles.receiptSectionTitle}>Transaction Details</Text>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Type:</Text>
                    <Text style={styles.receiptDetailValue}>{selectedTransaction.type}</Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Amount:</Text>
                    <Text style={[styles.receiptDetailValue, styles.amountText]}>
                      ₱{selectedTransaction.amount}
                    </Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Payment Method:</Text>
                    <Text style={styles.receiptDetailValue}>{selectedTransaction.paymentMethod || 'N/A'}</Text>
                  </View>
                  {selectedTransaction.status === 'Failed' && selectedTransaction.failureReason && (
                    <View style={styles.receiptDetailRow}>
                      <Text style={[styles.receiptDetailLabel, styles.errorLabel]}>Failure Reason:</Text>
                      <Text style={[styles.receiptDetailValue, styles.errorText]}>
                        {selectedTransaction.failureReason}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.receiptDivider} />

                {/* Loan Information */}
                <View style={styles.receiptSection}>
                  <Text style={styles.receiptSectionTitle}>Loan Information</Text>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Loan ID:</Text>
                    <Text style={styles.receiptDetailValue}>{selectedTransaction.loanId}</Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Loan Type:</Text>
                    <Text style={styles.receiptDetailValue}>{selectedTransaction.loanType || 'N/A'}</Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Lender:</Text>
                    <Text style={styles.receiptDetailValue}>{selectedTransaction.lender || 'N/A'}</Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Application Date:</Text>
                    <Text style={styles.receiptDetailValue}>{selectedTransaction.applicationDate || 'N/A'}</Text>
                  </View>
                </View>

                {selectedTransaction.loanAmount && (
                  <>
                    <View style={styles.receiptDivider} />

                    {/* Loan Terms & Breakdown */}
                    <View style={styles.receiptSection}>
                      <Text style={styles.receiptSectionTitle}>Loan Terms & Breakdown</Text>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Principal Amount:</Text>
                        <Text style={styles.receiptDetailValueAmount}>
                          ₱{selectedTransaction.loanAmount.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.receiptDetailRow}>
                        <Text style={styles.receiptDetailLabel}>Loan Term:</Text>
                        <Text style={styles.receiptDetailValue}>
                          {selectedTransaction.term || 'N/A'}
                        </Text>
                      </View>
                      {selectedTransaction.interestRate && (
                        <View style={styles.receiptDetailRow}>
                          <Text style={styles.receiptDetailLabel}>Interest Rate:</Text>
                          <Text style={styles.receiptDetailValue}>{selectedTransaction.interestRate}%</Text>
                        </View>
                      )}
                      {selectedTransaction.interestType && (
                        <View style={styles.receiptDetailRow}>
                          <Text style={styles.receiptDetailLabel}>Interest Type:</Text>
                          <Text style={styles.receiptDetailValue}>{selectedTransaction.interestType}</Text>
                        </View>
                      )}
                      {selectedTransaction.totalInterest && (
                        <View style={styles.receiptDetailRow}>
                          <Text style={styles.receiptDetailLabel}>Total Interest:</Text>
                          <Text style={styles.receiptDetailValueAmount}>₱{selectedTransaction.totalInterest.toFixed(2)}</Text>
                        </View>
                      )}
                      {selectedTransaction.processingFee && (
                        <View style={styles.receiptDetailRow}>
                          <Text style={styles.receiptDetailLabel}>Processing Fee:</Text>
                          <Text style={styles.receiptDetailValueAmount}>₱{selectedTransaction.processingFee}</Text>
                        </View>
                      )}
                      {selectedTransaction.netRelease && (
                        <View style={styles.receiptHighlightRow}>
                          <Text style={styles.receiptHighlightLabel}>Net Amount Received:</Text>
                          <Text style={styles.receiptNetReleaseValue}>₱{selectedTransaction.netRelease.toFixed(2)}</Text>
                        </View>
                      )}
                    </View>
                  </>
                )}

                <View style={styles.receiptFooter}>
                  <Text style={styles.footerText}>Thank you for your transaction</Text>
                  <Text style={styles.footerNote}>
                    This receipt is proof of your transaction. Please keep it for your records.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
          
          <View style={styles.receiptActions}>
            <TouchableOpacity 
              style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
              onPress={() => downloadReceiptAsPDF(selectedTransaction)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
                  <Text style={styles.downloadButtonText}>Generating PDF...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#FFF" />
                  <Text style={styles.downloadButtonText}>Download PDF Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <FlatList
        data={transactionDatas}
        renderItem={renderTransactionItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.transactionList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No transactions found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
      
      <ReceiptModal />
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  transactionList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
    marginBottom: 4,
  },
  transactionAmountFailed: {
    color: '#EF4444',
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusTextCompleted: {
    color: '#166534',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusTextFailed: {
    color: '#B91C1C',
  },
  // Receipt Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  receiptContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  receiptTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  closeButton: {
    padding: 4,
  },
  receiptContent: {
    padding: 20,
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
  receiptDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  receiptSection: {
    marginBottom: 16,
  },
  receiptSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  receiptDetailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  receiptDetailValueAmount: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  amountText: {
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  errorLabel: {
    color: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  receiptHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  receiptHighlightLabel: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  receiptNetReleaseValue: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
  },
  receiptFooter: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  receiptActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  downloadButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  downloadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TransactionsScreen;