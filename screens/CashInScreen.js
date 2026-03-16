import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from './DashboardScreen';

const { width } = Dimensions.get('window');

const CASHIN_METHODS = [
  { id: 'gcash', name: 'GCash', iconName: 'account-balance-wallet', color: '#007DFF', fee: 'No fee' },
  { id: 'maya',  name: 'Maya',  iconName: 'account-balance-wallet', color: '#00D632', fee: 'No fee' },
];

const CashInScreen = ({ navigation, route }) => {
  const { dark } = useContext(ThemeContext);
  const [ciAmount, setCiAmount] = useState('');
  const [ciMethod, setCiMethod] = useState(null);

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

  const handleCashIn = () => {
    const amt = parseFloat(ciAmount) || 0;
    if (!ciAmount || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!ciMethod) {
      Alert.alert('Select Method', 'Please select a payment method');
      return;
    }

    // Callback to parent with transaction data
    if (route.params?.onCashIn) {
      route.params.onCashIn({
        amount: amt,
        method: ciMethod.name,
        date: new Date().toISOString(),
      });
    }

    Alert.alert(
      'Cash In Successful',
      `₱${amt.toFixed(2)} added via ${ciMethod.name}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]}>Cash In</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Balance Banner */}
        <View style={[styles.balBanner, { backgroundColor: dark ? '#431407' : '#FFF7ED' }]}>
          <MaterialIcons name="account-balance-wallet" size={15} color={C.purple} />
          <Text style={[styles.balBannerTxt, { color: C.purple }]}>
            Balance: ₱{route.params?.balance?.toFixed(2) || '0.00'}
          </Text>
        </View>

        {/* Points Banner */}
        <View style={[styles.pointsBanner, { 
          backgroundColor: dark ? '#2D2005' : '#FFFBEB', 
          borderColor: dark ? '#78350F' : '#FDE68A' 
        }]}>
          <MaterialIcons name="stars" size={15} color="#F59E0B" />
          <Text style={[styles.pointsBannerTxt, { color: dark ? '#FDE68A' : '#92400E' }]}>
            Cash in ₱1,000+ to earn +5 credit points!
          </Text>
        </View>

        {/* Amount Input */}
        <Text style={[styles.label, { color: C.subtext }]}>Amount</Text>
        <View style={[styles.amtRow, { borderColor: C.inputBorder, backgroundColor: C.inputBg }]}>
          <Text style={[styles.currPfx, { color: C.text }]}>₱</Text>
          <TextInput
            style={[styles.amtInput, { color: C.text }]}
            placeholder="0.00"
            placeholderTextColor={C.subtext}
            keyboardType="decimal-pad"
            value={ciAmount}
            onChangeText={setCiAmount}
          />
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickRow}>
          {[500, 1000, 2000, 5000].map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.quickBtn, { borderColor: C.border, backgroundColor: C.faint }]}
              onPress={() => setCiAmount(v.toString())}
            >
              <Text style={[styles.quickBtnTxt, { color: C.text }]}>₱{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Methods */}
        <Text style={[styles.label, { color: C.subtext }]}>Select E-Wallet</Text>
        {CASHIN_METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.bankCard,
              { borderColor: ciMethod?.id === m.id ? C.purple : C.border },
              ciMethod?.id === m.id && { backgroundColor: dark ? '#431407' : '#FFF7ED' }
            ]}
            onPress={() => setCiMethod(m)}
          >
            <MaterialIcons name={m.iconName} size={26} color={m.color} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bankName, { color: C.text }]}>{m.name}</Text>
              <Text style={[styles.bankMeta, { color: C.subtext }]}>{m.fee}</Text>
            </View>
            {ciMethod?.id === m.id && (
              <MaterialIcons name="check-circle" size={20} color={C.purple} />
            )}
          </TouchableOpacity>
        ))}

        {/* Fee Info */}
        {ciAmount && parseFloat(ciAmount) >= 1000 && (
          <View style={[styles.feeBox, { backgroundColor: C.faint }]}>
            <View style={styles.feeRow}>
              <Text style={[styles.feeLbl, { color: C.subtext }]}>Points Reward</Text>
              <Text style={[styles.feeVal, { color: C.green }]}>+5 pts</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomBar, { backgroundColor: C.card, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (!ciAmount || !ciMethod) && styles.disabledBtn
          ]}
          onPress={handleCashIn}
          disabled={!ciAmount || !ciMethod}
        >
          <Text style={styles.primaryBtnTxt}>
            Add ₱{ciAmount || '0.00'} to Wallet
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
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  pointsBannerTxt: {
    fontSize: 12,
    flex: 1,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  primaryBtn: {
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
  disabledBtn: {
    backgroundColor: '#FED7AA',
  },
});

export default CashInScreen;