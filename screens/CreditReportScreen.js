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

const { width } = Dimensions.get('window');

const CreditReportScreen = ({ navigation, route }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Mock credit report data - in real app, this would come from API
  const creditReportData = {
    personalInfo: {
      fullName: 'Juan Dela Cruz',
      dateOfBirth: 'January 15, 1990',
      address: '123 Main Street, Manila, Philippines',
      phoneNumber: '+63 912 345 6789',
      email: 'juan.delacruz@example.com',
      reportDate: new Date().toLocaleDateString(),
      reportNumber: 'CR-2025-001234'
    },
    creditScore: {
      current: 720,
      previous: 705,
      trend: 'up',
      range: 'Good',
      lastUpdated: '2025-09-15'
    },
    scoreHistory: [
      { month: 'Mar', score: 680 },
      { month: 'Apr', score: 690 },
      { month: 'May', score: 700 },
      { month: 'Jun', score: 705 },
      { month: 'Jul', score: 710 },
      { month: 'Aug', score: 715 },
      { month: 'Sep', score: 720 }
    ],
    creditFactors: [
      {
        factor: 'Payment History',
        weight: 35,
        score: 85,
        status: 'Excellent',
        color: '#10B981',
        description: 'You have a perfect payment history with no late payments in the last 24 months.'
      },
      {
        factor: 'Credit Utilization',
        weight: 30,
        score: 70,
        status: 'Good',
        color: '#F59E0B',
        description: 'Your credit utilization is 25%. Consider keeping it below 10% for excellent scores.'
      },
      {
        factor: 'Credit History Length',
        weight: 15,
        score: 60,
        status: 'Fair',
        color: '#8B5CF6',
        description: 'Your average account age is 3 years. Older accounts help improve your score.'
      },
      {
        factor: 'Credit Mix',
        weight: 10,
        score: 75,
        status: 'Good',
        color: '#10B981',
        description: 'You have a good mix of credit cards, loans, and other credit types.'
      },
      {
        factor: 'New Credit Inquiries',
        weight: 10,
        score: 80,
        status: 'Very Good',
        color: '#10B981',
        description: 'You have minimal recent credit inquiries, which is good for your score.'
      }
    ],
    accounts: [
      {
        id: 1,
        type: 'Credit Card',
        institution: 'BPI Credit Card',
        accountNumber: '****-****-****-1234',
        status: 'Active',
        balance: 45000,
        creditLimit: 180000,
        utilization: 25,
        openDate: '2022-03-15',
        lastPayment: '2025-09-01',
        paymentHistory: 'Excellent'
      },
      {
        id: 2,
        type: 'Personal Loan',
        institution: 'Metrobank',
        accountNumber: '****-****-5678',
        status: 'Active',
        balance: 120000,
        originalAmount: 200000,
        monthlyPayment: 8500,
        openDate: '2024-01-10',
        lastPayment: '2025-09-05',
        paymentHistory: 'Good'
      },
      {
        id: 3,
        type: 'Auto Loan',
        institution: 'Toyota Financial',
        accountNumber: '****-****-9012',
        status: 'Closed',
        balance: 0,
        originalAmount: 800000,
        openDate: '2020-06-20',
        closeDate: '2024-06-20',
        paymentHistory: 'Excellent'
      }
    ],
    inquiries: [
      {
        id: 1,
        type: 'Hard Inquiry',
        institution: 'UnionBank Credit Card',
        date: '2025-08-15',
        purpose: 'Credit Card Application'
      },
      {
        id: 2,
        type: 'Soft Inquiry',
        institution: 'Lora Financial',
        date: '2025-09-10',
        purpose: 'Pre-qualification Check'
      }
    ],
    alerts: [
      {
        id: 1,
        type: 'positive',
        title: 'Credit Score Improved',
        message: 'Your credit score increased by 15 points this month',
        date: '2025-09-15',
        severity: 'info'
      },
      {
        id: 2,
        type: 'warning',
        title: 'High Credit Utilization',
        message: 'Your BPI Credit Card utilization is at 25%. Consider paying down the balance.',
        date: '2025-09-10',
        severity: 'warning'
      },
      {
        id: 3,
        type: 'action',
        title: 'New Credit Inquiry',
        message: 'A new hard inquiry was added to your report from UnionBank.',
        date: '2025-08-15',
        severity: 'info'
      }
    ],
    recommendations: [
      {
        id: 1,
        title: 'Pay Down Credit Card Balance',
        description: 'Reduce your BPI Credit Card balance to below 10% utilization to improve your score.',
        impact: 'High',
        timeframe: '1-2 months'
      },
      {
        id: 2,
        title: 'Keep Old Accounts Open',
        description: 'Maintain your oldest credit accounts to improve your credit history length.',
        impact: 'Medium',
        timeframe: 'Ongoing'
      },
      {
        id: 3,
        title: 'Set Up Automatic Payments',
        description: 'Ensure all payments are made on time by setting up automatic payments.',
        impact: 'High',
        timeframe: 'Immediate'
      }
    ]
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Success', 'Credit report updated successfully!');
    }, 2000);
  };

  const renderOverviewSection = () => (
    <View>
      {/* Credit Score Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit Score Overview</Text>
        <View style={styles.scoreOverview}>
          <View style={styles.currentScoreContainer}>
            <Text style={styles.currentScore}>{creditReportData.creditScore.current}</Text>
            <Text style={styles.scoreRange}>{creditReportData.creditScore.range}</Text>
            <View style={styles.scoreTrend}>
              <MaterialIcons 
                name={creditReportData.creditScore.trend === 'up' ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={creditReportData.creditScore.trend === 'up' ? '#10B981' : '#EF4444'} 
              />
              <Text style={[
                styles.scoreChange,
                { color: creditReportData.creditScore.trend === 'up' ? '#10B981' : '#EF4444' }
              ]}>
                +{creditReportData.creditScore.current - creditReportData.creditScore.previous} points
              </Text>
            </View>
          </View>
          <View style={styles.scoreGauge}>
            <View style={styles.gaugeBackground}>
              <View style={[
                styles.gaugeFill,
                { width: `${(creditReportData.creditScore.current / 850) * 100}%` }
              ]} />
            </View>
            <Text style={styles.gaugeLabel}>300 - 850 Range</Text>
          </View>
        </View>
      </View>

      {/* Key Factors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Score Factors</Text>
        {creditReportData.creditFactors.map((factor, index) => (
          <View key={index} style={styles.factorCard}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorName}>{factor.factor}</Text>
              <View style={styles.factorBadge}>
                <Text style={[styles.factorStatus, { color: factor.color }]}>
                  {factor.status}
                </Text>
              </View>
            </View>
            <View style={styles.factorProgress}>
              <View style={styles.progressBarBackground}>
                <View style={[
                  styles.progressBarFill,
                  { width: `${factor.score}%`, backgroundColor: factor.color }
                ]} />
              </View>
              <Text style={styles.factorWeight}>{factor.weight}%</Text>
            </View>
            <Text style={styles.factorDescription}>{factor.description}</Text>
          </View>
        ))}
      </View>

      {/* Alerts Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <TouchableOpacity onPress={() => setActiveSection('alerts')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {creditReportData.alerts.slice(0, 2).map(alert => (
          <TouchableOpacity 
            key={alert.id} 
            style={styles.alertCard}
            onPress={() => {
              setSelectedAlert(alert);
              setShowAlertModal(true);
            }}
          >
            <MaterialIcons 
              name={
                alert.severity === 'warning' ? 'warning' : 
                alert.type === 'positive' ? 'check-circle' : 'info'
              } 
              size={20} 
              color={
                alert.severity === 'warning' ? '#F59E0B' :
                alert.type === 'positive' ? '#10B981' : '#3B82F6'
              } 
            />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertDate}>{alert.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAccountsSection = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit Accounts</Text>
        <Text style={styles.sectionSubtitle}>
          Active and closed accounts that impact your credit score
        </Text>
        
        {creditReportData.accounts.map(account => (
          <View key={account.id} style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <View>
                <Text style={styles.accountType}>{account.type}</Text>
                <Text style={styles.accountInstitution}>{account.institution}</Text>
              </View>
              <View style={[
                styles.accountStatusBadge,
                { backgroundColor: account.status === 'Active' ? '#DCFCE7' : '#F3F4F6' }
              ]}>
                <Text style={[
                  styles.accountStatusText,
                  { color: account.status === 'Active' ? '#166534' : '#6B7280' }
                ]}>
                  {account.status}
                </Text>
              </View>
            </View>
            
            <Text style={styles.accountNumber}>{account.accountNumber}</Text>
            
            <View style={styles.accountDetails}>
              {account.balance !== undefined && (
                <View style={styles.accountDetailRow}>
                  <Text style={styles.accountDetailLabel}>Current Balance:</Text>
                  <Text style={styles.accountDetailValue}>
                    ₱{account.balance.toLocaleString()}
                  </Text>
                </View>
              )}
              
              {account.creditLimit && (
                <View style={styles.accountDetailRow}>
                  <Text style={styles.accountDetailLabel}>Credit Limit:</Text>
                  <Text style={styles.accountDetailValue}>
                    ₱{account.creditLimit.toLocaleString()}
                  </Text>
                </View>
              )}
              
              {account.utilization && (
                <View style={styles.accountDetailRow}>
                  <Text style={styles.accountDetailLabel}>Utilization:</Text>
                  <Text style={[
                    styles.accountDetailValue,
                    { color: account.utilization > 30 ? '#EF4444' : '#10B981' }
                  ]}>
                    {account.utilization}%
                  </Text>
                </View>
              )}
              
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountDetailLabel}>Opened:</Text>
                <Text style={styles.accountDetailValue}>
                  {new Date(account.openDate).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.accountDetailRow}>
                <Text style={styles.accountDetailLabel}>Payment History:</Text>
                <Text style={[
                  styles.accountDetailValue,
                  { color: account.paymentHistory === 'Excellent' ? '#10B981' : '#F59E0B' }
                ]}>
                  {account.paymentHistory}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderHistorySection = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Score History</Text>
        <Text style={styles.sectionSubtitle}>
          Your credit score trend over the last 7 months
        </Text>
        
        <View style={styles.chartContainer}>
          <View style={styles.chartYAxis}>
            {[850, 700, 550, 400, 300].map(value => (
              <Text key={value} style={styles.yAxisLabel}>{value}</Text>
            ))}
          </View>
          <View style={styles.chartArea}>
            {creditReportData.scoreHistory.map((data, index) => (
              <View key={index} style={styles.chartColumn}>
                <View 
                  style={[
                    styles.chartBar,
                    { height: `${((data.score - 300) / 550) * 100}%` }
                  ]} 
                />
                <Text style={styles.chartXLabel}>{data.month}</Text>
                <Text style={styles.chartScoreLabel}>{data.score}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit Inquiries</Text>
        <Text style={styles.sectionSubtitle}>
          Recent credit checks by lenders
        </Text>
        
        {creditReportData.inquiries.map(inquiry => (
          <View key={inquiry.id} style={styles.inquiryCard}>
            <View style={styles.inquiryHeader}>
              <MaterialIcons 
                name={inquiry.type === 'Hard Inquiry' ? 'search' : 'visibility'} 
                size={20} 
                color={inquiry.type === 'Hard Inquiry' ? '#EF4444' : '#6B7280'} 
              />
              <View style={styles.inquiryContent}>
                <Text style={styles.inquiryType}>{inquiry.type}</Text>
                <Text style={styles.inquiryInstitution}>{inquiry.institution}</Text>
              </View>
              <Text style={styles.inquiryDate}>{inquiry.date}</Text>
            </View>
            <Text style={styles.inquiryPurpose}>{inquiry.purpose}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAlertsSection = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credit Alerts</Text>
        <Text style={styles.sectionSubtitle}>
          Important changes and notifications about your credit
        </Text>
        
        {creditReportData.alerts.map(alert => (
          <TouchableOpacity 
            key={alert.id} 
            style={styles.alertCard}
            onPress={() => {
              setSelectedAlert(alert);
              setShowAlertModal(true);
            }}
          >
            <MaterialIcons 
              name={
                alert.severity === 'warning' ? 'warning' : 
                alert.type === 'positive' ? 'check-circle' : 'info'
              } 
              size={24} 
              color={
                alert.severity === 'warning' ? '#F59E0B' :
                alert.type === 'positive' ? '#10B981' : '#3B82F6'
              } 
            />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertDate}>{alert.date}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecommendationsSection = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
        <Text style={styles.sectionSubtitle}>
          Actions you can take to improve your credit score
        </Text>
        
        {creditReportData.recommendations.map(rec => (
          <View key={rec.id} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <MaterialIcons name="lightbulb" size={24} color="#F59E0B" />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <View style={styles.recommendationMeta}>
                  <View style={[
                    styles.impactBadge,
                    { 
                      backgroundColor: rec.impact === 'High' ? '#FEE2E2' : 
                                     rec.impact === 'Medium' ? '#FEF3C7' : '#E0E7FF'
                    }
                  ]}>
                    <Text style={[
                      styles.impactText,
                      { 
                        color: rec.impact === 'High' ? '#DC2626' : 
                               rec.impact === 'Medium' ? '#D97706' : '#3730A3'
                      }
                    ]}>
                      {rec.impact} Impact
                    </Text>
                  </View>
                  <Text style={styles.timeframe}>{rec.timeframe}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'overview', label: 'Overview', icon: 'dashboard' },
        { key: 'accounts', label: 'Accounts', icon: 'account-balance' },
        { key: 'history', label: 'History', icon: 'trending-up' },
        { key: 'alerts', label: 'Alerts', icon: 'notifications' },
        { key: 'tips', label: 'Tips', icon: 'lightbulb' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            activeSection === tab.key && styles.activeTabItem
          ]}
          onPress={() => setActiveSection(tab.key)}
        >
          <MaterialIcons 
            name={tab.icon} 
            size={20} 
            color={activeSection === tab.key ? '#8B5CF6' : '#6B7280'} 
          />
          <Text style={[
            styles.tabLabel,
            activeSection === tab.key && styles.activeTabLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      case 'accounts':
        return renderAccountsSection();
      case 'history':
        return renderHistorySection();
      case 'alerts':
        return renderAlertsSection();
      case 'tips':
        return renderRecommendationsSection();
      default:
        return renderOverviewSection();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Full Credit Report</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <MaterialIcons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#9CA3AF" : "#374151"} 
          />
        </TouchableOpacity>
      </View>

      {/* Report Info */}
      <View style={styles.reportInfo}>
        <Text style={styles.reportDate}>
          Report Date: {creditReportData.personalInfo.reportDate}
        </Text>
        <Text style={styles.reportNumber}>
          Report #: {creditReportData.personalInfo.reportNumber}
        </Text>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        visible={showAlertModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertModalHeader}>
              <MaterialIcons 
                name={
                  selectedAlert?.severity === 'warning' ? 'warning' : 
                  selectedAlert?.type === 'positive' ? 'check-circle' : 'info'
                } 
                size={30} 
                color={
                  selectedAlert?.severity === 'warning' ? '#F59E0B' :
                  selectedAlert?.type === 'positive' ? '#10B981' : '#3B82F6'
                } 
              />
              <TouchableOpacity onPress={() => setShowAlertModal(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.alertModalTitle}>{selectedAlert?.title}</Text>
            <Text style={styles.alertModalMessage}>{selectedAlert?.message}</Text>
            <Text style={styles.alertModalDate}>Date: {selectedAlert?.date}</Text>
            
            <TouchableOpacity 
              style={styles.alertModalButton}
              onPress={() => setShowAlertModal(false)}
            >
              <Text style={styles.alertModalButtonText}>Got it</Text>
            </TouchableOpacity>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  reportInfo: {
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reportNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  activeTabItem: {
    backgroundColor: '#F3F0FF',
  },
  tabLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Score Overview Styles
  scoreOverview: {
    alignItems: 'center',
  },
  currentScoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scoreRange: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreChange: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  scoreGauge: {
    width: '100%',
    alignItems: 'center',
  },
  gaugeBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  gaugeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Factor Card Styles
  factorCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  factorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  factorStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  factorProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  factorWeight: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  factorDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Alert Card Styles
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 18,
  },
  alertDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Account Card Styles
  accountCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  accountType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  accountInstitution: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  accountStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  accountNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  accountDetails: {
    gap: 8,
  },
  accountDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  accountDetailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Chart Styles
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginVertical: 16,
  },
  chartYAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
    minHeight: 10,
    marginBottom: 8,
  },
  chartXLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  chartScoreLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Inquiry Card Styles
  inquiryCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inquiryContent: {
    flex: 1,
    marginLeft: 12,
  },
  inquiryType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  inquiryInstitution: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  inquiryDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  inquiryPurpose: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 32,
  },

  // Recommendation Card Styles
  recommendationCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationContent: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeframe: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  alertModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertModalMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  alertModalDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  alertModalButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreditReportScreen;