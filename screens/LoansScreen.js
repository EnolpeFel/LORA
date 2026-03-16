import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LoanStore, { getCreditTier, fmtCurrency } from './Loanstore.js';

const { width } = Dimensions.get('window');

// ─── Loans Screen ────────────────────────────────────────────────────────────
const LoansScreen = ({ navigation, route }) => {
  const { darkMode = false } = route.params || {};
  const d = darkMode;

  // ── Reactive LoanStore subscription ──────────────────────────────────────
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    LoanStore.subscribe(listener);
    return () => LoanStore.unsubscribe(listener);
  }, []);

  // Live data from store
  const activeLoan   = LoanStore.getActiveLoan();
  const loanHistory  = LoanStore.getLoanHistory(); // Completed + Failed
  const allLoans     = LoanStore.getAllLoans();     // Active + history
  const allStoreTxns = LoanStore.getTransactions();

  const C = {
    bg: d ? '#0A0F1E' : '#F8FAFC',
    card: d ? '#1A1F2E' : '#FFFFFF',
    cardAlt: d ? '#1F2535' : '#F8FAFC',
    border: d ? '#2D3345' : '#E2E8F0',
    text: d ? '#F1F5F9' : '#0F172A',
    subtext: d ? '#94A3B8' : '#475569',
    faint: d ? '#262B3C' : '#F1F5F9',
    purple: '#FB923C',
    purpleLight: d ? '#431407' : '#FFF7ED',
    purpleMid: d ? '#5C1A0A' : '#FFEDD5',
    green: '#10B981',
    greenLight: d ? '#064E3B' : '#D1FAE5',
    amber: '#F59E0B',
    amberLight: d ? '#78350F' : '#FEF3C7',
    red: '#EF4444',
    redLight: d ? '#7F1D1D' : '#FEE2E2',
    redText: d ? '#FCA5A5' : '#B91C1C',
    blue: '#3B82F6',
    blueLight: d ? '#431407' : '#DBEAFE',
    shadow: d ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)',
  };

  // Normalise all loans for display
  const normLoans = allLoans.map(l => ({
    ...l,
    nextDueDate:      l.nextDueDate || '—',
    remainingBalance: l.remainingBalance ?? 0,
    monthlyPayment:   l.monthlyPayment   ?? 0,
    paymentsCompleted:l.paymentsCompleted ?? 0,
    paymentsTotal:    l.term             ?? 0,
    progress: l.term > 0 ? Math.round((l.paymentsCompleted / l.term) * 100) : 0,
  }));

  const stats = {
    total:        normLoans.length,
    active:       normLoans.filter(l => l.status === 'Active').length,
    completed:    normLoans.filter(l => l.status === 'Completed').length,
    failed:       normLoans.filter(l => l.status === 'Failed').length,
    outstanding:  normLoans.filter(l => l.status === 'Active').reduce((s, l) => s + l.remainingBalance, 0),
    totalBorrowed:normLoans.filter(l => l.status !== 'Failed').reduce((s, l) => s + l.amount, 0),
    nextDue:      normLoans.filter(l => l.status === 'Active').sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0]?.nextDueDate,
  };

  // Navigate to the right detail screen depending on loan status
  const navigateToLoan = (loan) => {
    if (loan.status === 'Active') {
      navigation.navigate('CurrentLoan');
    } else if (loan.status === 'Failed') {
      navigation.navigate('MyLoan', { loanId: loan.id });
    } else {
      navigation.navigate('LoanDetail', { loanId: loan.id, darkMode: d });
    }
  };

  const [filter, setFilter] = useState('all');

  const filteredLoans = normLoans.filter(loan => {
    if (filter === 'active')    return loan.status === 'Active';
    if (filter === 'failed')    return loan.status === 'Failed';
    if (filter === 'completed') return loan.status === 'Completed';
    return true;
  });

  const getTransactionCount = (loanId) =>
    allStoreTxns.filter(t => t.loanId === loanId).length;

  const navigateToTransactions = (loanId) => {
    const loanTransactions = allStoreTxns.filter(t => t.loanId === loanId);
    const loan = allLoans.find(l => l.id === loanId);
    navigation.navigate('Transactions', {
      transactions: loanTransactions,
      loanId,
      loanType: loan?.type,
      darkMode: d,
    });
  };

  const formatCurrency = (amount) =>
    Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatCompactCurrency = (amount) => {
    if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `₱${(amount / 1000).toFixed(0)}k`;
    return `₱${amount}`;
  };

  const getLoanIcon = (type) => {
    if (!type) return 'person-outline';
    if (type.toLowerCase().includes('home'))      return 'home-outline';
    if (type.toLowerCase().includes('emergency')) return 'flash-outline';
    if (type.toLowerCase().includes('business'))  return 'briefcase-outline';
    if (type.toLowerCase().includes('bonus'))     return 'gift-outline';
    return 'person-outline';
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={d ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View>
          <Text style={[s.headerTitle, { color: C.text }]}>My Loans</Text>
          <Text style={[s.headerSub, { color: C.subtext }]}>
            {stats.active} active · {formatCompactCurrency(stats.outstanding)} outstanding{stats.nextDue ? ` · Due ${stats.nextDue}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.headerAddBtn, { backgroundColor: C.purpleLight }]}
          onPress={() => navigation.navigate('LoanApplication')}
        >
          <Ionicons name="add" size={20} color={C.purple} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats Cards */}
        <View style={s.statsRow}>
          {[
            { label: 'Total',       value: stats.total,       color: C.text,   dot: null    },
            { label: 'Active',      value: stats.active,      color: C.green,  dot: C.green },
            { label: 'Completed',   value: stats.completed,   color: '#3B82F6',dot: '#3B82F6'},
            { label: 'Declined',    value: stats.failed,      color: C.red,    dot: C.red   },
          ].map((item, i) => (
            <View key={i} style={[s.statCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              {item.dot && (
                <View style={[s.statDot, { backgroundColor: item.dot }]} />
              )}
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.statLabel, { color: C.subtext }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter Tabs */}
        <View style={[s.filterWrap, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { key: 'all',       label: `All (${stats.total})`         },
            { key: 'active',    label: `Active (${stats.active})`      },
            { key: 'completed', label: `Done (${stats.completed})`     },
            { key: 'failed',    label: `Failed (${stats.failed})`      },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.filterTab, filter === tab.key ? {
                backgroundColor: tab.key === 'failed' ? C.red : tab.key === 'completed' ? '#3B82F6' : C.purple,
              } : null]}
              onPress={() => setFilter(tab.key)}
            >
              <Text style={[s.filterText, { color: filter === tab.key ? '#fff' : C.subtext, fontSize: 10 }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loan Cards */}
        <View style={s.list}>
          {filteredLoans.length === 0 ? (
            <View style={[s.empty, { backgroundColor: C.card }]}>
              <Ionicons name="document-text-outline" size={48} color={C.subtext} />
              <Text style={[s.emptyTitle, { color: C.text }]}>No loans found</Text>
              <Text style={[s.emptySub, { color: C.subtext }]}>
                {filter === 'active'    ? 'No active loans right now' :
                 filter === 'failed'    ? 'No declined applications' :
                 filter === 'completed' ? 'No completed loans yet' :
                 "You haven't taken any loans yet"}
              </Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: C.purple }]}
                onPress={() => navigation.navigate('LoanApplication')}
              >
                <Text style={s.emptyBtnText}>Apply for a Loan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredLoans.map(loan => {
              const txnCount = getTransactionCount(loan.id);
              const isActive    = loan.status === 'Active';
              const isFailed    = loan.status === 'Failed';
              const isCompleted = loan.status === 'Completed';
              return (
                <TouchableOpacity
                  key={loan.id}
                  style={[s.card, { backgroundColor: C.card, shadowColor: C.shadow },
                    isFailed ? { borderWidth: 1, borderColor: C.redLight } : null,
                    isCompleted ? { borderWidth: 1, borderColor: '#DBEAFE' } : null,
                  ]}
                  onPress={() => navigateToLoan(loan)}
                  activeOpacity={0.75}
                >
                  {/* Card Top Row */}
                  <View style={s.cardTop}>
                    <View style={[s.loanIconWrap, {
                      backgroundColor: isFailed ? C.redLight : isActive ? C.purpleLight : isCompleted ? '#DBEAFE' : C.faint
                    }]}>
                      <Ionicons
                        name={isFailed ? 'close-circle-outline' : isCompleted ? 'checkmark-circle-outline' : getLoanIcon(loan.type)}
                        size={18}
                        color={isFailed ? C.red : isActive ? C.purple : isCompleted ? '#3B82F6' : C.subtext}
                      />
                    </View>
                    <View style={s.cardTopMid}>
                      <Text style={[s.loanId, { color: C.subtext }]}>{loan.id}</Text>
                      <Text style={[s.loanType, { color: C.text }]}>{loan.type}</Text>
                    </View>
                    <View style={[s.statusBadge, {
                      backgroundColor: isFailed ? C.redLight : isActive ? C.greenLight : isCompleted ? '#DBEAFE' : C.faint
                    }]}>
                      <View style={[s.statusDot, {
                        backgroundColor: isFailed ? C.red : isActive ? C.green : isCompleted ? '#3B82F6' : C.subtext
                      }]} />
                      <Text style={[s.statusText, {
                        color: isFailed ? C.red : isActive ? C.green : isCompleted ? '#1E40AF' : C.subtext
                      }]}>
                        {loan.status}
                      </Text>
                    </View>
                  </View>

                  {/* Loan Amount & Lender */}
                  <View style={s.amountRow}>
                    <Text style={[s.loanAmount, { color: isFailed ? C.subtext : C.text }]}>
                      ₱{formatCurrency(loan.amount)}
                    </Text>
                    <Text style={[s.lenderName, { color: C.subtext }]}>{loan.lender}</Text>
                  </View>

                  {/* Purpose tag */}
                  {loan.purpose ? (
                    <View style={[s.purposeTag, { backgroundColor: C.faint }]}>
                      <Text style={[s.purposeText, { color: C.subtext }]}>{loan.purpose}</Text>
                    </View>
                  ) : null}

                  {/* Failed reason banner */}
                  {isFailed && (
                    <View style={[s.failedBanner, { backgroundColor: C.redLight, borderColor: `${C.red}30` }]}>
                      <Ionicons name="alert-circle-outline" size={14} color={C.red} />
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={[s.failedBannerTitle, { color: C.red }]}>Application Declined</Text>
                        <Text style={[s.failedBannerReason, { color: C.redText }]} numberOfLines={2}>
                          {loan.failureReason || 'Application was declined.'}
                        </Text>
                      </View>
                      {loan.failureDate ? <Text style={[s.failedBannerDate, { color: C.subtext }]}>{loan.failureDate}</Text> : null}
                    </View>
                  )}

                  {/* Completed badge */}
                  {isCompleted && (
                    <View style={[s.failedBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#3B82F6" />
                      <View style={{ flex: 1, marginLeft: 6 }}>
                        <Text style={[s.failedBannerTitle, { color: '#1D4ED8' }]}>Fully Paid</Text>
                        <Text style={[s.failedBannerReason, { color: '#1E40AF' }]}>
                          {loan.paymentsCompleted} payments · {fmtCurrency(loan.paidAmount || 0)} total paid
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Meta Row */}
                  <View style={s.metaRow}>
                    <View style={s.metaItem}>
                      <MaterialIcons name="schedule" size={13} color={C.subtext} />
                      <Text style={[s.metaText, { color: C.subtext }]}>{loan.term} months</Text>
                    </View>
                    <View style={s.metaDot} />
                    <View style={s.metaItem}>
                      <MaterialIcons name="percent" size={13} color={C.amber} />
                      <Text style={[s.metaText, { color: C.amber }]}>{loan.interestRate}% {loan.interestType}</Text>
                    </View>
                    <View style={s.metaDot} />
                    <View style={s.metaItem}>
                      <Ionicons name="receipt-outline" size={13} color={C.subtext} />
                      <Text style={[s.metaText, { color: C.subtext }]}>{txnCount} txns</Text>
                    </View>
                  </View>

                  {/* Progress Bar (active only) */}
                  {isActive && (
                    <View style={s.progressWrap}>
                      <View style={s.progressLabelRow}>
                        <Text style={[s.progressLabel, { color: C.subtext }]}>
                          {loan.paymentsCompleted}/{loan.paymentsTotal} payments
                        </Text>
                        <Text style={[s.progressPct, { color: C.purple }]}>{loan.progress}%</Text>
                      </View>
                      <View style={[s.progressBg, { backgroundColor: C.faint }]}>
                        <View style={[s.progressFill, { width: `${loan.progress}%`, backgroundColor: C.purple }]} />
                      </View>
                    </View>
                  )}

                  {/* Completed progress bar */}
                  {isCompleted && (
                    <View style={s.progressWrap}>
                      <View style={s.progressLabelRow}>
                        <Text style={[s.progressLabel, { color: C.subtext }]}>
                          {loan.paymentsCompleted}/{loan.term} payments
                        </Text>
                        <Text style={[s.progressPct, { color: '#3B82F6' }]}>100% ✓</Text>
                      </View>
                      <View style={[s.progressBg, { backgroundColor: C.faint }]}>
                        <View style={[s.progressFill, { width: '100%', backgroundColor: '#3B82F6' }]} />
                      </View>
                    </View>
                  )}

                  {/* Financials Grid — active or completed only */}
                  {!isFailed && (
                    <View style={[s.grid, { backgroundColor: d ? C.faint : '#F8FAFC' }]}>
                      <View style={s.gridCol}>
                        <Text style={[s.gridLabel, { color: C.subtext }]}>Balance</Text>
                        <Text style={[s.gridVal, { color: isActive ? C.purple : isCompleted ? C.green : C.subtext }]}>
                          {isCompleted ? 'Fully Paid' : `₱${formatCurrency(loan.remainingBalance)}`}
                        </Text>
                      </View>
                      <View style={[s.gridDivider, { backgroundColor: C.border }]} />
                      <View style={s.gridCol}>
                        <Text style={[s.gridLabel, { color: C.subtext }]}>Monthly</Text>
                        <Text style={[s.gridVal, { color: C.text }]}>₱{formatCurrency(loan.monthlyPayment)}</Text>
                      </View>
                      <View style={[s.gridDivider, { backgroundColor: C.border }]} />
                      <View style={s.gridCol}>
                        <Text style={[s.gridLabel, { color: C.subtext }]}>{isCompleted ? 'End Date' : 'Next Due'}</Text>
                        <Text style={[s.gridVal, { color: isCompleted ? C.green : C.amber }]}>
                          {isCompleted ? (loan.loanEndDate || '—') : loan.nextDueDate}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={s.actions}>
                    {!isFailed && (
                      <TouchableOpacity
                        style={[s.btnOutline, { borderColor: C.border }]}
                        onPress={() => navigateToTransactions(loan.id)}
                      >
                        <Ionicons name="receipt-outline" size={14} color={C.subtext} />
                        <Text style={[s.btnOutlineText, { color: C.subtext }]}>History ({txnCount})</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[s.btnOutline, { borderColor: isFailed ? C.red : isCompleted ? '#3B82F6' : C.purple }]}
                      onPress={() => navigateToLoan(loan)}
                    >
                      <Ionicons name="document-text-outline" size={14} color={isFailed ? C.red : isCompleted ? '#3B82F6' : C.purple} />
                      <Text style={[s.btnOutlineText, { color: isFailed ? C.red : isCompleted ? '#3B82F6' : C.purple }]}>View Details</Text>
                    </TouchableOpacity>
                    {isActive && (
                      <TouchableOpacity
                        style={[s.btnPrimary, { backgroundColor: C.purple }]}
                        onPress={() => navigation.navigate('CurrentLoan')}
                      >
                        <Ionicons name="card-outline" size={14} color="#fff" />
                        <Text style={s.btnPrimaryText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
                    {isFailed && (
                      <TouchableOpacity
                        style={[s.btnPrimary, { backgroundColor: C.purple, flex: 1 }]}
                        onPress={() => navigation.navigate('LoanApplication')}
                      >
                        <Ionicons name="refresh-outline" size={14} color="#fff" />
                        <Text style={s.btnPrimaryText}>Re-apply</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Portfolio Summary */}
        <View style={[{ backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 10 }}>Portfolio Summary</Text>
          {[
            ['Total Applied',       `${stats.total} loan${stats.total !== 1 ? 's' : ''}`,               C.text   ],
            ['Total Borrowed',      `₱${formatCurrency(stats.totalBorrowed)}`,                          C.text   ],
            ['Total Outstanding',   `₱${formatCurrency(stats.outstanding)}`,                            C.purple ],
            ['Active Loans',        `${stats.active} loan${stats.active !== 1 ? 's' : ''}`,             C.green  ],
            ['Completed Loans',     `${stats.completed} loan${stats.completed !== 1 ? 's' : ''}`,       '#3B82F6'],
            ['Declined Applications',`${stats.failed} application${stats.failed !== 1 ? 's' : ''}`,    C.red    ],
          ].map(([k, v, c]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 13, color: C.subtext }}>{k}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: c }}>{v}</Text>
            </View>
          ))}
        </View>

        {/* View All Transactions */}
        <TouchableOpacity
          style={[s.allTxnBtn, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={() => navigation.navigate('Transactions', { darkMode: d })}
        >
          <View style={s.allTxnLeft}>
            <Ionicons name="receipt-outline" size={20} color={C.purple} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[s.allTxnTitle, { color: C.text }]}>All Transactions</Text>
              <Text style={[s.allTxnSub, { color: C.subtext }]}>{allStoreTxns.length} records across all loans</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.subtext} />
        </TouchableOpacity>

        {/* Apply CTA */}
        {!activeLoan && (
          <TouchableOpacity
            style={[s.cta, { backgroundColor: C.purpleLight, borderColor: C.purpleMid }]}
            onPress={() => navigation.navigate('LoanApplication')}
          >
            <View>
              <Text style={[s.ctaTitle, { color: C.purple }]}>Need more funds?</Text>
              <Text style={[s.ctaSub, { color: C.subtext }]}>Apply in minutes · Fast approval</Text>
            </View>
            <View style={[s.ctaArrow, { backgroundColor: C.purple }]}>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  headerAddBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 'auto' },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 10, alignItems: 'center',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2,
  },
  statDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '500', marginTop: 1 },

  filterWrap: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4, marginBottom: 16, borderWidth: 1 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterText: { fontWeight: '600' },

  list: { gap: 14, marginBottom: 16 },
  card: {
    borderRadius: 20, padding: 16,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  loanIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTopMid: { flex: 1 },
  loanId: { fontSize: 10, fontWeight: '500' },
  loanType: { fontSize: 15, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  loanAmount: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  lenderName: { fontSize: 13, fontWeight: '500' },

  purposeTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 12 },
  purposeText: { fontSize: 11, fontWeight: '500' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#CBD5E1' },

  progressWrap: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 11 },
  progressPct: { fontSize: 11, fontWeight: '700' },
  progressBg: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  grid: { flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 14, alignItems: 'center' },
  gridCol: { flex: 1, alignItems: 'center' },
  gridDivider: { width: 1, height: 28 },
  gridLabel: { fontSize: 10, fontWeight: '500', marginBottom: 3 },
  gridVal: { fontSize: 13, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: 8 },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12,
  },
  btnOutlineText: { fontSize: 12, fontWeight: '600' },
  btnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderRadius: 10, paddingVertical: 9,
  },
  btnPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  failedBanner:       { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1 },
  failedBannerTitle:  { fontSize: 12, fontWeight: '700', marginBottom: 1 },
  failedBannerReason: { fontSize: 11, lineHeight: 15 },
  failedBannerDate:   { fontSize: 10, marginLeft: 6, marginTop: 2 },

  empty: { borderRadius: 20, padding: 36, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  emptySub: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  allTxnBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 12,
  },
  allTxnLeft: { flexDirection: 'row', alignItems: 'center' },
  allTxnTitle: { fontSize: 14, fontWeight: '600' },
  allTxnSub: { fontSize: 11, marginTop: 1 },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 16, borderWidth: 1 },
  ctaTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  ctaSub: { fontSize: 12 },
  ctaArrow: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
});

export default LoansScreen;