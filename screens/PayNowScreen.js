import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import LoanStore from './Loanstore.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const PURPLE = '#8B5CF6';
const ORANGE = '#F97316';
const RED    = '#DC2626';
const GREEN  = '#10B981';
const AMBER  = '#F59E0B';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.]/g, '')) : Number(n);
  return `₱${(isNaN(num) ? 0 : num).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const safeStr = (v) => (v !== null && v !== undefined ? String(v) : '—');

const getLoanIcon = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('home'))      return 'home';
  if (t.includes('emergency')) return 'flash-on';
  if (t.includes('business'))  return 'business-center';
  if (t.includes('education')) return 'school';
  return 'person';
};

// ─── Payment Methods ──────────────────────────────────────────────────────────
const METHODS = [
  { id: 'wallet',    name: 'Lora Wallet', icon: 'account-balance-wallet', cat: 'wallet',  fee: 0,  color: PURPLE,    desc: 'Instant · No fees' },
  { id: 'gcash',     name: 'GCash',       icon: 'smartphone',             cat: 'ewallet', fee: 0,  color: '#007DFF', desc: 'Instant · No fees' },
  { id: 'maya',      name: 'Maya',        icon: 'smartphone',             cat: 'ewallet', fee: 0,  color: '#00B14F', desc: 'Instant · No fees' },
  { id: 'bpi',       name: 'BPI',         icon: 'account-balance',        cat: 'bank',    fee: 15, color: '#C40B2C', desc: '1–3 business days' },
  { id: 'bdo',       name: 'BDO',         icon: 'account-balance',        cat: 'bank',    fee: 15, color: '#9E0B0F', desc: '1–3 business days' },
  { id: 'metrobank', name: 'Metrobank',   icon: 'account-balance',        cat: 'bank',    fee: 15, color: '#0F4B9C', desc: '1–3 business days' },
  { id: 'landbank',  name: 'Landbank',    icon: 'account-balance',        cat: 'bank',    fee: 15, color: '#0055A5', desc: '1–3 business days' },
  { id: 'unionbank', name: 'UnionBank',   icon: 'account-balance',        cat: 'bank',    fee: 10, color: '#FF6B00', desc: 'Instant' },
  { id: 'visa',      name: 'Visa Card',   icon: 'credit-card',            cat: 'card',    fee: 25, color: '#1A1F71', desc: 'Instant · 1.6% fee' },
  { id: 'mastercard',name: 'Mastercard',  icon: 'credit-card',            cat: 'card',    fee: 25, color: '#EB001B', desc: 'Instant · 1.6% fee' },
];
const CAT_LABELS = { wallet: 'Wallet', ewallet: 'E-Wallet', bank: 'Bank Transfer', card: 'Card' };

// ─── Main Screen ──────────────────────────────────────────────────────────────
const PayNowScreen = ({ navigation, route }) => {
  const transactions = route.params?.transactions || [];

  const [showDetails,     setShowDetails]     = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [newTx,           setNewTx]           = useState(null);
  const [showSuccess,     setShowSuccess]     = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loan = useMemo(() => {
    const la = route.params?.loanApplication;
    const bi = route.params?.billingInfo;

    if (!la || !bi) return null;

    const pc = Number(la.paymentsCompleted) || 0;
    const pr = Number(la.paymentsRemaining) || 0;
    const pt = Number(la.paymentsTotal) || (pc + pr) || Number(la.loanTerm) || 0;

    return {
      id:               safeStr(la.id),
      type:             safeStr(la.type || 'Personal Loan'),
      purpose:          safeStr(la.purpose || ''),
      lender:           safeStr(la.lender || '—'),
      status:           safeStr(la.status || 'Active'),
      dueDate:          safeStr(la.nextDueDate || la.dueDate || '—'),
      term:             safeStr(la.terms || la.term || '—'),
      applicationDate:  safeStr(la.applicationDate || ''),
      disbursementDate: safeStr(la.disbursementDate || ''),
      loanAmount:       Number(la.loanAmount)       || 0,
      remainingBalance: Number(la.remainingBalance) || 0,
      interestRate:     Number(la.interestRate)     || 0,
      interestType:     safeStr(la.interestType     || 'Fixed'),
      monthlyPayment:   Number(la.monthlyPayment)   || 0,
      totalInterest:    Number(la.totalInterest)    || 0,
      processingFee:    Number(la.processingFee)    || 0,
      netRelease:       Number(la.netRelease)       || 0,
      paidAmount:       Number(la.paidAmount)       || 0,
      paymentsCompleted: pc,
      paymentsRemaining: pr,
      paymentsTotal:    pt,
      progress:         pt > 0 ? Math.round((pc / pt) * 100) : 0,
      base:      Number(bi.basePayment)     || 0,
      principal: Number(bi.principalAmount) || 0,
      interest:  Number(bi.interestAmount)  || 0,
      lateFees:  Number(bi.lateFees)        || 0,
      daysLate:  Number(bi.daysLate)        || 0,
      total:     Number(bi.totalAmountDue)  || 0,
      isProcessing: la.status === 'Processing' || la.status === 'Pending',
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params]);

  useEffect(() => {
    if (!loan || loan.daysLate <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.025, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,     duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loan]);

  const goBack = () => navigation.goBack();

  const goToDashboard = () => {
    setShowSuccess(false);
    navigation.navigate('Dashboard', {
      newTransaction: newTx,
      updatedTransactions: newTx ? [newTx, ...transactions] : transactions,
    });
  };

  const handlePaymentComplete = (tx) => {
    setNewTx(tx);
    setShowMethodModal(false);
    setShowSuccess(true);
  };

  if (!loan) {
    return (
      <SafeAreaView style={s.root}>
        <View style={[s.header, { backgroundColor: PURPLE }]}>
          <TouchableOpacity onPress={goBack} style={s.headerBtn}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Pay Loan</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.loading}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={s.loadingTxt}>Loading billing details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue   = loan.daysLate > 0;
  const isUrgent    = isOverdue || loan.lateFees > 0;
  const accentColor = isOverdue ? RED : isUrgent ? ORANGE : PURPLE;
  const progress    = loan.paymentsTotal > 0 ? (loan.paymentsCompleted / loan.paymentsTotal) * 100 : 0;

  const statusCfg = ({
    Active:     { bg: '#ECFDF5', dot: GREEN,      text: '#059669' },
    Processing: { bg: '#FFF7ED', dot: AMBER,      text: '#D97706' },
    Pending:    { bg: '#FFF7ED', dot: AMBER,      text: '#D97706' },
    Paid:       { bg: '#EFF6FF', dot: '#3B82F6',  text: '#1D4ED8' },
  }[loan.status]) || { bg: '#F3F4F6', dot: '#9CA3AF', text: '#6B7280' };

  return (
    <SafeAreaView style={s.root} edges={['top']}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: accentColor }]}>
        <TouchableOpacity onPress={goBack} style={s.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Pay Loan</Text>
          <Text style={s.headerSub}>{loan.id}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDetails(v => !v)} style={s.headerBtn}>
          <MaterialIcons name={showDetails ? 'keyboard-arrow-up' : 'info-outline'} size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Processing banner */}
        {loan.isProcessing && (
          <View style={s.processingBanner}>
            <View style={s.processingIconWrap}>
              <MaterialIcons name="hourglass-empty" size={22} color={AMBER} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.processingTitle}>Application Under Review</Text>
              <Text style={s.processingMsg}>
                {`${loan.lender} is reviewing your ${loan.type} application. Payment will be available once approved.`}
              </Text>
              {!!loan.applicationDate && (
                <Text style={s.processingDate}>{`Applied: ${loan.applicationDate}`}</Text>
              )}
            </View>
          </View>
        )}

        {/* Urgent banner */}
        {isUrgent && !loan.isProcessing && (
          <View style={[s.urgentBanner, isOverdue ? s.urgentRed : s.urgentOrange]}>
            <MaterialIcons name={isOverdue ? 'error' : 'warning'} size={20} color={isOverdue ? RED : ORANGE} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[s.urgentTitle, { color: isOverdue ? '#7F1D1D' : '#78350F' }]}>
                {isOverdue ? `${loan.daysLate} Day${loan.daysLate !== 1 ? 's' : ''} Overdue` : 'Payment Due Soon'}
              </Text>
              <Text style={[s.urgentMsg, { color: isOverdue ? '#991B1B' : '#92400E' }]}>
                {isOverdue ? `A late fee of ${fmt(loan.lateFees)} has been applied.` : 'Pay today to avoid late fees.'}
              </Text>
            </View>
          </View>
        )}

        {/* Amount Hero Card */}
        {!loan.isProcessing && (
          <Animated.View style={[s.amountCard, { backgroundColor: accentColor }, { transform: [{ scale: pulseAnim }] }]}>
            <View style={s.amountCardTop}>
              <View style={s.loanChip}>
                <MaterialIcons name={getLoanIcon(loan.type)} size={12} color="white" />
                <Text style={s.loanChipTxt}>{loan.type}</Text>
              </View>
              <Text style={s.amountLender}>{loan.lender}</Text>
            </View>

            <Text style={s.amountLbl}>Amount Due This Month</Text>
            <Text style={s.amountBig}>{fmt(loan.total)}</Text>
            <Text style={s.dueDateTxt}>{`Due: ${loan.dueDate}`}</Text>

            {loan.lateFees > 0 && (
              <View style={s.lateFeeChip}>
                <MaterialIcons name="warning" size={11} color="#FEF2F2" />
                <Text style={s.lateFeeChipTxt}>{`Includes ${fmt(loan.lateFees)} late fee`}</Text>
              </View>
            )}

            <View style={s.strip}>
              <View style={s.stripItem}>
                <Text style={s.stripLbl}>Principal</Text>
                <Text style={s.stripVal}>{fmt(loan.principal)}</Text>
              </View>
              <View style={s.stripDivider} />
              <View style={s.stripItem}>
                <Text style={s.stripLbl}>Interest</Text>
                <Text style={[s.stripVal, { color: '#FDE68A' }]}>{fmt(loan.interest)}</Text>
              </View>
              {loan.lateFees > 0 && (
                <>
                  <View style={s.stripDivider} />
                  <View style={s.stripItem}>
                    <Text style={s.stripLbl}>Late Fee</Text>
                    <Text style={[s.stripVal, { color: '#FCA5A5' }]}>{fmt(loan.lateFees)}</Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* Loan Info Card */}
        <View style={s.infoCard}>
          <View style={s.infoHeader}>
            <View style={[s.loanIconWrap, { backgroundColor: `${accentColor}15` }]}>
              <MaterialIcons name={getLoanIcon(loan.type)} size={20} color={accentColor} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.infoId}>{`Loan #${loan.id}`}</Text>
              <Text style={s.infoLender}>{loan.lender}</Text>
              {!!loan.purpose && <Text style={s.infoPurpose}>{loan.purpose}</Text>}
            </View>
            <View style={[s.statusPill, { backgroundColor: statusCfg.bg }]}>
              <View style={[s.statusDot, { backgroundColor: statusCfg.dot }]} />
              <Text style={[s.statusTxt, { color: statusCfg.text }]}>{loan.status}</Text>
            </View>
          </View>

          {loan.paymentsTotal > 0 && (
            <View style={s.progressSection}>
              <View style={s.progressTopRow}>
                <Text style={s.progressNote}>{`${loan.paymentsCompleted} of ${loan.paymentsTotal} payments`}</Text>
                <Text style={[s.progressPct, { color: accentColor }]}>{`${loan.progress}%`}</Text>
              </View>
              <View style={s.track}>
                <View style={[s.trackFill, { width: `${Math.min(100, progress)}%`, backgroundColor: accentColor }]} />
              </View>
              <View style={s.progressBottomRow}>
                <Text style={s.progressNote}>{`${loan.paymentsRemaining} remaining`}</Text>
                {!!loan.term && <Text style={s.progressNote}>{loan.term}</Text>}
              </View>
            </View>
          )}

          {!loan.isProcessing && (
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: '#1F2937' }]}>{fmt(loan.monthlyPayment || loan.base)}</Text>
                <Text style={s.statLbl}>Monthly</Text>
              </View>
              <View style={[s.statItem, s.statBorder]}>
                <Text style={[s.statVal, { color: AMBER }]}>{`${loan.interestRate}%`}</Text>
                <Text style={s.statLbl}>Interest</Text>
              </View>
              <View style={[s.statItem, s.statBorder]}>
                <Text style={[s.statVal, { color: accentColor }]}>{fmt(loan.remainingBalance)}</Text>
                <Text style={s.statLbl}>Balance</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={s.expandBtn} onPress={() => setShowDetails(v => !v)}>
            <Text style={[s.expandBtnTxt, { color: accentColor }]}>
              {showDetails ? 'Hide loan details ↑' : 'View full loan details ↓'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={s.detailsBox}>

              <Text style={s.detailSectionLbl}>Loan Information</Text>
              {[
                ['Loan Type',         loan.type],
                ['Purpose',           loan.purpose],
                ['Lender',            loan.lender],
                ['Interest Type',     loan.interestType],
                ['Loan Term',         loan.term],
                ['Application Date',  loan.applicationDate],
                ['Disbursement Date', loan.disbursementDate],
              ].filter(([, v]) => v).map(([k, v]) => (
                <View key={k} style={s.detailRow}>
                  <Text style={s.detailKey}>{k}</Text>
                  <Text style={s.detailVal}>{safeStr(v)}</Text>
                </View>
              ))}

              <Text style={[s.detailSectionLbl, { marginTop: 12 }]}>Financial Breakdown</Text>
              {[
                ['Loan Amount',          fmt(loan.loanAmount),       null],
                ['Total Interest',       fmt(loan.totalInterest),     AMBER],
                ['Processing Fee',       fmt(loan.processingFee),     RED],
                ['Net Amount Released',  fmt(loan.netRelease),        accentColor],
                ['Remaining Balance',    fmt(loan.remainingBalance),  accentColor],
              ].filter(([, v]) => v && v !== '₱0.00').map(([k, v, color]) => (
                <View key={k} style={s.detailRow}>
                  <Text style={s.detailKey}>{k}</Text>
                  <Text style={[s.detailVal, color ? { color, fontWeight: '700' } : null]}>{v}</Text>
                </View>
              ))}

              <Text style={[s.detailSectionLbl, { marginTop: 12 }]}>Current Billing Cycle</Text>
              {([
                ['Due Date',      loan.dueDate,      AMBER],
                ['Base Payment',  fmt(loan.base),    null],
                ['Principal',     fmt(loan.principal),null],
                ['Interest',      fmt(loan.interest), AMBER],
                loan.lateFees > 0 ? [`Late Fee (${loan.daysLate} days)`, fmt(loan.lateFees), RED] : null,
                ['Total Due',     fmt(loan.total),   accentColor],
              ]).filter(Boolean).map(([k, v, color]) => (
                <View key={k} style={s.detailRow}>
                  <Text style={s.detailKey}>{k}</Text>
                  <Text style={[s.detailVal, color ? { color, fontWeight: '700' } : null]}>{safeStr(v)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Pay Button */}
        {!loan.isProcessing && (
          <TouchableOpacity
            style={[s.payBtn, { backgroundColor: accentColor, shadowColor: accentColor }]}
            onPress={() => setShowMethodModal(true)}
            activeOpacity={0.85}
          >
            <MaterialIcons name="payment" size={22} color="white" />
            <Text style={s.payBtnTxt}>{`PAY NOW  ${fmt(loan.total)}`}</Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={s.tipsCard}>
          <View style={s.tipsHeader}>
            <MaterialIcons name="lightbulb" size={16} color={AMBER} />
            <Text style={s.tipsTitle}>Payment Tips</Text>
          </View>
          {[
            'Paying early reduces your remaining interest balance.',
            'Lora Wallet payments are instant with zero fees.',
            'Bank transfers take 1–3 business days to verify.',
            `You have ${loan.paymentsRemaining} payment${loan.paymentsRemaining !== 1 ? 's' : ''} left on this loan.`,
          ].map((tip, i) => (
            <View key={i} style={s.tip}>
              <View style={s.tipDot} />
              <Text style={s.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Payment Method Modal */}
      <Modal visible={showMethodModal} animationType="slide" onRequestClose={() => setShowMethodModal(false)}>
        <PayMethodScreen
          loan={loan}
          accentColor={accentColor}
          onClose={() => setShowMethodModal(false)}
          onComplete={handlePaymentComplete}
        />
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} animationType="fade" transparent onRequestClose={goToDashboard}>
        <View style={s.successOverlay}>
          <View style={s.successCard}>
            <View style={[s.successIconWrap, { backgroundColor: newTx?.status === 'Completed' ? GREEN : AMBER }]}>
              <MaterialIcons
                name={newTx?.status === 'Completed' ? 'check-circle' : 'schedule'}
                size={38} color="white"
              />
            </View>
            <Text style={s.successTitle}>
              {newTx?.status === 'Completed' ? 'Payment Successful!' : 'Payment Submitted!'}
            </Text>
            <Text style={s.successMsg}>
              {safeStr(newTx?.processingMessage || 'Your payment has been processed successfully.')}
            </Text>

            <View style={s.successDetails}>
              {([
                ['Transaction ID',  safeStr(newTx?.transactionId)],
                ['Loan',            `#${loan.id} · ${loan.type}`],
                ['Lender',          loan.lender],
                ['Payment Method',  safeStr(newTx?.paymentMethod)],
                ['Loan Payment',    fmt(newTx?.amount)],
                newTx?.fee > 0 ? ['Transaction Fee', fmt(newTx.fee)] : null,
                ['Total Charged',   fmt(newTx?.totalAmount)],
                ['Status',          safeStr(newTx?.status)],
                ['Date & Time',     newTx?.date && newTx?.time ? `${newTx.date}  ${newTx.time}` : '—'],
              ]).filter(Boolean).map(([k, v]) => (
                <View key={k} style={s.successRow}>
                  <Text style={s.successKey}>{k}</Text>
                  <Text style={[
                    s.successVal,
                    k === 'Total Charged' ? { color: PURPLE, fontWeight: '800' } : null,
                    k === 'Status' ? { color: newTx?.status === 'Completed' ? GREEN : AMBER, fontWeight: '700' } : null,
                  ]}>{safeStr(v)}</Text>
                </View>
              ))}
            </View>

            <View style={s.successBtns}>
              <TouchableOpacity
                style={s.successBtnSecondary}
                onPress={() => {
                  setShowSuccess(false);
                  navigation.navigate('Transactions', {
                    transactions: newTx ? [newTx, ...transactions] : transactions,
                  });
                }}
              >
                <Text style={s.successBtnSecondaryTxt}>View Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.successBtnPrimary, { backgroundColor: accentColor }]}
                onPress={goToDashboard}
              >
                <Text style={s.successBtnPrimaryTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Payment Method Screen ────────────────────────────────────────────────────
const PayMethodScreen = ({ loan, accentColor = PURPLE, onClose, onComplete }) => {
  const [selMethod,    setSelMethod]    = useState(null);
  const [step,         setStep]         = useState('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txRef,        setTxRef]        = useState('');
  const [bankRef,      setBankRef]      = useState('');
  const [receipt,      setReceipt]      = useState(null);
  const [card,         setCard]         = useState({ number: '', name: '', expiry: '', cvv: '' });

  const executePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const txId      = `TXN-${Date.now()}`;
      const now       = new Date();
      const loanTotal = Number(loan.total)    || 0;
      const txFee     = Number(selMethod.fee) || 0;
      const isInstant = selMethod.id === 'wallet';

      // ── Commit to LoanStore so all screens see the updated balance / loan ──
      if (isInstant) {
        LoanStore.recordPayment({
          amount:    loanTotal,
          method:    selMethod.name,
          principal: loan.principal || loanTotal,
          interest:  loan.interest  || 0,
        });
      }

      const tx = {
        id:            txId,
        transactionId: txId,
        type:          'Payment',
        amount:        loanTotal,
        fee:           txFee,
        totalAmount:   loanTotal + txFee,
        date:          now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time:          now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status:        isInstant ? 'Completed' : 'Pending',
        loanId:        loan.id,
        paymentMethod: selMethod.name,
        lender:        loan.lender,
        isPending:     !isInstant,
        referenceNumber: selMethod.cat === 'ewallet' ? txRef
                       : selMethod.cat === 'bank'    ? bankRef : null,
        processingMessage: isInstant
          ? `Payment of ${fmt(loanTotal)} to ${loan.lender} completed instantly.`
          : `Your payment via ${selMethod.name} is being verified. This may take 1–3 business days.`,
      };
      setIsProcessing(false);
      onComplete(tx);
    }, 1800);
  };

  const handleContinue = () => {
    if (!selMethod) { Alert.alert('Select a payment method'); return; }
    if (selMethod.id === 'wallet') {
      const walletBal = LoanStore.getWalletBalance();
      Alert.alert(
        'Confirm Payment',
        `Pay ${fmt(loan.total)} from your Lora Wallet?\n\nLoan: #${loan.id}\nLender: ${loan.lender}\nAvailable: ${fmt(walletBal)}`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: executePayment }]
      );
      return;
    }
    setStep('form');
  };

  const handleSubmitForm = () => {
    if (selMethod.cat === 'ewallet' && txRef.length < 8) {
      Alert.alert('Invalid Reference', 'Enter a valid reference number (min 8 characters)'); return;
    }
    if (selMethod.cat === 'bank' && (!bankRef || !receipt)) {
      Alert.alert('Missing Fields', 'Upload your receipt and enter your reference number'); return;
    }
    if (selMethod.cat === 'card') {
      if (!card.number || !card.name || !card.expiry || !card.cvv) {
        Alert.alert('Missing Card Details', 'Please fill in all card fields'); return;
      }
      if (card.number.replace(/\s/g, '').length < 15) { Alert.alert('Invalid Card Number'); return; }
    }
    Alert.alert(
      'Confirm Payment',
      `Submit ${fmt(Number(loan.total) + selMethod.fee)} via ${selMethod.name}?\n\nLoan: #${loan.id} · ${loan.type}\nLender: ${loan.lender}`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Submit', onPress: executePayment }]
    );
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={[pm.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={pm.procTxt}>Processing payment…</Text>
        <Text style={pm.procSub}>Please wait, do not close this screen</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={pm.root}>

      <View style={pm.header}>
        <TouchableOpacity onPress={step === 'form' ? () => setStep('select') : onClose} style={pm.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={pm.headerTitle}>
          {step === 'form' ? safeStr(selMethod?.name) : 'Choose Payment Method'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[pm.amtBanner, { backgroundColor: `${accentColor}12` }]}>
        <MaterialIcons name="payment" size={16} color={accentColor} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[pm.amtBannerTxt, { color: accentColor }]}>
            {`Paying ${fmt(loan.total)}${selMethod?.fee > 0 ? ` + ${fmt(selMethod.fee)} fee` : ''}`}
          </Text>
          <Text style={pm.amtBannerSub}>{`Loan #${loan.id} · ${loan.lender}`}</Text>
        </View>
      </View>

      {step === 'select' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {(['wallet', 'ewallet', 'bank', 'card']).map(cat => (
            <View key={cat}>
              <Text style={pm.catLabel}>{CAT_LABELS[cat]}</Text>
              {METHODS.filter(m => m.cat === cat).map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[pm.methodCard, selMethod?.id === m.id ? { borderColor: accentColor, backgroundColor: `${accentColor}08` } : null]}
                  onPress={() => setSelMethod(m)}
                >
                  <View style={[pm.methodIcon, { backgroundColor: `${m.color}18` }]}>
                    <MaterialIcons name={m.icon} size={24} color={m.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={pm.methodName}>{m.name}</Text>
                    <Text style={pm.methodDesc}>{`${m.desc}${m.fee > 0 ? `  ·  +${fmt(m.fee)} fee` : '  ·  Free'}`}</Text>
                  </View>
                  <View style={[pm.radioOuter, selMethod?.id === m.id ? { borderColor: accentColor } : null]}>
                    {selMethod?.id === m.id && <View style={[pm.radioInner, { backgroundColor: accentColor }]} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {selMethod && (
            <View style={pm.feeBox}>
              <View style={pm.feeRow}>
                <Text style={pm.feeLbl}>Loan Payment</Text>
                <Text style={pm.feeVal}>{fmt(loan.total)}</Text>
              </View>
              <View style={pm.feeRow}>
                <Text style={pm.feeLbl}>Transaction Fee</Text>
                <Text style={[pm.feeVal, selMethod.fee === 0 ? { color: GREEN } : null]}>
                  {selMethod.fee === 0 ? 'FREE' : fmt(selMethod.fee)}
                </Text>
              </View>
              <View style={pm.feeRowTotal}>
                <Text style={pm.feeLblBold}>Total to Pay</Text>
                <Text style={[pm.feeValBold, { color: accentColor }]}>
                  {fmt(Number(loan.total) + selMethod.fee)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[pm.primaryBtn, { backgroundColor: selMethod ? accentColor : '#C4B5FD' }]}
            onPress={handleContinue}
            disabled={!selMethod}
          >
            <Text style={pm.primaryBtnTxt}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={18} color="white" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === 'form' && selMethod && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>

          {selMethod.cat === 'ewallet' && (
            <>
              <View style={pm.instrBox}>
                <Text style={pm.instrTitle}>{`How to pay via ${selMethod.name}`}</Text>
                {[
                  `Open your ${selMethod.name} app`,
                  'Scan the QR code or send to the number below',
                  `Use reference: Loan #${loan.id}`,
                  'Enter your transaction reference number below',
                ].map((t, i) => (
                  <View key={i} style={pm.instrRow}>
                    <View style={[pm.instrNum, { backgroundColor: accentColor }]}>
                      <Text style={pm.instrNumTxt}>{String(i + 1)}</Text>
                    </View>
                    <Text style={pm.instrTxt}>{t}</Text>
                  </View>
                ))}
              </View>
              <View style={pm.qrBox}>
                <MaterialIcons name="qr-code-2" size={100} color={accentColor} />
                <Text style={pm.qrTxt}>{`QR Code — ${selMethod.name}`}</Text>
                <View style={pm.sendToRow}>
                  <MaterialIcons name="smartphone" size={16} color={accentColor} />
                  <Text style={[pm.sendToTxt, { color: accentColor }]}>Send to: 0999 999 9999</Text>
                </View>
                <Text style={pm.sendAmt}>{fmt(loan.total)}</Text>
                <Text style={pm.sendRef}>{`Ref: ${loan.id}`}</Text>
              </View>
              <Text style={pm.fieldLbl}>Transaction Reference Number</Text>
              <TextInput
                style={pm.input}
                placeholder="e.g. GC12345678"
                value={txRef}
                onChangeText={setTxRef}
                autoCapitalize="characters"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={[pm.primaryBtn, { backgroundColor: txRef.length < 8 ? '#C4B5FD' : accentColor }]}
                onPress={handleSubmitForm}
                disabled={txRef.length < 8}
              >
                <Text style={pm.primaryBtnTxt}>Submit Payment</Text>
              </TouchableOpacity>
            </>
          )}

          {selMethod.cat === 'bank' && (
            <>
              <View style={pm.bankCard}>
                <Text style={pm.bankCardTitle}>Transfer to this account</Text>
                {[
                  ['Bank',           selMethod.name],
                  ['Account Name',   'Lora Finance Corporation'],
                  ['Account Number', '1234 5678 9012'],
                  ['Reference',      `Loan ${loan.id}`],
                  ['Amount',         fmt(Number(loan.total) + selMethod.fee)],
                ].map(([k, v]) => (
                  <View key={k} style={pm.bankRow}>
                    <Text style={pm.bankKey}>{k}</Text>
                    <Text style={[pm.bankVal, k === 'Amount' ? { color: accentColor, fontWeight: '800' } : null]}>{v}</Text>
                  </View>
                ))}
              </View>
              <Text style={pm.fieldLbl}>Upload Payment Receipt</Text>
              <TouchableOpacity
                style={[pm.uploadBtn, receipt ? pm.uploadBtnDone : null]}
                onPress={() => Alert.alert('Upload Receipt', 'Choose method:', [
                  { text: 'Take Photo',          onPress: () => setReceipt({ name: 'receipt_photo.jpg' }) },
                  { text: 'Choose from Gallery', onPress: () => setReceipt({ name: 'receipt_upload.jpg' }) },
                  { text: 'Cancel', style: 'cancel' },
                ])}
              >
                <MaterialIcons name={receipt ? 'check-circle' : 'cloud-upload'} size={22} color={receipt ? GREEN : accentColor} />
                <Text style={[pm.uploadBtnTxt, { color: receipt ? GREEN : accentColor }]}>
                  {receipt ? `Uploaded: ${receipt.name}` : 'Upload Receipt (Photo / PDF)'}
                </Text>
              </TouchableOpacity>
              <Text style={pm.fieldLbl}>Reference / Confirmation Number</Text>
              <TextInput
                style={pm.input}
                placeholder="From your bank receipt"
                value={bankRef}
                onChangeText={setBankRef}
                autoCapitalize="characters"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={pm.verifyNote}>⏱ Payment verified within 1–3 business days</Text>
              <TouchableOpacity
                style={[pm.primaryBtn, { backgroundColor: (!receipt || !bankRef) ? '#C4B5FD' : accentColor }]}
                onPress={handleSubmitForm}
                disabled={!receipt || !bankRef}
              >
                <Text style={pm.primaryBtnTxt}>Submit for Verification</Text>
              </TouchableOpacity>
            </>
          )}

          {selMethod.cat === 'card' && (
            <>
              <Text style={pm.fieldLbl}>Card Number</Text>
              <TextInput
                style={pm.input} placeholder="0000 0000 0000 0000" keyboardType="number-pad" maxLength={19}
                value={card.number}
                onChangeText={t => setCard({ ...card, number: t.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={pm.fieldLbl}>Cardholder Name</Text>
              <TextInput
                style={pm.input} placeholder="JUAN DELA CRUZ" autoCapitalize="characters"
                value={card.name} onChangeText={t => setCard({ ...card, name: t })}
                placeholderTextColor="#9CA3AF"
              />
              <View style={pm.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={pm.fieldLbl}>Expiry (MM/YY)</Text>
                  <TextInput
                    style={pm.input} placeholder="MM/YY" keyboardType="number-pad" maxLength={5}
                    value={card.expiry}
                    onChangeText={t => { let f = t.replace(/\D/g, ''); if (f.length >= 2) f = f.slice(0, 2) + '/' + f.slice(2, 4); setCard({ ...card, expiry: f }); }}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={pm.fieldLbl}>CVV</Text>
                  <TextInput
                    style={pm.input} placeholder="123" keyboardType="number-pad" maxLength={4} secureTextEntry
                    value={card.cvv} onChangeText={t => setCard({ ...card, cvv: t })}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={pm.feeBox}>
                <View style={pm.feeRow}>
                  <Text style={pm.feeLbl}>Loan Payment</Text>
                  <Text style={pm.feeVal}>{fmt(loan.total)}</Text>
                </View>
                <View style={pm.feeRow}>
                  <Text style={pm.feeLbl}>Service Fee (1.6%)</Text>
                  <Text style={pm.feeVal}>{fmt(selMethod.fee)}</Text>
                </View>
                <View style={pm.feeRowTotal}>
                  <Text style={pm.feeLblBold}>Total</Text>
                  <Text style={[pm.feeValBold, { color: accentColor }]}>{fmt(Number(loan.total) + selMethod.fee)}</Text>
                </View>
              </View>
              <TouchableOpacity style={[pm.primaryBtn, { backgroundColor: accentColor }]} onPress={handleSubmitForm}>
                <Text style={pm.primaryBtnTxt}>{`Pay ${fmt(Number(loan.total) + selMethod.fee)}`}</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles: Main ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F5F6FA' },
  scroll:     { padding: 16, paddingBottom: 60 },
  loading:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingTxt: { fontSize: 15, color: '#6B7280' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 13 },
  headerBtn:    { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: 'white' },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

  processingBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#FDE68A' },
  processingIconWrap:{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  processingTitle:   { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 3 },
  processingMsg:     { fontSize: 12, color: '#78350F', lineHeight: 18 },
  processingDate:    { fontSize: 11, color: '#B45309', marginTop: 4 },

  urgentBanner: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
  urgentRed:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  urgentOrange: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  urgentTitle:  { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  urgentMsg:    { fontSize: 12, lineHeight: 17 },

  amountCard:   { borderRadius: 22, padding: 22, marginBottom: 14, alignItems: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  amountCardTop:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 },
  loanChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  loanChipTxt:  { fontSize: 11, color: 'white', fontWeight: '600' },
  amountLender: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  amountLbl:    { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginBottom: 4 },
  amountBig:    { color: 'white', fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  dueDateTxt:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 },
  lateFeeChip:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  lateFeeChipTxt:{ color: '#FEF2F2', fontSize: 11, fontWeight: '600' },
  strip:        { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 14, marginTop: 18, width: '100%' },
  stripItem:    { flex: 1, alignItems: 'center' },
  stripDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },
  stripLbl:     { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 4, fontWeight: '500' },
  stripVal:     { fontSize: 14, fontWeight: '700', color: 'white' },

  infoCard:    { backgroundColor: 'white', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  infoHeader:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  loanIconWrap:{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoId:      { fontSize: 11, color: '#9CA3AF', marginBottom: 2, fontWeight: '500' },
  infoLender:  { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  infoPurpose: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },

  progressSection:  { marginBottom: 14 },
  progressTopRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressBottomRow:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  progressPct:  { fontSize: 13, fontWeight: '700' },
  progressNote: { fontSize: 11, color: '#9CA3AF' },
  track:        { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  trackFill:    { height: '100%', borderRadius: 4 },

  statsRow:  { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 12 },
  statItem:  { flex: 1, alignItems: 'center' },
  statBorder:{ borderLeftWidth: 1, borderLeftColor: '#E5E7EB' },
  statVal:   { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  statLbl:   { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },

  expandBtn:    { alignSelf: 'center', paddingVertical: 8, marginTop: 2 },
  expandBtnTxt: { fontSize: 13, fontWeight: '700' },

  detailsBox:      { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 8 },
  detailSectionLbl:{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  detailRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailKey:       { fontSize: 12, color: '#6B7280', flex: 1 },
  detailVal:       { fontSize: 12, fontWeight: '600', color: '#1F2937', textAlign: 'right', flex: 1 },

  payBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 16, marginBottom: 14, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  payBtnTxt: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },

  tipsCard:   { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tipsTitle:  { fontSize: 13, fontWeight: '700', color: '#92400E' },
  tip:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  tipDot:     { width: 5, height: 5, borderRadius: 3, backgroundColor: AMBER, marginTop: 6 },
  tipTxt:     { fontSize: 12, color: '#78350F', flex: 1, lineHeight: 18 },

  successOverlay:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 20 },
  successCard:     { backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center' },
  successIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  successTitle:    { fontSize: 21, fontWeight: '900', color: '#1F2937', marginBottom: 6, textAlign: 'center' },
  successMsg:      { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  successDetails:  { width: '100%', backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 18 },
  successRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  successKey:      { fontSize: 12, color: '#6B7280', flex: 1 },
  successVal:      { fontSize: 12, fontWeight: '600', color: '#1F2937', textAlign: 'right', flex: 1 },
  successBtns:     { flexDirection: 'row', gap: 10, width: '100%' },
  successBtnSecondary:    { flex: 1, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' },
  successBtnSecondaryTxt: { fontWeight: '700', fontSize: 14, color: '#374151' },
  successBtnPrimary:      { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  successBtnPrimaryTxt:   { color: 'white', fontWeight: '700', fontSize: 14 },
});

// ─── Styles: PayMethodScreen ──────────────────────────────────────────────────
const pm = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#F5F6FA' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 16, fontWeight: '700', color: '#1F2937' },

  amtBanner:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  amtBannerTxt:{ fontSize: 14, fontWeight: '700' },
  amtBannerSub:{ fontSize: 11, color: '#9CA3AF', marginTop: 1 },

  catLabel:   { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 8, marginTop: 14, textTransform: 'uppercase' },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  methodIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  methodName: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 3 },
  methodDesc: { fontSize: 11, color: '#6B7280' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  feeBox:     { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginVertical: 14 },
  feeRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  feeRowTotal:{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 4 },
  feeLbl:     { fontSize: 13, color: '#6B7280' },
  feeVal:     { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  feeLblBold: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  feeValBold: { fontSize: 16, fontWeight: '800' },

  primaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  primaryBtnTxt:{ color: 'white', fontSize: 15, fontWeight: '700' },

  procTxt: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#374151' },
  procSub: { marginTop: 6,  fontSize: 13, color: '#9CA3AF' },

  instrBox:   { backgroundColor: '#EDE9FE', borderRadius: 14, padding: 14, marginBottom: 14 },
  instrTitle: { fontSize: 13, fontWeight: '700', color: '#4C1D95', marginBottom: 12 },
  instrRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  instrNum:   { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  instrNumTxt:{ color: 'white', fontSize: 11, fontWeight: '800' },
  instrTxt:   { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },

  qrBox:    { alignItems: 'center', backgroundColor: 'white', borderRadius: 18, padding: 22, marginBottom: 14, borderWidth: 2, borderColor: '#DDD6FE', borderStyle: 'dashed' },
  qrTxt:    { fontSize: 13, color: '#6B7280', marginTop: 8 },
  sendToRow:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  sendToTxt:{ fontSize: 14, fontWeight: '600' },
  sendAmt:  { fontSize: 24, fontWeight: '900', color: '#1F2937', marginTop: 6, letterSpacing: -0.5 },
  sendRef:  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  bankCard:     { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#DDD6FE' },
  bankCardTitle:{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  bankRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  bankKey:      { fontSize: 13, color: '#6B7280' },
  bankVal:      { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  uploadBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 10, borderStyle: 'dashed', borderColor: '#DDD6FE', backgroundColor: '#FAFAFF' },
  uploadBtnDone:{ borderColor: GREEN, backgroundColor: '#F0FDF4' },
  uploadBtnTxt: { fontWeight: '600', fontSize: 13 },
  verifyNote:   { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 10 },

  fieldLbl: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input:    { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#1F2937', marginBottom: 4 },
  twoCol:   { flexDirection: 'row', gap: 10 },
});

export default PayNowScreen;