import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LoanStore from './Loanstore.js';

/**
 * MyLoanScreen
 *
 * Shows ONLY failed loan applications (static + any new ones from the session).
 * Active loans live in CurrentLoanScreen.
 * Completed loans can be viewed via LoansScreen / LoanDetailScreen.
 *
 * This screen is reached by navigating to 'MyLoan' with { loanId: '...' }
 * where the loan must have status === 'Failed'.
 */
const MyLoanScreen = ({ route, navigation }) => {
  const { loanId } = route.params;

  // ── Reactive store subscription ──────────────────────────────────────────
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    LoanStore.subscribe(listener);
    return () => LoanStore.unsubscribe(listener);
  }, []);

  // Only look in failed loans
  const failedLoans = LoanStore.getFailedLoans();
  const rawLoan = failedLoans.find(l => l.id === loanId);

  // ── Not a failed loan — show redirect ────────────────────────────────────
  if (!rawLoan) {
    const activeLoan   = LoanStore.getActiveLoan();
    const isActive     = activeLoan?.id === loanId;
    const allLoans     = LoanStore.getAllLoans();
    const isCompleted  = allLoans.find(l => l.id === loanId && l.status === 'Completed');

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.fixedHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loan Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.redirectWrap}>
          <Ionicons
            name={isActive ? 'pulse-outline' : isCompleted ? 'checkmark-circle-outline' : 'document-text-outline'}
            size={56}
            color={isActive ? '#FB923C' : isCompleted ? '#10B981' : '#FFEDD5'}
          />
          <Text style={styles.redirectTitle}>
            {isActive ? 'Loan is Active' : isCompleted ? 'Loan Completed' : 'Loan Not Found'}
          </Text>
          <Text style={styles.redirectSub}>
            {isActive
              ? 'Active loans are managed in the Current Loan screen.'
              : isCompleted
              ? 'This loan has been fully paid. View details in Loan History.'
              : 'This declined application record does not exist.'}
          </Text>
          <TouchableOpacity
            style={styles.redirectBtn}
            onPress={() => {
              if (isActive) navigation.navigate('CurrentLoan');
              else if (isCompleted) navigation.navigate('Loans');
              else navigation.goBack();
            }}
          >
            <Text style={styles.redirectBtnTxt}>
              {isActive ? 'Go to Current Loan' : isCompleted ? 'View Loan History' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Normalise failed loan ─────────────────────────────────────────────────
  const loanDetails = {
    id:              rawLoan.id,
    type:            rawLoan.type,
    lender:          rawLoan.lender,
    amount:          rawLoan.amount,
    status:          rawLoan.status,
    interestRate:    rawLoan.interestRate,
    interestType:    rawLoan.interestType,
    term:            rawLoan.term,
    purpose:         rawLoan.purpose || '—',
    applicationDate: rawLoan.applicationDate,
    failureReason:   rawLoan.failureReason || 'Application was declined by the lender.',
    failureDate:     rawLoan.failureDate   || rawLoan.applicationDate || '—',
    processingFee:   rawLoan.processingFee ?? 0,
    collateral:      rawLoan.collateral    || 'None',
    monthlyIncome:   rawLoan.monthlyIncome || '—',
    creditScore:     rawLoan.creditScore,
    creditTier:      rawLoan.creditTier    || '—',
  };

  const fmt = (n) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Declined Application</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Loans')}>
          <MaterialIcons name="list" size={22} color="#FB923C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Loan ID + Status ── */}
        <View style={styles.loanIdRow}>
          <Text style={styles.loanIdText}>{loanDetails.id}</Text>
          <View style={styles.statusBadgeFailed}>
            <View style={styles.dotFailed} />
            <Text style={styles.statusTextFailed}>Declined</Text>
          </View>
        </View>

        {/* ── Failed Hero ── */}
        <View style={styles.failedHeroCard}>
          <View style={styles.failedHeroIcon}>
            <Ionicons name="close-circle-outline" size={40} color="#fff" />
          </View>
          <Text style={styles.failedHeroTitle}>Application Declined</Text>
          <Text style={styles.failedHeroAmount}>{fmt(loanDetails.amount)}</Text>
          <Text style={styles.failedHeroMeta}>
            {loanDetails.lender} · {loanDetails.type} · {loanDetails.term} months
          </Text>
          <View style={styles.failedDateRow}>
            <MaterialIcons name="event-busy" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.failedDateTxt}>Declined on {loanDetails.failureDate}</Text>
          </View>
        </View>

        {/* ── Reason Banner ── */}
        <View style={styles.failedReasonCard}>
          <View style={styles.failedReasonHeader}>
            <View style={styles.failedReasonIconBox}>
              <Ionicons name="alert-circle" size={20} color="#B91C1C" />
            </View>
            <Text style={styles.failedReasonTitle}>Reason for Decline</Text>
          </View>
          <Text style={styles.failedReasonText}>{loanDetails.failureReason}</Text>
        </View>

        {/* ── Application Details ── */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Application Details</Text>
          {[
            ['Loan Type',      loanDetails.type],
            ['Purpose',        loanDetails.purpose],
            ['Applied Amount', fmt(loanDetails.amount)],
            ['Lender',         loanDetails.lender],
            ['Interest Rate',  `${loanDetails.interestRate}% (${loanDetails.interestType})`],
            ['Term',           `${loanDetails.term} months`],
            ['Processing Fee', fmt(loanDetails.processingFee)],
            ['Collateral',     loanDetails.collateral],
            ['Applied On',     loanDetails.applicationDate],
            ['Declined On',    loanDetails.failureDate],
          ].map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailKey}>{k}</Text>
              <Text style={styles.detailValue}>{v}</Text>
            </View>
          ))}
        </View>

        {/* ── Credit Info ── */}
        {loanDetails.creditScore ? (
          <View style={styles.creditCard}>
            <View style={styles.creditHeader}>
              <MaterialIcons name="score" size={18} color="#FB923C" />
              <Text style={styles.creditTitle}>Credit Info at Time of Application</Text>
            </View>
            <View style={styles.creditRow}>
              <View style={styles.creditItem}>
                <Text style={styles.creditLabel}>Credit Score</Text>
                <Text style={styles.creditValue}>{loanDetails.creditScore}</Text>
              </View>
              <View style={styles.creditDivider} />
              <View style={styles.creditItem}>
                <Text style={styles.creditLabel}>Tier</Text>
                <Text style={styles.creditValue}>{loanDetails.creditTier}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Re-apply CTA ── */}
        <TouchableOpacity
          style={styles.reapplyButton}
          onPress={() => navigation.navigate('LoanApplication', { creditScore: loanDetails.creditScore })}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.reapplyButtonText}>Re-apply for a Loan</Text>
        </TouchableOpacity>

        {/* ── Tips ── */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialIcons name="lightbulb" size={16} color="#D97706" />
            <Text style={styles.tipsTitle}>How to improve your chances</Text>
          </View>
          {[
            'Provide complete and accurate income documentation.',
            'Improve your credit score before re-applying.',
            'Consider applying for a lower loan amount.',
            'Clear existing debts to lower your debt-to-income ratio.',
            'Make sure your monthly income is at least 3× the monthly payment.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* ── Check Credit Score ── */}
        <TouchableOpacity
          style={styles.creditScoreBtn}
          onPress={() => navigation.navigate('CreditReport')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="assessment" size={18} color="#FB923C" />
          <Text style={styles.creditScoreBtnTxt}>View Full Credit Report</Text>
          <MaterialIcons name="chevron-right" size={18} color="#FB923C" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F5F5' },
  fixedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5E5', elevation: 3, zIndex: 1000 },
  backButton:  { padding: 5, width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  content:     { padding: 16, paddingBottom: 40 },

  // Redirect state
  redirectWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  redirectTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  redirectSub:   { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  redirectBtn:   { backgroundColor: '#FB923C', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12, marginTop: 8 },
  redirectBtnTxt:{ color: 'white', fontWeight: '700', fontSize: 14 },

  // Loan ID row
  loanIdRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  loanIdText:        { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  statusBadgeFailed: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#FEE2E2' },
  dotFailed:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  statusTextFailed:  { fontSize: 12, fontWeight: '700', color: '#B91C1C' },

  // Failed hero
  failedHeroCard:   { backgroundColor: '#DC2626', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 14, shadowColor: '#DC2626', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
  failedHeroIcon:   { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  failedHeroTitle:  { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  failedHeroAmount: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 6 },
  failedHeroMeta:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 8, textAlign: 'center' },
  failedDateRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  failedDateTxt:    { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  // Reason card
  failedReasonCard:   { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#FECACA', shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  failedReasonHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  failedReasonIconBox:{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  failedReasonTitle:  { fontSize: 14, fontWeight: '700', color: '#B91C1C' },
  failedReasonText:   { fontSize: 13, color: '#7F1D1D', lineHeight: 20, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12 },

  // Detail card
  detailCard:  { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  sectionTitle:{ fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1.5, borderBottomColor: '#FB923C' },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailKey:   { fontSize: 13, color: '#6B7280', flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'right', flex: 1 },

  // Credit info
  creditCard:    { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#FFEDD5' },
  creditHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  creditTitle:   { fontSize: 13, fontWeight: '700', color: '#5B21B6' },
  creditRow:     { flexDirection: 'row', alignItems: 'center' },
  creditItem:    { flex: 1, alignItems: 'center', paddingVertical: 8 },
  creditDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  creditLabel:   { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  creditValue:   { fontSize: 18, fontWeight: '800', color: '#FB923C' },

  // Re-apply
  reapplyButton:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FB923C', paddingVertical: 16, borderRadius: 14, marginBottom: 14, shadowColor: '#FB923C', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  reapplyButtonText:{ color: 'white', fontSize: 16, fontWeight: '700' },

  // Tips
  tipsCard:   { backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  tipsTitle:  { fontSize: 13, fontWeight: '700', color: '#92400E' },
  tipRow:     { flexDirection: 'row', marginBottom: 6 },
  tipBullet:  { color: '#F59E0B', fontWeight: '800', marginRight: 8, fontSize: 14 },
  tipText:    { fontSize: 12, color: '#78350F', flex: 1, lineHeight: 18 },

  // Credit score button
  creditScoreBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FFEDD5' },
  creditScoreBtnTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FB923C' },
});

export default MyLoanScreen;