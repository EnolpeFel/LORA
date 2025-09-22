  import React, { useState, useEffect } from 'react';
  import { 
    Dimensions, 
    Image, 
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
  import ProfileScreen from './ProfileScreen';

  const { width } = Dimensions.get('window');

  const DashboardScreen = ({ navigation, route }) => {
    const [showProfile, setShowProfile] = useState(false);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCreditScoreModal, setShowCreditScoreModal] = useState(false);
    const [showLoanStatusModal, setShowLoanStatusModal] = useState(false);
    const [showHowToLoanModal, setShowHowToLoanModal] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [loanApplicationStatus, setLoanApplicationStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [walletBalance, setWalletBalance] = useState(12500.75);
    const [showWalletActions, setShowWalletActions] = useState(false);
    
    // Wallet feature modals
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showPayQRModal, setShowPayQRModal] = useState(false);
    const [showCashInModal, setShowCashInModal] = useState(false);
    const [showTransactionHistory, setShowTransactionHistory] = useState(false);
    
    // Transfer form states
    const [transferAmount, setTransferAmount] = useState('');
    const [recipientNumber, setRecipientNumber] = useState('');
    const [transferNote, setTransferNote] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    
    // Cash In form states
    const [cashInAmount, setCashInAmount] = useState('');
    const [selectedCashInMethod, setSelectedCashInMethod] = useState('');
    
    // QR Payment states
    const [qrAmount, setQrAmount] = useState('');
    const [merchantName, setMerchantName] = useState('Sample Merchant');
    
    // Transaction history
    const [walletTransactions, setWalletTransactions] = useState([
      {
        id: 1,
        type: 'Transfer Out',
        amount: -2500.00,
        recipient: '+63 912 345 6789',
        bank: 'GCash',
        date: new Date().toISOString(),
        status: 'Completed',
        note: 'Payment for services'
      },
      {
        id: 2,
        type: 'Cash In',
        amount: 5000.00,
        source: 'GCash',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'Completed'
      },
      {
        id: 3,
        type: 'QR Payment',
        amount: -850.00,
        merchant: 'Coffee Shop',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'Completed'
      },
      {
        id: 4,
        type: 'Loan Disbursement',
        amount: 10000.00,
        date: new Date(Date.now() - 259200000).toISOString(),
        status: 'Completed'
      }
    ]);

    // Banks and e-wallets for transfer
    const banks = [
      { id: 'gcash', name: 'GCash', icon: '💳' },
      { id: 'unionbank', name: 'UnionBank', icon: '🏦' },
      { id: 'maya', name: 'Maya', icon: '💳' },
      { id: 'paymongo', name: 'PayMongo', icon: '🏦' },
      { id: 'bpi', name: 'BPI', icon: '🏦' },
      { id: 'metrobank', name: 'Metrobank', icon: '🏦' },
    ];

    const [notifications, setNotifications] = useState([
      { 
        id: 1, 
        title: 'Payment Received', 
        message: 'Your payment of Php 5,250.00 has been processed', 
        time: '2 hours ago', 
        read: false 
      },
      { 
        id: 2, 
        title: 'Loan Approved', 
        message: 'Your loan application has been approved', 
        time: '1 day ago', 
        read: true 
      },
    ]);

    // Credit score data
    const creditScore = 720;
    const creditScoreStatus = "GOOD";
    const maxLoanAmount = "Php 500,000.00";
    const creditScoreMessage = "Your credit score is in good standing. You're eligible for our best loan rates and terms.";

    // Cash In methods
    const cashInMethods = [
      { id: 'gcash', name: 'GCash', icon: '💳', fee: 0 },
      { id: 'paymaya', name: 'PayMaya', icon: '💳', fee: 0 },
      { id: 'bank', name: 'Bank Transfer', icon: '🏦', fee: 15 },
      { id: 'otc', name: 'Over the Counter', icon: '🏪', fee: 20 },
      { id: 'card', name: 'Credit/Debit Card', icon: '💳', fee: 25 }
    ];

    // Wallet Functions
    const handleTransfer = () => {
      const amount = parseFloat(transferAmount);
      if (!amount || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      if (amount > walletBalance) {
        Alert.alert('Error', 'Insufficient balance');
        return;
      }
      if (!recipientNumber) {
        Alert.alert('Error', 'Please enter recipient number');
        return;
      }
      if (!selectedBank) {
        Alert.alert('Error', 'Please select a bank or e-wallet');
        return;
      }

      // Process transfer
      setWalletBalance(prev => prev - amount);
      
      // Get selected bank name
      const bankName = banks.find(bank => bank.id === selectedBank)?.name || selectedBank;
      
      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        type: 'Transfer Out',
        amount: -amount,
        recipient: recipientNumber,
        bank: bankName,
        date: new Date().toISOString(),
        status: 'Completed',
        note: transferNote || 'Money transfer'
      };
      setWalletTransactions(prev => [newTransaction, ...prev]);
      
      // Add notification
      const notification = {
        id: Date.now(),
        title: 'Transfer Successful',
        message: `Php ${amount.toFixed(2)} sent to ${recipientNumber} via ${bankName}`,
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [notification, ...prev]);
      setHasUnreadNotifications(true);
      
      // Reset form and close modal
      setTransferAmount('');
      setRecipientNumber('');
      setTransferNote('');
      setSelectedBank('');
      setShowTransferModal(false);
      
      Alert.alert('Success', `Php ${amount.toFixed(2)} transferred successfully via ${bankName}!`);
    };

    const handleCashIn = () => {
      const amount = parseFloat(cashInAmount);
      if (!amount || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      if (!selectedCashInMethod) {
        Alert.alert('Error', 'Please select a cash-in method');
        return;
      }

      const method = cashInMethods.find(m => m.id === selectedCashInMethod);
      const totalAmount = amount - method.fee;
      
      // Process cash in
      setWalletBalance(prev => prev + totalAmount);
      
      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        type: 'Cash In',
        amount: totalAmount,
        source: method.name,
        date: new Date().toISOString(),
        status: 'Completed',
        fee: method.fee
      };
      setWalletTransactions(prev => [newTransaction, ...prev]);
      
      // Add notification
      const notification = {
        id: Date.now(),
        title: 'Cash In Successful',
        message: `Php ${totalAmount.toFixed(2)} added to your wallet via ${method.name}`,
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [notification, ...prev]);
      setHasUnreadNotifications(true);
      
      // Reset form and close modal
      setCashInAmount('');
      setSelectedCashInMethod('');
      setShowCashInModal(false);
      
      Alert.alert('Success', `Php ${totalAmount.toFixed(2)} added to your wallet!`);
    };

    const handleQRPayment = () => {
      const amount = parseFloat(qrAmount);
      if (!amount || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      if (amount > walletBalance) {
        Alert.alert('Error', 'Insufficient balance');
        return;
      }

      // Process QR payment
      setWalletBalance(prev => prev - amount);
      
      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        type: 'QR Payment',
        amount: -amount,
        merchant: merchantName,
        date: new Date().toISOString(),
        status: 'Completed'
      };
      setWalletTransactions(prev => [newTransaction, ...prev]);
      
      // Add notification
      const notification = {
        id: Date.now(),
        title: 'QR Payment Successful',
        message: `Php ${amount.toFixed(2)} paid to ${merchantName}`,
        time: 'Just now',
        read: false
      };
      setNotifications(prev => [notification, ...prev]);
      setHasUnreadNotifications(true);
      
      // Reset form and close modal
      setQrAmount('');
      setShowPayQRModal(false);
      
      Alert.alert('Success', `Payment of Php ${amount.toFixed(2)} successful!`);
    };

    // Check for loan status when screen focuses
    useEffect(() => {
      if (route.params?.loanStatus) {
        const status = route.params.loanStatus;
        setLoanApplicationStatus(status);
        setShowLoanStatusModal(true);
        
        // If loan is approved, add the amount to wallet
        if (status.status === 'approved') {
          const amountValue = parseFloat(status.amount.replace(/[^0-9.]/g, ''));
          if (!isNaN(amountValue)) {
            setWalletBalance(prev => prev + amountValue);
            
            // Add to transaction history
            const newTransaction = {
              id: Date.now(),
              type: 'Loan Disbursement',
              amount: amountValue,
              date: new Date().toISOString(),
              status: 'Completed'
            };
            setWalletTransactions(prev => [newTransaction, ...prev]);
          }
        }
        
        // Add notification
        const newNotification = {
          id: Date.now(),
          title: status.status === 'approved' ? 'Loan Approved' : 'Loan Application Submitted',
          message: status.status === 'approved' 
            ? `Your loan of ${status.amount} has been approved and credited to your wallet` 
            : `Your application for ${status.amount} is being processed`,
          time: 'Just now',
          read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
        setHasUnreadNotifications(true);
        
        navigation.setParams({ loanStatus: undefined });
      }
    }, [route.params]);

    // Update current date time every second
    useEffect(() => {
      const updateDateTime = () => {
        const now = new Date();
        const options = { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true 
        };
        setCurrentDateTime(now.toLocaleString('en-US', options).toUpperCase());
      };

      updateDateTime();
      const interval = setInterval(updateDateTime, 1000);
      return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
      navigation.navigate('Welcome');
    };

    const handleNotificationPress = (id) => {
      const updatedNotifications = notifications.map(notification => 
        notification.id === id ? {...notification, read: true} : notification
      );
      setNotifications(updatedNotifications);
      setHasUnreadNotifications(updatedNotifications.some(n => !n.read));
    };

    const markAllAsRead = () => {
      setNotifications(notifications.map(n => ({...n, read: true})));
      setHasUnreadNotifications(false);
    };

    const formatTransactionDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Simple Profile Screen Component
    const ProfileScreen = ({ onBack, onLogout }) => {
      const [profileData, setProfileData] = useState({
        name: 'Juan Dela Cruz',
        email: 'juan.delacruz@example.com',
        memberSince: 'January 15, 2023',
        accountStatus: 'Active',
        phoneNumber: '+63 912 345 6789',
        address: '123 Main Street, Manila, Philippines',
        profileImage: null
      });

      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 24 }}></View>
          </View>

          <ScrollView contentContainerStyle={styles.profileContent}>
            <View style={styles.avatarContainer}>
              {profileData.profileImage ? (
                <Image
                  source={{ uri: profileData.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.emptyAvatar]}>
                  <MaterialIcons name="person" size={40} color="#9CA3AF" />
                </View>
              )}
              <Text style={styles.name}>
                {profileData.name || 'No name provided'}
              </Text>
              <Text style={styles.email}>
                {profileData.email || 'No email provided'}
              </Text>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Member Since</Text>
                <Text style={styles.detailValue}>
                  {profileData.memberSince || 'Not available'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Account Status</Text>
                <Text style={[styles.detailValue, styles.activeStatus]}>
                  {profileData.accountStatus || 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>
                  {profileData.phoneNumber || 'Not provided'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>
                  {profileData.address || 'Not provided'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => {}}
            >
              <Text style={styles.settingsButtonText}>Account Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    };

    if (showProfile) {
      return (
        <ProfileScreen 
          onBack={() => setShowProfile(false)} 
          onLogout={handleLogout} 
        />
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../assets/LoraLogo.png')} 
              style={styles.logo}
            />
            <Text style={styles.appName}>Lora</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(true)}
          >
            <MaterialIcons name="notifications" size={24} color="#374151" />
            {hasUnreadNotifications && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* Transfer Modal */}
        <Modal
          visible={showTransferModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTransferModal(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.walletModal}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTransferModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.walletModalTitle}>Transfer Money</Text>
              <Text style={styles.walletBalance}>Available: Php {walletBalance.toFixed(2)}</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Select Bank/E-Wallet</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankList}>
                  {banks.map(bank => (
                    <TouchableOpacity
                      key={bank.id}
                      style={[
                        styles.bankOption,
                        selectedBank === bank.id && styles.selectedBankOption
                      ]}
                      onPress={() => setSelectedBank(bank.id)}
                    >
                      <Text style={styles.bankIcon}>{bank.icon}</Text>
                      <Text style={styles.bankName}>{bank.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Recipient Mobile Number/Account</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+63 912 345 6789"
                  value={recipientNumber}
                  onChangeText={setRecipientNumber}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Note (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Payment for..."
                  value={transferNote}
                  onChangeText={setTransferNote}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.walletActionButtonPrimary}
                onPress={handleTransfer}
              >
                <Text style={styles.walletActionButtonPrimaryText}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Cash In Modal */}
        <Modal
          visible={showCashInModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCashInModal(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.walletModal}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCashInModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.walletModalTitle}>Cash In</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  value={cashInAmount}
                  onChangeText={setCashInAmount}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cash In Method</Text>
                <ScrollView style={styles.cashInMethods}>
                  {cashInMethods.map(method => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.cashInMethod,
                        selectedCashInMethod === method.id && styles.selectedCashInMethod
                      ]}
                      onPress={() => setSelectedCashInMethod(method.id)}
                    >
                      <View style={styles.cashInMethodInfo}>
                        <Text style={styles.cashInMethodIcon}>{method.icon}</Text>
                        <View>
                          <Text style={styles.cashInMethodName}>{method.name}</Text>
                          <Text style={styles.cashInMethodFee}>
                            Fee: Php {method.fee.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      {selectedCashInMethod === method.id && (
                        <MaterialIcons name="check-circle" size={20} color="#8B5CF6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <TouchableOpacity 
                style={styles.walletActionButtonPrimary}
                onPress={handleCashIn}
              >
                <Text style={styles.walletActionButtonPrimaryText}>Cash In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Pay QR Modal */}
        <Modal
          visible={showPayQRModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPayQRModal(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.walletModal}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowPayQRModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.walletModalTitle}>QR Payment</Text>
              <Text style={styles.walletBalance}>Available: Php {walletBalance.toFixed(2)}</Text>
              
              {/* Mock QR Code */}
              <View style={styles.qrCodeContainer}>
                <View style={styles.qrCode}>
                  <MaterialIcons name="qr-code-2" size={100} color="#8B5CF6" />
                </View>
                <Text style={styles.merchantName}>{merchantName}</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount to Pay</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  value={qrAmount}
                  onChangeText={setQrAmount}
                  keyboardType="numeric"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.walletActionButtonPrimary}
                onPress={handleQRPayment}
              >
                <Text style={styles.walletActionButtonPrimaryText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Transaction History Modal */}
        <Modal
          visible={showTransactionHistory}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowTransactionHistory(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction History</Text>
              <TouchableOpacity onPress={() => setShowTransactionHistory(false)}>
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.transactionHistoryList}>
              {walletTransactions.map(transaction => (
                <View key={transaction.id} style={styles.transactionHistoryItem}>
                  <View style={styles.transactionHistoryIcon}>
                    <MaterialIcons 
                      name={
                        transaction.type === 'Transfer Out' ? 'send' :
                        transaction.type === 'Cash In' ? 'add-circle' :
                        transaction.type === 'QR Payment' ? 'qr-code' :
                        'account-balance'
                      } 
                      size={24} 
                      color={transaction.amount > 0 ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                  <View style={styles.transactionHistoryDetails}>
                    <Text style={styles.transactionHistoryType}>{transaction.type}</Text>
                    <Text style={styles.transactionHistoryDate}>
                      {formatTransactionDate(transaction.date)}
                    </Text>
                    {transaction.recipient && (
                      <Text style={styles.transactionHistoryExtra}>To: {transaction.recipient}</Text>
                    )}
                    {transaction.bank && (
                      <Text style={styles.transactionHistoryExtra}>Via: {transaction.bank}</Text>
                    )}
                    {transaction.source && (
                      <Text style={styles.transactionHistoryExtra}>From: {transaction.source}</Text>
                    )}
                    {transaction.merchant && (
                      <Text style={styles.transactionHistoryExtra}>At: {transaction.merchant}</Text>
                    )}
                    {transaction.note && (
                      <Text style={styles.transactionHistoryExtra}>{transaction.note}</Text>
                    )}
                  </View>
                  <View style={styles.transactionHistoryAmountContainer}>
                    <Text style={[
                      styles.transactionHistoryAmount,
                      { color: transaction.amount > 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      {transaction.amount > 0 ? '+' : ''}Php {Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                    <Text style={styles.transactionHistoryStatus}>{transaction.status}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Notifications Modal */}
        <Modal
          visible={showNotifications}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowNotifications(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <MaterialIcons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.notificationsList}>
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <TouchableOpacity 
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}
                    onPress={() => handleNotificationPress(notification.id)}
                  >
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                      <Text style={styles.notificationTime}>{notification.time}</Text>
                    </View>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyNotifications}>
                  <MaterialIcons name="notifications-off" size={40} color="#9CA3AF" />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Credit Score Modal with additional features */}
<Modal
  visible={showCreditScoreModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowCreditScoreModal(false)}
>
  <View style={styles.centeredView}>
    <View style={styles.creditScoreModal}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => setShowCreditScoreModal(false)}
      >
        <MaterialIcons name="close" size={24} color="#6B7280" />
      </TouchableOpacity>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.creditScoreModalTitle}>Your Credit Profile</Text>
        
        {/* Enhanced Credit Score Meter */}
        <View style={styles.roundMeterContainer}>
          <View style={styles.roundMeterOuter}>
            {/* Animated progress ring */}
            <View style={[
              styles.roundMeter,
              { 
                transform: [{ rotate: `${-135 + (creditScore / 850) * 270}deg`}],
                borderColor: creditScore >= 700 ? '#10B981' : creditScore >= 600 ? '#F59E0B' : '#EF4444'
              }
            ]}>
              <View style={[
                styles.roundMeterPointer,
                { backgroundColor: creditScore >= 700 ? '#10B981' : creditScore >= 600 ? '#F59E0B' : '#EF4444' }
              ]} />
            </View>
          </View>
          
          <View style={styles.roundMeterCenter}>
            <Text style={styles.roundMeterScore}>{creditScore}</Text>
            <Text style={[
              styles.roundMeterStatus,
              { 
                color: creditScore >= 700 ? '#10B981' : creditScore >= 600 ? '#F59E0B' : '#EF4444'
              }
            ]}>
              {creditScore >= 700 ? 'EXCELLENT' : creditScore >= 600 ? 'GOOD' : 'FAIR'}
            </Text>
          </View>
          
          <View style={styles.roundMeterLabels}>
            <Text style={styles.roundMeterLabel}>300</Text>
            <Text style={styles.roundMeterLabel}>850</Text>
          </View>
        </View>

        {/* Credit Score Breakdown */}
        <View style={styles.creditBreakdownSection}>
          <Text style={styles.sectionTitle}>Credit Score Factors</Text>
          
          <View style={styles.creditFactor}>
            <View style={styles.creditFactorHeader}>
              <Text style={styles.creditFactorTitle}>Payment History</Text>
              <Text style={styles.creditFactorPercentage}>35%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%', backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.creditFactorStatus}>Excellent - No missed payments</Text>
          </View>

          <View style={styles.creditFactor}>
            <View style={styles.creditFactorHeader}>
              <Text style={styles.creditFactorTitle}>Credit Utilization</Text>
              <Text style={styles.creditFactorPercentage}>30%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '70%', backgroundColor: '#F59E0B' }]} />
            </View>
            <Text style={styles.creditFactorStatus}>Good - 25% utilization</Text>
          </View>

          <View style={styles.creditFactor}>
            <View style={styles.creditFactorHeader}>
              <Text style={styles.creditFactorTitle}>Credit History Length</Text>
              <Text style={styles.creditFactorPercentage}>15%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%', backgroundColor: '#8B5CF6' }]} />
            </View>
            <Text style={styles.creditFactorStatus}>Fair - 3 years average</Text>
          </View>

          <View style={styles.creditFactor}>
            <View style={styles.creditFactorHeader}>
              <Text style={styles.creditFactorTitle}>Credit Mix</Text>
              <Text style={styles.creditFactorPercentage}>10%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%', backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.creditFactorStatus}>Good - Diverse credit types</Text>
          </View>

          <View style={styles.creditFactor}>
            <View style={styles.creditFactorHeader}>
              <Text style={styles.creditFactorTitle}>New Credit</Text>
              <Text style={styles.creditFactorPercentage}>10%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '80%', backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.creditFactorStatus}>Excellent - No recent inquiries</Text>
          </View>
        </View>

        {/* Credit Score Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>
          
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Pre-approved for loans up to ₱500,000</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Interest rates as low as 8.5% per annum</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Flexible repayment terms up to 36 months</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.benefitText}>Priority customer support</Text>
          </View>
        </View>

        {/* Credit Improvement Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips to Improve Your Score</Text>
          
          <View style={styles.tipItem}>
            <MaterialIcons name="lightbulb" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>Pay all bills on time to maintain excellent payment history</Text>
          </View>
          
          <View style={styles.tipItem}>
            <MaterialIcons name="lightbulb" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>Keep credit utilization below 30% of available credit</Text>
          </View>
          
          <View style={styles.tipItem}>
            <MaterialIcons name="lightbulb" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>Avoid closing old credit accounts</Text>
          </View>
        </View>

        {/* Credit Score History Chart */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Score History (Last 6 Months)</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: '60%' }]} />
              <Text style={styles.chartLabel}>Jan</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: '65%' }]} />
              <Text style={styles.chartLabel}>Feb</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: '70%' }]} />
              <Text style={styles.chartLabel}>Mar</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: '75%' }]} />
              <Text style={styles.chartLabel}>Apr</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: '80%' }]} />
              <Text style={styles.chartLabel}>May</Text>
            </View>
            <View style={styles.chartBar}>
              <View style={[styles.bar, { height: '85%' }]} />
              <Text style={styles.chartLabel}>Jun</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
         <TouchableOpacity 
  style={styles.secondaryButton}
  onPress={() => {
    setShowCreditScoreModal(false);
    navigation.navigate('CreditReport'); // Update this line
  }}
>
  <Text style={styles.secondaryButtonText}>View Full Report</Text>
</TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.applyLoanButton}
            onPress={() => {
              setShowCreditScoreModal(false);
              navigation.navigate('LoanApplication');
            }}
          >
            <Text style={styles.applyLoanButtonText}>Apply for Loan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>


        {/* Loan Application Status Modal */}
        <Modal
          visible={showLoanStatusModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLoanStatusModal(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.loanStatusModal}>
              <View style={styles.loanStatusHeader}>
                <MaterialIcons name="check-circle" size={40} color="#10B981" />
                              <Text style={styles.loanStatusTitle}>Application Submitted</Text>
              </View>
              
              <Text style={styles.loanStatusText}>
                Your loan application is now being processed. We'll notify you once we have updates.
              </Text>
              
              <Text style={styles.loanStatusSubtext}>
                Application ID: {loanApplicationStatus?.id}
              </Text>
              
              <View style={styles.loanStatusDetails}>
                <View style={styles.loanStatusDetailItem}>
                  <Text style={styles.loanStatusDetailLabel}>Amount:</Text>
                  <Text style={styles.loanStatusDetailValue}>
                    {loanApplicationStatus?.amount}
                  </Text>
                </View>
                <View style={styles.loanStatusDetailItem}>
                  <Text style={styles.loanStatusDetailLabel}>Term:</Text>
                  <Text style={styles.loanStatusDetailValue}>
                    {loanApplicationStatus?.term} months
                  </Text>
                </View>
                <View style={styles.loanStatusDetailItem}>
                  <Text style={styles.loanStatusDetailLabel}>Lenders:</Text>
                  <Text style={styles.loanStatusDetailValue}>
                    {loanApplicationStatus?.lenders}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.loanStatusButton}
                onPress={() => setShowLoanStatusModal(false)}
              >
                <Text style={styles.loanStatusButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Wallet Actions Modal */}
        <Modal
          visible={showWalletActions}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWalletActions(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.walletActionsModal}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowWalletActions(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.walletActionsTitle}>Wallet Actions</Text>
              
              <View style={styles.walletActionButtons}>
                <TouchableOpacity 
                  style={styles.walletActionButton}
                  onPress={() => {
                    setShowWalletActions(false);
                    setShowTransferModal(true);
                  }}
                >
                  <MaterialIcons name="send" size={30} color="#8B5CF6" />
                  <Text style={styles.walletActionButtonText}>Transfer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.walletActionButton}
                  onPress={() => {
                    setShowWalletActions(false);
                    setShowPayQRModal(true);
                  }}
                >
                  <MaterialIcons name="qr-code" size={30} color="#8B5CF6" />
                  <Text style={styles.walletActionButtonText}>Pay QR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.walletActionButton}
                  onPress={() => {
                    setShowWalletActions(false);
                    setShowCashInModal(true);
                  }}
                >
                  <MaterialIcons name="add-circle" size={30} color="#8B5CF6" />
                  <Text style={styles.walletActionButtonText}>Cash In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* How to Loan Modal */}
        <Modal
          visible={showHowToLoanModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHowToLoanModal(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.howToLoanModal}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowHowToLoanModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.howToLoanModalTitle}>How to Loan with Lora</Text>
              
              <ScrollView style={styles.howToLoanContent}>
                <View style={styles.featureSection}>
                  <Text style={styles.featureTitle}>1. Check Your Credit Score</Text>
                  <Text style={styles.featureDescription}>
                    View your current credit score to understand your eligibility for loans. 
                    A higher score gives you access to better rates and higher loan amounts.
                  </Text>
                </View>
                
                <View style={styles.featureSection}>
                  <Text style={styles.featureTitle}>2. Apply for a Loan</Text>
                  <Text style={styles.featureDescription}>
                    Fill out our simple application form with your personal and financial details. 
                    Our process is quick and secure.
                  </Text>
                </View>
                
                <View style={styles.featureSection}>
                  <Text style={styles.featureTitle}>3. Get Approved</Text>
                  <Text style={styles.featureDescription}>
                    Receive instant approval decisions. If approved, funds will be disbursed 
                    directly to your Lora wallet.
                  </Text>
                </View>
                
                <View style={styles.featureSection}>
                  <Text style={styles.featureTitle}>4. Manage Your Loan</Text>
                  <Text style={styles.featureDescription}>
                    View your current loan balance, payment schedule, and make payments 
                    directly from your wallet.
                  </Text>
                </View>
                
                <View style={styles.featureSection}>
                  <Text style={styles.featureTitle}>5. Make Payments</Text>
                  <Text style={styles.featureDescription}>
                    Use your wallet balance to make payments on time. Set up reminders 
                    to avoid missing due dates.
                  </Text>
                </View>
                
                <View style={styles.featureSection}>
                  <Text style={styles.featureTitle}>6. Wallet Features</Text>
                  <Text style={styles.featureDescription}>
                    Your Lora wallet allows you to transfer funds, pay via QR code, 
                    and cash in from various payment channels.
                  </Text>
                </View>
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.applyLoanButton}
                onPress={() => {
                  setShowHowToLoanModal(false);
                  navigation.navigate('LoanApplication');
                }}
              >
                <Text style={styles.applyLoanButtonText}>Apply for Loan Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Main Content */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Tab Selector */}
          <View style={styles.tabSelector}>
            <TouchableOpacity 
              style={[
                styles.tabButton, 
                activeTab === 'pending' && styles.activeTab
              ]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === 'pending' && styles.activeTabText
              ]}>
                Pending Amount
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tabButton, 
                activeTab === 'wallet' && styles.activeTab
              ]}
              onPress={() => setActiveTab('wallet')}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === 'wallet' && styles.activeTabText
              ]}>
                My Wallet
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grand Total Card or Wallet Card based on active tab */}
          {activeTab === 'pending' ? (
            <View style={styles.grandTotalCard}>
              <View style={styles.grandTotalContent}>
                <View style={styles.grandTotalInfo}>
                  <Text style={styles.grandTotalLabel}>Grand Total Pending Amount</Text>
                  <Text style={styles.grandTotalAmount}>Php 582,001.50</Text>
                  <Text style={styles.grandTotalDate}>AS OF {currentDateTime}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.payNowButtonGrand}
                  onPress={() => navigation.navigate('PayNow')}
                >
                  <Text style={styles.payNowButtonTextGrand}>PAY NOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <Text style={styles.walletTitle}>My Wallet Balance</Text>
                <TouchableOpacity onPress={() => setShowTransactionHistory(true)}>
                  <MaterialIcons name="history" size={20} color="rgba(255, 255, 255, 0.8)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.walletAmount}>Php {walletBalance.toFixed(2)}</Text>
              <Text style={styles.grandTotalDate}>AS OF {currentDateTime}</Text>
              
              <View style={styles.walletActions}>
                <TouchableOpacity 
                  style={styles.walletAction}
                  onPress={() => setShowTransferModal(true)}
                >
                  <MaterialIcons name="send" size={20} color="white" />
                  <Text style={styles.walletActionText}>Transfer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.walletAction}
                  onPress={() => setShowPayQRModal(true)}
                >
                  <MaterialIcons name="qr-code" size={20} color="white" />
                  <Text style={styles.walletActionText}>Pay QR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.walletAction}
                  onPress={() => setShowCashInModal(true)}
                >
                  <MaterialIcons name="add-circle" size={20} color="white" />
                  <Text style={styles.walletActionText}>Cash In</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.walletAction}
                  onPress={() => setShowWalletActions(true)}
                >
                  <MaterialIcons name="more-horiz" size={20} color="white" />
                  <Text style={styles.walletActionText}>More</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Cards Row */}
          <View style={styles.row}>
            {/* Current Loan */}
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('CurrentLoan')}
            >
              <Text style={styles.cardTitle}>Current Loan</Text>
              <Text style={styles.cardValue}>Php 150,000.00</Text>
            </TouchableOpacity>

            {/* Next Payment without Pay Now (moved to Grand Total card) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Next Payment Due</Text>
              <Text style={styles.dueDate}>Aug 5, 2025</Text>
              <Text style={styles.dueAmount}>Php 5,250.00</Text>
            </View>
          </View>

          {/* Credit Score Card - Now standalone */}
          <TouchableOpacity 
            style={[styles.card, styles.fullWidthCard]}
            onPress={() => setShowCreditScoreModal(true)}
          >
            <Text style={styles.cardTitle}>Credit Score</Text>
            <View style={styles.creditScoreContainer}>
              <Text style={styles.creditScore}>720</Text>
              <Text style={styles.creditScoreLabel}>GOOD</Text>
            </View>
          </TouchableOpacity>

          {/* Loan Application */}
          <View style={styles.loanApplicationCard}>
            <Text style={styles.loanTitle}>Need Loan?</Text>
            <Text style={styles.loanText}>
              Get approved in minutes with our quick application process
            </Text>
            <View style={styles.loanButtonsContainer}>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => navigation.navigate('LoanApplication')}
              >
                <Text style={styles.applyButtonText}>+ Apply for a loan</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.howToLoanButton}
                onPress={() => setShowHowToLoanModal(true)}
              >
                <Text style={styles.howToLoanButtonText}>How to Loan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionList}>
            <TransactionItem 
              type="Payment" 
              amount="5,250.00" 
              date="Jul 5, 2023" 
              status="Completed"
            />
            <TransactionItem 
              type="Loan Disbursement" 
              amount="150,000.00" 
              date="Jun 15, 2023" 
              status="Completed"
            />
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
         <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>🏠</Text>
          </View>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Loans')}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>💵</Text>
          </View>
          <Text style={styles.navText}>Loans</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Transactions')}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📊</Text>
          </View>
          <Text style={styles.navText}>Transactions</Text>
        </TouchableOpacity>
        <TouchableOpacity 
  style={styles.navItem} 
  onPress={() => navigation.navigate('Profile')}
>
  <View style={styles.navIcon}>
    <Text style={styles.navIconText}>👤</Text>
  </View>
  <Text style={styles.navText}>Profile</Text>
</TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};  

  const TransactionItem = ({ type, amount, date, status }) => {
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionIconText}>
            {type === 'Payment' ? '💸' : '🏦'}
          </Text>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionType}>{type}</Text>
          <Text style={styles.transactionDate}>{date}</Text>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={styles.transactionAmount}>Php {amount}</Text>
          <Text style={[
            styles.transactionStatus,
            status === 'Completed' ? styles.statusCompleted : styles.statusPending
          ]}>
            {status}
          </Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({


// Add these to your existing styles object
creditBreakdownSection: {
  marginBottom: 25,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#1F2937',
  marginBottom: 15,
},
creditFactor: {
  marginBottom: 15,
},
creditFactorHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 5,
},
creditFactorTitle: {
  fontSize: 14,
  fontWeight: '500',
  color: '#374151',
},
creditFactorPercentage: {
  fontSize: 12,
  color: '#6B7280',
},
progressBar: {
  height: 6,
  backgroundColor: '#E5E7EB',
  borderRadius: 3,
  marginBottom: 5,
},
progressFill: {
  height: '100%',
  borderRadius: 3,
},
creditFactorStatus: {
  fontSize: 12,
  color: '#6B7280',
},
benefitsSection: {
  marginBottom: 25,
},
benefitItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
benefitText: {
  fontSize: 14,
  color: '#374151',
  marginLeft: 10,
  flex: 1,
},
tipsSection: {
  marginBottom: 25,
},
tipItem: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 8,
},
tipText: {
  fontSize: 13,
  color: '#6B7280',
  marginLeft: 8,
  flex: 1,
  lineHeight: 18,
},
historySection: {
  marginBottom: 25,
},
chartContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  height: 100,
  paddingHorizontal: 10,
},
chartBar: {
  alignItems: 'center',
  flex: 1,
},
bar: {
  width: 20,
  backgroundColor: '#8B5CF6',
  borderRadius: 2,
  marginBottom: 5,
},
chartLabel: {
  fontSize: 10,
  color: '#6B7280',
},
actionButtonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 10,
},
secondaryButton: {
  flex: 1,
  backgroundColor: '#F3F4F6',
  padding: 15,
  borderRadius: 8,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#D1D5DB',
},
secondaryButtonText: {
  color: '#374151',
  fontSize: 16,
  fontWeight: '600',
},



    grandTotalCard: {
      backgroundColor: '#8B5CF6',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    grandTotalContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    grandTotalInfo: {
      flex: 1,
    },
    grandTotalLabel: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 14,
    },
    grandTotalAmount: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    grandTotalDate: {
      color: 'rgba(255, 255, 255, 0.75)',
      fontSize: 12,
    },
    payNowButtonGrand: {
      backgroundColor: 'white',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginLeft: 16,
    },
    payNowButtonTextGrand: {
      color: '#8B5CF6',
      fontWeight: 'bold',
      fontSize: 14,
    },
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: 'white',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    appName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#F97316',
      marginLeft: 10,
    },
    logo: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    notificationButton: {
      padding: 8,
      position: 'relative',
    },
    notificationDot: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 8,
      height: 8,
      backgroundColor: '#EF4444',
      borderRadius: 4,
    },
    content: {
      padding: 16,
      paddingBottom: 80,
    },
    tabSelector: {
      flexDirection: 'row',
      backgroundColor: '#EDE9FE',
      borderRadius: 8,
      padding: 4,
      marginBottom: 16,
    },
    tabButton: {
      flex: 1,
      padding: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: 'white',
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabButtonText: {
      color: '#8B5CF6',
      fontWeight: '500',
    },
    activeTabText: {
      fontWeight: '600',
    },
    walletCard: {
      backgroundColor: '#4F46E5',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    walletHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    walletTitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 14,
    },
    walletAmount: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    walletActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    walletAction: {
      alignItems: 'center',
      padding: 8,
      flex: 1,
    },
    walletActionText: {
      color: 'white',
      fontSize: 12,
      marginTop: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    card: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      width: (width - 40) / 2,
      elevation: 1,
    },
    fullWidthCard: {
      width: '100%',
      marginBottom: 16,
    },
    cardTitle: {
      color: '#4B5563',
      fontSize: 14,
      marginBottom: 8,
    },
    cardValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
    },
    dueDate: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
    },
    dueAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: '#EF4444',
    },
    creditScoreContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    creditScore: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    creditScoreLabel: {
      color: '#10B981',
      fontSize: 14,
      fontWeight: '500',
    },
    loanApplicationCard: {
      backgroundColor: '#F97316',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    loanTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
    },
    loanText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 14,
      marginVertical: 8,
    },
    loanButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    applyButton: {
      backgroundColor: 'white',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      flex: 1,
      marginRight: 8,
    },
    applyButtonText: {
      color: '#F97316',
      fontWeight: '600',
      textAlign: 'center',
    },
    howToLoanButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'white',
    },
    howToLoanButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
    },
    seeAllText: {
      color: '#8B5CF6',
      fontSize: 14,
    },
    transactionList: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#EDE9FE',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionIconText: {
      fontSize: 18,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionType: {
      fontSize: 14,
      fontWeight: '500',
      color: '#1F2937',
    },
    transactionDate: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 2,
    },
    transactionAmountContainer: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
    },
    transactionStatus: {
      fontSize: 12,
      marginTop: 4,
      fontWeight: '500',
    },
    statusCompleted: {
      color: '#10B981',
    },
    statusPending: {
      color: '#F59E0B',
    },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    navItem: {
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    navIcon: {
      marginBottom: 4,
    },
    navIconText: {
      fontSize: 20,
    },
    navText: {
      color: '#9CA3AF',
      fontSize: 12,
    },
    navTextActive: {
      color: '#8B5CF6',
      fontSize: 12,
      fontWeight: '500',
    },
    profileContent: {
      padding: 20,
      flexGrow: 1,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 30,
      marginTop: 20,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 15,
    },
    emptyAvatar: {
      backgroundColor: '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    name: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1F2937',
      marginBottom: 5,
    },
    email: {
      fontSize: 14,
      color: '#6B7280',
    },
    detailsContainer: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    detailLabel: {
      color: '#6B7280',
      fontSize: 14,
    },
    detailValue: {
      color: '#1F2937',
      fontSize: 14,
      fontWeight: '500',
    },
    activeStatus: {
      color: '#10B981',
    },
    settingsButton: {
      backgroundColor: '#E5E7EB',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    settingsButtonText: {
      color: '#1F2937',
      fontSize: 16,
      fontWeight: '600',
    },
    logoutButton: {
      backgroundColor: '#EF4444',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    logoutButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      fontSize: 24,
      color: '#374151',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1F2937',
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    modalHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    markAllText: {
      color: '#8B5CF6',
      fontWeight: '500',
    },
    notificationsList: {
      flex: 1,
      padding: 16,
    },
    notificationItem: {
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    notificationContent: {
      flex: 1,
    },
    unreadNotification: {
      borderLeftWidth: 4,
      borderLeftColor: '#8B5CF6',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#8B5CF6',
      marginLeft: 8,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      color: '#4B5563',
      marginBottom: 4,
    },
    notificationTime: {
      fontSize: 12,
      color: '#9CA3AF',
    },
    emptyNotifications: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      marginTop: 16,
      color: '#6B7280',
      fontSize: 16,
    },
    // Wallet Modal Styles
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    walletModal: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    walletModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#1F2937',
      textAlign: 'center',
    },
    walletBalance: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
      marginBottom: 5,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#F9FAFB',
    },
    bankList: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    bankOption: {
      alignItems: 'center',
      padding: 10,
      marginRight: 10,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      minWidth: 80,
    },
    selectedBankOption: {
      borderColor: '#8B5CF6',
      backgroundColor: '#F3F0FF',
    },
    bankIcon: {
      fontSize: 24,
      marginBottom: 5,
    },
    bankName: {
      fontSize: 12,
      color: '#374151',
    },
    walletActionButtonPrimary: {
      backgroundColor: '#8B5CF6',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 10,
    },
    walletActionButtonPrimaryText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    closeButton: {
      position: 'absolute',
      top: 15,
      right: 15,
      zIndex: 1,
    },
    // QR Modal Styles
    qrCodeContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    qrCode: {
      width: 150,
      height: 150,
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    merchantName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#1F2937',
    },
    // Cash In Modal Styles
    cashInMethods: {
      maxHeight: 200,
    },
    cashInMethod: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      marginBottom: 10,
    },
    selectedCashInMethod: {
      borderColor: '#8B5CF6',
      backgroundColor: '#F3F0FF',
    },
    cashInMethodInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cashInMethodIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    cashInMethodName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#1F2937',
    },
    cashInMethodFee: {
      fontSize: 12,
      color: '#6B7280',
    },
    // Transaction History Modal Styles
    transactionHistoryList: {
      flex: 1,
      padding: 16,
    },
    transactionHistoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    transactionHistoryIcon: {
      marginRight: 12,
      marginTop: 4,
    },
    transactionHistoryDetails: {
      flex: 1,
    },
    transactionHistoryType: {
      fontSize: 14,
      fontWeight: '500',
      color: '#1F2937',
    },
    transactionHistoryDate: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 2,
    },
    transactionHistoryExtra: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 2,
    },
    transactionHistoryAmountContainer: {
      alignItems: 'flex-end',
    },
    transactionHistoryAmount: {
      fontSize: 14,
      fontWeight: '600',
    },
    transactionHistoryStatus: {
      fontSize: 12,
      color: '#10B981',
      marginTop: 4,
    },
    // Credit Score Modal Styles
    creditScoreModal: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    creditScoreModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#1F2937',
      textAlign: 'center',
    },
    roundMeterContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    roundMeterOuter: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    roundMeter: {
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 10,
      borderColor: '#8B5CF6',
      borderLeftColor: '#E5E7EB',
      borderBottomColor: '#E5E7EB',
      transform: [{ rotate: '-135deg' }],
      position: 'absolute',
    },
    roundMeterPointer: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#8B5CF6',
      position: 'absolute',
      top: -10,
      left: '50%',
      marginLeft: -10,
    },
    roundMeterCenter: {
      position: 'absolute',
      alignItems: 'center',
    },
    roundMeterScore: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1F2937',
    },
    roundMeterStatus: {
      fontSize: 16,
      fontWeight: '600',
    },
    roundMeterLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 20,
      marginTop: 10,
    },
    roundMeterLabel: {
      fontSize: 12,
      color: '#6B7280',
    },
    creditScoreInfo: {
      marginBottom: 20,
    },
    creditScoreMessage: {
      fontSize: 14,
      color: '#4B5563',
      textAlign: 'center',
      marginBottom: 15,
      lineHeight: 20,
    },
    creditScoreDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    creditScoreDetailLabel: {
      fontSize: 14,
      color: '#6B7280',
    },
    creditScoreDetailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#1F2937',
    },
    applyLoanButton: {
      backgroundColor: '#8B5CF6',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    applyLoanButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
      // Loan Status Modal Styles
    loanStatusModal: {
      width: '90%',
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    loanStatusHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    loanStatusTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1F2937',
      marginTop: 10,
    },
    loanStatusText: {
      fontSize: 14,
      color: '#4B5563',
      textAlign: 'center',
      marginBottom: 15,
      lineHeight: 20,
    },
    loanStatusSubtext: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 20,
    },
    loanStatusDetails: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      padding: 15,
      marginBottom: 20,
    },
    loanStatusDetailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },
    loanStatusDetailLabel: {
      fontSize: 14,
      color: '#6B7280',
    },
    loanStatusDetailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#1F2937',
    },
    loanStatusButton: {
      backgroundColor: '#8B5CF6',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    loanStatusButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    // Wallet Actions Modal Styles
    walletActionsModal: {
      width: '90%',
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    walletActionsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#1F2937',
      textAlign: 'center',
    },
    walletActionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
    },
    walletActionButton: {
      alignItems: 'center',
      padding: 20,
      borderRadius: 12,
      backgroundColor: '#F9FAFB',
      width: '30%',
      marginBottom: 15,
    },
    walletActionButtonText: {
      fontSize: 12,
      color: '#4B5563',
      marginTop: 8,
      fontWeight: '500',
    },
    // How to Loan Modal Styles
    howToLoanModal: {
      width: '95%',
      height: '85%',
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    howToLoanModalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#1F2937',
      textAlign: 'center',
    },
    howToLoanContent: {
      flex: 1,
      marginBottom: 20,
    },
    featureSection: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 8,
    },
    featureDescription: {
      fontSize: 14,
      color: '#4B5563',
      lineHeight: 20,
    },
    applyLoanButton: {
      backgroundColor: '#F97316',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
    },
    applyLoanButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  export default DashboardScreen;




