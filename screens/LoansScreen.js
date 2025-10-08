import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LoanManagementApp = () => {
  const [loans] = useState([
    {
      id: 1,
      title: 'Home Mortgage',
      amount: 225000,
      originated: '03/15/2020',
      term: '30 years',
      status: 'active'
    },
    {
      id: 2,
      title: 'Auto Loan',
      amount: 28500,
      originated: '08/22/2022',
      term: '5 years',
      status: 'active'
    },
    {
      id: 3,
      title: 'Personal Loan',
      amount: 15000,
      originated: '01/10/2023',
      term: '3 years',
      status: 'active'
    },
  ]);

  const [applicationHistory] = useState([
    {
      id: 1,
      title: 'Education Loan',
      amount: 12000,
      applied: '11/05/2023',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Small Business Loan',
      amount: 50000,
      applied: '09/18/2021',
      status: 'paid'
    }
  ]);

  const handleBackPress = () => {
    Alert.alert('Go Back', 'Navigating back to previous screen');
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6a11cb" />
      
      {/* Header - Exact replica of web design */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            <View style={styles.logo}>
              <MaterialIcons name="account-balance" size={28} color="#ffd700" />
              <Text style={styles.logoText}>FinSecure</Text>
            </View>
            <View style={styles.navLinks}>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.navLink, styles.activeNavLink]}>
                <Text style={[styles.navLinkText, styles.activeNavLinkText]}>My Loans</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Applications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLink}>
                <Text style={styles.navLinkText}>Documents</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.centerSection}>
            <View style={styles.pageTitle}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                <Ionicons name="arrow-back" size={20} color="white" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>My Loans</Text>
            </View>
          </View>
          
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="white" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="settings-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.userProfile}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>JS</Text>
              </View>
              <Text style={styles.userName}>John Smith</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content - Exact replica */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loan Stats */}
        <View style={styles.loanStats}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Loan Balance</Text>
            <Text style={styles.statValue}>$42,580</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Monthly Payment</Text>
            <Text style={styles.statValue}>$1,250</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Remaining Terms</Text>
            <Text style={styles.statValue}>34 months</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Interest Rate</Text>
            <Text style={styles.statValue}>4.25%</Text>
          </View>
        </View>

        {/* Active Loans Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list" size={24} color="#6a11cb" />
            <Text style={styles.cardTitle}>Active Loans</Text>
          </View>
          <View style={styles.loanList}>
            {loans.map(loan => (
              <View key={loan.id} style={styles.loanItem}>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanName}>{loan.title}</Text>
                  <View style={styles.loanDetails}>
                    <Text style={styles.loanDetail}>Originated: {loan.originated}</Text>
                    <Text style={styles.loanDetail}>Term: {loan.term}</Text>
                  </View>
                </View>
                <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
                <View style={[styles.loanStatus, styles.statusActive]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Application History Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color="#6a11cb" />
            <Text style={styles.cardTitle}>Loan Application History</Text>
          </View>
          <View style={styles.loanList}>
            {applicationHistory.map(app => (
              <View key={app.id} style={styles.loanItem}>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanName}>{app.title}</Text>
                  <View style={styles.loanDetails}>
                    <Text style={styles.loanDetail}>Applied: {app.applied}</Text>
                    <Text style={styles.loanDetail}>Amount: {formatCurrency(app.amount)}</Text>
                  </View>
                </View>
                <Text style={styles.loanAmount}>{formatCurrency(app.amount)}</Text>
                <View style={[
                  styles.loanStatus, 
                  app.status === 'pending' ? styles.statusPending : styles.statusPaid
                ]}>
                  <Text style={styles.statusText}>
                    {app.status === 'pending' ? 'Pending' : 'Paid Off'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#6a11cb',
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 8,
  },
  navLinks: {
    flexDirection: 'row',
    marginLeft: 32,
    gap: 24,
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  activeNavLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  navLinkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  activeNavLinkText: {
    fontWeight: '600',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  pageTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loanStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    width: (width - 80) / 2,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#6a11cb',
  },
  statTitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3748',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
  },
  loanList: {
    gap: 16,
  },
  loanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 20,
  },
  loanInfo: {
    flex: 1,
  },
  loanName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  loanDetails: {
    flexDirection: 'row',
    gap: 24,
  },
  loanDetail: {
    fontSize: 14,
    color: '#718096',
  },
  loanAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginHorizontal: 16,
  },
  loanStatus: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#e3f2fd',
  },
  statusPending: {
    backgroundColor: '#fff3e0',
  },
  statusPaid: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoanManagementApp;