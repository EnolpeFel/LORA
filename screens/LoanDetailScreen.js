import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LoanStore, { getCreditTier } from './Loanstore.js';

const { width } = Dimensions.get('window');

const LoanDetailScreen = ({ navigation, route }) => {
  const { loanId, darkMode = false } = route.params || {};
  const d = darkMode;

  // ── Reactive store subscription ──────────────────────────────────────────
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    LoanStore.subscribe(listener);
    return () => LoanStore.unsubscribe(listener);
  }, []);

  // Resolve loan from active OR history
  const activeLoan  = LoanStore.getActiveLoan();
  const historyLoan = LoanStore.getLoanHistory().find(l => l.id === loanId);
  const loan        = activeLoan?.id === loanId ? activeLoan : historyLoan;

  // Transactions for this loan
  const loanTxns  = LoanStore.getTransactions(loanId);
  const creditTier = getCreditTier(loan?.creditScore || 200);

  // ─── Color Palette ──────────────────────────────────────────────────────────
  const C = {
    bg: d ? '#0A0F1E' : '#F8FAFC',
    card: d ? '#1A1F2E' : '#FFFFFF',
    border: d ? '#2D3345' : '#E2E8F0',
    text: d ? '#F1F5F9' : '#0F172A',
    subtext: d ? '#94A3B8' : '#475569',
    faint: d ? '#262B3C' : '#F1F5F9',
    purple: '#FB923C',
    purpleLight: d ? '#431407' : '#FFF7ED',
    purpleMid: d ? '#5C1A0A' : '#FFEDD5',
    green: '#10B981',
    greenLight: d ? '#064E3B' : '#D1FAE5',
    greenText: d ? '#6EE7B7' : '#166534',
    amber: '#F59E0B',
    amberLight: d ? '#78350F' : '#FEF3C7',
    amberText: d ? '#FCD34D' : '#92400E',
    red: '#EF4444',
    redLight: d ? '#7F1D1D' : '#FEE2E2',
    redText: d ? '#FCA5A5' : '#B91C1C',
    shadow: d ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)',
  };

  const [activeTab, setActiveTab] = useState('overview');

  if (!loan) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: C.bg }]}>
        <View style={[s.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: C.text }]}>Loan Detail</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={s.notFound}>
          <Ionicons name="document-text-outline" size={52} color={C.subtext} />
          <Text style={[s.notFoundText, { color: C.text }]}>Loan not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isActive      = loan.status === 'Active';
  const isFailed      = loan.status === 'Failed';
  const isActiveLoan  = activeLoan?.id === loanId;   // shown in CurrentLoanScreen
  const paymentsTotal = loan.term;
  const totalPaid     = loan.monthlyPayment * (loan.paymentsCompleted || 0);
  const remainingPayments = paymentsTotal - (loan.paymentsCompleted || 0);
  const totalPointsEarned = loanTxns.reduce((sum, t) => sum + (t.creditPointsEarned || 0), 0);

  // Navigate to the full CurrentLoanScreen for the active loan
  const goToCurrentLoan = () => navigation.navigate('CurrentLoan');

  const formatCurrency = (n) =>
    `₱${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getLoanIcon = (type) => {
    if (type === 'Home Loan') return 'home-outline';
    if (type === 'Emergency Loan') return 'flash-outline';
    if (type === 'Business Loan') return 'briefcase-outline';
    return 'person-outline';
  };

  const getTxIcon = (type, status) => {
    if (status === 'Failed') return { icon: 'close-circle', color: C.red, bg: C.redLight };
    if (type === 'Payment') return { icon: 'cash-outline', color: C.purple, bg: C.purpleLight };
    return { icon: 'arrow-down-circle-outline', color: C.green, bg: C.greenLight };
  };

  // ─── Overview Tab ────────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <>
      {/* Hero Card */}
      <View style={[s.heroCard, { backgroundColor: isFailed ? C.red : C.purple }]}>
        <View style={s.heroTop}>
          <View style={s.heroIconWrap}>
            <Ionicons name={isFailed ? 'close-circle-outline' : getLoanIcon(loan.type)} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.heroId}>{loan.id}</Text>
            <Text style={s.heroType}>{loan.type}</Text>
          </View>
          <View style={[s.heroBadge, { backgroundColor: isFailed ? 'rgba(0,0,0,0.25)' : isActive ? C.green : 'rgba(255,255,255,0.25)' }]}>
            <Text style={s.heroBadgeText}>{loan.status}</Text>
          </View>
        </View>

        <Text style={s.heroAmount}>{formatCurrency(loan.amount)}</Text>
        <Text style={s.heroPurpose}>{loan.purpose}</Text>

        {isFailed && (
          <View style={s.heroFailedBanner}>
            <Ionicons name="alert-circle-outline" size={15} color="rgba(255,255,255,0.9)" />
            <Text style={s.heroFailedText}>Declined · {loan.failureReason}</Text>
          </View>
        )}

        {isActive && (
          <View style={s.heroProgress}>
            <View style={s.heroProgressLabelRow}>
              <Text style={s.heroProgressLabel}>{loan.paymentsCompleted}/{paymentsTotal} payments</Text>
              <Text style={s.heroProgressPct}>{loan.progress}%</Text>
            </View>
            <View style={s.heroProgressBg}>
              <View style={[s.heroProgressFill, { width: `${loan.progress}%` }]} />
            </View>
          </View>
        )}
      </View>

      {/* Failed — application details card */}
      {isFailed && (
        <View style={[s.failedDetailCard, { backgroundColor: C.redLight, borderColor: `${C.red}40` }]}>
          <View style={s.failedDetailRow}>
            <Ionicons name="calendar-outline" size={16} color={C.red} />
            <Text style={[s.failedDetailLbl, { color: C.subtext }]}>Applied on</Text>
            <Text style={[s.failedDetailVal, { color: C.text }]}>{loan.applicationDate}</Text>
          </View>
          <View style={[s.failedDetailRow, { borderTopWidth: 1, borderTopColor: `${C.red}20` }]}>
            <Ionicons name="close-circle-outline" size={16} color={C.red} />
            <Text style={[s.failedDetailLbl, { color: C.subtext }]}>Declined on</Text>
            <Text style={[s.failedDetailVal, { color: C.red }]}>{loan.failureDate}</Text>
          </View>
          <View style={[s.failedDetailRow, { borderTopWidth: 1, borderTopColor: `${C.red}20` }]}>
            <Ionicons name="information-circle-outline" size={16} color={C.red} />
            <Text style={[s.failedDetailLbl, { color: C.subtext }]}>Reason</Text>
            <Text style={[s.failedDetailVal, { color: C.text, flex: 1.5 }]}>{loan.failureReason}</Text>
          </View>
          <TouchableOpacity
            style={[s.reapplyBtn, { backgroundColor: C.purple }]}
            onPress={() => navigation.navigate('LoanApplication')}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={s.reapplyBtnTxt}>Re-apply for this Loan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Key Stats Grid — hide for failed */}
      {!isFailed && (
        <View style={[s.statsGrid, { backgroundColor: C.card, shadowColor: C.shadow }]}>
          {[
            { label: 'Monthly Payment', value: formatCurrency(loan.monthlyPayment), color: C.text },
            { label: 'Interest Rate', value: `${loan.interestRate}%`, color: C.amber },
            { label: 'Total Paid', value: formatCurrency(totalPaid), color: C.green },
            { label: 'Balance', value: isActive ? formatCurrency(loan.remainingBalance) : 'Fully Paid', color: isActive ? C.purple : C.green },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <View style={s.statItem}>
                <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
                <Text style={[s.statLbl, { color: C.subtext }]}>{item.label}</Text>
              </View>
              {i % 2 === 0 ? <View style={[s.statDividerV, { backgroundColor: C.border }]} /> : null}
              {i === 1 ? <View style={[s.statDividerH, { backgroundColor: C.border }]} /> : null}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Loan Info Section */}
      <View style={[s.section, { backgroundColor: C.card, shadowColor: C.shadow }]}>
        <Text style={[s.sectionTitle, { color: C.text }]}>Loan Information</Text>
        {[
          { label: 'Lender',            value: loan.lender,           icon: 'account-balance' },
          { label: 'Loan Type',         value: loan.type,             icon: 'description'     },
          { label: 'Purpose',           value: loan.purpose,          icon: 'category'        },
          { label: 'Interest Type',     value: loan.interestType,     icon: 'trending-up'     },
          { label: 'Term',              value: `${loan.term} months`, icon: 'schedule'        },
          { label: 'Application Date',  value: loan.applicationDate,  icon: 'event'           },
          ...(!isFailed ? [{ label: 'Disbursement Date', value: loan.loanStartDate, icon: 'send' }] : []),
        ].map((row, i) => (
          <View key={i} style={[s.infoRow, i > 0 ? { borderTopWidth: 1, borderTopColor: C.border } : null]}>
            <MaterialIcons name={row.icon} size={16} color={C.subtext} />
            <Text style={[s.infoLabel, { color: C.subtext }]}>{row.label}</Text>
            <Text style={[s.infoValue, { color: C.text }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Financial Breakdown — hide for failed */}
      {!isFailed && (
        <View style={[s.section, { backgroundColor: C.card, shadowColor: C.shadow }]}>
          <Text style={[s.sectionTitle, { color: C.text }]}>Financial Breakdown</Text>
          {[
            { label: 'Principal Amount', value: formatCurrency(loan.amount),         color: C.text  },
            { label: 'Total Interest',   value: formatCurrency(loan.totalInterest),  color: C.amber },
            { label: 'Processing Fee',   value: formatCurrency(loan.processingFee),  color: C.red   },
          ].map((row, i) => (
            <View key={i} style={[s.breakRow, i > 0 ? { borderTopWidth: 1, borderTopColor: C.border } : null]}>
              <Text style={[s.breakLabel, { color: C.subtext }]}>{row.label}</Text>
              <Text style={[s.breakValue, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
          <View style={[s.netReleaseRow, { backgroundColor: C.purpleLight }]}>
            <Text style={[s.netReleaseLabel, { color: C.purple }]}>Net Amount Released</Text>
            <Text style={[s.netReleaseVal, { color: C.purple }]}>{formatCurrency(loan.netRelease)}</Text>
          </View>
        </View>
      )}

      {/* Next Payment (active only) */}
      {isActive && (
        <View style={[s.nextPayCard, { backgroundColor: C.amberLight, borderColor: `${C.amber}50` }]}>
          <View style={s.nextPayLeft}>
            <MaterialIcons name="event" size={18} color={C.amber} />
            <View style={{ marginLeft: 10 }}>
              <Text style={[s.nextPayLabel, { color: C.amberText }]}>Next Payment Due</Text>
              <Text style={[s.nextPayDate, { color: C.amberText }]}>{loan.nextDueDate}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.nextPayAmt, { color: C.amberText }]}>{formatCurrency(loan.monthlyPayment)}</Text>
            <Text style={[s.nextPayRemaining, { color: C.amber }]}>{remainingPayments} monthly payments left</Text>
          </View>
        </View>
      )}
    </>
  );

  // ─── Schedule Tab ────────────────────────────────────────────────────────────
  // Build amortisation rows with due dates derived from disbursementDate
  const buildScheduleRows = () => {
    const base = new Date(loan.loanStartDate || loan.applicationDate);
    const monthlyRate = loan.interestRate / 100 / 12;
    const payment = loan.monthlyPayment;
    let balance = loan.amount;
    return Array.from({ length: paymentsTotal }, (_, i) => {
      const num       = i + 1;
      const isPaid    = num <= loan.paymentsCompleted;
      const isCurrent = isActive && num === loan.paymentsCompleted + 1;
      const interest  = parseFloat((balance * monthlyRate).toFixed(2));
      const principal = parseFloat((payment - interest).toFixed(2));
      balance         = parseFloat(Math.max(0, balance - principal).toFixed(2));
      // Due date = disbursement date + num months, same day-of-month
      const due = new Date(base);
      due.setMonth(due.getMonth() + num);
      const dueLabel = due.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
      return { num, isPaid, isCurrent, dueLabel, principal, interest, payment, balance };
    });
  };
  const scheduleRows = buildScheduleRows();

  const ScheduleTab = () => (
    <View style={{ gap: 12 }}>
      {/* Summary bar */}
      <View style={[s.schSummaryBar, { backgroundColor: C.card, shadowColor: C.shadow }]}>
        {[
          { val: loan.paymentsCompleted, lbl: 'Paid',      color: C.green  },
          { val: remainingPayments,      lbl: 'Remaining', color: C.purple },
          { val: paymentsTotal,     lbl: 'Total',     color: C.text   },
        ].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={[s.schSumDivider, { backgroundColor: C.border }]} />}
            <View style={s.schSumItem}>
              <Text style={[s.schSumVal, { color: item.color }]}>{item.val}</Text>
              <Text style={[s.schSumLbl, { color: C.subtext }]}>{item.lbl}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Legend */}
      <View style={[s.schLegendRow, { backgroundColor: C.card, shadowColor: C.shadow }]}>
        {[
          { color: C.green,  bg: C.greenLight,  label: 'Paid'     },
          { color: C.purple, bg: C.purpleLight, label: 'Current'  },
          { color: C.subtext,bg: C.faint,       label: 'Upcoming' },
        ].map((item, i) => (
          <View key={i} style={s.schLegendItem}>
            <View style={[s.schLegendDot, { backgroundColor: item.bg, borderColor: item.color }]} />
            <Text style={[s.schLegendTxt, { color: C.subtext }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Monthly rows */}
      {scheduleRows.map(({ num, isPaid, isCurrent, dueLabel, principal, interest, payment, balance }) => {
        const rowBg     = isPaid ? C.greenLight  : isCurrent ? C.purpleLight : C.card;
        const accentClr = isPaid ? C.green       : isCurrent ? C.purple      : C.subtext;
        const amtClr    = isPaid ? C.green       : isCurrent ? C.purple      : C.text;
        return (
          <View
            key={num}
            style={[
              s.schRow,
              {
                backgroundColor: rowBg,
                borderColor: isPaid ? C.green : isCurrent ? C.purple : C.border,
                shadowColor: C.shadow,
              },
            ]}
          >
            {/* Left: number badge + dates */}
            <View style={[s.schNumBadge, { backgroundColor: isPaid ? C.green : isCurrent ? C.purple : C.border }]}>
              {isPaid ? (
                <Ionicons name="checkmark" size={13} color="#fff" />
              ) : isCurrent ? (
                <Ionicons name="time-outline" size={13} color="#fff" />
              ) : (
                <Text style={s.schNumTxt}>{num}</Text>
              )}
            </View>

            <View style={s.schMid}>
              <Text style={[s.schMonthLbl, { color: accentClr }]}>
                Month {num}{isCurrent ? '  ← Current' : ''}
              </Text>
              <Text style={[s.schDueDate, { color: C.subtext }]}>Due: {dueLabel}</Text>
              <View style={s.schBreakdownRow}>
                <Text style={[s.schBreakdownTxt, { color: C.subtext }]}>
                  P: {formatCurrency(principal)}
                </Text>
                <Text style={[s.schBreakdownSep, { color: C.border }]}>·</Text>
                <Text style={[s.schBreakdownTxt, { color: C.red }]}>
                  I: {formatCurrency(interest)}
                </Text>
              </View>
            </View>

            {/* Right: amount + balance */}
            <View style={s.schRight}>
              <Text style={[s.schPayAmt, { color: amtClr }]}>{formatCurrency(payment)}</Text>
              <Text style={[s.schBalanceTxt, { color: C.subtext }]}>
                Bal: {formatCurrency(balance)}
              </Text>
              {isPaid && (
                <View style={[s.schPaidPill, { backgroundColor: C.green }]}>
                  <Text style={s.schPaidPillTxt}>Paid</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  // ─── Transactions Tab ────────────────────────────────────────────────────────
  const TransactionsTab = () => (
    <View style={{ gap: 10 }}>
      <View style={[s.txSummary, { backgroundColor: C.card, shadowColor: C.shadow }]}>
        {[
          { label: 'Total Txns', value: loanTxns.length, color: C.text },
          { label: 'Completed', value: loanTxns.filter(t => t.status === 'Completed').length, color: C.green },
          { label: 'Failed', value: loanTxns.filter(t => t.status === 'Failed').length, color: C.red },
          { label: 'Points', value: `+${totalPointsEarned}`, color: C.amber },
        ].map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={[s.txSumDivider, { backgroundColor: C.border }]} /> : null}
            <View style={s.txSumItem}>
              <Text style={[s.txSumVal, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.txSumLabel, { color: C.subtext }]}>{item.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {loanTxns.length === 0 ? (
        <View style={[s.txEmpty, { backgroundColor: C.card }]}>
          <Ionicons name="receipt-outline" size={40} color={C.subtext} />
          <Text style={[s.txEmptyText, { color: C.subtext }]}>No transactions yet</Text>
        </View>
      ) : (
        loanTxns.map(tx => {
          const cfg = getTxIcon(tx.type, tx.status);
          const isOk = tx.status === 'Completed';
          const isFail = tx.status === 'Failed';
          return (
            <View key={tx.id} style={[s.txCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              <View style={[s.txIconWrap, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={20} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.txType, { color: C.text }]}>{tx.type}</Text>
                <Text style={[s.txDate, { color: C.subtext }]}>{tx.date} · {tx.time}</Text>
                <Text style={[s.txMethod, { color: C.subtext }]}>{tx.paymentMethod}</Text>
                {tx.creditPointsEarned > 0 && (
                  <View style={[s.ptsBadge, { backgroundColor: C.amberLight }]}>
                    <MaterialIcons name="star" size={10} color={C.amber} />
                    <Text style={[s.ptsBadgeText, { color: C.amberText }]}>+{tx.creditPointsEarned} pts</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 5 }}>
                <Text style={[s.txAmount, { color: isFail ? C.red : C.text }]}>
                  ₱{tx.amount}
                </Text>
                <View style={[s.txStatusPill, {
                  backgroundColor: isOk ? C.greenLight : isFail ? C.redLight : C.faint
                }]}>
                  <Text style={[s.txStatusText, {
                    color: isOk ? C.greenText : isFail ? C.redText : C.subtext
                  }]}>
                    {tx.status}
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* View All in Transactions Screen */}
      <TouchableOpacity
        style={[s.viewAllBtn, { backgroundColor: C.purpleLight, borderColor: C.purpleMid }]}
        onPress={() => navigation.navigate('Transactions', {
          transactions: loanTxns,
          loanId: loan.id,
          loanType: loan.type,
          darkMode: d,
        })}
      >
        <Ionicons name="receipt-outline" size={16} color={C.purple} />
        <Text style={[s.viewAllText, { color: C.purple }]}>Open Full Transaction History</Text>
        <Ionicons name="chevron-forward" size={16} color={C.purple} />
      </TouchableOpacity>
    </View>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={d ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: C.text }]}>Loan Detail</Text>
          <Text style={[s.headerSub, { color: C.subtext }]}>{loan.id}</Text>
        </View>
        {/* For the active loan: shortcut to full CurrentLoanScreen */}
        {isActiveLoan && isActive && (
          <TouchableOpacity
            style={[s.payNowBtn, { backgroundColor: C.purpleLight, marginRight: 6 }]}
            onPress={goToCurrentLoan}
          >
            <Text style={[s.payNowText, { color: C.purple }]}>Full View</Text>
          </TouchableOpacity>
        )}
        {isActive && (
          <TouchableOpacity
            style={[s.payNowBtn, { backgroundColor: C.purple }]}
            onPress={() => navigation.navigate('PayNow', {
              loanApplication: {
                id:                loan.id,
                type:              loan.type,
                purpose:           loan.purpose || '',
                lender:            loan.lender,
                status:            loan.status,
                nextDueDate:       loan.nextDueDate,
                dueDate:           loan.nextDueDate,
                terms:             `${loan.term} months`,
                term:              loan.term,
                applicationDate:   loan.applicationDate || '',
                disbursementDate:  loan.loanStartDate || '',
                loanAmount:        loan.amount,
                remainingBalance:  loan.remainingBalance,
                interestRate:      loan.interestRate,
                interestType:      loan.interestType,
                monthlyPayment:    loan.monthlyPayment,
                totalInterest:     loan.totalInterest,
                processingFee:     loan.processingFee,
                netRelease:        loan.netRelease,
                totalPayableAmount:loan.totalPayable || (loan.monthlyPayment * paymentsTotal),
                paymentsCompleted: loan.paymentsCompleted,
                paymentsRemaining: paymentsTotal - loan.paymentsCompleted,
                paymentsTotal:     paymentsTotal,
                paidAmount:        loan.paidAmount || (loan.monthlyPayment * loan.paymentsCompleted),
              },
              billingInfo: {
                basePayment:     loan.monthlyPayment,
                principalAmount: loan.monthlyPayment - (loan.remainingBalance * loan.interestRate / 100 / 12),
                interestAmount:  loan.remainingBalance * loan.interestRate / 100 / 12,
                lateFees:        0,
                totalAmountDue:  loan.monthlyPayment,
                daysLate:        0,
              },
              transactions: [],
            })}
          >
            <Text style={s.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar — hide schedule & transactions for failed applications */}
      {!isFailed && (
        <View style={[s.tabBar, { backgroundColor: C.card, borderBottomColor: C.border }]}>
          {[
            { key: 'overview',      label: 'Overview',                    icon: 'grid-outline'    },
            { key: 'schedule',      label: 'Schedule',                    icon: 'calendar-outline'},
            { key: 'transactions',  label: `History (${loanTxns.length})`,icon: 'receipt-outline' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key ? { borderBottomColor: C.purple, borderBottomWidth: 2 } : null]}
              onPress={() => setActiveTab(tab.key)}
            >
            <Ionicons
              name={tab.icon}
              size={15}
              color={activeTab === tab.key ? C.purple : C.subtext}
            />
            <Text style={[
              s.tabText,
              { color: activeTab === tab.key ? C.purple : C.subtext }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      )}

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {(isFailed || activeTab === 'overview') && <OverviewTab />}
        {!isFailed && activeTab === 'schedule' && <ScheduleTab />}
        {!isFailed && activeTab === 'transactions' && <TransactionsTab />}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 1 },
  payNowBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  payNowText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 12, fontWeight: '600' },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 2,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  heroIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroId: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroType: { fontSize: 15, color: '#fff', fontWeight: '700' },
  heroBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroAmount: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 4 },
  heroPurpose: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  heroProgress: {},
  heroProgressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  heroProgressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroProgressPct: { fontSize: 12, color: '#fff', fontWeight: '700' },
  heroProgressBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  heroProgressFill: { height: '100%', borderRadius: 3, backgroundColor: '#fff' },
  heroFailedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 10, marginTop: 4 },
  heroFailedText:   { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500', flex: 1 },

  // Failed detail card
  failedDetailCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  failedDetailRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  failedDetailLbl:  { fontSize: 13, flex: 1 },
  failedDetailVal:  { fontSize: 13, fontWeight: '600', flex: 1.5, textAlign: 'right' },
  reapplyBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, marginTop: 8 },
  reapplyBtnTxt:    { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Stats Grid (2×2)
  statsGrid: {
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: { width: '50%', padding: 16, alignItems: 'center' },
  statVal: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  statLbl: { fontSize: 11, fontWeight: '500' },
  statDividerV: { width: 1, height: '100%', position: 'absolute', left: '50%' },
  statDividerH: { width: '100%', height: 1 },

  // Section Card
  section: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },

  // Info Rows
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  infoLabel: { flex: 1, fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600', textAlign: 'right' },

  // Breakdown
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  breakLabel: { fontSize: 13 },
  breakValue: { fontSize: 13, fontWeight: '600' },
  netReleaseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 8 },
  netReleaseLabel: { fontSize: 13, fontWeight: '700' },
  netReleaseVal: { fontSize: 17, fontWeight: '800' },

  // Next Payment
  nextPayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  nextPayLeft: { flexDirection: 'row', alignItems: 'center' },
  nextPayLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  nextPayDate: { fontSize: 15, fontWeight: '700' },
  nextPayAmt: { fontSize: 17, fontWeight: '800' },
  nextPayRemaining: { fontSize: 11, fontWeight: '500' },

  // Schedule — monthly payment list
  schSummaryBar: {
    flexDirection: 'row', borderRadius: 14, padding: 14, alignItems: 'center',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  schSumItem:    { flex: 1, alignItems: 'center' },
  schSumVal:     { fontSize: 20, fontWeight: '800' },
  schSumLbl:     { fontSize: 11, fontWeight: '500', marginTop: 2 },
  schSumDivider: { width: 1, height: 30, marginHorizontal: 4 },

  schLegendRow:  {
    flexDirection: 'row', gap: 16, borderRadius: 12, padding: 12,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  schLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  schLegendDot:  { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  schLegendTxt:  { fontSize: 12, fontWeight: '500' },

  schRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  schNumBadge: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  schNumTxt:       { fontSize: 12, fontWeight: '700', color: '#fff' },
  schMid:          { flex: 1 },
  schMonthLbl:     { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  schDueDate:      { fontSize: 11, marginBottom: 3 },
  schBreakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  schBreakdownTxt: { fontSize: 11, fontWeight: '500' },
  schBreakdownSep: { fontSize: 11 },
  schRight:        { alignItems: 'flex-end', gap: 4 },
  schPayAmt:       { fontSize: 15, fontWeight: '800' },
  schBalanceTxt:   { fontSize: 10 },
  schPaidPill:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  schPaidPillTxt:  { fontSize: 10, fontWeight: '700', color: '#fff' },

  // Transactions Tab
  txSummary: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  txSumItem: { flex: 1, alignItems: 'center' },
  txSumVal: { fontSize: 18, fontWeight: '800' },
  txSumLabel: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  txSumDivider: { width: 1, height: 28, marginHorizontal: 4 },

  txEmpty: { borderRadius: 14, padding: 32, alignItems: 'center', gap: 8 },
  txEmptyText: { fontSize: 13 },

  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
  },
  txIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  txType: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  txDate: { fontSize: 11, marginBottom: 1 },
  txMethod: { fontSize: 11, marginBottom: 4 },
  ptsBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ptsBadgeText: { fontSize: 10, fontWeight: '700' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  txStatusText: { fontSize: 10, fontWeight: '700' },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  viewAllText: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'center' },

  // Not found
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notFoundText: { fontSize: 16, fontWeight: '600' },
});

export default LoanDetailScreen;