import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, TextInput, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Points awarded per verification
const VERIFICATION_POINTS = {
  gmail: 20,
  id: 30,
  phone: 15,
};

const TOTAL_POSSIBLE_POINTS = Object.values(VERIFICATION_POINTS).reduce((a, b) => a + b, 0);

const ProfileScreen = ({ navigation, route }) => {
  const [totalPoints, setTotalPoints] = useState(route?.params?.totalPoints ?? 0);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] }),
        },
      ]
    );
  };

  const [verifications, setVerifications] = useState({
    gmail: { verified: false, value: '' },
    id: { verified: false, value: '' },
    phone: { verified: false, value: '' },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [activeVerification, setActiveVerification] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const verificationConfig = [
    {
      key: 'gmail',
      label: 'Gmail / Email',
      icon: 'email',
      color: '#EA4335',
      points: VERIFICATION_POINTS.gmail,
      placeholder: 'Enter your Gmail address',
      keyboardType: 'email-address',
      description: 'Link your Google account for secure login',
    },
    {
      key: 'id',
      label: 'Government ID',
      icon: 'badge',
      color: '#4F46E5',
      points: VERIFICATION_POINTS.id,
      placeholder: 'Enter your ID number',
      keyboardType: 'default',
      description: 'Verify identity with a valid government-issued ID',
    },
    {
      key: 'phone',
      label: 'Mobile Number',
      icon: 'phone-android',
      color: '#10B981',
      points: VERIFICATION_POINTS.phone,
      placeholder: 'Enter your mobile number',
      keyboardType: 'phone-pad',
      description: 'Add your number for OTP-based security',
    },
  ];

  const verifiedCount = Object.values(verifications).filter(v => v.verified).length;
  const verificationPoints = verificationConfig
    .filter(cfg => verifications[cfg.key].verified)
    .reduce((sum, cfg) => sum + cfg.points, 0);

  const openVerifyModal = (config) => {
    if (verifications[config.key].verified) return;
    setActiveVerification(config);
    setInputValue('');
    setModalVisible(true);
  };

  const handleVerify = () => {
    if (!inputValue.trim()) {
      Alert.alert('Error', 'Please enter a valid value');
      return;
    }

    const key = activeVerification.key;
    const pts = activeVerification.points;

    setVerifications(prev => ({
      ...prev,
      [key]: { verified: true, value: inputValue.trim() }
    }));
    setTotalPoints(prev => prev + pts);
    setModalVisible(false);

    Alert.alert(
      '✅ Verified!',
      `${activeVerification.label} verified.\n\n🎉 You earned +${pts} points!`
    );
  };

  const profileCompleteness = Math.round((verifiedCount / verificationConfig.length) * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={44} color="#3B82F6" />
          </View>
          <Text style={styles.profileName}>Juan dela Cruz</Text>
          <Text style={styles.profileSub}>Member since January 2024</Text>

          {/* Points Summary */}
          <View style={styles.pointsSummary}>
            <View style={styles.pointsRow}>
              <MaterialIcons name="stars" size={24} color="#F59E0B" />
              <Text style={styles.pointsTotal}>{totalPoints}</Text>
              <Text style={styles.pointsLabel}>Total Points</Text>
            </View>
            <View style={styles.pointsDivider} />
            <View style={styles.pointsRow}>
              <MaterialIcons name="verified-user" size={20} color="#10B981" />
              <Text style={styles.pointsVerified}>{verificationPoints}</Text>
              <Text style={styles.pointsLabel}>From Verification</Text>
            </View>
          </View>
        </View>

        {/* Profile Completeness */}
        <View style={styles.completenessCard}>
          <View style={styles.completenessHeader}>
            <Text style={styles.completenessTitle}>Profile Completeness</Text>
            <Text style={styles.completenessPercent}>{profileCompleteness}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${profileCompleteness}%` }]} />
          </View>
          {profileCompleteness < 100 && (
            <Text style={styles.completenessHint}>
              Complete all verifications to earn up to +{TOTAL_POSSIBLE_POINTS} points
            </Text>
          )}
        </View>

        {/* Verification Section */}
        <Text style={styles.sectionTitle}>Account Verification</Text>
        <Text style={styles.sectionSubtitle}>Verify your accounts to earn bonus points</Text>

        {verificationConfig.map((cfg) => {
          const isVerified = verifications[cfg.key].verified;
          return (
            <TouchableOpacity
              key={cfg.key}
              style={[styles.verifyCard, isVerified && styles.verifyCardDone]}
              onPress={() => openVerifyModal(cfg)}
              activeOpacity={isVerified ? 1 : 0.75}
            >
              <View style={[styles.verifyIconBox, { backgroundColor: cfg.color + '15' }]}>
                <MaterialIcons name={cfg.icon} size={26} color={cfg.color} />
              </View>

              <View style={styles.verifyDetails}>
                <View style={styles.verifyTitleRow}>
                  <Text style={styles.verifyLabel}>{cfg.label}</Text>
                  {isVerified && (
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="check-circle" size={14} color="#10B981" />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.verifyDescription}>{cfg.description}</Text>
                {isVerified && (
                  <Text style={styles.verifyValue} numberOfLines={1}>
                    {verifications[cfg.key].value}
                  </Text>
                )}
              </View>

              <View style={styles.verifyRight}>
                {isVerified ? (
                  <MaterialIcons name="check-circle" size={28} color="#10B981" />
                ) : (
                  <View style={styles.pointsPill}>
                    <MaterialIcons name="stars" size={13} color="#F59E0B" />
                    <Text style={styles.pointsPillText}>+{cfg.points}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Points Guide */}
        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>📌 How to Earn Points</Text>
          {verificationConfig.map(cfg => (
            <View key={cfg.key} style={styles.guideRow}>
              <MaterialIcons name={cfg.icon} size={16} color={cfg.color} />
              <Text style={styles.guideText}>
                Verify {cfg.label} → <Text style={styles.guidePts}>+{cfg.points} pts</Text>
              </Text>
              {verifications[cfg.key].verified && (
                <MaterialIcons name="check" size={14} color="#10B981" />
              )}
            </View>
          ))}
          <View style={[styles.guideRow, { marginTop: 6 }]}>
            <MaterialIcons name="account-balance-wallet" size={16} color="#F59E0B" />
            <Text style={styles.guideText}>
              Cash in ₱1,000+ → <Text style={styles.guidePts}>+5 pts per transaction</Text>
            </Text>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Settings', 'Account settings coming soon.')}>
            <View style={styles.settingsRowLeft}>
              <MaterialIcons name="settings" size={22} color="#6B7280" />
              <Text style={styles.settingsRowText}>Account Settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Help', 'Support center coming soon.')}>
            <View style={styles.settingsRowLeft}>
              <MaterialIcons name="help-outline" size={22} color="#6B7280" />
              <Text style={styles.settingsRowText}>Help & Support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon.')}>
            <View style={styles.settingsRowLeft}>
              <MaterialIcons name="privacy-tip" size={22} color="#6B7280" />
              <Text style={styles.settingsRowText}>Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {activeVerification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconBox, { backgroundColor: activeVerification.color + '15' }]}>
                    <MaterialIcons name={activeVerification.icon} size={30} color={activeVerification.color} />
                  </View>
                  <Text style={styles.modalTitle}>Verify {activeVerification.label}</Text>
                  <Text style={styles.modalSubtitle}>
                    Earn <Text style={styles.modalPoints}>+{activeVerification.points} points</Text> upon verification
                  </Text>
                </View>

                <TextInput
                  style={styles.modalInput}
                  placeholder={activeVerification.placeholder}
                  placeholderTextColor="#9CA3AF"
                  keyboardType={activeVerification.keyboardType}
                  value={inputValue}
                  onChangeText={setInputValue}
                  autoFocus
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalVerifyBtn}
                    onPress={handleVerify}
                  >
                    <Text style={styles.modalVerifyText}>Verify & Earn Points</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { padding: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#BFDBFE',
  },
  profileName: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  profileSub: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 16 },
  pointsSummary: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  pointsRow: { flex: 1, alignItems: 'center', gap: 4 },
  pointsTotal: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  pointsVerified: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  pointsLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  pointsDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB', marginHorizontal: 12 },

  completenessCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  completenessHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  completenessTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  completenessPercent: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  completenessHint: { fontSize: 12, color: '#6B7280', marginTop: 6 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 12 },

  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  verifyCardDone: { borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' },
  verifyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyDetails: { flex: 1, marginLeft: 14 },
  verifyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  verifyLabel: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '700', color: '#065F46' },
  verifyDescription: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  verifyValue: { fontSize: 12, color: '#3B82F6', marginTop: 2, fontWeight: '500' },
  verifyRight: { marginLeft: 10 },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  pointsPillText: { fontSize: 13, fontWeight: '700', color: '#B45309' },

  guideBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 4,
  },
  guideTitle: { fontSize: 13, fontWeight: '700', color: '#0369A1', marginBottom: 10 },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  guideText: { fontSize: 13, color: '#374151', flex: 1 },
  guidePts: { fontWeight: '700', color: '#B45309' },

  actionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowText: { fontSize: 15, color: '#374151', fontWeight: '500' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  modalPoints: { fontWeight: '700', color: '#B45309' },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalVerifyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalVerifyText: { fontSize: 15, fontWeight: '600', color: 'white' },
});

export default ProfileScreen;