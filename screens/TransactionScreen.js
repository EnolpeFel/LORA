import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Modal, ScrollView, Alert, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Optional expo modules — gracefully degrade if not installed
let Print, Sharing, FileSystem;
try { Print = require('expo-print'); } catch (_) {}
try { Sharing = require('expo-sharing'); } catch (_) {}
try { FileSystem = require('expo-file-system'); } catch (_) {}

import LoanStore from './Loanstore.js';

const TransactionsScreen = ({ navigation, route }) => {
  const { darkMode = false, loanId, loanType } = route.params || {};
  const d = darkMode;

  // ─── Color Palette (dark-mode aware) ────────────────────────────────────────
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
    green: '#10B981',
    greenLight: d ? '#064E3B' : '#DCFCE7',
    greenText: d ? '#6EE7B7' : '#166534',
    amber: '#F59E0B',
    amberLight: d ? '#78350F' : '#FEF3C7',
    amberText: d ? '#FCD34D' : '#92400E',
    red: '#EF4444',
    redLight: d ? '#7F1D1D' : '#FEE2E2',
    redText: d ? '#FCA5A5' : '#B91C1C',
    blue: '#3B82F6',
    blueLight: d ? '#431407' : '#EFF6FF',
    shadow: d ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)',
    modalBg: d ? '#111827' : '#FFFFFF',
    overlay: 'rgba(0,0,0,0.6)',
  };

  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [txFilter, setTxFilter] = useState('all');

  // ── Pull transactions from LoanStore (live), fall back to route params ──
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    LoanStore.subscribe(listener);
    return () => LoanStore.unsubscribe(listener);
  }, []);

  const rawTransactions = loanId
    ? LoanStore.getTransactions(loanId)
    : (route.params?.transactions || LoanStore.getTransactions());

  const transactions = rawTransactions.filter(tx => {
    if (txFilter === 'payments') return tx.type === 'Payment';
    if (txFilter === 'disbursements') return tx.type === 'Loan Disbursement';
    if (txFilter === 'failed') return tx.status === 'Failed';
    return true;
  });

  const totalPoints = rawTransactions.reduce((sum, t) => sum + (t.creditPointsEarned || 0), 0);
  const successCount = rawTransactions.filter(t => t.status === 'Completed').length;
  const failedCount = rawTransactions.filter(t => t.status === 'Failed').length;

  const screenTitle = loanId
    ? `${loanType || 'Loan'} History`
    : 'All Transactions';

  const screenSubtitle = loanId
    ? `${loanId} · ${rawTransactions.length} records`
    : `${rawTransactions.length} total records`;

  // ─── Receipt HTML ─────────────────────────────────────────────────────────────
  const generateReceiptHTML = (tx) => `
    <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:Arial,sans-serif;padding:24px;color:#1a1a1a;max-width:480px;margin:auto}
    .brand{font-size:22px;font-weight:800;color:#FB923C;margin-bottom:4px}
    .title{font-size:17px;font-weight:700;margin-bottom:2px}
    .meta{font-size:12px;color:#666;margin-bottom:16px}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:20px}
    .ok{background:#DCFCE7;color:#166534}.fail{background:#FEE2E2;color:#B91C1C}
    h3{font-size:13px;font-weight:700;color:#FB923C;border-bottom:1px solid #E5E7EB;padding-bottom:6px;margin:16px 0 10px}
    .row{display:flex;justify-content:space-between;margin-bottom:7px;font-size:13px}
    .lbl{color:#6B7280}.val{font-weight:500}
    .amt{color:#FB923C;font-weight:700}
    .hl{background:#FFF7ED;border-radius:8px;padding:10px 12px;margin-top:8px}
    .pts{background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px 12px;margin:12px 0}
    .footer{margin-top:24px;text-align:center;font-size:11px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:14px}
    </style></head><body>
    <div class="brand">LORA FINANCE</div>
    <div class="title">Transaction Receipt</div>
    <div class="meta">Receipt #${tx.transactionId || tx.id} · ${tx.date} at ${tx.time}</div>
    <span class="badge ${tx.status === 'Completed' ? 'ok' : 'fail'}">${tx.status}</span>
    <h3>Transaction Details</h3>
    <div class="row"><span class="lbl">Type</span><span class="val">${tx.type}</span></div>
    <div class="row"><span class="lbl">Amount</span><span class="val amt">₱${tx.amount}</span></div>
    <div class="row"><span class="lbl">Payment Method</span><span class="val">${tx.paymentMethod || 'N/A'}</span></div>
    ${tx.failureReason ? `<div class="row"><span class="lbl" style="color:#EF4444">Failure Reason</span><span class="val" style="color:#EF4444">${tx.failureReason}</span></div>` : ''}
    <h3>Loan Information</h3>
    <div class="row"><span class="lbl">Loan ID</span><span class="val">${tx.loanId}</span></div>
    <div class="row"><span class="lbl">Type</span><span class="val">${tx.loanType || 'N/A'}</span></div>
    <div class="row"><span class="lbl">Lender</span><span class="val">${tx.lender || 'N/A'}</span></div>
    <div class="row"><span class="lbl">Application Date</span><span class="val">${tx.applicationDate || 'N/A'}</span></div>
    ${tx.loanAmount ? `
    <h3>Loan Terms</h3>
    <div class="row"><span class="lbl">Principal</span><span class="val amt">₱${tx.loanAmount.toLocaleString()}</span></div>
    <div class="row"><span class="lbl">Term</span><span class="val">${tx.term}</span></div>
    <div class="row"><span class="lbl">Interest Rate</span><span class="val">${tx.interestRate}% ${tx.interestType}</span></div>
    <div class="row"><span class="lbl">Total Interest</span><span class="val amt">₱${tx.totalInterest?.toFixed(2)}</span></div>
    <div class="row"><span class="lbl">Processing Fee</span><span class="val">₱${tx.processingFee?.toFixed(2)}</span></div>
    <div class="hl"><div class="row"><span class="lbl" style="font-weight:700">Net Released</span><span class="val amt">₱${tx.netRelease?.toFixed(2)}</span></div></div>` : ''}
    ${tx.creditPointsEarned > 0 ? `
    <div class="pts">
      <div style="font-weight:700;color:#92400E;margin-bottom:4px">⭐ +${tx.creditPointsEarned} Credit Points Earned</div>
      <div style="font-size:12px;color:#78350F">${tx.type === 'Payment' ? 'On-time repayment (+20 pts)' : 'Lora transaction (+5 pts)'}</div>
    </div>` : ''}
    <div class="footer">
      <p>Thank you for banking with Lora Finance by RightApp Inc.</p>
      <p>Generated ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
    </div></body></html>
  `;

  const downloadPDF = async (tx) => {
    if (!Print || !FileSystem) {
      Alert.alert('Unavailable', 'Install expo-print and expo-file-system to enable PDF downloads.', [{ text: 'OK' }]);
      return;
    }
    try {
      setIsDownloading(true);
      const { uri } = await Print.printToFileAsync({ html: generateReceiptHTML(tx) });
      const filename = `Lora_Receipt_${tx.transactionId || tx.id}_${Date.now()}.pdf`;
      const dest = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.moveAsync({ from: uri, to: dest });
      if (Sharing && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle: 'Share Receipt', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Saved', `Receipt saved to: ${dest}`, [{ text: 'OK' }]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsDownloading(false);
    }
  };

  // ─── Transaction Card ────────────────────────────────────────────────────────
  const getTypeConfig = (type, status) => {
    if (status === 'Failed') return { icon: 'close-circle', color: C.red, bg: C.redLight };
    if (type === 'Payment') return { icon: 'cash-outline', color: C.purple, bg: C.purpleLight };
    if (type === 'Loan Disbursement') return { icon: 'arrow-down-circle-outline', color: C.green, bg: C.greenLight };
    return { icon: 'help-circle-outline', color: C.subtext, bg: C.faint };
  };

  const renderItem = useCallback(({ item }) => {
    const config = getTypeConfig(item.type, item.status);
    const isCompleted = item.status === 'Completed';
    const isFailed = item.status === 'Failed';
    return (
      <TouchableOpacity
        style={[styles.txCard, { backgroundColor: C.card, shadowColor: C.shadow }]}
        onPress={() => { setSelectedTx(item); setReceiptVisible(true); }}
        activeOpacity={0.75}
      >
        <View style={[styles.txIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>

        <View style={styles.txInfo}>
          <Text style={[styles.txType, { color: C.text }]}>{item.type}</Text>
          <Text style={[styles.txMeta, { color: C.subtext }]}>{item.date} · {item.time}</Text>
          <View style={styles.txTagRow}>
            <View style={[styles.txTag, { backgroundColor: C.faint }]}>
              <Text style={[styles.txTagText, { color: C.subtext }]}>{item.loanId}</Text>
            </View>
            {item.creditPointsEarned > 0 && (
              <View style={[styles.txTag, { backgroundColor: C.amberLight }]}>
                <MaterialIcons name="star" size={10} color={C.amberText} />
                <Text style={[styles.txTagText, { color: C.amberText }]}>+{item.creditPointsEarned} pts</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isFailed ? C.red : C.text }]}>
            ₱{item.amount}
          </Text>
          <View style={[
            styles.statusPill,
            { backgroundColor: isCompleted ? C.greenLight : isFailed ? C.redLight : C.faint }
          ]}>
            <Text style={[
              styles.statusPillText,
              { color: isCompleted ? C.greenText : isFailed ? C.redText : C.subtext }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [C]);

  // ─── Receipt Modal ───────────────────────────────────────────────────────────
  const ReceiptModal = () => {
    if (!selectedTx) return null;
    const isCompleted = selectedTx.status === 'Completed';
    return (
      <Modal
        visible={receiptVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReceiptVisible(false)}
      >
        <View style={[styles.overlay, { backgroundColor: C.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: C.modalBg }]}>
            {/* Sheet Handle */}
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            {/* Sheet Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: C.border }]}>
              <View style={styles.sheetHeaderLeft}>
                <MaterialIcons name="receipt" size={20} color={C.purple} />
                <Text style={[styles.sheetTitle, { color: C.text }]}>Transaction Receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setReceiptVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={C.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {/* Status Badge */}
              <View style={styles.receiptTop}>
                <View style={[
                  styles.statusLarge,
                  { backgroundColor: isCompleted ? C.greenLight : C.redLight }
                ]}>
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'close-circle'}
                    size={32}
                    color={isCompleted ? C.green : C.red}
                  />
                  <Text style={[styles.statusLargeText, { color: isCompleted ? C.greenText : C.redText }]}>
                    {selectedTx.status}
                  </Text>
                </View>
                <Text style={[styles.receiptId, { color: C.subtext }]}>
                  #{selectedTx.transactionId || selectedTx.id}
                </Text>
                <Text style={[styles.receiptDate, { color: C.subtext }]}>
                  {selectedTx.date} · {selectedTx.time}
                </Text>
              </View>

              {/* Amount Hero */}
              <View style={[styles.amountHero, { backgroundColor: C.purpleLight }]}>
                <Text style={[styles.amountHeroLabel, { color: C.purple }]}>Amount</Text>
                <Text style={[styles.amountHeroVal, { color: C.purple }]}>₱{selectedTx.amount}</Text>
                <Text style={[styles.amountHeroType, { color: C.subtext }]}>{selectedTx.type}</Text>
              </View>

              {/* Transaction Info */}
              <ReceiptSection title="Transaction Details" color={C}>
                <ReceiptRow label="Payment Method" value={selectedTx.paymentMethod || 'N/A'} C={C} />
                <ReceiptRow label="Loan ID" value={selectedTx.loanId} C={C} />
                <ReceiptRow label="Loan Type" value={selectedTx.loanType || 'N/A'} C={C} />
                <ReceiptRow label="Lender" value={selectedTx.lender || 'N/A'} C={C} />
                <ReceiptRow label="Application Date" value={selectedTx.applicationDate || 'N/A'} C={C} />
                {selectedTx.failureReason && (
                  <View style={[styles.errorRow, { backgroundColor: C.redLight }]}>
                    <Ionicons name="warning-outline" size={14} color={C.red} />
                    <Text style={[styles.errorText, { color: C.redText }]}>{selectedTx.failureReason}</Text>
                  </View>
                )}
              </ReceiptSection>

              {/* Loan Breakdown */}
              {selectedTx.loanAmount ? (
                <ReceiptSection title="Loan Breakdown" color={C}>
                  <ReceiptRow label="Principal Amount" value={`₱${selectedTx.loanAmount.toLocaleString()}`} C={C} highlight />
                  <ReceiptRow label="Term" value={selectedTx.term} C={C} />
                  <ReceiptRow label="Interest Rate" value={`${selectedTx.interestRate}% ${selectedTx.interestType}`} C={C} />
                  <ReceiptRow label="Total Interest" value={`₱${selectedTx.totalInterest?.toFixed(2)}`} C={C} />
                  <ReceiptRow label="Processing Fee" value={`₱${selectedTx.processingFee?.toFixed(2)}`} C={C} />
                  {/* Net Release highlight */}
                  <View style={[styles.netRow, { backgroundColor: C.purpleLight }]}>
                    <Text style={[styles.netLabel, { color: C.purple }]}>Net Amount Released</Text>
                    <Text style={[styles.netVal, { color: C.purple }]}>₱{selectedTx.netRelease?.toFixed(2)}</Text>
                  </View>
                </ReceiptSection>
              ) : null}

              {/* Credit Points */}
              {selectedTx.creditPointsEarned > 0 && (
                <View style={[styles.ptsBox, { backgroundColor: C.amberLight, borderColor: `${C.amber}60` }]}>
                  <MaterialIcons name="star" size={20} color={C.amber} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.ptsTitle, { color: C.amberText }]}>
                      +{selectedTx.creditPointsEarned} Credit Points Earned
                    </Text>
                    <Text style={[styles.ptsSub, { color: C.amberText }]}>
                      {selectedTx.type === 'Payment'
                        ? 'On-time repayment — fastest way to grow your score!'
                        : 'Every transaction grows your credit score.'}
                    </Text>
                    <Text style={[styles.ptsMini, { color: C.amber }]}>
                      +20 pts/loan payment · +5 pts/transaction · 5 repayments = next tier 🚀
                    </Text>
                  </View>
                </View>
              )}

              {/* Footer */}
              <View style={styles.receiptFooter}>
                <Ionicons name="shield-checkmark-outline" size={16} color={C.subtext} />
                <Text style={[styles.footerText, { color: C.subtext }]}>
                  Verified by Lora Finance · RightApp Inc.
                </Text>
              </View>
            </ScrollView>

            {/* Download Button */}
            <View style={[styles.sheetActions, { borderTopColor: C.border, backgroundColor: C.modalBg }]}>
              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: isDownloading ? C.subtext : C.purple }]}
                onPress={() => downloadPDF(selectedTx)}
                disabled={isDownloading}
              >
                <Ionicons name={isDownloading ? 'cloud-download-outline' : 'download-outline'} size={18} color="#fff" />
                <Text style={styles.downloadBtnText}>
                  {isDownloading ? 'Generating PDF…' : 'Download PDF Receipt'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={d ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: C.text }]}>{screenTitle}</Text>
          <Text style={[styles.headerSub, { color: C.subtext }]}>{screenSubtitle}</Text>
        </View>
      </View>

      {/* Summary Strip */}
      <View style={[styles.summaryStrip, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: C.green }]}>{successCount}</Text>
          <Text style={[styles.summaryLabel, { color: C.subtext }]}>Completed</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: C.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: C.red }]}>{failedCount}</Text>
          <Text style={[styles.summaryLabel, { color: C.subtext }]}>Failed</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: C.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryVal, { color: C.amber }]}>{totalPoints}</Text>
          <Text style={[styles.summaryLabel, { color: C.subtext }]}>Points Earned</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        {[
          { key: 'all', label: 'All' },
          { key: 'payments', label: 'Payments' },
          { key: 'disbursements', label: 'Disbursements' },
          { key: 'failed', label: 'Failed' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, txFilter === tab.key && { backgroundColor: C.purpleLight }]}
            onPress={() => setTxFilter(tab.key)}
          >
            <Text style={[
              styles.filterChipText,
              { color: txFilter === tab.key ? C.purple : C.subtext }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={52} color={C.subtext} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>No transactions</Text>
            <Text style={[styles.emptySub, { color: C.subtext }]}>
              No records match the selected filter
            </Text>
          </View>
        }
      />

      <ReceiptModal />
    </SafeAreaView>
  );
};

// ─── Helper Components ────────────────────────────────────────────────────────

const ReceiptSection = ({ title, color: C, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: C.purple, borderBottomColor: C.border }]}>{title}</Text>
    {children}
  </View>
);

const ReceiptRow = ({ label, value, C, highlight }) => (
  <View style={styles.receiptRow}>
    <Text style={[styles.receiptLabel, { color: C.subtext }]}>{label}</Text>
    <Text style={[styles.receiptVal, { color: highlight ? C.purple : C.text }]}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 1 },

  // Summary Strip
  summaryStrip: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  summaryDivider: { width: 1, marginVertical: 4 },

  // Filter
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
  },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  // Transaction List
  list: { padding: 14, gap: 10, paddingBottom: 32, flexGrow: 1 },

  txCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  txIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txMeta: { fontSize: 11, marginBottom: 5 },
  txTagRow: { flexDirection: 'row', gap: 5 },
  txTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  txTagText: { fontSize: 10, fontWeight: '600' },

  txRight: { alignItems: 'flex-end', gap: 5 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  emptySub: { fontSize: 12, textAlign: 'center' },

  // Modal / Sheet
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '50%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  sheetScroll: { paddingHorizontal: 20 },

  receiptTop: { alignItems: 'center', paddingVertical: 20 },
  statusLarge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 10 },
  statusLargeText: { fontSize: 15, fontWeight: '700' },
  receiptId: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  receiptDate: { fontSize: 11 },

  amountHero: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20 },
  amountHeroLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  amountHeroVal: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  amountHeroType: { fontSize: 12, marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', borderBottomWidth: 1, paddingBottom: 8, marginBottom: 12 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  receiptLabel: { fontSize: 13, flex: 1 },
  receiptVal: { fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, marginTop: 4 },
  errorText: { fontSize: 12, fontWeight: '500', flex: 1 },

  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 6 },
  netLabel: { fontSize: 13, fontWeight: '700' },
  netVal: { fontSize: 16, fontWeight: '800' },

  ptsBox: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  ptsTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  ptsSub: { fontSize: 12, lineHeight: 17, marginBottom: 4 },
  ptsMini: { fontSize: 11 },

  receiptFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 24, paddingTop: 8 },
  footerText: { fontSize: 11 },

  sheetActions: { padding: 16, borderTopWidth: 1 },
  downloadBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    padding: 15, borderRadius: 12,
  },
  downloadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default TransactionsScreen;