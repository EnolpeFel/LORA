import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
  const [profileData, setProfileData] = useState({
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@example.com',
    memberSince: 'January 15, 2023',
    accountStatus: 'Verified',
    phoneNumber: '+63 912 345 6789',
    address: '123 Main Street, Manila, Philippines',
    profileImage: null,
    idVerified: false, // Changed to false to show upload functionality
    twoFactorEnabled: false,
    connectedAccounts: {
      google: false,
      facebook: false,
      apple: false
    },
    notificationEnabled: true,
    uploadedIdImage: null,
    idType: '',
    gmailAddress: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [idUploadModalVisible, setIdUploadModalVisible] = useState(false);
  const [gmailModalVisible, setGmailModalVisible] = useState(false);

  const handleEdit = (field, value) => {
    setEditField(field);
    setEditValue(value);
    setModalVisible(true);
  };

  const saveEdit = () => {
    setProfileData(prev => ({
      ...prev,
      [editField]: editValue
    }));
    setModalVisible(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const toggleSwitch = (field) => {
    setProfileData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleGmailConnect = () => {
    setGmailModalVisible(true);
  };

  const saveGmailAddress = () => {
    if (!editValue || !editValue.includes('@gmail.com')) {
      Alert.alert("Invalid Email", "Please enter a valid Gmail address.");
      return;
    }
    
    setProfileData(prev => ({
      ...prev,
      gmailAddress: editValue,
      connectedAccounts: {
        ...prev.connectedAccounts,
        google: true
      }
    }));
    setGmailModalVisible(false);
    setEditValue('');
    Alert.alert("Success", "Gmail account connected successfully!");
  };

  const handleIDTypeSelection = (idType) => {
    setProfileData(prev => ({
      ...prev,
      idType: idType
    }));
    setIdUploadModalVisible(false);
    
    // Simulate image picker functionality
    setTimeout(() => {
      Alert.alert(
        "ID Upload",
        `${idType} selected. In a real app, this would open the camera or image picker.`,
        [
          {
            text: "Simulate Upload",
            onPress: () => {
              setProfileData(prev => ({
                ...prev,
                uploadedIdImage: `simulated_${idType.toLowerCase().replace(/[^a-z0-9]/g, '_')}_image.jpg`,
                idVerified: false // Will be verified after review
              }));
              Alert.alert("Success", "ID uploaded successfully! Your document is being reviewed.");
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    }, 100);
  };

  const handleIDUpload = () => {
    if (profileData.idVerified) {
      Alert.alert(
        "ID Already Verified",
        "Your ID has already been verified. Contact support if you need to update it.",
        [{ text: "OK" }]
      );
      return;
    }

    setIdUploadModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Log Out", 
          onPress: () => navigation.navigate('Welcome'),
          style: "destructive"
        }
      ]
    );
  };

  const getIdVerificationStatus = () => {
    if (profileData.idVerified) return { text: 'Verified', color: '#10B981' };
    if (profileData.uploadedIdImage) return { text: 'Under Review', color: '#F59E0B' };
    return { text: 'Not Verified', color: '#EF4444' };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editButton}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.profileContent}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarContainer}>
          {profileData.profileImage ? (
            <Image 
              source={{ uri: profileData.profileImage }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.emptyAvatar]}>
              <MaterialIcons name="person" size={40} color="#9CA3AF" />
            </View>
          )}
          {isEditing && (
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialIcons name="edit" size={16} color="white" />
            </TouchableOpacity>
          )}
          <Text style={styles.name}>{profileData.name}</Text>
          <Text style={styles.email}>{profileData.email}</Text>
          <View style={styles.verificationBadge}>
            <MaterialIcons name="verified" size={16} color="#10B981" />
            <Text style={styles.verificationText}>Verified Account</Text>
          </View>
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{profileData.name}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => handleEdit('name', profileData.name)}>
                    <MaterialIcons name="edit" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{profileData.email}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => handleEdit('email', profileData.email)}>
                    <MaterialIcons name="edit" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{profileData.phoneNumber}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => handleEdit('phoneNumber', profileData.phoneNumber)}>
                    <MaterialIcons name="edit" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Address</Text>
              <View style={styles.detailValueContainer}>
                <Text style={styles.detailValue}>{profileData.address}</Text>
                {isEditing && (
                  <TouchableOpacity onPress={() => handleEdit('address', profileData.address)}>
                    <MaterialIcons name="edit" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <View style={styles.securityItem}>
                <MaterialIcons name="verified-user" size={20} color="#3B82F6" />
                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityLabel}>ID Verification</Text>
                  <Text style={[styles.securityStatus, { color: getIdVerificationStatus().color }]}>
                    {getIdVerificationStatus().text}
                  </Text>
                  {profileData.idType && (
                    <Text style={[styles.securityStatus, { fontSize: 11, color: '#9CA3AF' }]}>
                      {profileData.idType}
                    </Text>
                  )}
                </View>
              </View>
              {profileData.idVerified ? (
                <MaterialIcons name="check-circle" size={24} color="#10B981" />
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={handleIDUpload}>
                  <MaterialIcons name="upload" size={14} color="#3B82F6" />
                  <Text style={styles.uploadButtonText}>
                    {profileData.uploadedIdImage ? 'Re-upload' : 'Upload ID'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.securityItem}>
                <MaterialIcons name="mail-outline" size={20} color="#3B82F6" />
                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityLabel}>Gmail Account</Text>
                  <Text style={styles.securityStatus}>
                    {profileData.connectedAccounts.google ? 'Connected' : 'Not Connected'}
                  </Text>
                  {profileData.connectedAccounts.google && profileData.gmailAddress && (
                    <Text style={[styles.securityStatus, { fontSize: 11, color: '#3B82F6', fontWeight: '500' }]}>
                      {profileData.gmailAddress}
                    </Text>
                  )}
                </View>
              </View>
              {profileData.connectedAccounts.google ? (
                <View style={styles.connectedContainer}>
                  <MaterialIcons name="check-circle" size={20} color="#10B981" />
                  {isEditing && (
                    <TouchableOpacity 
                      style={[styles.editGmailButton, { marginLeft: 8 }]}
                      onPress={() => {
                        setEditValue(profileData.gmailAddress);
                        setGmailModalVisible(true);
                      }}
                    >
                      <MaterialIcons name="edit" size={14} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.connectButton} onPress={handleGmailConnect}>
                  <MaterialIcons name="add" size={14} color="#4F46E5" />
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.detailItem}>
              <View style={styles.securityItem}>
                <MaterialIcons name="lock-outline" size={20} color="#3B82F6" />
                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityLabel}>Two-Factor Authentication</Text>
                  <Text style={styles.securityStatus}>
                    {profileData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={profileData.twoFactorEnabled}
                onValueChange={() => toggleSwitch('twoFactorEnabled')}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={profileData.twoFactorEnabled ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
            
            <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
              <View style={styles.securityItem}>
                <MaterialIcons name="notifications-none" size={20} color="#3B82F6" />
                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityLabel}>Notifications</Text>
                  <Text style={styles.securityStatus}>
                    {profileData.notificationEnabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={profileData.notificationEnabled}
                onValueChange={() => toggleSwitch('notificationEnabled')}
                trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                thumbColor={profileData.notificationEnabled ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>
        </View>

        {/* Account Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>{profileData.memberSince}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Account Status</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, 
                  { backgroundColor: profileData.accountStatus === 'Verified' ? '#10B981' : '#F59E0B' }]} 
                />
                <Text style={[styles.detailValue, 
                  { color: profileData.accountStatus === 'Verified' ? '#10B981' : '#F59E0B' }]}
                >
                  {profileData.accountStatus}
                </Text>
              </View>
            </View>
            
            <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Account ID</Text>
              <Text style={styles.detailValue}>USR-7894561230</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.settingsButton}>
          <MaterialIcons name="settings" size={20} color="#4B5563" />
          <Text style={styles.settingsButtonText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpButton}>
          <MaterialIcons name="help-outline" size={20} color="#4B5563" />
          <Text style={styles.helpButtonText}>Help & Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gmail Connect Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={gmailModalVisible}
        onRequestClose={() => setGmailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.gmailModalHeader}>
              <MaterialIcons name="mail-outline" size={32} color="#3B82F6" />
              <Text style={styles.modalTitle}>Connect Gmail Account</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Enter your Gmail address to connect your account for enhanced security and features.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder="Enter your Gmail address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setGmailModalVisible(false);
                  setEditValue('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveGmailAddress}
              >
                <Text style={styles.saveButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ID Upload Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={idUploadModalVisible}
        onRequestClose={() => setIdUploadModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload ID Document</Text>
            <Text style={styles.modalSubtitle}>Please select your ID type to upload:</Text>
            
            <View style={styles.idTypeContainer}>
              <TouchableOpacity 
                style={styles.idTypeButton}
                onPress={() => handleIDTypeSelection("Driver's License")}
              >
                <MaterialIcons name="credit-card" size={24} color="#3B82F6" />
                <Text style={styles.idTypeText}>Driver's License</Text>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.idTypeButton}
                onPress={() => handleIDTypeSelection("Passport")}
              >
                <MaterialIcons name="book" size={24} color="#3B82F6" />
                <Text style={styles.idTypeText}>Passport</Text>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.idTypeButton}
                onPress={() => handleIDTypeSelection("National ID")}
              >
                <MaterialIcons name="badge" size={24} color="#3B82F6" />
                <Text style={styles.idTypeText}>National ID</Text>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.idTypeButton}
                onPress={() => handleIDTypeSelection("PhilHealth ID")}
              >
                <MaterialIcons name="local-hospital" size={24} color="#3B82F6" />
                <Text style={styles.idTypeText}>PhilHealth ID</Text>
                <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, { marginTop: 16 }]}
              onPress={() => setIdUploadModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  profileContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  emptyAvatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    right: '38%',
    bottom: 70,
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginLeft: 4,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  detailValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityTextContainer: {
    marginLeft: 12,
  },
  securityLabel: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  securityStatus: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  verifyButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '500',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  uploadButtonText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  connectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editGmailButton: {
    backgroundColor: '#F3F4F6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gmailModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  helpButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  idTypeContainer: {
    marginBottom: 16,
  },
  idTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  idTypeText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default ProfileScreen;