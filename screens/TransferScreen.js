import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from './DashboardScreen';

const { width } = Dimensions.get('window');

const BANKS = [
  { id: 'gcash',       name: 'GCash',        icon: '💳', fee: 0,  proc: 'Instant',   color: '#008C5A', inputType: 'mobile',  ph: '0912 345 6789' },
  { id: 'maya',        name: 'Maya',         icon: '💳', fee: 0,  proc: 'Instant',   color: '#0056A8', inputType: 'mobile',  ph: '0912 345 6789' },
  { id: 'bpi',         name: 'BPI',          icon: '🏦', fee: 25, proc: '1-2 hrs',   color: '#C40B2C', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'bdo',         name: 'BDO',          icon: '🏦', fee: 25, proc: '1-2 hrs',   color: '#9E0B0F', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'metrobank',   name: 'Metrobank',    icon: '🏦', fee: 25, proc: '1-2 hrs',   color: '#0F4B9C', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'unionbank',   name: 'UnionBank',    icon: '🏦', fee: 15, proc: 'Instant',   color: '#FF6B00', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'landbank',    name: 'LandBank',     icon: '🏦', fee: 20, proc: '1-2 hrs',   color: '#0055A5', inputType: 'account', ph: '1234 5678 9012' },
  { id: 'securitybank',name: 'Security Bank',icon: '🏦', fee: 25, proc: '1-2 hrs',   color: '#FFCD00', inputType: 'account', ph: '1234 5678 9012' },
];

const TransferScreen = ({ navigation, route }) => {
  const { dark } = useContext(ThemeContext);
  const [txStep, setTxStep] = useState(1);
  const [selBank, setSelBank] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txName, setTxName] = useState('');
  const [txContact, setTxContact] = useState('');
  const [txNote, setTxNote] = useState('');
  const [txPin, setTxPin] = useState('');

  // Colour palette (matches Dashboard)
  const C = {
    bg:           dark ? '#0F172A' : '#F3F4F6',
    card:         dark ? '#1E293B' : '#FFFFFF',
    border:       dark ? '#334155' : '#E5E7EB',
    text:         dark ? '#F1F5F9' : '#1F2937',
    subtext:      dark ? '#94A3B8' : '#6B7280',
    faint:        dark ? '#334155' : '#F9FAFB',
    headerBg:     dark ? '#1E293B' : '#FFFFFF',
    modalBg:      dark ? '#1E293B' : '#FFFFFF',
    inputBg:      dark ? '#0F172A' : '#F9FAFB',
    inputBorder:  dark ? '#334155' : '#E5E7EB',
    purple:       '#FB923C',
    green:        '#10B981',
    amber:        '#F59E0B',
    red:          '#EF4444',
  };

  const bankObj = BANKS.find(b => b.id === selBank);
  const txAmt = parseFloat(txAmount.replace(/,/g, '')) || 0;
  const txFee = bankObj?.fee || 0;
  const txTotal = txAmt + txFee;
  const balance = route.params?.balance || 0;

  const resetTransfer = () => {
    setTxStep(1);
    setSelBank('');
    setTxAmount('');
    setTxName('');
    setTxContact('');
    setTxNote('');
    setTxPin('');
  };

  const handleTransfer = () => {
    if (!selBank) {
      Alert.alert('Select Bank', 'Please select a bank or e-wallet');
      return;
    }
    if (!txAmount || txAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!txName.trim()) {
      Alert.alert('Missing Info', 'Please enter recipient name');
      return;
    }
    if (!txContact.trim()) {
      Alert.alert('Missing Info', 'Please enter contact info');
      return;
    }
    if (txTotal > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance');
      return;
    }
    if (!txPin || txPin.length < 4) {
      Alert.alert('PIN Required', 'Please enter your PIN');
      return;
    }

    // Callback to parent with transaction data
    if (route.params?.onTransfer) {
      route.params.onTransfer({
        amount: txTotal,
        to: txName,
        bank: bankObj?.name,
        date: new Date().toISOString(),
        note: txNote,
      });
    }

    Alert.alert(
      'Transfer Successful',
      `₱${txTotal.toFixed(2)} sent to ${txName}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  // Step indicator component
  const Steps = ({ current }) => (
    <View style={styles.steps}>
      {['Bank', 'Details', 'Confirm'].map((lbl, i) => (
        <React.Fragment key={i}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, current >= i + 1 && { backgroundColor: C.purple }]}>
              {current > i + 1 ? (
                <MaterialIcons name="check" size={13} color="white" />
              ) : (
                <Text style={[styles.stepNum, current >= i + 1 && { color: 'white' }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLbl, { color: current >= i + 1 ? C.purple : C.subtext }]}>{lbl}</Text>
          </View>
          {i < 2 && <View style={[styles.stepLine, current >= i + 2 && { backgroundColor: C.purple }]} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>
          {txStep === 1 ? 'Select Destination' : txStep === 2 ? 'Transfer Details' : 'Confirm Transfer'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <Steps current={txStep} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Bank Selection */}
        {txStep === 1 && (
          <>
            <View style={[styles.balBanner, { backgroundColor: dark ? '#431407' : '#FFF7ED' }]}>
              <MaterialIcons name="account-balance-wallet" size={15} color={C.purple} />
              <Text style={[styles.balBannerTxt, { color: C.purple }]}>
                Balance: ₱{balance.toFixed(2)}
              </Text>
            </View>
            {BANKS.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.bankCard,
                  { borderColor: selBank === b.id ? C.purple : C.border },
                  selBank === b.id && { backgroundColor: dark ? '#431407' : '#FFF7ED' }
                ]}
                onPress={() => setSelBank(b.id)}
              >
                <Text style={{ fontSize: 22, marginRight: 10 }}>{b.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bankName, { color: C.text }]}>{b.name}</Text>
                  <Text style={[styles.bankMeta, { color: C.subtext }]}>
                    {b.proc} · {b.fee === 0 ? 'FREE' : `₱${b.fee} fee`}
                  </Text>
                </View>
                {selBank === b.id && <MaterialIcons name="check-circle" size={20} color={C.purple} />}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step 2: Details */}
        {txStep === 2 && (
          <>
            <View style={[styles.bankCard, { borderColor: C.purple, backgroundColor: dark ? '#431407' : '#FFF7ED' }]}>
              <Text style={{ fontSize: 22, marginRight: 8 }}>{bankObj?.icon}</Text>
              <Text style={[styles.bankName, { color: C.purple }]}>{bankObj?.name}</Text>
            </View>

            <Text style={[styles.label, { color: C.subtext }]}>Amount</Text>
            <View style={[styles.amtRow, { borderColor: C.inputBorder, backgroundColor: C.inputBg }]}>
              <Text style={[styles.currPfx, { color: C.text }]}>₱</Text>
              <TextInput
                style={[styles.amtInput, { color: C.text }]}
                placeholder="0.00"
                placeholderTextColor={C.subtext}
                keyboardType="decimal-pad"
                value={txAmount}
                onChangeText={setTxAmount}
              />
            </View>

            <View style={styles.quickRow}>
              {[500, 1000, 2000, 5000].map(v => (
                <TouchableOpacity
                  key={v}
                  style={[styles.quickBtn, { borderColor: C.border, backgroundColor: C.faint }]}
                  onPress={() => setTxAmount(v.toLocaleString('en-PH'))}
                >
                  <Text style={[styles.quickBtnTxt, { color: C.text }]}>₱{v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.subtext }]}>Recipient Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              placeholder="Full name"
              placeholderTextColor={C.subtext}
              value={txName}
              onChangeText={setTxName}
            />

            <Text style={[styles.label, { color: C.subtext }]}>
              {bankObj?.inputType === 'mobile' ? 'Mobile Number' : 'Account Number'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              placeholder={bankObj?.ph}
              placeholderTextColor={C.subtext}
              keyboardType={bankObj?.inputType === 'mobile' ? 'phone-pad' : 'numeric'}
              value={txContact}
              onChangeText={setTxContact}
            />

            <Text style={[styles.label, { color: C.subtext }]}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              placeholder="For..."
              placeholderTextColor={C.subtext}
              value={txNote}
              onChangeText={setTxNote}
            />

            {txAmount && (
              <View style={[styles.feeBox, { backgroundColor: C.faint }]}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLbl, { color: C.subtext }]}>Amount</Text>
                  <Text style={[styles.feeVal, { color: C.text }]}>₱{txAmt.toFixed(2)}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLbl, { color: C.subtext }]}>Fee</Text>
                  <Text style={[styles.feeVal, { color: txFee === 0 ? C.green : C.text }]}>
                    {txFee === 0 ? 'FREE' : `₱${txFee}`}
                  </Text>
                </View>
                <View style={[styles.feeRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, marginTop: 4 }]}>
                  <Text style={[styles.feeLbl, { color: C.text, fontWeight: '700' }]}>Total</Text>
                  <Text style={{ color: C.purple, fontWeight: '800', fontSize: 15 }}>₱{txTotal.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Step 3: Confirm */}
        {txStep === 3 && (
          <>
            <View style={[styles.confirmBox, { backgroundColor: C.faint }]}>
              <Text style={[styles.confirmTitle, { color: C.text }]}>Transfer Summary</Text>
              {[
                ['To', txName],
                ['Via', bankObj?.name],
                [bankObj?.inputType === 'mobile' ? 'Mobile' : 'Account', txContact],
                ['Amount', `₱${txAmt.toFixed(2)}`],
                ['Fee', txFee === 0 ? 'FREE' : `₱${txFee}`],
                ['Total', `₱${txTotal.toFixed(2)}`],
                ['Note', txNote || '—'],
                ['Balance After', `₱${(balance - txTotal).toFixed(2)}`],
              ].map(([k, v]) => (
                <View key={k} style={[styles.confirmRow, { borderBottomColor: C.border }]}>
                  <Text style={[styles.confirmKey, { color: C.subtext }]}>{k}</Text>
                  <Text style={[styles.confirmVal, { color: k === 'Total' ? C.purple : C.text }]}>{v}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.label, { color: C.subtext }]}>Enter PIN to confirm</Text>
            <TextInput
              style={[styles.pinInput, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              placeholder="••••"
              placeholderTextColor={C.subtext}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              value={txPin}
              onChangeText={setTxPin}
            />
            <Text style={[styles.pinHint, { color: C.subtext }]}>Your 4–6 digit security PIN</Text>
          </>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomBar, { backgroundColor: C.card, borderTopColor: C.border }]}>
        {txStep > 1 && (
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: C.faint }]}
            onPress={() => setTxStep(txStep - 1)}
          >
            <Text style={[styles.secondaryBtnTxt, { color: C.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            txStep === 1 && { flex: 1 },
            (txStep === 1 && !selBank) && styles.disabledBtn
          ]}
          onPress={() => {
            if (txStep === 1) {
              if (!selBank) {
                Alert.alert('Select a bank');
                return;
              }
              setTxStep(2);
            } else if (txStep === 2) {
              if (!txAmount || txAmt <= 0) {
                Alert.alert('Enter a valid amount');
                return;
              }
              if (!txName.trim()) {
                Alert.alert('Enter recipient name');
                return;
              }
              if (!txContact.trim()) {
                Alert.alert('Enter contact info');
                return;
              }
              if (txTotal > balance) {
                Alert.alert('Insufficient Balance');
                return;
              }
              setTxStep(3);
            } else {
              handleTransfer();
            }
          }}
          disabled={txStep === 1 && !selBank}
        >
          <Text style={styles.primaryBtnTxt}>
            {txStep === 1 ? 'Continue' : txStep === 2 ? 'Review' : 'Confirm Transfer'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepLbl: { fontSize: 10 },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
    marginBottom: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  balBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  balBannerTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
  },
  bankName: {
    fontSize: 14,
    fontWeight: '700',
  },
  bankMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 6,
  },
  amtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 12,
    marginBottom: 4,
  },
  currPfx: {
    fontSize: 18,
    fontWeight: '800',
    marginRight: 4,
  },
  amtInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    padding: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 8,
  },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 7,
    alignItems: 'center',
  },
  quickBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  feeBox: {
    borderRadius: 10,
    padding: 13,
    marginTop: 10,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  feeLbl: {
    fontSize: 13,
  },
  feeVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  confirmKey: {
    fontSize: 13,
  },
  confirmVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
  },
  pinHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: '#FB923C',
    padding: 14,
    borderRadius: 11,
    alignItems: 'center',
  },
  primaryBtnTxt: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 11,
    alignItems: 'center',
  },
  secondaryBtnTxt: {
    fontWeight: '600',
    fontSize: 15,
  },
  disabledBtn: {
    backgroundColor: '#FED7AA',
  },
});

export default TransferScreen;