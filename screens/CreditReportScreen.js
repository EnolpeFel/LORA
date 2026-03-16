import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// ─── Credit Score & Loan Tier System (RightApp Inc. — Lora App) ───────────────
const CREDIT_TIERS = [
  { min: 200, max: 299, maxLoan: 5000,  label: 'Starter', color: '#6B7280' },
  { min: 300, max: 399, maxLoan: 10000, label: 'Bronze',  color: '#F59E0B' },
  { min: 400, max: 499, maxLoan: 20000, label: 'Silver',  color: '#8B5CF6' },
  { min: 500, max: 850, maxLoan: 50000, label: 'Gold',    color: '#10B981' },
];
const getCreditTier = (score) =>
  CREDIT_TIERS.find(t => score >= t.min && score <= t.max) || CREDIT_TIERS[0];
const getPointsToNextTier = (score) => {
  const nextTier = CREDIT_TIERS.find(t => t.min > score);
  return nextTier ? nextTier.min - score : 0;
};

// ─── Lora App Credit Report Data ──────────────────────────────────────────────
const CREDIT_REPORT = {
  owner: 'Juan dela Cruz',
  generatedDate: 'March 10, 2026',
  score: 560,
  scoreMax: 850,
  scoreRating: 'Gold',
  scoreColor: '#10B981',

  summary: {
    totalLoans: 4,
    activeLoans: 1,
    completedLoans: 3,
    totalBorrowed: 275000,
    totalRepaid: 245000,
    outstandingBalance: 30000,
    onTimePayments: 96,
    missedPayments: 1,
    memberSince: 'January 2024',
  },

  accounts: [
    {
      id: 1, name: 'Lora Personal Loan', type: 'Personal Loan',
      icon: 'account-balance', color: '#F97316', status: 'Open',
      balance: 30000, limit: 50000, utilization: 60,
      paymentStatus: 'Current', openedDate: 'January 2026',
    },
    {
      id: 2, name: 'Lora Emergency Loan', type: 'Emergency Loan',
      icon: 'local-hospital', color: '#EF4444', status: 'Closed',
      balance: 0, limit: 0, utilization: 0,
      paymentStatus: 'Fully Paid', openedDate: 'September 2025',
    },
    {
      id: 3, name: 'Lora Business Loan', type: 'Business Loan',
      icon: 'store', color: '#3B82F6', status: 'Closed',
      balance: 0, limit: 0, utilization: 0,
      paymentStatus: 'Fully Paid', openedDate: 'May 2025',
    },
    {
      id: 4, name: 'Lora Salary Loan', type: 'Salary Loan',
      icon: 'payments', color: '#8B5CF6', status: 'Closed',
      balance: 0, limit: 0, utilization: 0,
      paymentStatus: 'Fully Paid', openedDate: 'January 2024',
    },
  ],

  factors: [
    { label: 'Loan Repayment History', impact: 'High',   value: 96,  trend: 'up',      color: '#10B981' },
    { label: 'Loan Utilization',        impact: 'High',   value: 60,  trend: 'down',    color: '#F59E0B' },
    { label: 'Account Tenure',          impact: 'Medium', value: 68,  trend: 'up',      color: '#3B82F6' },
    { label: 'Transaction Activity',    impact: 'Medium', value: 85,  trend: 'up',      color: '#8B5CF6' },
    { label: 'Profile Completeness',    impact: 'Low',    value: 100, trend: 'neutral', color: '#6B7280' },
  ],

  scoreHistory: [
    { label: 'Account Created',       score: 200, tier: 'Starter', note: 'Baseline on verification' },
    { label: 'First Cash-In',         score: 205, tier: 'Starter', note: '+5 pts · ₱1,000 cash-in' },
    { label: 'Salary Loan Repaid ×3', score: 265, tier: 'Starter', note: '+60 pts · 3 payments' },
    { label: 'Bronze Tier Reached',   score: 300, tier: 'Bronze',  note: '+35 pts · 5th repayment' },
    { label: 'Business Loan Repaid',  score: 400, tier: 'Silver',  note: '+100 pts · fully paid' },
    { label: 'Emergency Loan Paid',   score: 500, tier: 'Gold',    note: '+100 pts · tier up!' },
    { label: 'Current Score',         score: 560, tier: 'Gold',    note: '+60 pts · ongoing payments' },
  ],
};

// ─── Animated Score Bar ────────────────────────────────────────────────────────
const ScoreGauge = ({ score, max, color }) => {
  const animWidth = useRef(new Animated.Value(0)).current;
  const pct = Math.round((score / max) * 100);

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: pct,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  const widthInterp = animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={gS.wrapper}>
      <View style={gS.barBg}>
        <Animated.View style={[gS.barFill, { width: widthInterp, backgroundColor: color }]} />
      </View>
      <View style={gS.labels}>
        <Text style={gS.minLabel}>200</Text>
        <Text style={[gS.pctLabel, { color }]}>{pct}% of max</Text>
        <Text style={gS.maxLabel}>{max}</Text>
      </View>
    </View>
  );
};
const gS = StyleSheet.create({
  wrapper:   { width: '100%', marginTop: 8 },
  barBg:     { height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 6 },
  labels:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  minLabel:  { fontSize: 11, color: '#9CA3AF' },
  maxLabel:  { fontSize: 11, color: '#9CA3AF' },
  pctLabel:  { fontSize: 12, fontWeight: '700' },
});

// ─── Collapsible Section ───────────────────────────────────────────────────────
const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={s.sectionCard}>
      <TouchableOpacity style={s.sectionHeader} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <View style={s.sectionHeaderLeft}>
          {icon && <MaterialIcons name={icon} size={16} color="#8B5CF6" style={{ marginRight: 7 }} />}
          <Text style={s.sectionTitle}>{title}</Text>
        </View>
        <MaterialIcons name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={22} color="#9CA3AF" />
      </TouchableOpacity>
      {open && children}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CreditReportScreen = ({ navigation }) => {
  const [expandedAccount, setExpandedAccount] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const report = CREDIT_REPORT;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const formatCurrency = (val) =>
    val.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 });

  const getTrendIcon = (trend) =>
    trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'trending-flat';

  const getTrendColor = (trend, label) => {
    if (label === 'Loan Utilization')
      return trend === 'down' ? '#10B981' : trend === 'up' ? '#EF4444' : '#6B7280';
    return trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
  };

  const impactColor = (impact) =>
    impact === 'High' ? '#EF4444' : impact === 'Medium' ? '#F59E0B' : '#10B981';

  const tier = getCreditTier(report.score);
  const ptsToNext = getPointsToNextTier(report.score);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Credit Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Score Card ── */}
        <Animated.View style={[s.scoreCard, { opacity: fadeAnim }]}>
          <View style={s.scoreTop}>
            <View>
              <Text style={s.scoreOwner}>{report.owner}</Text>
              <Text style={s.scoreDate}>Generated: {report.generatedDate}</Text>
            </View>
            <View style={[s.ratingBadge, { backgroundColor: tier.color + '18', borderColor: tier.color + '50', borderWidth: 1 }]}>
              <MaterialIcons name="star" size={13} color={tier.color} />
              <Text style={[s.ratingText, { color: tier.color }]}>{report.scoreRating}</Text>
            </View>
          </View>

          <View style={s.scoreDisplay}>
            <Text style={[s.scoreNumber, { color: tier.color }]}>{report.score}</Text>
            <Text style={s.scoreMax}>/ {report.scoreMax}</Text>
          </View>

          <ScoreGauge score={report.score} max={report.scoreMax} color={tier.color} />

          <View style={s.tierRow}>
            <View style={[s.tierChip, { backgroundColor: tier.color + '12', borderColor: tier.color + '35', borderWidth: 1 }]}>
              <Text style={s.tierChipLbl}>Tier</Text>
              <Text style={[s.tierChipVal, { color: tier.color }]}>{tier.label}</Text>
            </View>
            <View style={[s.tierChip, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1 }]}>
              <Text style={s.tierChipLbl}>Max Loan</Text>
              <Text style={[s.tierChipVal, { color: '#10B981' }]}>₱{tier.maxLoan.toLocaleString()}</Text>
            </View>
            {ptsToNext > 0 && (
              <View style={[s.tierChip, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderWidth: 1 }]}>
                <Text style={s.tierChipLbl}>Next Tier</Text>
                <Text style={[s.tierChipVal, { color: '#F97316' }]}>-{ptsToNext} pts</Text>
              </View>
            )}
          </View>

          <View style={[s.descBox, { backgroundColor: tier.color + '08' }]}>
            <MaterialIcons name="info-outline" size={14} color={tier.color} />
            <Text style={s.descTxt}>
              You're in the <Text style={{ color: tier.color, fontWeight: '700' }}>{tier.label}</Text> tier.
              Keep repaying loans on time to unlock higher loan limits.
            </Text>
          </View>
        </Animated.View>

        {/* ── Loan Summary ── */}
        <Section title="Loan Summary" icon="assessment">
          <View style={s.summaryGrid}>
            {[
              { label: 'Total Loans',     value: report.summary.totalLoans,                         icon: 'folder',                 color: '#3B82F6' },
              { label: 'Active Loans',    value: report.summary.activeLoans,                         icon: 'lock-open',              color: '#10B981' },
              { label: 'On-Time Rate',    value: `${report.summary.onTimePayments}%`,                icon: 'check-circle',           color: '#10B981' },
              { label: 'Missed',          value: report.summary.missedPayments,                      icon: 'cancel',                 color: '#EF4444' },
              { label: 'Total Borrowed',  value: formatCurrency(report.summary.totalBorrowed),       icon: 'account-balance-wallet', color: '#F59E0B' },
              { label: 'Outstanding',     value: formatCurrency(report.summary.outstandingBalance),  icon: 'donut-large',            color: '#8B5CF6' },
            ].map((item, idx) => (
              <View key={idx} style={s.summaryCell}>
                <View style={[s.summaryCellIcon, { backgroundColor: item.color + '15' }]}>
                  <MaterialIcons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={s.summaryCellValue}>{item.value}</Text>
                <Text style={s.summaryCellLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ── Score Factors ── */}
        <Section title="Score Factors" icon="tune">
          {report.factors.map((factor, idx) => (
            <View key={idx} style={[s.factorRow, idx < report.factors.length - 1 && s.factorBorder]}>
              <View style={s.factorTop}>
                <View>
                  <Text style={s.factorLabel}>{factor.label}</Text>
                  <View style={s.factorImpactRow}>
                    <View style={[s.impactDot, { backgroundColor: impactColor(factor.impact) }]} />
                    <Text style={s.factorImpact}>{factor.impact} Impact</Text>
                  </View>
                </View>
                <View style={s.factorRight}>
                  <Text style={[s.factorValue, { color: factor.color }]}>{factor.value}%</Text>
                  <MaterialIcons name={getTrendIcon(factor.trend)} size={16} color={getTrendColor(factor.trend, factor.label)} />
                </View>
              </View>
              <View style={s.factorBarBg}>
                <View style={[s.factorBarFill, { width: `${factor.value}%`, backgroundColor: factor.color }]} />
              </View>
            </View>
          ))}
        </Section>

        {/* ── Accounts ── */}
        <Section title="Lora Loan Accounts" icon="account-balance">
          {report.accounts.map((acc) => {
            const isExpanded = expandedAccount === acc.id;
            const isOpen = acc.status === 'Open';
            return (
              <TouchableOpacity
                key={acc.id}
                style={[
                  s.accountCard,
                  !isOpen && s.accountCardClosed,
                  isOpen && { borderColor: acc.color + '50' },
                  isExpanded && { borderColor: acc.color, borderWidth: 2 },
                ]}
                onPress={() => setExpandedAccount(isExpanded ? null : acc.id)}
                activeOpacity={0.8}
              >
                <View style={s.accountHeader}>
                  <View style={[s.accountIconBox, { backgroundColor: acc.color + '15' }]}>
                    <MaterialIcons name={acc.icon} size={22} color={acc.color} />
                  </View>
                  <View style={s.accountInfo}>
                    <Text style={s.accountName}>{acc.name}</Text>
                    <Text style={s.accountType}>{acc.type}</Text>
                  </View>
                  <View style={s.accountRight}>
                    <View style={[s.statusBadge, { backgroundColor: isOpen ? '#D1FAE5' : '#F3F4F6' }]}>
                      <View style={[s.statusDot, { backgroundColor: isOpen ? '#10B981' : '#9CA3AF' }]} />
                      <Text style={[s.statusText, { color: isOpen ? '#065F46' : '#6B7280' }]}>{acc.status}</Text>
                    </View>
                    <MaterialIcons name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#9CA3AF" />
                  </View>
                </View>

                {isExpanded && (
                  <View style={s.accountDetails}>
                    {[
                      ['Payment Status', acc.paymentStatus,
                        acc.paymentStatus === 'Current' ? '#10B981'
                        : acc.paymentStatus === 'Fully Paid' ? '#8B5CF6'
                        : acc.paymentStatus.includes('Late') ? '#EF4444' : '#1F2937'],
                      ['Opened', acc.openedDate, '#1F2937'],
                    ].map(([k, v, c]) => (
                      <View key={k} style={s.detailRow}>
                        <Text style={s.detailKey}>{k}</Text>
                        <Text style={[s.detailValue, { color: c }]}>{v}</Text>
                      </View>
                    ))}
                    {isOpen && (
                      <>
                        {[
                          ['Balance', formatCurrency(acc.balance)],
                          ['Loan Limit', formatCurrency(acc.limit)],
                        ].map(([k, v]) => (
                          <View key={k} style={s.detailRow}>
                            <Text style={s.detailKey}>{k}</Text>
                            <Text style={s.detailValue}>{v}</Text>
                          </View>
                        ))}
                        <View style={s.detailRow}>
                          <Text style={s.detailKey}>Utilization</Text>
                          <Text style={[s.detailValue, { fontWeight: '700',
                            color: acc.utilization > 50 ? '#EF4444' : acc.utilization > 30 ? '#F59E0B' : '#10B981'
                          }]}>{acc.utilization}%</Text>
                        </View>
                        <View style={s.utilizationBarBg}>
                          <View style={[s.utilizationBarFill, {
                            width: `${acc.utilization}%`,
                            backgroundColor: acc.utilization > 50 ? '#EF4444' : acc.utilization > 30 ? '#F59E0B' : '#10B981',
                          }]} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>0% (No debt)</Text>
                          <Text style={{ fontSize: 10, color: '#9CA3AF' }}>100% (Maxed)</Text>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Section>

        {/* ── Score Journey ── */}
        <Section title="Score Journey" icon="timeline">
          {report.scoreHistory.map((entry, idx) => {
            const entryTier = CREDIT_TIERS.find(t => t.label === entry.tier) || CREDIT_TIERS[0];
            const isLast = idx === report.scoreHistory.length - 1;
            return (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: isLast ? 0 : 14 }}>
                <View style={{ alignItems: 'center', marginRight: 12 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: entryTier.color + '20',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 2, borderColor: entryTier.color,
                  }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: entryTier.color }}>{entry.score}</Text>
                  </View>
                  {!isLast && <View style={{ width: 2, height: 22, backgroundColor: '#E5E7EB', marginTop: 3 }} />}
                </View>
                <View style={{ flex: 1, paddingTop: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937' }}>{entry.label}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{entry.note}</Text>
                  <View style={{ marginTop: 4 }}>
                    <View style={{ backgroundColor: entryTier.color + '15', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: entryTier.color }}>{entryTier.label}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </Section>

        {/* ── Tips ── */}
        <Section title="💡 Tips to Improve Your Lora Score" defaultOpen={true}>
          <View style={{ backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FDE68A' }}>
            {[
              { tip: 'Repay loans on time to earn +20 pts per payment',           icon: 'check-circle',           color: '#10B981' },
              { tip: 'Cash in at least ₱1,000 to earn +5 pts per transaction',    icon: 'account-balance-wallet', color: '#3B82F6' },
              { tip: 'Complete 5 loan repayments to advance one tier',             icon: 'trending-up',            color: '#8B5CF6' },
              { tip: 'Verify your email, ID, and mobile for bonus points',         icon: 'verified-user',          color: '#F59E0B' },
              { tip: 'Keep your profile 100% complete for the best rates',         icon: 'person',                 color: '#F97316' },
            ].map((item, i) => (
              <View key={i} style={s.tipRow}>
                <View style={[s.tipIcon, { backgroundColor: item.color + '15' }]}>
                  <MaterialIcons name={item.icon} size={14} color={item.color} />
                </View>
                <Text style={s.tipText}>{item.tip}</Text>
              </View>
            ))}
          </View>
        </Section>

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8F9FA' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn:      { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content:      { padding: 16, paddingBottom: 40 },

  scoreCard:    { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  scoreTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  scoreOwner:   { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  scoreDate:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  ratingBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  ratingText:   { fontSize: 13, fontWeight: '700' },
  scoreDisplay: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  scoreNumber:  { fontSize: 56, fontWeight: '900', lineHeight: 64 },
  scoreMax:     { fontSize: 18, color: '#9CA3AF', marginBottom: 10 },
  tierRow:      { flexDirection: 'row', gap: 8, marginTop: 12 },
  tierChip:     { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  tierChipLbl:  { fontSize: 10, color: '#6B7280', marginBottom: 2 },
  tierChipVal:  { fontSize: 14, fontWeight: '800' },
  descBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 10, padding: 10, marginTop: 12 },
  descTxt:      { fontSize: 12, color: '#6B7280', lineHeight: 18, flex: 1 },

  sectionCard:       { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  sectionHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle:      { fontSize: 15, fontWeight: '700', color: '#1F2937' },

  summaryGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCell:      { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, alignItems: 'center', width: '30.5%' },
  summaryCellIcon:  { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  summaryCellValue: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  summaryCellLabel: { fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 2 },

  factorRow:       { paddingVertical: 12 },
  factorBorder:    { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  factorTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  factorLabel:     { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 3 },
  factorImpactRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  impactDot:       { width: 6, height: 6, borderRadius: 3 },
  factorImpact:    { fontSize: 11, color: '#9CA3AF' },
  factorRight:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  factorValue:     { fontSize: 13, fontWeight: '700' },
  factorBarBg:     { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  factorBarFill:   { height: '100%', borderRadius: 3 },

  accountCard:        { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  accountCardClosed:  { opacity: 0.75, borderStyle: 'dashed' },
  accountHeader:      { flexDirection: 'row', alignItems: 'center' },
  accountIconBox:     { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  accountInfo:        { flex: 1, marginLeft: 12 },
  accountName:        { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  accountType:        { fontSize: 12, color: '#6B7280' },
  accountRight:       { alignItems: 'flex-end', gap: 4 },
  statusBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusDot:          { width: 6, height: 6, borderRadius: 3 },
  statusText:         { fontSize: 11, fontWeight: '600' },
  accountDetails:     { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  detailKey:          { fontSize: 13, color: '#6B7280' },
  detailValue:        { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  utilizationBarBg:   { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  utilizationBarFill: { height: '100%', borderRadius: 3 },

  tipRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tipIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  tipText: { fontSize: 13, color: '#78350F', flex: 1, lineHeight: 19 },
});

export default CreditReportScreen;