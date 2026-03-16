import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import LoanStore, { fmtCurrency, getCreditTier } from './Loanstore.js';

// ─── Billing Calculator ───────────────────────────────────────────────────────
const calcBilling = (loan) => {
  const base        = loan.monthlyPayment;
  const annualRate  = loan.interestRate / 100;
  const monthlyRate = annualRate / 12;
  const interest    = loan.remainingBalance * monthlyRate;
  const principal   = Math.max(0, base - interest);
  const dueDate     = new Date(loan.dueDate);
  const today       = new Date();
  const daysLate    = today > dueDate ? Math.floor((today - dueDate) / 86400000) : 0;
  const lateFees    = daysLate * 50;
  return { base, principal, interest, lateFees, daysLate, total: base + lateFees };
};

const fmt = fmtCurrency;

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyLoanState = ({ navigation }) => (
  <SafeAreaView style={s.root} edges={['top']}>
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
        <MaterialIcons name="arrow-back" size={24} color="#374151" />
      </TouchableOpacity>
      <Text style={s.headerTitle}>My Current Loan</Text>
      <View style={{ width: 40 }} />
    </View>
    <View style={s.emptyWrap}>
      <MaterialIcons name="account-balance" size={64} color="#FFEDD5" />
      <Text style={s.emptyTitle}>No Active Loan</Text>
      <Text style={s.emptySub}>You don't have an active loan right now.{'\n'}Apply for a loan to get started.</Text>
      <TouchableOpacity
        style={s.emptyBtn}
        onPress={() => navigation.navigate('LoanApplication')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={18} color="white" />
        <Text style={s.emptyBtnTxt}>Apply for a Loan</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CurrentLoanScreen = ({ navigation }) => {
  // ── Reactive store reads ──────────────────────────────────────────────────
  const [, forceUpdate]     = useState(0);
  const rawLoan             = LoanStore.getActiveLoan();

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    LoanStore.subscribe(listener);
    return () => LoanStore.unsubscribe(listener);
  }, []);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [showHistory,     setShowHistory]     = useState(false);
  const [showDetails,     setShowDetails]     = useState(false);
  const [daysUntilDue,    setDaysUntilDue]    = useState(0);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [showAmort,       setShowAmort]       = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── No active loan — show empty state ─────────────────────────────────────
  if (!rawLoan) return <EmptyLoanState navigation={navigation} />;

  // ── Normalise loan into the shape this screen expects ────────────────────
  const creditTier = getCreditTier(rawLoan.creditScore || 200);
  const loan = {
    id:               rawLoan.id,
    type:             rawLoan.type,
    lender:           rawLoan.lender,
    status:           rawLoan.status,
    date:             rawLoan.applicationDate,
    loanStartDate:    rawLoan.loanStartDate,
    loanEndDate:      rawLoan.loanEndDate,
    dueDate:          rawLoan.dueDate,
    nextDueDate:      rawLoan.nextDueDate,
    loanAmount:       rawLoan.amount,
    remainingBalance: rawLoan.remainingBalance,
    paidAmount:       rawLoan.paidAmount,
    monthlyPayment:   rawLoan.monthlyPayment,
    terms:            `${rawLoan.term} months`,
    loanTerm:         rawLoan.term,
    paymentsCompleted: rawLoan.paymentsCompleted,
    paymentsRemaining: rawLoan.paymentsRemaining,
    interestRate:     rawLoan.interestRate,
    interestType:     rawLoan.interestType,
    totalInterest:    rawLoan.totalInterest,
    processingFee:    rawLoan.processingFee,
    totalPayment:     rawLoan.totalPayable,
    netRelease:       rawLoan.netRelease,
    monthlyIncome:    rawLoan.monthlyIncome,
    collateral:       rawLoan.collateral,
    purpose:          rawLoan.purpose,
    officerName:      rawLoan.officerName,
    officerContact:   rawLoan.officerContact,
    branchName:       rawLoan.branchName,
    branchAddress:    rawLoan.branchAddress,
    creditScore:      rawLoan.creditScore,
    tierLabel:        creditTier.label,
    tierColor:        creditTier.color,
    tierMaxLoan:      creditTier.maxLoan,
  };

  // ── Payment history from LoanStore ───────────────────────────────────────
  const txns = LoanStore.getTransactions(rawLoan.id);
  const history = txns
    .filter(t => t.type === 'Payment')
    .map((t, i) => ({
      id:        i + 1,
      date:      t.date,
      amount:    t.amountNum,
      principal: t.principal,
      interest:  t.interest,
      status:    'Completed',
      method:    t.paymentMethod,
      ref:       t.transactionId,
    }));

  const billing  = calcBilling(loan);
  const isUrgent = daysUntilDue <= 7 || billing.daysLate > 0;
  const progress = loan.loanAmount > 0 ? (loan.paidAmount / loan.loanAmount) * 100 : 0;

  useEffect(() => {
    const due   = new Date(loan.dueDate);
    const today = new Date();
    setDaysUntilDue(Math.max(0, Math.ceil((due - today) / 86400000)));
  }, [loan.dueDate]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  const goToPayNow = () =>
    navigation.navigate('PayNow', {
      loanApplication: { ...loan, amount: fmt(loan.loanAmount), actualAmountDue: billing.total },
      billingInfo: {
        basePayment: billing.base, principalAmount: billing.principal,
        interestAmount: billing.interest, lateFees: billing.lateFees,
        totalAmountDue: billing.total, daysLate: billing.daysLate,
      },
      transactions: [],
    });

  const goToTransactions = () =>
    navigation.navigate('Transactions', {
      loanId:       loan.id,
      loanType:     loan.type,
      transactions: LoanStore.getTransactions(loan.id),
    });

  const handleContactSupport = () =>
    Alert.alert('Contact Support', 'Choose how to reach us:', [
      { text: 'Call',      onPress: () => Alert.alert('Calling', '1-800-LOAN-HELP') },
      { text: 'Email',     onPress: () => Alert.alert('Email', 'support@lorafinance.com') },
      { text: 'Live Chat', onPress: () => Alert.alert('Chat', 'Opening live chat...') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const DRow = ({ label, value, accent, borderless }) => (
    <View style={[s.dRow, borderless ? { borderBottomWidth: 0 } : null]}>
      <Text style={s.dKey}>{label}</Text>
      <Text style={[s.dVal, accent ? { color: accent, fontWeight: '700' } : null]}>{value}</Text>
    </View>
  );

  // Build simple amortization schedule
  const amortRows = (() => {
    const monthlyRate = (loan.interestRate / 100) / 12;
    const base = loan.monthlyPayment;
    let bal = loan.loanAmount;
    const rows = [];
    for (let i = 1; i <= loan.loanTerm; i++) {
      const interest  = bal * monthlyRate;
      const principal = base - interest;
      bal = Math.max(0, bal - principal);
      rows.push({ num: i, principal: principal.toFixed(2), interest: interest.toFixed(2), balance: bal.toFixed(2) });
    }
    return rows;
  })();

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Current Loan</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={goToTransactions} style={s.headerBtn}>
            <MaterialIcons name="receipt-long" size={24} color="#FB923C" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDetails(true)} style={s.headerBtn}>
            <MaterialIcons name="info-outline" size={24} color="#FB923C" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Credit Tier Banner ── */}
        <TouchableOpacity
          style={[s.tierBanner, { backgroundColor: loan.tierColor + '12', borderColor: loan.tierColor + '40' }]}
          onPress={() => navigation.navigate('CreditReport')}
          activeOpacity={0.8}
        >
          <View style={[s.tierIconBox, { backgroundColor: loan.tierColor + '20' }]}>
            <MaterialIcons name="star" size={18} color={loan.tierColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.tierBannerTitle, { color: loan.tierColor }]}>
              {loan.tierLabel} Tier · Score {loan.creditScore}
            </Text>
            <Text style={s.tierBannerSub}>
              Max loan limit: {fmt(loan.tierMaxLoan)} · Approved within your tier
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={loan.tierColor} />
        </TouchableOpacity>

        {/* ── Urgent alert ── */}
        {isUrgent && (
          <View style={[s.alertBanner, billing.daysLate > 0 ? s.alertBannerRed : s.alertBannerOrange]}>
            <MaterialIcons name={billing.daysLate > 0 ? 'error' : 'warning'} size={22} color={billing.daysLate > 0 ? '#DC2626' : '#F97316'} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.alertTitle, { color: billing.daysLate > 0 ? '#DC2626' : '#B45309' }]}>
                {billing.daysLate > 0 ? 'Payment Overdue!' : 'Payment Due Soon!'}
              </Text>
              <Text style={[s.alertMsg, { color: billing.daysLate > 0 ? '#7F1D1D' : '#92400E' }]}>
                {billing.daysLate > 0
                  ? `${billing.daysLate} days overdue · Late fee: ${fmt(billing.lateFees)}`
                  : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining to avoid late fees`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Balance card ── */}
        <View style={s.balanceCard}>
          <View style={s.balanceTop}>
            <View>
              <Text style={s.balanceLbl}>Remaining Balance</Text>
              <Text style={s.balanceAmt}>{fmt(loan.remainingBalance)}</Text>
            </View>
            <View style={s.activePill}>
              <MaterialIcons name="check-circle" size={14} color="#059669" />
              <Text style={s.activePillTxt}>Active</Text>
            </View>
          </View>

          <View style={s.progressSection}>
            <View style={s.progressNumbers}>
              <View style={s.progressStat}>
                <Text style={s.progressStatNum}>{loan.paymentsCompleted}</Text>
                <Text style={s.progressStatLbl}>Paid</Text>
              </View>
              <View style={s.progressBarWrap}>
                <View style={s.progressTrack}>
                  <Animated.View style={[s.progressFill, { width: progressWidth }]} />
                </View>
                <Text style={s.progressPct}>{progress.toFixed(0)}% Complete</Text>
              </View>
              <View style={s.progressStat}>
                <Text style={s.progressStatNum}>{loan.paymentsRemaining}</Text>
                <Text style={s.progressStatLbl}>Remaining</Text>
              </View>
            </View>
          </View>

          <View style={s.paidRow}>
            <View style={s.paidItem}>
              <Text style={s.paidLbl}>Original Amount</Text>
              <Text style={s.paidVal}>{fmt(loan.loanAmount)}</Text>
            </View>
            <View style={s.paidDivider} />
            <View style={s.paidItem}>
              <Text style={s.paidLbl}>Amount Paid</Text>
              <Text style={[s.paidVal, { color: '#10B981' }]}>{fmt(loan.paidAmount)}</Text>
            </View>
            <View style={s.paidDivider} />
            <View style={s.paidItem}>
              <Text style={s.paidLbl}>Monthly Left</Text>
              <Text style={[s.paidVal, { color: '#F97316' }]}>{loan.paymentsRemaining} mo</Text>
            </View>
          </View>
        </View>

        {/* ── Next payment card ── */}
        <View style={[s.payCard, isUrgent ? s.payCardUrgent : null]}>
          <View style={s.payCardTop}>
            <View style={s.payCardLeft}>
              <View style={[s.payCardIcon, { backgroundColor: isUrgent ? '#FEF3C7' : '#FFF7ED' }]}>
                <MaterialIcons name="calendar-today" size={24} color={isUrgent ? '#F97316' : '#FB923C'} />
              </View>
              <View>
                <Text style={s.payCardLbl}>Next Payment</Text>
                <Text style={s.payCardDate}>{loan.nextDueDate}</Text>
                <Text style={[s.payCardDays, { color: isUrgent ? '#F97316' : '#FB923C' }]}>
                  {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : 'Due today!'}
                </Text>
              </View>
            </View>
            <View style={s.payCardRight}>
              <Text style={[s.payCardAmt, { color: isUrgent ? '#F97316' : '#FB923C' }]}>
                {fmt(billing.total)}
              </Text>
              {billing.lateFees > 0 && (
                <Text style={s.payCardNote}>+{fmt(billing.lateFees)} late fee</Text>
              )}
            </View>
          </View>

          <View style={s.payBreakdown}>
            {[
              ['Principal', fmt(billing.principal)],
              ['Interest',  fmt(billing.interest)],
              billing.lateFees > 0 ? ['Late Fee', fmt(billing.lateFees)] : null,
            ].filter(Boolean).map(([k, v]) => (
              <View key={k} style={s.payBreakdownItem}>
                <Text style={s.payBreakdownLbl}>{k}</Text>
                <Text style={[s.payBreakdownVal, k === 'Late Fee' ? { color: '#DC2626' } : null]}>{v}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[s.payBtn, isUrgent ? s.payBtnUrgent : null]}
            onPress={goToPayNow}
            activeOpacity={0.85}
          >
            <MaterialIcons name="payment" size={20} color="white" />
            <Text style={s.payBtnTxt}>Pay Now — {fmt(billing.total)}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Loan summary grid ── */}
        <View style={s.summaryCard}>
          <Text style={s.cardTitle}>Loan Summary</Text>
          <View style={s.summaryGrid}>
            {[
              { label: 'Loan ID',         value: loan.id,                     wide: true  },
              { label: 'Lender',          value: loan.lender,                 wide: true  },
              { label: 'Loan Amount',     value: fmt(loan.loanAmount)                     },
              { label: 'Interest Rate',   value: `${loan.interestRate}% / mo`             },
              { label: 'Net Release',     value: fmt(loan.netRelease)                     },
              { label: 'Processing Fee',  value: fmt(loan.processingFee)                  },
              { label: 'Total Interest',  value: fmt(loan.totalInterest)                  },
              { label: 'Total Payable',   value: fmt(loan.totalPayment)                   },
              { label: 'Monthly Payment', value: fmt(loan.monthlyPayment), accent: '#FB923C' },
              { label: 'Interest Type',   value: loan.interestType                        },
              { label: 'Term',            value: loan.terms                               },
              { label: 'Start Date',      value: loan.loanStartDate                       },
              { label: 'End Date',        value: loan.loanEndDate                         },
              { label: 'Purpose',         value: loan.purpose,               wide: true   },
              { label: 'Collateral',      value: loan.collateral,            wide: true   },
            ].map(({ label, value, wide, accent }) => (
              <View key={label} style={[s.summaryCell, wide ? s.summaryCellFull : null]}>
                <Text style={s.summaryCellLbl}>{label}</Text>
                <Text style={[s.summaryCellVal, accent ? { color: accent } : null]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Amortization toggle */}
          <TouchableOpacity style={s.amortBtn} onPress={() => setShowAmort(v => !v)}>
            <MaterialIcons name="table-chart" size={16} color="#FB923C" />
            <Text style={s.amortBtnTxt}>{showAmort ? 'Hide' : 'View'} Amortization Schedule</Text>
            <MaterialIcons name={showAmort ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color="#FB923C" />
          </TouchableOpacity>

          {showAmort && (
            <View style={s.amortTable}>
              <View style={[s.amortRow, s.amortHeader]}>
                {['Mo.', 'Principal', 'Interest', 'Balance'].map(h => (
                  <Text key={h} style={s.amortHeaderTxt}>{h}</Text>
                ))}
              </View>
              {amortRows.map((r, i) => (
                <View key={i} style={[s.amortRow, i < loan.paymentsCompleted ? s.amortRowPaid : null, i % 2 === 0 ? { backgroundColor: '#F9FAFB' } : null]}>
                  <Text style={[s.amortCell, { color: i < loan.paymentsCompleted ? '#10B981' : '#1F2937', fontWeight: i < loan.paymentsCompleted ? '700' : '500' }]}>{r.num}</Text>
                  <Text style={s.amortCell}>₱{parseFloat(r.principal).toLocaleString('en-PH', { minimumFractionDigits: 0 })}</Text>
                  <Text style={[s.amortCell, { color: '#EF4444' }]}>₱{parseFloat(r.interest).toLocaleString('en-PH', { minimumFractionDigits: 0 })}</Text>
                  <Text style={[s.amortCell, { color: '#FB923C', fontWeight: '600' }]}>₱{parseFloat(r.balance).toLocaleString('en-PH', { minimumFractionDigits: 0 })}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Recent payments ── */}
        <View style={s.histCard}>
          <View style={s.histCardHeader}>
            <Text style={s.cardTitle}>Recent Payments</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={() => setShowHistory(true)}>
                <Text style={s.viewAll}>View All →</Text>
              </TouchableOpacity>
            )}
          </View>
          {history.length === 0 ? (
            <View style={s.noPayWrap}>
              <MaterialIcons name="pending-actions" size={32} color="#FFEDD5" />
              <Text style={s.noPayTxt}>No payments yet</Text>
            </View>
          ) : (
            history.slice(0, 3).map((p) => (
              <View key={p.id} style={s.histRow}>
                <View style={s.histIconWrap}>
                  <MaterialIcons name="check-circle" size={22} color="#10B981" />
                </View>
                <View style={s.histMid}>
                  <Text style={s.histDate}>{p.date}</Text>
                  <Text style={s.histMethod}>via {p.method}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.histAmt}>{fmt(p.amount)}</Text>
                  <View style={s.completedPill}>
                    <Text style={s.completedPillTxt}>Completed</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Transactions shortcut ── */}
        <TouchableOpacity style={s.txShortcut} onPress={goToTransactions} activeOpacity={0.85}>
          <MaterialIcons name="receipt-long" size={20} color="#FB923C" />
          <Text style={s.txShortcutTxt}>View All Transactions for This Loan</Text>
          <MaterialIcons name="chevron-right" size={20} color="#FB923C" />
        </TouchableOpacity>

        {/* ── Loan officer ── */}
        <View style={s.officerCard}>
          <Text style={s.cardTitle}>Loan Officer</Text>
          <View style={s.officerRow}>
            <View style={s.officerAvatar}>
              <MaterialIcons name="person" size={28} color="#FB923C" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.officerName}>{loan.officerName}</Text>
              <Text style={s.officerBranch}>{loan.branchName}</Text>
              <Text style={s.officerAddr}>{loan.branchAddress}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.contactBtn} onPress={handleContactSupport}>
            <MaterialIcons name="support-agent" size={18} color="#FB923C" />
            <Text style={s.contactBtnTxt}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tips ── */}
        <View style={s.tipsCard}>
          <View style={s.tipsHeader}>
            <MaterialIcons name="lightbulb" size={18} color="#F59E0B" />
            <Text style={s.tipsTitle}>Helpful Tips</Text>
          </View>
          {[
            'Pay early to reduce your interest charges.',
            'Set a calendar reminder 5 days before due date.',
            'Contact support if you need a payment plan adjustment.',
            'Paying on time improves your credit score by +20 pts.',
          ].map((tip, i) => (
            <View key={i} style={s.tip}>
              <Text style={s.tipBullet}>•</Text>
              <Text style={s.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Payment History Modal                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showHistory} animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <SafeAreaView style={s.root}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={s.headerBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Payment History</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={s.histSummary}>
            <Text style={s.histSummaryLbl}>Total Paid</Text>
            <Text style={s.histSummaryAmt}>{fmt(loan.paidAmount)}</Text>
            <Text style={s.histSummarySub}>{`${loan.paymentsCompleted} payments completed out of ${loan.loanTerm}`}</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {history.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={s.fullHistItem}
                onPress={() => setExpandedPayment(expandedPayment === p.id ? null : p.id)}
              >
                <View style={s.fullHistTop}>
                  <View style={s.fullHistLeft}>
                    <View style={s.fullHistIconBox}>
                      <MaterialIcons name="check-circle" size={22} color="#10B981" />
                    </View>
                    <View>
                      <Text style={s.fullHistDate}>{p.date}</Text>
                      <Text style={s.fullHistMethod}>via {p.method}</Text>
                      <Text style={s.fullHistRef}>Ref: {p.ref}</Text>
                    </View>
                  </View>
                  <View style={s.fullHistRight}>
                    <Text style={s.fullHistAmt}>{fmt(p.amount)}</Text>
                    <MaterialIcons name={expandedPayment === p.id ? 'expand-less' : 'expand-more'} size={18} color="#9CA3AF" />
                  </View>
                </View>
                {expandedPayment === p.id && (
                  <View style={s.expandedBreakdown}>
                    <View style={s.expandRow}>
                      <Text style={s.expandLbl}>Principal</Text>
                      <Text style={s.expandVal}>{fmt(p.principal)}</Text>
                    </View>
                    <View style={s.expandRow}>
                      <Text style={s.expandLbl}>Interest</Text>
                      <Text style={[s.expandVal, { color: '#EF4444' }]}>{fmt(p.interest)}</Text>
                    </View>
                    <View style={[s.expandRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 8 }]}>
                      <Text style={[s.expandLbl, { fontWeight: '700', color: '#1F2937' }]}>Total</Text>
                      <Text style={[s.expandVal, { fontWeight: '700', color: '#FB923C' }]}>{fmt(p.amount)}</Text>
                    </View>
                    <View style={s.statusPill}>
                      <MaterialIcons name="check-circle" size={13} color="#059669" />
                      <Text style={s.statusPillTxt}>{p.status}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Loan Details Modal                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal visible={showDetails} animationType="slide" onRequestClose={() => setShowDetails(false)}>
        <SafeAreaView style={s.root}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowDetails(false)} style={s.headerBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Loan Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {[
              {
                title: 'Basic Information',
                rows: [
                  ['Loan ID',          loan.id],
                  ['Lender',           loan.lender],
                  ['Loan Type',        loan.type],
                  ['Status',           loan.status, '#10B981'],
                  ['Application Date', loan.date],
                ],
              },
              {
                title: 'Financial Terms',
                rows: [
                  ['Loan Amount',     fmt(loan.loanAmount), '#FB923C'],
                  ['Net Release',     fmt(loan.netRelease)],
                  ['Processing Fee',  fmt(loan.processingFee)],
                  ['Interest Rate',   `${loan.interestRate}% / month`],
                  ['Interest Type',   loan.interestType],
                  ['Total Interest',  fmt(loan.totalInterest)],
                  ['Total Payable',   fmt(loan.totalPayment)],
                  ['Monthly Payment', fmt(loan.monthlyPayment), '#FB923C'],
                ],
              },
              {
                title: 'Payment Status',
                rows: [
                  ['Remaining Balance',  fmt(loan.remainingBalance), '#EF4444'],
                  ['Amount Paid',        fmt(loan.paidAmount), '#10B981'],
                  ['Payments Completed', `${loan.paymentsCompleted} of ${loan.loanTerm}`],
                  ['Payments Remaining', `${loan.paymentsRemaining}`],
                  ['Current Amount Due', fmt(billing.total), '#FB923C'],
                  ...(billing.lateFees > 0 ? [[`Late Fee (${billing.daysLate} days)`, fmt(billing.lateFees), '#DC2626']] : []),
                ],
              },
              {
                title: 'Important Dates',
                rows: [
                  ['Start Date',    loan.loanStartDate],
                  ['Next Due Date', loan.nextDueDate, '#F59E0B'],
                  ['End Date',      loan.loanEndDate],
                ],
              },
              {
                title: 'Loan Purpose & Collateral',
                rows: [
                  ['Purpose',        loan.purpose],
                  ['Collateral',     loan.collateral],
                  ['Monthly Income', loan.monthlyIncome],
                ],
              },
              {
                title: 'Branch Information',
                rows: [
                  ['Officer',  loan.officerName],
                  ['Branch',   loan.branchName],
                  ['Address',  loan.branchAddress],
                  ['Contact',  loan.officerContact],
                ],
              },
            ].map((section) => (
              <View key={section.title} style={s.detailSection}>
                <Text style={s.detailSectionTitle}>{section.title}</Text>
                {section.rows.map(([k, v, accent], i) => (
                  <DRow key={k} label={k} value={v} accent={accent} borderless={i === section.rows.length - 1} />
                ))}
              </View>
            ))}

            <TouchableOpacity style={s.payBtnFull} onPress={() => { setShowDetails(false); goToPayNow(); }}>
              <MaterialIcons name="payment" size={20} color="white" />
              <Text style={s.payBtnTxt}>Pay Now — {fmt(billing.total)}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { padding: 16, paddingBottom: 48 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerBtn:   { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },

  // ── Empty state ──
  emptyWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle:  { fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 18, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FB923C', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  emptyBtnTxt: { color: 'white', fontWeight: '700', fontSize: 15 },

  // ── Tier banner ──
  tierBanner:      { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
  tierIconBox:     { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tierBannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  tierBannerSub:   { fontSize: 11, color: '#6B7280', lineHeight: 16 },

  alertBanner:       { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  alertBannerOrange: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  alertBannerRed:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  alertTitle:        { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  alertMsg:          { fontSize: 12, lineHeight: 16 },

  balanceCard:     { backgroundColor: 'white', borderRadius: 18, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  balanceTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  balanceLbl:      { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  balanceAmt:      { fontSize: 28, fontWeight: '800', color: '#1F2937' },
  activePill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  activePillTxt:   { fontSize: 12, fontWeight: '700', color: '#059669' },
  progressSection: { marginBottom: 16 },
  progressNumbers: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressStat:    { alignItems: 'center', minWidth: 40 },
  progressStatNum: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  progressStatLbl: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  progressBarWrap: { flex: 1, alignItems: 'center' },
  progressTrack:   { width: '100%', height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  progressFill:    { height: '100%', backgroundColor: '#FB923C', borderRadius: 5 },
  progressPct:     { fontSize: 11, color: '#6B7280' },
  paidRow:         { flexDirection: 'row', alignItems: 'stretch', backgroundColor: '#F9FAFB', borderRadius: 10, overflow: 'hidden' },
  paidItem:        { flex: 1, alignItems: 'center', paddingVertical: 12 },
  paidDivider:     { width: 1, backgroundColor: '#E5E7EB' },
  paidLbl:         { fontSize: 11, color: '#6B7280', marginBottom: 4 },
  paidVal:         { fontSize: 14, fontWeight: '700', color: '#1F2937' },

  payCard:         { backgroundColor: 'white', borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: '#FFEDD5', shadowColor: '#FB923C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  payCardUrgent:   { borderColor: '#FED7AA', backgroundColor: '#FFFBEB' },
  payCardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  payCardLeft:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  payCardIcon:     { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  payCardLbl:      { fontSize: 12, color: '#6B7280', marginBottom: 3 },
  payCardDate:     { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  payCardDays:     { fontSize: 12, fontWeight: '500' },
  payCardRight:    { alignItems: 'flex-end' },
  payCardAmt:      { fontSize: 24, fontWeight: '800' },
  payCardNote:     { fontSize: 11, color: '#DC2626', marginTop: 2 },
  payBreakdown:    { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 14 },
  payBreakdownItem:{ alignItems: 'center' },
  payBreakdownLbl: { fontSize: 11, color: '#6B7280', marginBottom: 3 },
  payBreakdownVal: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  payBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FB923C', paddingVertical: 15, borderRadius: 12, shadowColor: '#FB923C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  payBtnUrgent:    { backgroundColor: '#F97316' },
  payBtnTxt:       { color: 'white', fontSize: 15, fontWeight: '700' },
  payBtnFull:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FB923C', margin: 16, paddingVertical: 16, borderRadius: 12, shadowColor: '#FB923C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },

  summaryCard:     { backgroundColor: 'white', borderRadius: 18, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  cardTitle:       { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
  summaryGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  summaryCell:     { width: '50%', paddingVertical: 10, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  summaryCellFull: { width: '100%' },
  summaryCellLbl:  { fontSize: 11, color: '#9CA3AF', marginBottom: 3 },
  summaryCellVal:  { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  amortBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#FFEDD5', borderRadius: 10, backgroundColor: '#FAFAFF' },
  amortBtnTxt:    { fontSize: 13, fontWeight: '600', color: '#FB923C', flex: 1, textAlign: 'center' },
  amortTable:     { marginTop: 12, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  amortHeader:    { backgroundColor: '#FFF7ED' },
  amortHeaderTxt: { fontSize: 11, fontWeight: '700', color: '#7C3AED', flex: 1, textAlign: 'center', paddingVertical: 8 },
  amortRow:       { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  amortRowPaid:   { backgroundColor: '#F0FDF4' },
  amortCell:      { flex: 1, fontSize: 11, textAlign: 'center', color: '#1F2937' },

  histCard:       { backgroundColor: 'white', borderRadius: 18, padding: 20, marginBottom: 14 },
  histCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll:        { color: '#FB923C', fontSize: 13, fontWeight: '600' },
  histRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  histIconWrap:   { marginRight: 12 },
  histMid:        { flex: 1 },
  histDate:       { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 1 },
  histMethod:     { fontSize: 12, color: '#6B7280' },
  histAmt:        { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  completedPill:  { backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
  completedPillTxt:{ fontSize: 10, fontWeight: '600', color: '#059669' },
  noPayWrap:      { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noPayTxt:       { fontSize: 13, color: '#9CA3AF' },

  txShortcut:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#FFEDD5' },
  txShortcutTxt:  { flex: 1, fontSize: 14, fontWeight: '600', color: '#FB923C' },

  officerCard:   { backgroundColor: 'white', borderRadius: 18, padding: 20, marginBottom: 14 },
  officerRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  officerAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  officerName:   { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  officerBranch: { fontSize: 12, color: '#6B7280', marginBottom: 1 },
  officerAddr:   { fontSize: 11, color: '#9CA3AF' },
  contactBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', borderWidth: 1, borderColor: '#FB923C', borderRadius: 10, paddingVertical: 12 },
  contactBtnTxt: { color: '#FB923C', fontWeight: '600', fontSize: 14 },

  tipsCard:   { backgroundColor: '#FFFBEB', borderRadius: 18, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tipsTitle:  { fontSize: 14, fontWeight: '700', color: '#92400E' },
  tip:        { flexDirection: 'row', marginBottom: 7 },
  tipBullet:  { color: '#F59E0B', fontWeight: '800', marginRight: 8, fontSize: 14 },
  tipTxt:     { fontSize: 13, color: '#78350F', flex: 1, lineHeight: 18 },

  histSummary:    { backgroundColor: 'white', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  histSummaryLbl: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  histSummaryAmt: { fontSize: 32, fontWeight: '800', color: '#10B981', marginBottom: 4 },
  histSummarySub: { fontSize: 12, color: '#6B7280' },
  fullHistItem:   { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  fullHistTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fullHistLeft:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  fullHistIconBox:{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
  fullHistDate:   { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  fullHistMethod: { fontSize: 12, color: '#6B7280' },
  fullHistRef:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  fullHistRight:  { alignItems: 'flex-end' },
  fullHistAmt:    { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  expandedBreakdown: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginTop: 12 },
  expandRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  expandLbl:      { fontSize: 13, color: '#6B7280' },
  expandVal:      { fontSize: 13, color: '#1F2937', fontWeight: '500' },
  statusPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 8 },
  statusPillTxt:  { fontSize: 12, fontWeight: '600', color: '#059669' },

  detailSection:      { backgroundColor: 'white', padding: 20, marginBottom: 12 },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: '#FB923C' },
  dRow:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dKey:               { fontSize: 13, color: '#6B7280', flex: 1 },
  dVal:               { fontSize: 13, fontWeight: '500', color: '#1F2937', textAlign: 'right', flex: 1 },
});

export default CurrentLoanScreen;