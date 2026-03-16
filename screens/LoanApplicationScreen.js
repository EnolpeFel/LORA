import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, Alert,
  Platform, Linking, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LoanStore from './Loanstore.js';

const PURPLE = '#FB923C';

const fmt = (n) =>
  `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const genAppId = () =>
  'L-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();

const CREDIT_TIERS = [
  { min: 200, max: 299, maxLoan: 5000,   label: 'Starter', color: '#6B7280', bg: '#F3F4F6', icon: 'remove-circle-outline' },
  { min: 300, max: 399, maxLoan: 10000,  label: 'Bronze',  color: '#F59E0B', bg: '#FFFBEB', icon: 'trending-up-outline' },
  { min: 400, max: 499, maxLoan: 20000,  label: 'Silver',  color: '#FB923C', bg: '#FFF7ED', icon: 'star-outline' },
  { min: 500, max: 850, maxLoan: 50000,  label: 'Gold',    color: '#10B981', bg: '#ECFDF5', icon: 'ribbon-outline' },
];

const getCreditTier = (score) =>
  CREDIT_TIERS.find(t => score >= t.min && score <= t.max) || CREDIT_TIERS[0];

const PURPOSES = [
  'Emergency Expenses', 'Education', 'Home Improvement', 'Business Capital',
  'Debt Consolidation', 'Medical Bills', 'Vehicle Purchase', 'Travel', 'Wedding', 'Other',
];

const COMPANIES = [
  {
    id: 1, name: 'OCS Lending Incorporated',
    interestType: 'Straight', interestRateVal: 0.075, interestRate: '7.5% / month',
    minAmount: 5000, maxAmount: 100000, minTerm: 2, maxTerm: 24,
    processingFee: 750, processing: '3–5 business days',
    contact: '+63 912 345 6789', address: '123 Main Street, Manila',
    rating: 4.5, reviews: 1245, physicalVisitation: true,
    info: 'OCS Lending has been operating since 2010 and has served over 50,000 customers across the Philippines.',
    requirements: ['Valid ID', 'Barangay Clearance', 'Collateral documents'],
  },
  {
    id: 2, name: 'PNJ Lending Company',
    interestType: 'Straight', interestRateVal: 0.10, interestRate: '10% / month',
    minAmount: 3000, maxAmount: 50000, minTerm: 1, maxTerm: 12,
    processingFee: 0, processing: '1–2 business days',
    contact: '+63 917 890 1234', address: '456 Commerce Ave, Cebu City',
    rating: 4.2, reviews: 876, physicalVisitation: false,
    info: 'PNJ provides the fastest approvals in the industry — disbursement within 24 hours for qualified applicants.',
    requirements: ['Valid ID', 'Barangay Clearance', 'Medical Certificate', 'Collateral documents'],
  },
  {
    id: 3, name: 'San Hec Bro Lending Inc.',
    interestType: 'Diminishing', interestRateVal: 0.05, interestRate: '5% diminishing / month',
    minAmount: 10000, maxAmount: 200000, minTerm: 3, maxTerm: 36,
    processingFee: 500, processing: '2–3 business days',
    contact: '+63 918 765 4321', address: '789 Business Park, Davao City',
    rating: 4.7, reviews: 1567, physicalVisitation: false,
    info: 'San Hec Bro specializes in diminishing-balance loans — meaning you pay less interest as the loan is paid down.',
    requirements: ['Valid ID', 'PSA Birth Certificate', 'Barangay Clearance', 'Medical Certificate', 'Collateral documents'],
  },
];

const COLLATERAL_LABELS = { atm: 'ATM Card', check: 'Check', passbook: 'Passbook' };

const calcLoan = (company, amount, termCount) => {
  const amt  = parseFloat(amount);
  const term = parseInt(termCount);
  if (!amt || !term || isNaN(amt) || isNaN(term) || amt <= 0 || term <= 0) return null;
  if (company.interestType === 'Straight') {
    const interest = amt * company.interestRateVal * term;
    const total    = amt + interest;
    return { interest, total, monthly: total / term, net: amt - company.processingFee, rate: company.interestRateVal * 100 };
  }
  const mPrin = amt / term;
  let remaining = amt, totalInt = 0;
  for (let i = 0; i < term; i++) { totalInt += remaining * company.interestRateVal; remaining -= mPrin; }
  const total = amt + totalInt;
  return { interest: totalInt, total, monthly: total / term, net: amt - company.processingFee, rate: company.interestRateVal * 100 };
};

const checkEligibility = (company, amount, termCount, creditMaxLoan) => {
  const amt  = parseFloat(amount);
  const term = parseInt(termCount);
  const reasons = [];
  if (isNaN(amt) || amt < company.minAmount)               reasons.push(`Min amount is ${fmt(company.minAmount)}`);
  if (!isNaN(amt) && amt > company.maxAmount)              reasons.push(`Max amount is ${fmt(company.maxAmount)}`);
  if (!isNaN(amt) && creditMaxLoan && amt > creditMaxLoan) reasons.push(`Your credit tier limit is ${fmt(creditMaxLoan)}`);
  if (isNaN(term) || term < company.minTerm)               reasons.push(`Min term is ${company.minTerm} months`);
  if (!isNaN(term) && term > company.maxTerm)              reasons.push(`Max term is ${company.maxTerm} months`);
  return { eligible: reasons.length === 0, reasons };
};

const getDTI = (company, loanAmount, terms, monthlyIncome) => {
  const calc = calcLoan(company, loanAmount, terms);
  const inc  = parseFloat(monthlyIncome);
  if (!calc || !inc || isNaN(inc)) return null;
  const pct = (calc.monthly / inc) * 100;
  return { pct: pct.toFixed(1), level: pct < 35 ? 'great' : pct < 50 ? 'warning' : 'danger' };
};

const DTI_META = {
  great:   { color: '#10B981', bg: '#ECFDF5', border: '#BBF7D0', icon: 'check-circle', label: 'Healthy (below 35%)' },
  warning: { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: 'warning',      label: 'Moderate (35–50%)' },
  danger:  { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: 'warning',      label: 'High (above 50%)' },
};

// ── Success Screen ────────────────────────────────────────────────────────────
const SuccessScreen = ({ loan, company, onGoToDashboard }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={ss.root}>
      <Animated.View style={[ss.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <View style={ss.iconCircle}>
          <MaterialIcons name="check-circle" size={64} color="white" />
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Text style={ss.title}>Loan Approved! 🎉</Text>
        <Text style={ss.sub}>Your loan has been disbursed to your wallet</Text>

        <View style={ss.card}>
          <View style={ss.cardRow}>
            <Text style={ss.cardKey}>Loan ID</Text>
            <Text style={ss.cardVal}>{loan.id}</Text>
          </View>
          <View style={ss.cardRow}>
            <Text style={ss.cardKey}>Lender</Text>
            <Text style={ss.cardVal}>{loan.lender}</Text>
          </View>
          <View style={ss.cardRow}>
            <Text style={ss.cardKey}>Loan Amount</Text>
            <Text style={ss.cardVal}>{fmt(loan.amount)}</Text>
          </View>
          <View style={[ss.cardRow, { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, marginTop: 4 }]}>
            <Text style={[ss.cardKey, { color: '#059669' }]}>Net Disbursed</Text>
            <Text style={[ss.cardVal, { color: '#059669', fontSize: 17 }]}>{fmt(loan.netRelease)}</Text>
          </View>
          <View style={ss.cardRow}>
            <Text style={ss.cardKey}>Monthly Payment</Text>
            <Text style={ss.cardVal}>{fmt(loan.monthlyPayment)}</Text>
          </View>
          <View style={ss.cardRow}>
            <Text style={ss.cardKey}>First Due Date</Text>
            <Text style={ss.cardVal}>{loan.nextDueDate}</Text>
          </View>
        </View>

        <View style={ss.tipBox}>
          <MaterialIcons name="lightbulb" size={16} color="#D97706" />
          <Text style={ss.tipTxt}>Processing: {company.processing}. Pay on time to build your credit score (+20 pts per payment).</Text>
        </View>

        <TouchableOpacity style={ss.btn} onPress={onGoToDashboard} activeOpacity={0.85}>
          <MaterialIcons name="home" size={20} color="white" />
          <Text style={ss.btnTxt}>Go to Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const ss = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap:    { marginBottom: 24 },
  iconCircle:  { width: 100, height: 100, borderRadius: 50, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  title:       { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  sub:         { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  card:        { backgroundColor: 'white', borderRadius: 18, padding: 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 4, marginBottom: 16 },
  cardRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardKey:     { fontSize: 13, color: '#6B7280' },
  cardVal:     { fontSize: 14, fontWeight: '700', color: '#1F2937', textAlign: 'right' },
  tipBox:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A', width: '100%' },
  tipTxt:      { fontSize: 12, color: '#92400E', flex: 1, lineHeight: 17 },
  btn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PURPLE, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14, shadowColor: PURPLE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnTxt:      { color: 'white', fontSize: 16, fontWeight: '700' },
});

// ── Step components (same as before, abbreviated for clarity) ─────────────────
const CreditScoreBanner = React.memo(({ creditScore }) => {
  if (!creditScore) return null;
  const tier = getCreditTier(creditScore);
  const nextTier = CREDIT_TIERS.find(t => t.min > creditScore);
  return (
    <View style={[s.creditBanner, { backgroundColor: tier.bg, borderColor: tier.color + '40' }]}>
      <View style={[s.creditBadge, { backgroundColor: tier.color }]}>
        <Ionicons name={tier.icon} size={14} color="white" />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[s.creditTierLabel, { color: tier.color }]}>{tier.label} Member</Text>
          <View style={[s.creditScorePill, { backgroundColor: tier.color }]}>
            <Text style={s.creditScorePillTxt}>{creditScore} pts</Text>
          </View>
        </View>
        <Text style={s.creditLimitTxt}>
          Max loan: {fmt(tier.maxLoan)}
          {nextTier ? `  ·  ${nextTier.min - creditScore} pts to ${nextTier.label}` : '  ·  Maximum tier reached 🎉'}
        </Text>
      </View>
    </View>
  );
});

const STEP_LABELS = ['Type', 'Details', 'Lender', 'Docs', 'Review'];
const StepBar = React.memo(({ step }) => (
  <View style={s.stepBar}>
    {STEP_LABELS.map((lbl, i) => (
      <React.Fragment key={i}>
        <View style={s.stepItem}>
          <View style={[s.stepCircle, step > i && s.stepDone, step === i && s.stepActive]}>
            {step > i
              ? <Ionicons name="checkmark" size={13} color="white" />
              : <Text style={[s.stepNum, step >= i && { color: 'white' }]}>{i + 1}</Text>}
          </View>
          <Text style={[s.stepLbl, step >= i && { color: PURPLE, fontWeight: '600' }]}>{lbl}</Text>
        </View>
        {i < STEP_LABELS.length - 1 && <View style={[s.stepLine, step > i && { backgroundColor: PURPLE }]} />}
      </React.Fragment>
    ))}
  </View>
));

// (Step0, Step1, Step2, Step3, Step4 remain exactly the same as the original)
// Including them in full below:

const Step0 = React.memo(({ loanType, setLoanType, onNext, creditScore }) => (
  <View>
    <Text style={s.stepTitle}>Apply for a Loan</Text>
    <Text style={s.stepSub}>Choose the type of loan you need</Text>
    <CreditScoreBanner creditScore={creditScore} />
    {[
      { id: 'new',   icon: 'cash-outline',  title: 'New Loan',   desc: 'Regular personal or business loans with competitive rates and flexible terms', badge: null },
      { id: 'bonus', icon: 'gift-outline',  title: 'Bonus Loan', desc: 'Loans against 13th/14th month pay, bonuses, or special cash disbursements',  badge: 'Quick Release' },
    ].map(t => (
      <TouchableOpacity key={t.id} style={[s.typeCard, loanType === t.id && s.typeCardActive]} onPress={() => setLoanType(t.id)} activeOpacity={0.85}>
        <View style={[s.typeIconBox, { backgroundColor: loanType === t.id ? '#FFF7ED' : '#F3F4F6' }]}>
          <Ionicons name={t.icon} size={32} color={loanType === t.id ? PURPLE : '#6B7280'} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <Text style={[s.typeTitle, loanType === t.id && { color: PURPLE }]}>{t.title}</Text>
            {t.badge && <View style={s.badgePill}><Text style={s.badgePillTxt}>{t.badge}</Text></View>}
          </View>
          <Text style={s.typeDesc}>{t.desc}</Text>
        </View>
        <View style={[s.typeCheck, { borderColor: loanType === t.id ? PURPLE : '#D1D5DB', backgroundColor: loanType === t.id ? PURPLE : 'transparent' }]}>
          {loanType === t.id && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
      </TouchableOpacity>
    ))}
    <TouchableOpacity style={[s.primaryBtn, !loanType && s.disabledBtn]} onPress={onNext} disabled={!loanType} activeOpacity={0.85}>
      <Text style={s.primaryBtnTxt}>Continue to Loan Details</Text>
      <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  </View>
));

const Step1 = React.memo(({
  loanAmount, setLoanAmount, terms, setTerms,
  monthlyIncome, setMonthlyIncome, purpose, setPurpose,
  collateral, setCollateral, otherCollateral, setOtherCollateral,
  errors, clearError, onNext, onBack, creditScore,
}) => {
  const tier = creditScore ? getCreditTier(creditScore) : null;
  const creditMaxLoan = tier?.maxLoan;
  const dti = (loanAmount && terms && monthlyIncome)
    ? getDTI(COMPANIES[0], loanAmount, terms, monthlyIncome) : null;
  const estMonthly = loanAmount && terms && parseFloat(loanAmount) > 0 && parseInt(terms) > 0
    ? parseFloat(loanAmount) / parseInt(terms) : null;
  const amtNum = parseFloat(loanAmount);
  const exceedsLimit = creditMaxLoan && !isNaN(amtNum) && amtNum > creditMaxLoan;
  const quickAmounts = creditMaxLoan
    ? [creditMaxLoan * 0.1, creditMaxLoan * 0.25, creditMaxLoan * 0.5, creditMaxLoan]
        .map(v => Math.floor(v / 1000) * 1000).filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
    : [5000, 10000, 20000, 50000];

  return (
    <View>
      <Text style={s.stepTitle}>Loan Details</Text>
      <Text style={s.stepSub}>Enter your loan request information</Text>
      <CreditScoreBanner creditScore={creditScore} />

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Loan Amount <Text style={s.req}>*</Text></Text>
        <View style={[s.amtRow, (errors.loanAmount || exceedsLimit) && { borderColor: '#EF4444' }]}>
          <Text style={s.amtPfx}>₱</Text>
          <TextInput style={s.amtInput} placeholder="e.g. 20,000" keyboardType="decimal-pad"
            value={loanAmount} onChangeText={v => { setLoanAmount(v); clearError('loanAmount'); }}
            placeholderTextColor="#9CA3AF" />
        </View>
        {errors.loanAmount
          ? <Text style={s.errTxt}>{errors.loanAmount}</Text>
          : exceedsLimit
          ? <Text style={s.errTxt}>Exceeds your {tier.label} tier limit of {fmt(creditMaxLoan)}</Text>
          : null}
        <View style={s.quickRow}>
          {quickAmounts.map(v => (
            <TouchableOpacity key={v} style={[s.quickBtn, loanAmount === v.toString() && s.quickBtnActive]}
              onPress={() => { setLoanAmount(v.toString()); clearError('loanAmount'); }} activeOpacity={0.8}>
              <Text style={[s.quickBtnTxt, loanAmount === v.toString() && { color: 'white' }]}>
                {v >= 1000 ? `₱${v / 1000}K` : fmt(v)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Loan Term <Text style={s.req}>*</Text></Text>
        <TextInput style={[s.input, errors.terms && { borderColor: '#EF4444' }]}
          placeholder="Number of months (e.g. 12)" keyboardType="numeric"
          value={terms} onChangeText={v => { setTerms(v); clearError('terms'); }}
          placeholderTextColor="#9CA3AF" />
        {errors.terms ? <Text style={s.errTxt}>{errors.terms}</Text> : null}
        <View style={s.quickRow}>
          {[3, 6, 12, 24].map(v => (
            <TouchableOpacity key={v} style={[s.quickBtn, terms === v.toString() && s.quickBtnActive]}
              onPress={() => { setTerms(v.toString()); clearError('terms'); }} activeOpacity={0.8}>
              <Text style={[s.quickBtnTxt, terms === v.toString() && { color: 'white' }]}>{v} mo</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {estMonthly !== null && (
        <View style={s.estBox}>
          <MaterialIcons name="calculate" size={16} color={PURPLE} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={s.estLabel}>Principal-only estimate</Text>
            <Text style={s.estAmt}>{fmt(estMonthly)} / month</Text>
            <Text style={s.estNote}>Actual amount includes interest & fees from selected lender</Text>
          </View>
        </View>
      )}

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Monthly Gross Income <Text style={s.req}>*</Text></Text>
        <View style={[s.amtRow, errors.income && { borderColor: '#EF4444' }]}>
          <Text style={s.amtPfx}>₱</Text>
          <TextInput style={s.amtInput} placeholder="Your gross monthly income" keyboardType="decimal-pad"
            value={monthlyIncome} onChangeText={v => { setMonthlyIncome(v); clearError('income'); }}
            placeholderTextColor="#9CA3AF" />
        </View>
        {errors.income ? <Text style={s.errTxt}>{errors.income}</Text> : null}
        {dti && (() => { const m = DTI_META[dti.level]; return (
          <View style={[s.dtiBox, { backgroundColor: m.bg, borderColor: m.border }]}>
            <MaterialIcons name={m.icon} size={14} color={m.color} />
            <Text style={[s.dtiTxt, { color: m.color }]}>DTI Ratio: {dti.pct}% — {m.label}</Text>
          </View>
        ); })()}
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Loan Purpose <Text style={s.req}>*</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {PURPOSES.map(p => (
            <TouchableOpacity key={p} style={[s.chip, purpose === p && s.chipActive]}
              onPress={() => { setPurpose(p); clearError('purpose'); }} activeOpacity={0.8}>
              <Text style={[s.chipTxt, purpose === p && s.chipTxtActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {errors.purpose ? <Text style={s.errTxt}>{errors.purpose}</Text> : null}
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Available Collateral <Text style={s.optionalTxt}>(optional)</Text></Text>
        <View style={s.checkGrid}>
          {[
            { key: 'atm',      label: 'ATM Card', icon: 'card-outline' },
            { key: 'check',    label: 'Check',    icon: 'document-text-outline' },
            { key: 'passbook', label: 'Passbook', icon: 'book-outline' },
            { key: 'other',    label: 'Other',    icon: 'add-circle-outline' },
          ].map(({ key, label, icon }) => (
            <TouchableOpacity key={key} style={[s.checkItem, collateral[key] && s.checkItemActive]}
              onPress={() => setCollateral(p => ({ ...p, [key]: !p[key] }))} activeOpacity={0.8}>
              <View style={[s.checkBox, collateral[key] && s.checkBoxActive]}>
                {collateral[key]
                  ? <Ionicons name="checkmark" size={14} color="white" />
                  : <Ionicons name={icon} size={14} color="#9CA3AF" />}
              </View>
              <Text style={[s.checkLbl, collateral[key] && { color: PURPLE, fontWeight: '600' }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {collateral.other && (
          <TextInput style={[s.input, { marginTop: 10 }]} placeholder="Describe your other collateral"
            value={otherCollateral} onChangeText={setOtherCollateral} placeholderTextColor="#9CA3AF" />
        )}
      </View>

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={s.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.primaryBtn, { flex: 1 }, exceedsLimit && s.disabledBtn]}
          onPress={onNext} disabled={!!exceedsLimit} activeOpacity={0.85}>
          <Text style={s.primaryBtnTxt}>View Lenders</Text>
          <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const Step2 = React.memo(({
  loanAmount, terms, purpose, monthlyIncome, creditScore,
  selCompany, onSelectCompany, onBack,
  showCompanyModal, setShowCompanyModal, modalCompany, setModalCompany,
}) => {
  const creditMaxLoan = creditScore ? getCreditTier(creditScore).maxLoan : null;
  const tier = creditScore ? getCreditTier(creditScore) : null;

  return (
    <View>
      <Text style={s.stepTitle}>Select Lender</Text>
      <Text style={s.stepSub}>Compare offers and choose the best fit</Text>

      {tier && (
        <View style={[s.creditBanner, { backgroundColor: tier.bg, borderColor: tier.color + '40', marginBottom: 14 }]}>
          <View style={[s.creditBadge, { backgroundColor: tier.color }]}>
            <Ionicons name={tier.icon} size={14} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.creditTierLabel, { color: tier.color }]}>{tier.label} — Max {fmt(creditMaxLoan)}</Text>
            <Text style={s.creditLimitTxt}>Lenders are filtered by your credit tier</Text>
          </View>
        </View>
      )}

      <View style={s.summaryChip}>
        <MaterialIcons name="info-outline" size={13} color={PURPLE} />
        <Text style={s.summaryChipTxt}>{fmt(parseFloat(loanAmount))} · {terms} months · {purpose}</Text>
      </View>

      {COMPANIES.map(c => {
        const { eligible, reasons } = checkEligibility(c, loanAmount, terms, creditMaxLoan);
        const calc       = eligible ? calcLoan(c, loanAmount, terms) : null;
        const isSelected = selCompany === c.id;
        const dti        = eligible ? getDTI(c, loanAmount, terms, monthlyIncome) : null;

        return (
          <View key={c.id} style={[s.lenderCard, !eligible && s.lenderCardIneligible, isSelected && s.lenderCardSelected]}>
            <View style={s.lenderHeader}>
              <View style={[s.lenderLogoBox, !eligible && { backgroundColor: '#F3F4F6' }]}>
                <MaterialIcons name="account-balance" size={26} color={eligible ? PURPLE : '#9CA3AF'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.lenderName, !eligible && { color: '#9CA3AF' }]}>{c.name}</Text>
                <View style={s.starsRow}>
                  {[...Array(5)].map((_, i) => <Ionicons key={i} name={i < Math.floor(c.rating) ? 'star' : 'star-outline'} size={12} color={eligible ? '#F59E0B' : '#D1D5DB'} />)}
                  <Text style={[s.reviewCnt, !eligible && { color: '#D1D5DB' }]}>{c.rating} ({c.reviews.toLocaleString()})</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { setModalCompany(c); setShowCompanyModal(true); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="information-circle-outline" size={24} color={eligible ? PURPLE : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <View style={s.lenderTags}>
              <View style={s.lenderTag}><MaterialIcons name="percent" size={12} color={PURPLE} /><Text style={s.lenderTagTxt}>{c.interestRate}</Text></View>
              <View style={s.lenderTag}><MaterialIcons name="schedule" size={12} color={PURPLE} /><Text style={s.lenderTagTxt}>{c.processing}</Text></View>
              {c.processingFee > 0
                ? <View style={s.lenderTag}><MaterialIcons name="receipt" size={12} color={PURPLE} /><Text style={s.lenderTagTxt}>Fee: {fmt(c.processingFee)}</Text></View>
                : <View style={[s.lenderTag, { backgroundColor: '#ECFDF5' }]}><MaterialIcons name="check-circle" size={12} color="#10B981" /><Text style={[s.lenderTagTxt, { color: '#059669' }]}>No Processing Fee</Text></View>}
              {c.physicalVisitation && <View style={[s.lenderTag, { backgroundColor: '#FEF3C7' }]}><MaterialIcons name="location-on" size={12} color="#F59E0B" /><Text style={[s.lenderTagTxt, { color: '#92400E' }]}>Visit Required</Text></View>}
            </View>

            <Text style={[s.lenderLimits, !eligible && { color: '#D1D5DB' }]}>
              Eligible range: {fmt(c.minAmount)} – {fmt(c.maxAmount)} · {c.minTerm}–{c.maxTerm} months
            </Text>

            {!eligible && (
              <View style={s.ineligibleBox}>
                <MaterialIcons name="error-outline" size={14} color="#EF4444" />
                <View style={{ marginLeft: 6, flex: 1 }}>
                  {reasons.map((r, i) => <Text key={i} style={s.ineligibleTxt}>• {r}</Text>)}
                </View>
              </View>
            )}

            {calc && eligible && (
              <View style={s.calcBox}>
                <Text style={s.calcTitle}>Your Loan Breakdown</Text>
                {[
                  ['Loan Amount',         fmt(parseFloat(loanAmount))],
                  ['Term',                `${terms} months`],
                  [`Interest (${calc.rate.toFixed(1)}%)`, fmt(calc.interest)],
                  ['Processing Fee',      c.processingFee > 0 ? fmt(c.processingFee) : 'FREE'],
                  ['Net Release',         fmt(calc.net)],
                  ['Avg Monthly Payment', fmt(calc.monthly)],
                  ['Total Payable',       fmt(calc.total)],
                ].map(([k, v]) => (
                  <View key={k} style={s.calcRow}>
                    <Text style={s.calcKey}>{k}</Text>
                    <Text style={[s.calcVal, (k === 'Avg Monthly Payment' || k === 'Net Release') && { color: PURPLE, fontWeight: '700' }]}>{v}</Text>
                  </View>
                ))}
                {dti && (() => { const m = DTI_META[dti.level]; return (
                  <View style={[s.dtiBox, { backgroundColor: m.bg, borderColor: m.border, marginTop: 8 }]}>
                    <MaterialIcons name={m.icon} size={12} color={m.color} />
                    <Text style={[s.dtiTxt, { color: m.color, fontSize: 11 }]}>DTI: {dti.pct}% — {m.label}</Text>
                  </View>
                ); })()}
              </View>
            )}

            <TouchableOpacity
              style={[s.selectBtn, isSelected && s.selectBtnSelected, !eligible && s.selectBtnDisabled]}
              onPress={() => eligible && onSelectCompany(c.id)}
              disabled={!eligible} activeOpacity={eligible ? 0.85 : 1}>
              <Text style={[s.selectBtnTxt, isSelected && { color: 'white' }, !eligible && { color: '#D1D5DB' }]}>
                {isSelected ? '✓ Selected — Continue to Documents' : eligible ? 'Select This Lender' : 'Not Eligible'}
              </Text>
              {isSelected && <Ionicons name="arrow-forward" size={14} color="white" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={18} color="#374151" />
        <Text style={s.backBtnTxt}>Back to Details</Text>
      </TouchableOpacity>

      <Modal visible={showCompanyModal} animationType="slide" transparent onRequestClose={() => setShowCompanyModal(false)}>
        <View style={s.centeredView}>
          <View style={s.companyModal}>
            <View style={s.companyModalHeader}>
              <View style={s.lenderLogoBox}><MaterialIcons name="account-balance" size={22} color={PURPLE} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={s.companyModalName}>{modalCompany?.name}</Text>
                <View style={s.starsRow}>
                  {[...Array(5)].map((_, i) => <Ionicons key={i} name={i < Math.floor(modalCompany?.rating || 0) ? 'star' : 'star-outline'} size={12} color="#F59E0B" />)}
                  <Text style={s.reviewCnt}>{modalCompany?.rating} ({(modalCompany?.reviews || 0).toLocaleString()} reviews)</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowCompanyModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={26} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text style={s.modalSectionTitle}>About</Text>
              <Text style={s.modalBodyTxt}>{modalCompany?.info}</Text>
              <Text style={s.modalSectionTitle}>Loan Terms</Text>
              {[
                ['Interest Type',   modalCompany?.interestType],
                ['Interest Rate',   modalCompany?.interestRate],
                ['Processing Fee',  modalCompany?.processingFee === 0 ? 'FREE' : fmt(modalCompany?.processingFee || 0)],
                ['Processing Time', modalCompany?.processing],
                ['Amount Range',    `${fmt(modalCompany?.minAmount || 0)} – ${fmt(modalCompany?.maxAmount || 0)}`],
                ['Term Range',      `${modalCompany?.minTerm}–${modalCompany?.maxTerm} months`],
                ['Physical Visit',  modalCompany?.physicalVisitation ? 'Required' : 'Not required'],
              ].map(([k, v]) => (
                <View key={k} style={s.modalRow}><Text style={s.modalKey}>{k}</Text><Text style={s.modalVal}>{v}</Text></View>
              ))}
              <Text style={s.modalSectionTitle}>Required Documents</Text>
              {(modalCompany?.requirements || []).map((r, i) => (
                <View key={i} style={s.modalReqRow}><Ionicons name="document-text-outline" size={14} color={PURPLE} /><Text style={s.modalReqTxt}>{r}</Text></View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const Step3 = React.memo(({
  company, loanType, loanAmount, terms,
  documents, setDocuments, uploading, setUploading,
  onNext, onBack,
}) => {
  const calc      = calcLoan(company, loanAmount, terms);
  const doneCount = company.requirements.filter(r => documents.some(d => d.requirement === r)).length;
  const allDone   = doneCount === company.requirements.length;

  const handleUpload = async (req) => {
    setUploading(req);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Allow media library access to upload files.'); return; }
      }
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: false, copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.length) {
        const asset = res.assets[0];
        setDocuments(p => [...p, { id: Date.now(), name: asset.name, uri: asset.uri, type: asset.mimeType, requirement: req, date: new Date().toLocaleDateString('en-PH'), isImage: asset.mimeType?.startsWith('image/') }]);
      }
    } catch { Alert.alert('Upload Failed', 'Could not pick the document. Please try again.'); }
    finally { setUploading(null); }
  };

  const handleCamera = async (req) => {
    setUploading(req);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Camera permission needed'); return; }
      const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
      if (!res.canceled && res.assets?.length) {
        setDocuments(p => [...p, { id: Date.now(), name: `photo_${Date.now()}.jpg`, uri: res.assets[0].uri, type: 'image/jpeg', requirement: req, date: new Date().toLocaleDateString('en-PH'), isImage: true }]);
      }
    } catch { Alert.alert('Camera Error', 'Failed to capture image. Please try again.'); }
    finally { setUploading(null); }
  };

  const removeDoc = (docId) =>
    Alert.alert('Remove Document', 'Remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setDocuments(p => p.filter(d => d.id !== docId)) },
    ]);

  return (
    <View>
      <Text style={s.stepTitle}>Upload Documents</Text>
      <Text style={s.stepSub}>Required by {company.name}</Text>

      <View style={s.reviewCard}>
        <Text style={s.reviewCardTitle}>Loan Summary</Text>
        {[
          ['Type',        loanType === 'new' ? 'New Loan' : 'Bonus Loan'],
          ['Amount',      fmt(parseFloat(loanAmount))],
          ['Term',        `${terms} months`],
          ['Monthly',     calc ? fmt(calc.monthly) : '—'],
          ['Net Release', calc ? fmt(calc.net) : '—'],
          ['Total',       calc ? fmt(calc.total) : '—'],
          ['Lender',      company.name],
        ].map(([k, v]) => (
          <View key={k} style={s.reviewRow}>
            <Text style={s.reviewKey}>{k}</Text>
            <Text style={[s.reviewVal, (k === 'Monthly' || k === 'Net Release') && { color: PURPLE }]}>{v}</Text>
          </View>
        ))}
      </View>

      <View style={s.docProgressWrap}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={s.docProgressLabel}>Document Progress</Text>
          <Text style={[s.docProgressTxt, { color: allDone ? '#10B981' : '#6B7280' }]}>{doneCount}/{company.requirements.length} complete</Text>
        </View>
        <View style={s.docProgressTrack}>
          <View style={[s.docProgressFill, { width: `${(doneCount / company.requirements.length) * 100}%`, backgroundColor: allDone ? '#10B981' : PURPLE }]} />
        </View>
      </View>

      {company.requirements.map((req, idx) => {
        const uploaded    = documents.filter(d => d.requirement === req);
        const done        = uploaded.length > 0;
        const isUploading = uploading === req;
        return (
          <View key={req} style={[s.reqSection, done && { borderColor: '#10B981', borderWidth: 1.5 }]}>
            <View style={s.reqHeader}>
              <View style={[s.reqBullet, { backgroundColor: done ? '#ECFDF5' : '#FFF7ED' }]}>
                {done ? <MaterialIcons name="check-circle" size={18} color="#10B981" /> : <Text style={s.reqBulletNum}>{idx + 1}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.reqTitle}>{req}</Text>
                <Text style={[s.reqStatus, { color: done ? '#10B981' : '#9CA3AF' }]}>
                  {done ? `${uploaded.length} file${uploaded.length > 1 ? 's' : ''} uploaded` : 'No files yet'}
                </Text>
              </View>
              {done && <View style={s.doneBadge}><Text style={s.doneBadgeTxt}>Done</Text></View>}
            </View>
            <View style={s.uploadRow}>
              <TouchableOpacity style={[s.uploadBtn, isUploading && { opacity: 0.6 }]} onPress={() => handleUpload(req)} disabled={!!uploading} activeOpacity={0.8}>
                {isUploading ? <ActivityIndicator size="small" color={PURPLE} /> : <Ionicons name="document-attach" size={17} color={PURPLE} />}
                <Text style={s.uploadBtnTxt}>{isUploading ? 'Uploading…' : 'Upload File'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.uploadBtn, isUploading && { opacity: 0.6 }]} onPress={() => handleCamera(req)} disabled={!!uploading} activeOpacity={0.8}>
                <Ionicons name="camera" size={17} color={PURPLE} />
                <Text style={s.uploadBtnTxt}>Take Photo</Text>
              </TouchableOpacity>
            </View>
            {uploaded.map(doc => (
              <View key={doc.id} style={s.docRow}>
                <View style={s.docIcon}><Ionicons name={doc.isImage ? 'image' : 'document-text'} size={15} color={PURPLE} /></View>
                <View style={{ flex: 1 }}><Text style={s.docName} numberOfLines={1}>{doc.name}</Text><Text style={s.docDate}>{doc.date}</Text></View>
                <TouchableOpacity onPress={() => removeDoc(doc.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}

      <View style={[s.progressBanner, { backgroundColor: allDone ? '#ECFDF5' : '#FFFBEB', borderColor: allDone ? '#BBF7D0' : '#FDE68A' }]}>
        <MaterialIcons name={allDone ? 'check-circle' : 'pending'} size={16} color={allDone ? '#10B981' : '#F59E0B'} />
        <Text style={[s.progressBannerTxt, { color: allDone ? '#10B981' : '#92400E' }]}>
          {allDone ? 'All requirements fulfilled — ready to review' : `${company.requirements.length - doneCount} requirement${company.requirements.length - doneCount > 1 ? 's' : ''} remaining`}
        </Text>
      </View>

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={s.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.reviewBtn, !allDone && s.disabledBtn]} onPress={onNext} disabled={!allDone} activeOpacity={0.85}>
          <Ionicons name="eye-outline" size={18} color="white" />
          <Text style={s.primaryBtnTxt}> Review & Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const Step4 = React.memo(({
  company, loanType, loanAmount, terms, purpose,
  monthlyIncome, collateral, otherCollateral,
  documents, creditScore, onSubmit, onBack, submitting,
}) => {
  const calc    = calcLoan(company, loanAmount, terms);
  const dti     = getDTI(company, loanAmount, terms, monthlyIncome);
  const dtiMeta = dti ? DTI_META[dti.level] : null;
  const tier    = creditScore ? getCreditTier(creditScore) : null;
  const collateralList = Object.entries(collateral)
    .filter(([, v]) => v)
    .map(([k]) => k === 'other' && otherCollateral ? otherCollateral : (COLLATERAL_LABELS[k] || 'Other'))
    .join(', ') || 'None';

  return (
    <View>
      <Text style={s.stepTitle}>Review Application</Text>
      <Text style={s.stepSub}>Confirm all details before submitting</Text>

      <View style={[s.reviewCard, { borderColor: PURPLE }]}>
        <View style={s.lenderHeader}>
          <View style={s.lenderLogoBox}><MaterialIcons name="account-balance" size={22} color={PURPLE} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.lenderName}>{company.name}</Text>
            <View style={s.starsRow}>
              {[...Array(5)].map((_, i) => <Ionicons key={i} name={i < Math.floor(company.rating) ? 'star' : 'star-outline'} size={11} color="#F59E0B" />)}
              <Text style={s.reviewCnt}>{company.rating} ({company.reviews.toLocaleString()})</Text>
            </View>
          </View>
          <View style={[s.lenderTag, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[s.lenderTagTxt, { color: '#059669' }]}>{company.processing}</Text>
          </View>
        </View>
      </View>

      {tier && (
        <View style={[s.creditBanner, { backgroundColor: tier.bg, borderColor: tier.color + '40', marginBottom: 14 }]}>
          <View style={[s.creditBadge, { backgroundColor: tier.color }]}>
            <Ionicons name={tier.icon} size={14} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[s.creditTierLabel, { color: tier.color }]}>{tier.label} Member · {creditScore} pts</Text>
            <Text style={s.creditLimitTxt}>Credit tier approved for this loan amount</Text>
          </View>
          <MaterialIcons name="check-circle" size={18} color={tier.color} />
        </View>
      )}

      <View style={s.reviewCard}>
        <Text style={s.reviewCardTitle}>Loan Breakdown</Text>
        {calc && [
          ['Loan Type',       loanType === 'new' ? 'New Loan' : 'Bonus Loan'],
          ['Purpose',         purpose],
          ['Loan Amount',     fmt(parseFloat(loanAmount))],
          ['Term',            `${terms} months`],
          ['Interest Type',   company.interestType],
          [`Interest (${calc.rate.toFixed(1)}%)`, fmt(calc.interest)],
          ['Processing Fee',  company.processingFee > 0 ? fmt(company.processingFee) : 'FREE'],
          ['Net Release',     fmt(calc.net)],
          ['Avg Monthly',     fmt(calc.monthly)],
          ['Total Payable',   fmt(calc.total)],
        ].map(([k, v]) => (
          <View key={k} style={s.reviewRow}>
            <Text style={s.reviewKey}>{k}</Text>
            <Text style={[s.reviewVal,
              (k === 'Net Release' || k === 'Avg Monthly') && { color: PURPLE, fontWeight: '700' },
              k === 'Total Payable' && { fontWeight: '700', fontSize: 14 },
            ]}>{v}</Text>
          </View>
        ))}
      </View>

      <View style={s.reviewCard}>
        <Text style={s.reviewCardTitle}>Borrower Information</Text>
        {[['Monthly Income', fmt(parseFloat(monthlyIncome))], ['Collateral', collateralList]].map(([k, v]) => (
          <View key={k} style={s.reviewRow}><Text style={s.reviewKey}>{k}</Text><Text style={s.reviewVal}>{v}</Text></View>
        ))}
        {dti && dtiMeta && (
          <View style={[s.dtiBox, { backgroundColor: dtiMeta.bg, borderColor: dtiMeta.border, marginTop: 8 }]}>
            <MaterialIcons name={dtiMeta.icon} size={13} color={dtiMeta.color} />
            <Text style={[s.dtiTxt, { color: dtiMeta.color }]}>DTI: {dti.pct}% — {dtiMeta.label}</Text>
          </View>
        )}
      </View>

      <View style={s.reviewCard}>
        <Text style={s.reviewCardTitle}>Documents ({documents.length} file{documents.length !== 1 ? 's' : ''})</Text>
        {company.requirements.map((req, i) => {
          const uploaded = documents.filter(d => d.requirement === req);
          return (
            <View key={i} style={[s.reviewRow, { alignItems: 'flex-start' }]}>
              <Text style={[s.reviewKey, { flex: 1.2 }]}>{req}</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {uploaded.map((d, di) => <Text key={di} style={[s.reviewVal, { fontSize: 11 }]} numberOfLines={1}>{d.name}</Text>)}
              </View>
            </View>
          );
        })}
      </View>

      <View style={s.disclaimerBox}>
        <MaterialIcons name="info-outline" size={14} color="#6B7280" />
        <Text style={s.disclaimerTxt}>
          By submitting, you confirm all provided information is accurate and consent to a credit evaluation by {company.name}.
        </Text>
      </View>

      <View style={s.navRow}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8} disabled={submitting}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={s.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, submitting && s.disabledBtn]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={18} color="white" />
              <Text style={s.primaryBtnTxt}> Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const LoanApplicationScreen = ({ navigation, route }) => {
  const creditScore = route?.params?.creditScore ?? 560;

  const [step, setStep]         = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState(null);  // triggers success screen
  const [submittedCompany, setSubmittedCompany] = useState(null);

  const [loanType, setLoanType]               = useState(null);
  const [loanAmount, setLoanAmount]           = useState('');
  const [terms, setTerms]                     = useState('');
  const [monthlyIncome, setMonthlyIncome]     = useState('');
  const [purpose, setPurpose]                 = useState('');
  const [collateral, setCollateral]           = useState({ atm: false, check: false, passbook: false, other: false });
  const [otherCollateral, setOtherCollateral] = useState('');
  const [errors, setErrors]                   = useState({});

  const [selCompany, setSelCompany]             = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [modalCompany, setModalCompany]         = useState(null);

  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(null);

  const company = COMPANIES.find(c => c.id === selCompany);

  const clearError = (key) => setErrors(p => { const n = { ...p }; delete n[key]; return n; });

  const validate1 = () => {
    const errs = {};
    const amt  = parseFloat(loanAmount);
    const term = parseInt(terms);
    const inc  = parseFloat(monthlyIncome);
    const creditMaxLoan = getCreditTier(creditScore).maxLoan;
    if (!loanAmount || isNaN(amt) || amt < 1000)         errs.loanAmount = 'Enter a valid amount (min ₱1,000)';
    else if (amt > creditMaxLoan)                         errs.loanAmount = `Exceeds your credit tier limit of ${fmt(creditMaxLoan)}`;
    if (!terms || isNaN(term) || term < 1 || term > 60)  errs.terms      = 'Enter a valid term (1–60 months)';
    if (!monthlyIncome || isNaN(inc) || inc < 1)         errs.income     = 'Enter a valid monthly income';
    if (!purpose)                                         errs.purpose    = 'Please select a loan purpose';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSelectCompany = (cId) => {
    const c = COMPANIES.find(x => x.id === cId);
    const creditMaxLoan = getCreditTier(creditScore).maxLoan;
    const { eligible, reasons } = checkEligibility(c, loanAmount, terms, creditMaxLoan);
    if (!eligible) {
      Alert.alert('Loan Parameters Mismatch', `${c.name} cannot process your request:\n\n• ${reasons.join('\n• ')}\n\nPlease adjust your loan details.`);
      return;
    }
    setSelCompany(cId);
    setDocuments([]);
    setStep(3);
  };

  const handleFinalSubmit = () => {
    if (!company) return;
    setSubmitting(true);

    const calc = calcLoan(company, loanAmount, terms);
    const collateralList = Object.entries(collateral)
      .filter(([, v]) => v)
      .map(([k]) => k === 'other' && otherCollateral ? otherCollateral : (COLLATERAL_LABELS[k] || 'Other'))
      .join(', ');
    const tier = getCreditTier(creditScore);

    const submittedApp = {
      id:            genAppId(),
      type:          loanType === 'new' ? 'New Loan' : 'Bonus Loan',
      amount:        parseFloat(loanAmount),
      terms:         parseInt(terms),
      monthlyPayment: calc?.monthly,
      lender:        company.name,
      lenderId:      company.id,
      purpose,
      monthlyIncome: parseFloat(monthlyIncome),
      collateral:    collateralList || 'None',
      interestRate:  calc?.rate,
      interestType:  company.interestType,
      totalInterest: calc?.interest,
      processingFee: company.processingFee,
      totalPayment:  calc?.total,
      netRelease:    calc?.net,
      creditScore,
      creditTier:    tier.label,
    };

    // Simulate a brief processing delay for UX
    setTimeout(() => {
      try {
        const activeLoan = LoanStore.commitLoanApplication(submittedApp);
        setSubmittedLoan(activeLoan);
        setSubmittedCompany(company);
      } catch (e) {
        Alert.alert('Submission Error', 'Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }, 800);
  };

  // ── If loan was successfully submitted, show the success screen ──
  if (submittedLoan && submittedCompany) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <SuccessScreen
          loan={submittedLoan}
          company={submittedCompany}
          onGoToDashboard={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'Dashboard',
                params: {
                  loanDisbursement: {
                    loanId:     submittedLoan.id,
                    loanType:   submittedLoan.type,
                    lender:     submittedLoan.lender,
                    netRelease: submittedLoan.netRelease,
                    amount:     submittedLoan.amount,
                    date:       new Date().toISOString(),
                  },
                },
              }],
            });
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => step === 0 ? navigation.goBack() : setStep(step - 1)} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Loan Application</Text>
        <View style={{ width: 40 }} />
      </View>

      <StepBar step={step} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <Step0 loanType={loanType} setLoanType={setLoanType} creditScore={creditScore} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <Step1
            loanAmount={loanAmount} setLoanAmount={setLoanAmount}
            terms={terms} setTerms={setTerms}
            monthlyIncome={monthlyIncome} setMonthlyIncome={setMonthlyIncome}
            purpose={purpose} setPurpose={setPurpose}
            collateral={collateral} setCollateral={setCollateral}
            otherCollateral={otherCollateral} setOtherCollateral={setOtherCollateral}
            errors={errors} clearError={clearError} creditScore={creditScore}
            onNext={() => { if (validate1()) setStep(2); }} onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step2
            loanAmount={loanAmount} terms={terms} purpose={purpose} monthlyIncome={monthlyIncome}
            creditScore={creditScore} selCompany={selCompany} onSelectCompany={handleSelectCompany}
            onBack={() => setStep(1)}
            showCompanyModal={showCompanyModal} setShowCompanyModal={setShowCompanyModal}
            modalCompany={modalCompany} setModalCompany={setModalCompany}
          />
        )}
        {step === 3 && company && (
          <Step3
            company={company} loanType={loanType} loanAmount={loanAmount} terms={terms}
            documents={documents} setDocuments={setDocuments}
            uploading={uploading} setUploading={setUploading}
            onNext={() => setStep(4)} onBack={() => setStep(2)}
          />
        )}
        {step === 4 && company && (
          <Step4
            company={company} loanType={loanType} loanAmount={loanAmount} terms={terms}
            purpose={purpose} monthlyIncome={monthlyIncome}
            collateral={collateral} otherCollateral={otherCollateral}
            documents={documents} creditScore={creditScore}
            onSubmit={handleFinalSubmit} onBack={() => setStep(3)}
            submitting={submitting}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { padding: 16, paddingBottom: 60 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerBtn:   { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },

  stepBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  stepItem:   { alignItems: 'center' },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  stepActive: { backgroundColor: PURPLE },
  stepDone:   { backgroundColor: '#10B981' },
  stepNum:    { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  stepLbl:    { fontSize: 9, color: '#9CA3AF' },
  stepLine:   { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 3, marginBottom: 12 },

  stepTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
  stepSub:   { fontSize: 13, color: '#6B7280', marginBottom: 16 },

  creditBanner:      { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 18 },
  creditBadge:       { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  creditTierLabel:   { fontSize: 13, fontWeight: '700' },
  creditLimitTxt:    { fontSize: 11, color: '#6B7280', marginTop: 1 },
  creditScorePill:   { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  creditScorePillTxt:{ fontSize: 10, color: 'white', fontWeight: '700' },

  typeCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#E5E7EB' },
  typeCardActive: { borderColor: PURPLE, backgroundColor: '#FAFAFF' },
  typeIconBox:    { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  typeTitle:      { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 3 },
  typeDesc:       { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  typeCheck:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  badgePill:      { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  badgePillTxt:   { fontSize: 10, color: '#059669', fontWeight: '600' },

  fieldGroup:  { marginBottom: 18 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 7 },
  req:         { color: '#EF4444' },
  optionalTxt: { color: '#9CA3AF', fontWeight: '400' },
  input:       { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 13, fontSize: 15, color: '#1F2937' },
  amtRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingLeft: 13 },
  amtPfx:      { fontSize: 18, fontWeight: '700', color: '#1F2937', marginRight: 4 },
  amtInput:    { flex: 1, fontSize: 18, fontWeight: '600', paddingVertical: 12, paddingRight: 13, color: '#1F2937' },
  errTxt:      { fontSize: 12, color: '#EF4444', marginTop: 5 },
  quickRow:    { flexDirection: 'row', gap: 8, marginTop: 9 },
  quickBtn:    { flex: 1, borderWidth: 1, borderColor: '#FFEDD5', borderRadius: 8, paddingVertical: 8, alignItems: 'center', backgroundColor: '#FAFAFF' },
  quickBtnActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  quickBtnTxt: { fontSize: 12, fontWeight: '600', color: PURPLE },

  dtiBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, padding: 9, marginTop: 9 },
  dtiTxt: { fontSize: 12, fontWeight: '500', flex: 1 },

  estBox:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12, marginBottom: 16 },
  estLabel: { fontSize: 11, color: '#7C3AED', marginBottom: 2 },
  estAmt:   { fontSize: 18, fontWeight: '800', color: PURPLE },
  estNote:  { fontSize: 10, color: '#7C3AED', marginTop: 2 },

  chipScroll: { marginTop: 4 },
  chip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  chipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  chipTxt:    { fontSize: 13, color: '#374151' },
  chipTxtActive: { color: 'white', fontWeight: '600' },

  checkGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  checkItem:       { flexDirection: 'row', alignItems: 'center', gap: 8, width: '47%', backgroundColor: 'white', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  checkItemActive: { borderColor: PURPLE, backgroundColor: '#FAFAFF' },
  checkBox:        { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  checkBoxActive:  { backgroundColor: PURPLE, borderColor: PURPLE },
  checkLbl:        { fontSize: 13, color: '#374151' },

  navRow:        { flexDirection: 'row', gap: 10, marginTop: 20 },
  backBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F3F4F6', borderRadius: 11 },
  backBtnTxt:    { fontSize: 14, fontWeight: '600', color: '#374151' },
  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PURPLE, paddingVertical: 14, borderRadius: 11 },
  primaryBtnTxt: { color: 'white', fontSize: 15, fontWeight: '700' },
  disabledBtn:   { backgroundColor: '#FED7AA' },
  reviewBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F59E0B', paddingVertical: 14, borderRadius: 11 },
  submitBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 11, minHeight: 52 },

  summaryChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 14, alignSelf: 'flex-start' },
  summaryChipTxt: { fontSize: 12, color: PURPLE, fontWeight: '500' },

  lenderCard:           { backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  lenderCardSelected:   { borderWidth: 2, borderColor: PURPLE },
  lenderCardIneligible: { opacity: 0.6 },
  lenderHeader:         { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  lenderLogoBox:        { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  lenderName:           { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  starsRow:             { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewCnt:            { fontSize: 11, color: '#6B7280', marginLeft: 3 },
  lenderTags:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  lenderTag:            { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  lenderTagTxt:         { fontSize: 11, color: PURPLE, fontWeight: '500' },
  lenderLimits:         { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  ineligibleBox:        { flexDirection: 'row', backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 10 },
  ineligibleTxt:        { fontSize: 12, color: '#B91C1C', lineHeight: 18 },

  calcBox:   { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 12 },
  calcTitle: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  calcRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  calcKey:   { fontSize: 13, color: '#6B7280' },
  calcVal:   { fontSize: 13, fontWeight: '600', color: '#1F2937' },

  selectBtn:         { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  selectBtnSelected: { backgroundColor: PURPLE },
  selectBtnDisabled: { backgroundColor: '#F3F4F6' },
  selectBtnTxt:      { fontWeight: '700', fontSize: 14, color: PURPLE },

  centeredView:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  companyModal:       { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, maxHeight: '88%' },
  companyModalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  companyModalName:   { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  modalSectionTitle:  { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalBodyTxt:       { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  modalRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalKey:           { fontSize: 13, color: '#6B7280', flex: 1 },
  modalVal:           { fontSize: 13, fontWeight: '500', color: '#1F2937', textAlign: 'right', flex: 1 },
  modalReqRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 7 },
  modalReqTxt:        { fontSize: 13, color: '#374151', flex: 1 },

  reviewCard:      { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#FFEDD5' },
  reviewCardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  reviewRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reviewKey:       { fontSize: 13, color: '#6B7280' },
  reviewVal:       { fontSize: 13, fontWeight: '600', color: '#1F2937', textAlign: 'right', flex: 1, paddingLeft: 8 },

  docProgressWrap:  { marginBottom: 16 },
  docProgressLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  docProgressTrack: { height: 7, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  docProgressFill:  { height: '100%', borderRadius: 4 },
  docProgressTxt:   { fontSize: 12, fontWeight: '600' },

  reqSection:   { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  reqHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  reqBullet:    { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  reqBulletNum: { fontSize: 13, fontWeight: '700', color: PURPLE },
  reqTitle:     { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  reqStatus:    { fontSize: 12, marginTop: 2 },
  doneBadge:    { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  doneBadgeTxt: { fontSize: 11, color: '#10B981', fontWeight: '700' },

  uploadRow:    { flexDirection: 'row', gap: 10, marginBottom: 10 },
  uploadBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#FFEDD5', borderRadius: 8, paddingVertical: 10, backgroundColor: '#FAFAFF' },
  uploadBtnTxt: { fontSize: 13, color: PURPLE, fontWeight: '600' },

  docRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginBottom: 6 },
  docIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  docName: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  docDate: { fontSize: 10, color: '#FED7AA', marginTop: 1 },

  progressBanner:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1 },
  progressBannerTxt: { fontSize: 13, fontWeight: '600' },

  disclaimerBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  disclaimerTxt: { fontSize: 12, color: '#6B7280', lineHeight: 17, flex: 1 },
});

export default LoanApplicationScreen;