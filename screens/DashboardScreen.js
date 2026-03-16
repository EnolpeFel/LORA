import React, { useState, useEffect, useRef, createContext } from 'react';
import {
  Dimensions, Image, ScrollView, StyleSheet, Switch,
  Text, TouchableOpacity, View, Modal, TextInput, Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import LoanStore, { getCreditTier, fmtCurrency, CREDIT_TIERS } from './Loanstore.js';

const { width } = Dimensions.get('window');

// ─── Dark-mode context ────────────────────────────────────────────────────────
export const ThemeContext = createContext({ dark: false, toggle: () => {} });

// ─── Wallet banks / methods ───────────────────────────────────────────────────
const BANKS = [
  { id: 'gcash',        name: 'GCash',         icon: '💳', fee: 0,  proc: 'Instant', color: '#008C5A', inputType: 'mobile',  ph: '0912 345 6789' },
  { id: 'maya',         name: 'Maya',          icon: '💳', fee: 0,  proc: 'Instant', color: '#0056A8', inputType: 'mobile',  ph: '0912 345 6789' },
  { id: 'bpi',          name: 'BPI',           icon: '🏦', fee: 25, proc: '1-2 hrs', color: '#C40B2C', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'bdo',          name: 'BDO',           icon: '🏦', fee: 25, proc: '1-2 hrs', color: '#9E0B0F', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'metrobank',    name: 'Metrobank',     icon: '🏦', fee: 25, proc: '1-2 hrs', color: '#0F4B9C', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'unionbank',    name: 'UnionBank',     icon: '🏦', fee: 15, proc: 'Instant', color: '#FF6B00', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'landbank',     name: 'LandBank',      icon: '🏦', fee: 20, proc: '1-2 hrs', color: '#0055A5', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'securitybank', name: 'Security Bank', icon: '🏦', fee: 25, proc: '1-2 hrs', color: '#FFCD00', inputType: 'account', ph: '1234 5678 9012' },
];

// ─── Transaction row ──────────────────────────────────────────────────────────
const TxRow = ({ tx, C }) => {
  const isOut = ['Transfer Out', 'QR Payment'].includes(tx.type);
  const emoji = {
    'Transfer Out':      '📤',
    'Cash In':           '📥',
    'QR Payment':        '📲',
    'Loan Disbursement': '🏦',
    'Payment':           '💸',
  }[tx.type] || '💳';

  return (
    <View style={[styles.txRow, { borderBottomColor: C.border }]}>
      <View style={[styles.txIcon, { backgroundColor: isOut ? '#FEF2F2' : '#F0FDF4' }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={styles.txMid}>
        <Text style={[styles.txType, { color: C.text }]}>{tx.type}</Text>
        <Text style={[styles.txDate, { color: C.subtext }]}>
          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmt, { color: isOut ? '#EF4444' : '#10B981' }]}>
          {isOut ? '-' : '+'}₱{tx.amount.toFixed(2)}
        </Text>
        <View style={[styles.txPill, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.txStatus, { color: '#166534' }]}>{tx.status}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const DashboardScreen = ({ navigation, route }) => {
  const [dark, setDark] = useState(false);
  const [unread, setUnread] = useState(true);

  // modals
  const [showNotif,      setShowNotif]      = useState(false);
  const [showCredit,     setShowCredit]     = useState(false);
  const [showLoanStatus, setShowLoanStatus] = useState(false);
  const [showHowToLoan,  setShowHowToLoan]  = useState(false);
  const [showSettings,   setShowSettings]   = useState(false);
  const [showHistory,    setShowHistory]    = useState(false);

  // wallet
  const [balance,      setBalance]      = useState(15250.75);
  const [hideBalance,  setHideBalance]  = useState(false);
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'Transfer Out',      amount: 2500,  to: 'Juan Dela Cruz', bank: 'GCash',  date: new Date().toISOString(),                    status: 'Completed', note: 'Services' },
    { id: 2, type: 'Cash In',           amount: 5000,  source: 'GCash',      date: new Date(Date.now() - 86400000).toISOString(),    status: 'Completed' },
    { id: 3, type: 'QR Payment',        amount: 850,   merchant: 'Coffee Shop', date: new Date(Date.now() - 172800000).toISOString(), status: 'Completed' },
    { id: 4, type: 'Loan Disbursement', amount: 49000,                          date: new Date(Date.now() - 259200000).toISOString(), status: 'Completed' },
  ]);

  // ── Reactive LoanStore subscription ──────────────────────────────────────
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    LoanStore.subscribe(listener);
    return () => LoanStore.unsubscribe(listener);
  }, []);

  // ── Credit score — derived from active loan or default ────────────────────
  const activeLoan   = LoanStore.getActiveLoan();
  const loanHistory  = LoanStore.getLoanHistory();          // failed + completed only
  const allStoreTxns = LoanStore.getTransactions();

  const [creditScore, setCreditScore] = useState(
    activeLoan?.creditScore ?? 560
  );
  const [loanAppStatus, setLoanAppStatus] = useState(null);
  const [clock, setClock] = useState('');

  const [notifications, setNotifications] = useState([
    { id: 1, icon: 'stars',                  iconColor: '#F59E0B', iconBg: '#FFFBEB', title: 'Points Earned! +20 pts',  msg: 'On-time loan repayment credited.',   time: '2 hrs ago',  read: false },
    { id: 2, icon: 'check-circle',           iconColor: '#10B981', iconBg: '#ECFDF5', title: 'Loan Approved',           msg: 'Your loan has been approved.',       time: '1 day ago',  read: true  },
    { id: 3, icon: 'workspace-premium',      iconColor: '#FB923C', iconBg: '#FFF7ED', title: 'Tier Upgrade 🎉 Gold',   msg: 'You reached Gold tier!',             time: '3 days ago', read: true  },
    { id: 4, icon: 'payment',                iconColor: '#3B82F6', iconBg: '#EFF6FF', title: 'Payment Due Soon',        msg: 'Payment of ₱2,273 due Aug 5, 2025.', time: '4 days ago', read: true  },
    { id: 5, icon: 'account-balance-wallet', iconColor: '#10B981', iconBg: '#ECFDF5', title: 'Cash In Successful',     msg: '₱5,000 added via GCash.',            time: '5 days ago', read: true  },
  ]);

  // ── Colour palette ────────────────────────────────────────────────────────
  const C = {
    bg:          dark ? '#0F172A' : '#F3F4F6',
    card:        dark ? '#1E293B' : '#FFFFFF',
    border:      dark ? '#334155' : '#E5E7EB',
    text:        dark ? '#F1F5F9' : '#1F2937',
    subtext:     dark ? '#94A3B8' : '#6B7280',
    faint:       dark ? '#334155' : '#F9FAFB',
    headerBg:    dark ? '#1E293B' : '#FFFFFF',
    modalBg:     dark ? '#1E293B' : '#FFFFFF',
    inputBg:     dark ? '#0F172A' : '#F9FAFB',
    inputBorder: dark ? '#334155' : '#E5E7EB',
    purple:      '#FB923C',
    green:       '#10B981',
    amber:       '#F59E0B',
    red:         '#EF4444',
  };

  const tier = getCreditTier(creditScore);

  // ── Live clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).toUpperCase());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const addNotif = (n) => { setNotifications(p => [n, ...p]); setUnread(true); };

  // ── Incoming navigation params ─────────────────────────────────────────────
  // Use a ref to track which loanIds we've already processed so the effect
  // never fires twice for the same disbursement, and we never call setParams
  // inside the effect (which would re-trigger it and cause infinite loops).
  const processedDisbursements = useRef(new Set());

  const loanDisbursement = route.params?.loanDisbursement;
  const newTransaction   = route.params?.newTransaction;

  useEffect(() => {
    if (loanDisbursement) {
      const key = loanDisbursement.loanId;
      // Guard: only process each disbursement once
      if (!processedDisbursements.current.has(key)) {
        processedDisbursements.current.add(key);

        const amt = loanDisbursement.netRelease || 0;
        setBalance(prev => prev + amt);
        setTransactions(prev => [{
          id:     `DISB-${key}`,
          type:   'Loan Disbursement',
          amount: amt,
          source: loanDisbursement.lender,
          date:   loanDisbursement.date || new Date().toISOString(),
          status: 'Completed',
          note:   `${loanDisbursement.loanType} · ${key}`,
        }, ...prev]);
        addNotif({
          id:        `NOTIF-${key}`,
          icon:      'account-balance',
          iconColor: '#10B981',
          iconBg:    '#ECFDF5',
          title:     '💸 Loan Disbursed!',
          msg:       `${fmtCurrency(amt)} from ${loanDisbursement.lender} added to your wallet.`,
          time:      'Just now',
          read:      false,
        });
        const currentActive = LoanStore.getActiveLoan();
        if (currentActive?.creditScore) setCreditScore(currentActive.creditScore);
      }
    }
  }, [loanDisbursement]);

  useEffect(() => {
    if (newTransaction) {
      setTransactions(p => [newTransaction, ...p]);
      if (newTransaction.amount) setBalance(p => Math.max(0, p - (newTransaction.amount || 0)));
    }
  }, [newTransaction]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const handleTransfer = (tx) => {
    setBalance(prev => prev - tx.amount);
    setTransactions(prev => [{ id: Date.now(), type: 'Transfer Out', amount: tx.amount, to: tx.to, bank: tx.bank, date: tx.date, status: 'Completed', note: tx.note }, ...prev]);
    setCreditScore(prev => Math.min(850, prev + 5));
    addNotif({ id: Date.now(), icon: 'send', iconColor: '#FB923C', iconBg: '#FFF7ED', title: 'Transfer Successful', msg: `₱${tx.amount.toFixed(2)} sent to ${tx.to}`, time: 'Just now', read: false });
  };

  const handleCashIn = (tx) => {
    setBalance(prev => prev + tx.amount);
    setTransactions(prev => [{ id: Date.now(), type: 'Cash In', amount: tx.amount, source: tx.method, date: tx.date, status: 'Completed' }, ...prev]);
    if (tx.amount >= 1000) setCreditScore(prev => Math.min(850, prev + 5));
    addNotif({ id: Date.now(), icon: 'add-circle', iconColor: '#10B981', iconBg: '#ECFDF5', title: 'Cash In Successful', msg: `₱${tx.amount.toFixed(2)} added via ${tx.method}`, time: 'Just now', read: false });
  };

  const handleQRPay = (tx) => {
    setBalance(prev => prev - tx.amount);
    setTransactions(prev => [{ id: Date.now(), type: 'QR Payment', amount: tx.amount, merchant: 'QR Merchant', date: tx.date, status: 'Completed' }, ...prev]);
    setCreditScore(prev => Math.min(850, prev + 5));
    addNotif({ id: Date.now(), icon: 'qr-code', iconColor: '#3B82F6', iconBg: '#EFF6FF', title: 'QR Payment Successful', msg: `₱${tx.amount.toFixed(2)} paid`, time: 'Just now', read: false });
  };

  const handleLogout = () => Alert.alert('Log Out', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log Out', style: 'destructive', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }) },
  ]);

  const markAllRead = () => { setNotifications(ns => ns.map(n => ({ ...n, read: true }))); setUnread(false); };

  // ── Reusable buttons ──────────────────────────────────────────────────────
  const PrimaryBtn = ({ title, onPress, disabled }) => (
    <TouchableOpacity style={[styles.primaryBtn, disabled && styles.disabledBtn]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryBtnTxt}>{title}</Text>
    </TouchableOpacity>
  );
  const SecondaryBtn = ({ title, onPress }) => (
    <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: C.faint }]} onPress={onPress}>
      <Text style={[styles.secondaryBtnTxt, { color: C.text }]}>{title}</Text>
    </TouchableOpacity>
  );

  // ── Modal wrappers ────────────────────────────────────────────────────────
  const BottomSheet = ({ visible, onClose, children, tall }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: C.modalBg, maxHeight: tall ? '92%' : '85%' }]}>
          <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
            <MaterialIcons name="close" size={22} color={C.subtext} />
          </TouchableOpacity>
          {children}
        </View>
      </View>
    </Modal>
  );

  const FullModal = ({ visible, onClose, title, children, rightAction }) => (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.fullModal, { backgroundColor: C.bg }]}>
        <View style={[styles.fullModalHeader, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <MaterialIcons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.fullModalTitle, { color: C.text }]}>{title}</Text>
          {rightAction || <View style={{ width: 32 }} />}
        </View>
        {children}
      </SafeAreaView>
    </Modal>
  );

  // ── Transaction History ───────────────────────────────────────────────────
  const HistoryModal = () => {
    const totalIn  = transactions.filter(t => ['Cash In', 'Loan Disbursement'].includes(t.type)).reduce((a, t) => a + t.amount, 0);
    const totalOut = transactions.filter(t => ['Transfer Out', 'QR Payment'].includes(t.type)).reduce((a, t) => a + t.amount, 0);
    return (
      <FullModal visible={showHistory} onClose={() => setShowHistory(false)} title="Wallet History">
        <View style={[styles.histSum, { backgroundColor: C.card, borderBottomColor: C.border }]}>
          {[
            ['Total In',  `+₱${totalIn.toFixed(2)}`,  '#10B981'],
            ['Total Out', `-₱${totalOut.toFixed(2)}`, '#EF4444'],
            ['Txns',      transactions.length,         C.text],
          ].map(([k, v, c]) => (
            <View key={k} style={styles.histSumItem}>
              <Text style={[styles.histSumVal, { color: c }]}>{v}</Text>
              <Text style={[styles.histSumLbl, { color: C.subtext }]}>{k}</Text>
            </View>
          ))}
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {transactions.map(tx => (
            <View key={tx.id} style={[styles.histCard, { backgroundColor: C.card }]}>
              <TxRow tx={tx} C={C} />
            </View>
          ))}
        </ScrollView>
      </FullModal>
    );
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const NotifModal = () => (
    <FullModal visible={showNotif} onClose={() => setShowNotif(false)} title="Notifications"
      rightAction={
        <TouchableOpacity onPress={markAllRead}>
          <Text style={{ color: C.purple, fontSize: 12, fontWeight: '600' }}>Mark all read</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView>
        {notifications.map(n => (
          <TouchableOpacity
            key={n.id}
            style={[styles.notifRow, { borderBottomColor: C.border }, !n.read && { backgroundColor: dark ? '#1E2D4A' : '#F5F3FF' }]}
            onPress={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
          >
            <View style={[styles.notifIcon, { backgroundColor: n.iconBg }]}>
              <MaterialIcons name={n.icon} size={20} color={n.iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.notifTitle, { color: C.text }]}>{n.title}</Text>
                {!n.read && <View style={[styles.unreadDot, { backgroundColor: C.purple }]} />}
              </View>
              <Text style={[styles.notifMsg, { color: C.subtext }]}>{n.msg}</Text>
              <Text style={[styles.notifTime, { color: C.subtext }]}>{n.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </FullModal>
  );

  // ── Credit Score ──────────────────────────────────────────────────────────
  const CreditModal = () => (
    <BottomSheet visible={showCredit} onClose={() => setShowCredit(false)} tall>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sheetTitle, { color: C.text }]}>Your Credit Profile</Text>
        <View style={styles.scoreCircleWrap}>
          <View style={[styles.scoreCircleOuter, { backgroundColor: C.faint }]}>
            {[
              { color: '#EF4444', start: 0   },
              { color: '#F97316', start: 54  },
              { color: '#F59E0B', start: 108 },
              { color: '#10B981', start: 162 },
              { color: '#059669', start: 216 },
            ].map((seg, i) => {
              const needle = ((creditScore - 200) / 650) * 270;
              return (
                <View key={i} style={[styles.scoreArc, { borderColor: seg.color, transform: [{ rotate: `${-135 + seg.start}deg` }], opacity: needle >= seg.start ? 1 : 0.15 }]} />
              );
            })}
            <View style={[styles.scoreInner, { backgroundColor: C.card }]}>
              <Text style={[styles.scoreNum,  { color: C.text }]}>{creditScore}</Text>
              <Text style={[styles.scoreTier, { color: tier.color }]}>{tier.label.toUpperCase()}</Text>
              <Text style={[styles.scoreOf,   { color: C.subtext }]}>/ 850</Text>
            </View>
          </View>
        </View>

        {/* Tier Ladder */}
        <View style={[styles.tierLadder, { backgroundColor: C.faint }]}>
          <Text style={[styles.tierTitle, { color: C.text }]}>Loan Tier Ladder</Text>
          {[
            { r: '200–299', l: '₱5,000',   min: 200 },
            { r: '300–399', l: '₱10,000',  min: 300 },
            { r: '400–499', l: '₱20,000',  min: 400 },
            { r: '500+',    l: '₱50,000+', min: 500 },
          ].map((t, i) => {
            const isActive = creditScore >= t.min && (i === 3 || creditScore < [300, 400, 500, 851][i]);
            return (
              <View key={i} style={[styles.tierRow, { borderBottomColor: C.border }, isActive && { backgroundColor: dark ? '#431407' : '#FFF7ED', borderRadius: 8, paddingHorizontal: 8 }]}>
                <Text style={[styles.tierRange, { color: isActive ? C.purple : C.subtext, fontWeight: isActive ? '700' : '400' }]}>{t.r}</Text>
                <Text style={[styles.tierLoan,  { color: isActive ? C.purple : C.text }]}>{t.l}</Text>
                {isActive && <MaterialIcons name="check-circle" size={15} color={C.purple} />}
              </View>
            );
          })}
          <Text style={[styles.tierHint, { color: C.subtext }]}>Pay on time (+20 pts) or do transactions (+5 pts).</Text>
        </View>

        {/* Score Factors */}
        <Text style={[styles.scoreFactorsTitle, { color: C.text }]}>Score Factors</Text>
        {[
          { t: 'Payment History',    p: 85, c: '#10B981' },
          { t: 'Credit Utilization', p: 70, c: '#F59E0B' },
          { t: 'History Length',     p: 60, c: '#FB923C' },
          { t: 'Credit Mix',         p: 75, c: '#10B981' },
          { t: 'New Credit',         p: 80, c: '#10B981' },
        ].map((f, i) => (
          <View key={i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: C.text }}>{f.t}</Text>
              <Text style={{ fontSize: 13, color: C.subtext }}>{f.p}%</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: C.faint }}>
              <View style={{ width: `${f.p}%`, height: '100%', backgroundColor: f.c, borderRadius: 3 }} />
            </View>
          </View>
        ))}
        <View style={styles.rowBtns}>
          <SecondaryBtn title="Full Report" onPress={() => { setShowCredit(false); navigation.navigate('CreditReport'); }} />
          <PrimaryBtn title="Apply for Loan" onPress={() => { setShowCredit(false); navigation.navigate('LoanApplication'); }} />
        </View>
      </ScrollView>
    </BottomSheet>
  );

  // ── How to Loan ───────────────────────────────────────────────────────────
  const HowToLoanModal = () => (
    <BottomSheet visible={showHowToLoan} onClose={() => setShowHowToLoan(false)} tall>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sheetTitle, { color: C.text }]}>How to Get a Loan</Text>
        {[
          { n: '1', t: 'Check Your Credit Score', d: 'Your score determines how much you can borrow and at what rate.' },
          { n: '2', t: 'Apply Online',            d: 'Fill out the form: amount, term, purpose, and select lenders.' },
          { n: '3', t: 'Upload Documents',        d: 'Submit valid ID, payslip, and other required files.' },
          { n: '4', t: 'Wait for Approval',       d: 'Lenders review within 1–5 business days.' },
          { n: '5', t: 'Receive Funds',            d: 'Approved loan is deposited directly to your Lora wallet.' },
        ].map(step => (
          <View key={step.n} style={styles.howStep}>
            <View style={[styles.howNum, { backgroundColor: C.purple }]}>
              <Text style={styles.howNumTxt}>{step.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.howTitle, { color: C.text }]}>{step.t}</Text>
              <Text style={[styles.howDesc,  { color: C.subtext }]}>{step.d}</Text>
            </View>
          </View>
        ))}
        <PrimaryBtn title="Apply Now" onPress={() => { setShowHowToLoan(false); navigation.navigate('LoanApplication'); }} />
      </ScrollView>
    </BottomSheet>
  );

  // ── Loan Status Modal ─────────────────────────────────────────────────────
  const LoanStatusModal = () => (
    <BottomSheet visible={showLoanStatus} onClose={() => setShowLoanStatus(false)}>
      <MaterialIcons name="check-circle" size={52} color="#10B981" style={{ alignSelf: 'center', marginBottom: 12 }} />
      <Text style={[styles.sheetTitle, { color: C.text, textAlign: 'center' }]}>Application Submitted!</Text>
      <Text style={[{ textAlign: 'center', marginBottom: 16, color: C.subtext }]}>Your loan is being processed.</Text>
      {loanAppStatus && (
        <View style={[styles.confirmBox, { backgroundColor: C.faint }]}>
          {[
            ['App ID', loanAppStatus.id],
            ['Amount', loanAppStatus.amount],
            ['Term',   loanAppStatus.term && `${loanAppStatus.term} months`],
          ].map(([k, v]) => v ? (
            <View key={k} style={[styles.confirmRow, { borderBottomColor: C.border }]}>
              <Text style={[styles.confirmKey, { color: C.subtext }]}>{k}</Text>
              <Text style={[styles.confirmVal, { color: C.text }]}>{v}</Text>
            </View>
          ) : null)}
        </View>
      )}
      <PrimaryBtn title="Got it!" onPress={() => setShowLoanStatus(false)} />
    </BottomSheet>
  );

  // ── Settings ──────────────────────────────────────────────────────────────
  const SettingsModal = () => (
    <FullModal visible={showSettings} onClose={() => setShowSettings(false)} title="Settings">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.settingCard, { backgroundColor: C.card }]}>
          <Text style={[styles.settingGroupTitle, { color: C.subtext }]}>APPEARANCE</Text>
          <View style={[styles.settingRow, { borderBottomColor: C.border }]}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="dark-mode" size={22} color={C.purple} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: C.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSub,   { color: C.subtext }]}>Switch to dark theme</Text>
              </View>
            </View>
            <Switch value={dark} onValueChange={setDark} trackColor={{ false: '#D1D5DB', true: '#FB923C' }} thumbColor="white" />
          </View>
        </View>
        <View style={[styles.settingCard, { backgroundColor: C.card }]}>
          <Text style={[styles.settingGroupTitle, { color: C.subtext }]}>SECURITY</Text>
          {[
            { icon: 'fingerprint',   label: 'Biometric Login',    sub: 'Use fingerprint to sign in' },
            { icon: 'lock',          label: 'Change PIN',         sub: 'Update your security PIN' },
            { icon: 'notifications', label: 'Push Notifications', sub: 'Receive alerts and reminders' },
          ].map((item, i, arr) => (
            <TouchableOpacity key={item.label} style={[styles.settingRow, { borderBottomColor: i < arr.length - 1 ? C.border : 'transparent' }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name={item.icon} size={22} color={C.purple} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.settingLabel, { color: C.text }]}>{item.label}</Text>
                  <Text style={[styles.settingSub,   { color: C.subtext }]}>{item.sub}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={C.subtext} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.settingCard, { backgroundColor: C.card }]}>
          <Text style={[styles.settingGroupTitle, { color: C.subtext }]}>ACCOUNT</Text>
          {[
            { icon: 'person',       label: 'Edit Profile',   sub: 'Update your personal info' },
            { icon: 'help-outline', label: 'Help & Support', sub: 'FAQ, contact us' },
            { icon: 'privacy-tip',  label: 'Privacy Policy', sub: 'How we use your data' },
          ].map((item, i, arr) => (
            <TouchableOpacity key={item.label} style={[styles.settingRow, { borderBottomColor: i < arr.length - 1 ? C.border : 'transparent' }]}>
              <View style={styles.settingLeft}>
                <MaterialIcons name={item.icon} size={22} color={C.purple} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.settingLabel, { color: C.text }]}>{item.label}</Text>
                  <Text style={[styles.settingSub,   { color: C.subtext }]}>{item.sub}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={C.subtext} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: C.red }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={C.red} />
          <Text style={[styles.logoutBtnTxt, { color: C.red }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </FullModal>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  const totIn  = transactions.filter(t => ['Cash In', 'Loan Disbursement'].includes(t.type)).reduce((a, t) => a + t.amount, 0);
  const totOut = transactions.filter(t => ['Transfer Out', 'QR Payment'].includes(t.type)).reduce((a, t) => a + t.amount, 0);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(!dark) }}>
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>

        <HistoryModal />
        <NotifModal />
        <CreditModal />
        <SettingsModal />
        <HowToLoanModal />
        <LoanStatusModal />

        {/* ── Top header ── */}
        <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>

          {/* Left — Logo wordmark */}
          <View style={styles.headerLeft}>
            {/* Logo mark: layered hexagonal badge */}
            <View style={styles.logoMark}>
              <Image
                source={require('../assets/LoraLogo.png')}
                style={styles.logoImg}
                resizeMode="cover"
              />
              <View style={[styles.logoMarkAccent, { backgroundColor: dark ? '#A78BFA' : '#FED7AA', borderColor: dark ? '#0F172A' : '#FFFFFF' }]} />
            </View>

            {/* Brand name + tagline */}
            <View style={styles.headerBrandBlock}>
              <View style={styles.headerBrandRow}>
                <Text style={[styles.appName, { color: dark ? '#F1F5F9' : '#1C1007' }]}>Lora</Text>
                <View style={[styles.appBadge, { backgroundColor: dark ? '#4C1D95' : '#FFF7ED' }]}>
                  <Text style={[styles.appBadgeTxt, { color: dark ? '#FED7AA' : '#EA580C' }]}>Finance</Text>
                </View>
              </View>
              {/* Tier pill under brand — driven by real credit tier */}
              <View style={[styles.headerTierPill, { backgroundColor: tier.color + (dark ? '30' : '18') }]}>
                <View style={[styles.headerTierDot, { backgroundColor: tier.color }]} />
                <Text style={[styles.headerTierTxt, { color: tier.color }]}>{tier.label} Member</Text>
              </View>
            </View>
          </View>

          {/* Center — greeting (fills space, truncated) */}
          <View style={styles.headerCenter}>
            <Text style={[styles.headerGreeting, { color: C.subtext }]} numberOfLines={1}>
              {(() => {
                const h = new Date().getHours();
                return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
              })()}
            </Text>
            <Text style={[styles.headerName, { color: C.text }]} numberOfLines={1}>Juan Dela Cruz</Text>
          </View>

          {/* Right — action buttons */}
          <View style={styles.headerRight}>
            {/* Search */}
            <TouchableOpacity
              style={[styles.hIconBtn, { backgroundColor: dark ? '#334155' : '#F1F5F9' }]}
              onPress={() => setShowSettings(true)}
              activeOpacity={0.75}
            >
              <MaterialIcons name="settings" size={18} color={dark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>

            {/* Notifications with badge */}
            <TouchableOpacity
              style={[styles.hIconBtn, { backgroundColor: dark ? '#334155' : '#F1F5F9' }, unread && { backgroundColor: dark ? '#431407' : '#FFF7ED' }]}
              onPress={() => setShowNotif(true)}
              activeOpacity={0.75}
            >
              <MaterialIcons
                name="notifications"
                size={18}
                color={unread ? '#FB923C' : (dark ? '#94A3B8' : '#64748B')}
              />
              {unread && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeTxt}>
                    {notifications.filter(n => !n.read).length > 9 ? '9+' : notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Avatar */}
            <TouchableOpacity
              style={styles.headerAvatar}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <View style={[styles.headerAvatarInner, { backgroundColor: tier.color }]}>
                <Text style={styles.headerAvatarTxt}>JD</Text>
              </View>
              <View style={[styles.headerAvatarStatus, { backgroundColor: '#10B981', borderColor: C.headerBg }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scroll content ── */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Wallet card ── */}
          <View style={styles.walletCard}>
            <View style={styles.walletTop}>
              <View>
                <Text style={styles.walletLabel}>My Wallet</Text>
                <Text style={styles.walletClock}>{clock}</Text>
              </View>
              <TouchableOpacity onPress={() => setHideBalance(h => !h)}>
                <MaterialIcons name={hideBalance ? 'visibility-off' : 'visibility'} size={20} color="rgba(255,255,255,0.75)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.walletAmt}>
              {hideBalance ? '₱ ••••••' : `₱ ${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
            </Text>
            <View style={styles.walletStats}>
              <MaterialIcons name="trending-up"   size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.walletStatTxt}>In ₱{totIn.toFixed(0)}</Text>
              <View style={styles.walletStatSep} />
              <MaterialIcons name="trending-down" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.walletStatTxt}>Out ₱{totOut.toFixed(0)}</Text>
              <View style={styles.walletStatSep} />
              <MaterialIcons name="receipt"       size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.walletStatTxt}>{transactions.length} txns</Text>
            </View>
            <View style={styles.walletActions}>
              {[
                { icon: 'send',              label: 'Transfer', onPress: () => navigation.navigate('Transfer', { balance, onTransfer: handleTransfer }) },
                { icon: 'qr-code',           label: 'Pay QR',   onPress: () => navigation.navigate('QRPay',    { balance, onQRPay: handleQRPay }) },
                { icon: 'add-circle-outline',label: 'Cash In',  onPress: () => navigation.navigate('CashIn',   { balance, onCashIn: handleCashIn }) },
                { icon: 'history',           label: 'History',  onPress: () => setShowHistory(true) },
              ].map(a => (
                <TouchableOpacity key={a.label} style={styles.walletActionBtn} onPress={a.onPress} activeOpacity={0.8}>
                  <View style={styles.walletActionIcon}>
                    <MaterialIcons name={a.icon} size={20} color="#FB923C" />
                  </View>
                  <Text style={styles.walletActionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Summary cards — data from LoanStore ── */}
          <View style={styles.cardRow}>
            {/* Active loan card — shows live data or "no loan" state */}
            <TouchableOpacity
              style={[styles.smallCard, { backgroundColor: C.card }]}
              onPress={() => navigation.navigate(activeLoan ? 'CurrentLoan' : 'LoanApplication')}
            >
              <MaterialIcons name="account-balance" size={20} color={activeLoan ? '#FB923C' : '#9CA3AF'} style={{ marginBottom: 6 }} />
              <Text style={[styles.smallCardLabel, { color: C.subtext }]}>Current Loan</Text>
              {activeLoan ? (
                <>
                  <Text style={[styles.smallCardValue, { color: C.text }]}>{fmtCurrency(activeLoan.amount)}</Text>
                  <Text style={[styles.smallCardSub, { color: '#FB923C' }]}>{activeLoan.creditTier} Tier</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.smallCardValue, { color: '#9CA3AF', fontSize: 13 }]}>No active loan</Text>
                  <Text style={[styles.smallCardSub, { color: '#FB923C' }]}>Tap to apply →</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Next payment card — shows due date or loan history count */}
            <TouchableOpacity
              style={[styles.smallCard, { backgroundColor: C.card }]}
              onPress={() => activeLoan ? navigation.navigate('CurrentLoan') : navigation.navigate('Loans')}
            >
              <MaterialIcons name={activeLoan ? 'event' : 'history'} size={20} color={activeLoan ? '#F59E0B' : '#9CA3AF'} style={{ marginBottom: 6 }} />
              {activeLoan ? (
                <>
                  <Text style={[styles.smallCardLabel, { color: C.subtext }]}>Next Payment</Text>
                  <Text style={[styles.smallCardDate,  { color: '#F59E0B' }]}>{activeLoan.nextDueDate}</Text>
                  <Text style={[styles.smallCardValue, { color: C.text }]}>{fmtCurrency(activeLoan.monthlyPayment)}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.smallCardLabel, { color: C.subtext }]}>Loan History</Text>
                  <Text style={[styles.smallCardValue, { color: C.text }]}>{loanHistory.length} loan{loanHistory.length !== 1 ? 's' : ''}</Text>
                  <Text style={[styles.smallCardSub, { color: '#9CA3AF' }]}>
                    {loanHistory.filter(l => l.status === 'Completed').length} completed · {loanHistory.filter(l => l.status === 'Failed').length} declined
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Credit score card ── */}
          <TouchableOpacity style={[styles.creditCard, { backgroundColor: C.card }]} onPress={() => setShowCredit(true)}>
            <View style={styles.arcWrap}>
              {[
                { color: '#EF4444', start: 0   },
                { color: '#F97316', start: 54  },
                { color: '#F59E0B', start: 108 },
                { color: '#10B981', start: 162 },
                { color: '#059669', start: 216 },
              ].map((seg, i) => {
                const needle = ((creditScore - 200) / 650) * 270;
                return (
                  <View key={i} style={[styles.arcSeg, { borderColor: seg.color, transform: [{ rotate: `${-135 + seg.start}deg` }], opacity: needle >= seg.start ? 1 : 0.18 }]} />
                );
              })}
              <View style={[styles.arcInner, { backgroundColor: C.card }]}>
                <Text style={[styles.arcScore, { color: tier.color }]}>{creditScore}</Text>
                <Text style={[styles.arcTier,  { color: tier.color }]}>{tier.label}</Text>
                <Text style={[styles.arcOf,    { color: C.subtext }]}>/ 850</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.smallCardLabel, { color: C.subtext }]}>Credit Score</Text>
              <Text style={[styles.smallCardValue, { color: C.text }]}>{fmtCurrency(tier.maxLoan)} max</Text>
              <Text style={[styles.creditTierBadge, { color: tier.color }]}>{tier.label} Tier</Text>
              {(() => { const next = CREDIT_TIERS.find(t => t.min > creditScore); return next ? (
                <Text style={[styles.creditPts, { color: C.subtext }]}>{next.min - creditScore} pts to {next.label}</Text>
              ) : null; })()}
              <Text style={[styles.creditTap, { color: C.purple }]}>Tap for details →</Text>
            </View>
          </TouchableOpacity>

          {/* ── Loan promo ── */}
          <View style={[styles.loanCard, { backgroundColor: dark ? '#431407' : '#FFF7ED', borderColor: dark ? '#4C1D95' : '#FFEDD5' }]}>
            <Text style={[styles.loanTitle, { color: C.text }]}>Need a Loan?</Text>
            <Text style={[styles.loanSub,   { color: C.subtext }]}>Get approved in minutes. Quick & secure.</Text>
            <View style={styles.loanBtns}>
              <TouchableOpacity style={styles.loanApplyBtn} onPress={() => navigation.navigate('LoanApplication')}>
                <MaterialIcons name="add" size={16} color="white" />
                <Text style={styles.loanApplyBtnTxt}>Apply for a Loan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.loanHowBtn, { backgroundColor: C.card, borderColor: dark ? '#4C1D95' : '#FFEDD5' }]} onPress={() => setShowHowToLoan(true)}>
                <Text style={[styles.loanHowBtnTxt, { color: C.purple }]}>How to Loan</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Recent transactions — wallet + loan store merged ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => setShowHistory(true)}>
              <Text style={[styles.seeAll, { color: C.purple }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.txList, { backgroundColor: C.card }]}>
            {[
              ...transactions,
              ...allStoreTxns.map(t => ({
                id:     t.id,
                type:   t.type,
                amount: t.amountNum ?? parseFloat(t.amount) ?? 0,
                date:   t.date,
                status: t.status,
              })),
            ]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 4)
              .map(tx => <TxRow key={tx.id} tx={tx} C={C} />)}
          </View>

        </ScrollView>

        {/* ── Bottom nav ── */}
        <View style={[styles.bottomNav, { backgroundColor: C.headerBg, borderTopColor: C.border }]}>
          {[
            { icon: '🏠', label: 'Home',         onPress: () => {} },
            { icon: '💵', label: 'Loans',        onPress: () => navigation.navigate('Loans', { darkMode: dark }) },
            { icon: '📊', label: 'Transactions', onPress: () => navigation.navigate('Transactions') },
            { icon: '👤', label: 'Profile',      onPress: () => navigation.navigate('Profile') },
          ].map(n => (
            <TouchableOpacity key={n.label} style={styles.navItem} onPress={n.onPress}>
              <Text style={styles.navEmoji}>{n.icon}</Text>
              <Text style={[styles.navLabel, { color: n.label === 'Home' ? '#FB923C' : C.subtext }, n.label === 'Home' && { fontWeight: '700' }]}>
                {n.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </ThemeContext.Provider>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1 },
  scrollContent: { paddingBottom: 90 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1 },

  // ── Logo mark ──
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark:        { width: 40, height: 40, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  logoImg:         { width: 40, height: 40, borderRadius: 14,
                     shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  logoMarkAccent:  { position: 'absolute', width: 10, height: 10, borderRadius: 5, bottom: -2, right: -2, borderWidth: 2 },

  // ── Brand text ──
  headerBrandBlock: { justifyContent: 'center', gap: 3 },
  headerBrandRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appName:          { fontSize: 20, fontWeight: '900', letterSpacing: -0.8 },
  appBadge:         { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  appBadgeTxt:      { fontSize: 9, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  headerTierPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, alignSelf: 'flex-start' },
  headerTierDot:    { width: 5, height: 5, borderRadius: 3 },
  headerTierTxt:    { fontSize: 10, fontWeight: '700' },

  // ── Center greeting ──
  headerCenter:    { flex: 1, paddingHorizontal: 12, alignItems: 'center' },
  headerGreeting:  { fontSize: 10, fontWeight: '500', letterSpacing: 0.2 },
  headerName:      { fontSize: 13, fontWeight: '700', marginTop: 1 },

  // ── Right buttons ──
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hIconBtn:        { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge:      { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8,
                     backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifBadgeTxt:   { color: 'white', fontSize: 8, fontWeight: '800' },
  headerAvatar:    { position: 'relative', marginLeft: 2 },
  headerAvatarInner:{ width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  headerAvatarTxt: { color: 'white', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  headerAvatarStatus:{ position: 'absolute', width: 10, height: 10, borderRadius: 5, bottom: -1, right: -1, borderWidth: 2 },

  // ── Legacy kept for notif dot if referenced elsewhere ──
  hBtn:     { padding: 8, position: 'relative' },
  notifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', position: 'absolute', top: 6, right: 6 },
  logo:     { width: 32, height: 32, borderRadius: 16 },

  walletCard:        { margin: 16, borderRadius: 22, backgroundColor: '#FB923C', padding: 20, shadowColor: '#FB923C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 },
  walletTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  walletLabel:       { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  walletClock:       { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 2 },
  walletAmt:         { color: 'white', fontSize: 30, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5 },
  walletStats:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 20 },
  walletStatTxt:     { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500' },
  walletStatSep:     { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' },
  walletActions:     { flexDirection: 'row', justifyContent: 'space-between' },
  walletActionBtn:   { alignItems: 'center', width: '23%' },
  walletActionIcon:  { width: 46, height: 46, borderRadius: 23, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  walletActionLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '500', textAlign: 'center' },

  cardRow:       { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  smallCard:     { flex: 1, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  smallCardLabel:{ fontSize: 11, fontWeight: '500', marginBottom: 4 },
  smallCardDate: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  smallCardValue:{ fontSize: 17, fontWeight: '800' },
  smallCardSub:  { fontSize: 11, fontWeight: '600', marginTop: 3 },

  creditCard:      { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  arcWrap:         { width: 86, height: 86, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  arcSeg:          { position: 'absolute', width: 86, height: 86, borderRadius: 43, borderWidth: 8, borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
  arcInner:        { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  arcScore:        { fontSize: 16, fontWeight: '800' },
  arcTier:         { fontSize: 8, fontWeight: '700' },
  arcOf:           { fontSize: 8 },
  creditTierBadge: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  creditPts:       { fontSize: 11, marginTop: 2 },
  creditTap:       { fontSize: 11, marginTop: 4 },

  loanCard:        { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 20, borderWidth: 1 },
  loanTitle:       { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  loanSub:         { fontSize: 13, marginBottom: 16 },
  loanBtns:        { flexDirection: 'row', gap: 10 },
  loanApplyBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FB923C', paddingVertical: 12, borderRadius: 10 },
  loanApplyBtnTxt: { color: 'white', fontWeight: '700', fontSize: 13 },
  loanHowBtn:      { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  loanHowBtnTxt:   { fontWeight: '700', fontSize: 13 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  sectionTitle:  { fontSize: 15, fontWeight: '700' },
  seeAll:        { fontSize: 13, fontWeight: '600' },
  txList:        { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  txRow:         { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: 1 },
  txIcon:        { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 11 },
  txMid:         { flex: 1 },
  txType:        { fontSize: 13, fontWeight: '600' },
  txDate:        { fontSize: 11, marginTop: 2 },
  txRight:       { alignItems: 'flex-end' },
  txAmt:         { fontSize: 13, fontWeight: '700' },
  txPill:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 3 },
  txStatus:      { fontSize: 10, fontWeight: '600' },

  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 8, paddingTop: 8, position: 'absolute', bottom: 0, left: 0, right: 0 },
  navItem:   { flex: 1, alignItems: 'center', paddingVertical: 2 },
  navEmoji:  { fontSize: 20, marginBottom: 2 },
  navLabel:  { fontSize: 10 },

  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetClose: { alignSelf: 'flex-end', padding: 4, marginBottom: 6 },
  sheetTitle: { fontSize: 19, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  fullModal:       { flex: 1 },
  fullModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  fullModalTitle:  { fontSize: 17, fontWeight: '700' },

  confirmBox: { borderRadius: 12, padding: 14, marginBottom: 14 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1 },
  confirmKey: { fontSize: 13 },
  confirmVal: { fontSize: 13, fontWeight: '600' },

  rowBtns:        { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn:     { flex: 1, backgroundColor: '#FB923C', padding: 14, borderRadius: 11, alignItems: 'center' },
  primaryBtnTxt:  { color: 'white', fontWeight: '700', fontSize: 15 },
  secondaryBtn:   { flex: 1, padding: 14, borderRadius: 11, alignItems: 'center' },
  secondaryBtnTxt:{ fontWeight: '600', fontSize: 15 },
  disabledBtn:    { backgroundColor: '#FED7AA' },

  histSum:     { flexDirection: 'row', padding: 16, borderBottomWidth: 1 },
  histSumItem: { flex: 1, alignItems: 'center' },
  histSumVal:  { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  histSumLbl:  { fontSize: 11 },
  histCard:    { borderRadius: 12, marginBottom: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },

  notifRow:   { flexDirection: 'row', padding: 14, borderBottomWidth: 1 },
  notifIcon:  { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  unreadDot:  { width: 8, height: 8, borderRadius: 4 },
  notifMsg:   { fontSize: 12, lineHeight: 17, marginTop: 2 },
  notifTime:  { fontSize: 11, marginTop: 3 },

  scoreCircleWrap:  { alignItems: 'center', marginBottom: 16 },
  scoreCircleOuter: { width: 150, height: 150, borderRadius: 75, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  scoreArc:         { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 11, borderTopColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
  scoreInner:       { width: 112, height: 112, borderRadius: 56, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  scoreNum:  { fontSize: 26, fontWeight: '800' },
  scoreTier: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  scoreOf:   { fontSize: 11, marginTop: 1 },
  tierLadder:        { borderRadius: 12, padding: 14, marginBottom: 14 },
  tierTitle:         { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  tierRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1 },
  tierRange:         { fontSize: 13, flex: 1 },
  tierLoan:          { fontSize: 13, fontWeight: '600', marginRight: 6 },
  tierHint:          { fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  scoreFactorsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },

  settingCard:       { borderRadius: 14, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  settingGroupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  settingRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  settingLeft:       { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingLabel:      { fontSize: 14, fontWeight: '600' },
  settingSub:        { fontSize: 12, marginTop: 1 },
  logoutBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, padding: 14, marginTop: 8 },
  logoutBtnTxt:      { fontWeight: '700', fontSize: 15 },

  howStep:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  howNum:    { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  howNumTxt: { color: 'white', fontWeight: '800', fontSize: 14 },
  howTitle:  { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  howDesc:   { fontSize: 13, lineHeight: 18 },
});

export default DashboardScreen;