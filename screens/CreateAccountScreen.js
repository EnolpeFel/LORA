import React, { useState, useRef } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { SEND_MPIN, VERIFY_MPIN } from "../graphql/queries/sendVerifyMpin";
import { CREATE_ACCOUNT } from '../graphql/mutations/createAccount';
import client from "../lib/apolloClient";

const { width, height } = Dimensions.get('window');

const CreateAccountScreen = ({ navigation }) => {
  // State management
  const [screen, setScreen] = useState('registration');
  const [phoneNumber, setPhoneNumber] = useState('+63');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [mpin, setMpin] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthdate: '',
    gender: '',
    nationality: '',
    agreed: false
  });
  const [address, setAddress] = useState({
    country: '',
    province: '',
    municipality: '',
    barangay: '',
    street: '',
    agreed: false
  });
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [profileImage, setProfileImage] = useState(null);
  const inputRefs = useRef([]);
  const pinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  // Dropdowns
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false);
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  
  const genderOptions = ['Male', 'Female', 'Other'];
  const nationalityOptions = ['Filipino', 'Others'];
  const countryOptions = ['Philippines', 'Others'];
  const provinceOptions = ['Cebu City', 'Others'];
  const municipalityOptions = ['Cebu City', 'Others'];
  const barangayOptions = ['Mambaling', 'Duljo', 'Pasil', 'Others'];

  // Timer countdown
  React.useEffect(() => {
    let interval;
    if (screen === 'verification' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [screen, timer]);

  // Screen handlers
  const handleNext = async () => {
    if (!phoneNumber || phoneNumber.length < 13) { // +63 plus 10 digits
      Alert.alert('Error', 'Please enter a valid Philippine mobile number (+63XXXXXXXXXX)');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the terms');
      return;
    }

    // Send MPIN
    try {
      const { data } = await client.query({
        query: SEND_MPIN,
        variables: { phone: phoneNumber },
        fetchPolicy: 'no-cache'
      })

      const { success, message } = data.sendMPIN;

      // TO DO: Add loading and success message in UI
      // This is a example
      console.log(success, message); 

      if (!success) {
        return;
      };

    } catch (err) {
      // TO DO: Add error message in UI
      console.log(err);
      return;
    }

    setScreen('verification');
    setTimer(300);
    setCanResend(false);
    Keyboard.dismiss();
  };

  const handleVerify = async () => {
    const enteredMpin = mpin.join('');
    if (enteredMpin.length !== 6) {
      Alert.alert('Error', 'Please enter 6-digit MPIN');
      return;
    }

    // Verify MPIN
    try {
      const { data } = await client.query({
        query: VERIFY_MPIN,
        variables: { phone: phoneNumber, code: enteredMpin },
        fetchPolicy: 'no-cache'
      });

      const { success, message } = data.verifyMPIN;

      // TO DO: Add loading and success message in UI
      // This is a example
      console.log(success, message);

      if (!success) {
        Alert.alert('Error', 'Invalid MPIN. Please try again');
        setMpin(['', '', '', '', '', '']);
        return;
      };

    } catch (err) {
      // TO DO: Add error message in UI
      console.log(err);
      setMpin(['', '', '', '', '', '']);
      return;
    };

    setScreen('details');
  };

  const handleResend = () => {
    Alert.alert('MPIN Sent', 'New MPIN has been sent to your number');
    setTimer(300);
    setCanResend(false);
    setMpin(['', '', '', '', '', '']);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  const handleSubmitDetails = () => {
    if (!userDetails.firstName || !userDetails.lastName || !userDetails.birthdate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!validateBirthdate()) {
      Alert.alert('Error', 'Please enter a valid birthdate (MM/DD/YYYY)');
      return;
    }
    if (!userDetails.agreed) {
      Alert.alert('Error', 'Please confirm the information is true and complete');
      return;
    }
    setScreen('address');
  };

  const handleSubmitAddress = () => {
    if (!address.country || !address.province || !address.municipality || !address.barangay || !address.street) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }
    if (!address.agreed) {
      Alert.alert('Error', 'Please confirm the address information is true');
      return;
    }
    setScreen('pin');
  };

  const handlePinChange = (text, index, isConfirm = false) => {
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = text.replace(/[^0-9]/g, '');
    
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    if (text && index < 3) {
      if (isConfirm) {
        if (confirmPinRefs.current[index + 1]) {
          confirmPinRefs.current[index + 1].focus();
        }
      } else {
        if (pinRefs.current[index + 1]) {
          pinRefs.current[index + 1].focus();
        }
      }
    }
  };

  const handleKeyPress = (e, index, isConfirm = false) => {
    if (e.nativeEvent.key === 'Backspace' && !(isConfirm ? confirmPin[index] : pin[index]) && index > 0) {
      if (isConfirm) {
        if (confirmPinRefs.current[index - 1]) {
          confirmPinRefs.current[index - 1].focus();
        }
      } else {
        if (pinRefs.current[index - 1]) {
          pinRefs.current[index - 1].focus();
        }
      }
    }
  };

  const handleSubmitPin = async () => {
    const enteredPin = pin.join('');
    const enteredConfirmPin = confirmPin.join('');

    if (enteredPin.length !== 4 || enteredConfirmPin.length !== 4) {
      Alert.alert('Error', 'Please complete both PIN fields');
      return;
    }

    if (enteredPin !== enteredConfirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    // Compile the data
    const {  
      firstName,
      middleName,
      lastName,
      suffix,
      birthdate,
      gender,
      nationality,
    } = userDetails;

    const {
      country,
      province,
      municipality,
      barangay,
      street,
    } = address;

    // Convert birthdate into ISO format for API YYYY-MM-DD
    const dateParts = birthdate.split('/');
    const birthdateISO = `${dateParts[2]}-${dateParts[0]}-${dateParts[1]}`;

    const compiledData = {
      phone: phoneNumber,
      fname: firstName,
      mname: middleName !== "" ? middleName : null,
      lname: lastName,
      suffix: suffix !== "" ? suffix : null,
      birthdate: new Date(birthdateISO),
      gender: gender !== "" ? gender : null,
      nationality: nationality !== "" ? nationality : null,
      country,
      province,
      municipality,
      barangay,
      address_text: street,
      pinCode: pin.join('')
    }

    // Create account mutation
    try {
      const { data } = await client.mutate({
        mutation: CREATE_ACCOUNT,
        variables: { data: compiledData },
        fetchPolicy: 'no-cache'
      })

      const {  success, message } = data.createAccount;

      // TO DO: Add loading and success message in UI
      // This is a example

      console.log(success, message);

      // TO DO: Add error message in UI
      if (!success) {
        return;
      }

    } catch (err) {
      // TO DO: Add error message in UI
      console.log(err);
      return;
    }

    // Navigate to Dashboard on successful account creation
    navigation.navigate('Dashboard');
  };

  // Helper functions
  const formatBirthdate = (text) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
      if (cleaned.length > 2) {
        formatted += '/' + cleaned.slice(2, 4);
        if (cleaned.length > 4) {
          formatted += '/' + cleaned.slice(4, 8);
        }
      }
    }
    setUserDetails({...userDetails, birthdate: formatted});
  };

  const validateBirthdate = () => {
    const { birthdate } = userDetails;
    if (!birthdate) return false;
    
    const parts = birthdate.split('/');
    if (parts.length !== 3) return false;
    
    const [month, day, year] = parts.map(Number);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  };

  const selectGender = (gender) => {
    setUserDetails({...userDetails, gender});
    setShowGenderDropdown(false);
  };

  const selectNationality = (nationality) => {
    setUserDetails({...userDetails, nationality});
    setShowNationalityDropdown(false);
  };

  const selectCountry = (country) => {
    setAddress({...address, country});
    setShowCountryDropdown(false);
  };

  const selectProvince = (province) => {
    setAddress({...address, province});
    setShowProvinceDropdown(false);
  };

  const selectMunicipality = (municipality) => {
    setAddress({...address, municipality});
    setShowMunicipalityDropdown(false);
  };

  const selectBarangay = (barangay) => {
    setAddress({...address, barangay});
    setShowBarangayDropdown(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMpinChange = (text, index) => {
    const newMpin = [...mpin];
    newMpin[index] = text.replace(/[^0-9]/g, '');
    setMpin(newMpin);

    if (text && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }

    if (text && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPressMpin = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !mpin[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  // Close dropdowns when touching outside
  const closeDropdowns = () => {
    setShowGenderDropdown(false);
    setShowNationalityDropdown(false);
    setShowCountryDropdown(false);
    setShowProvinceDropdown(false);
    setShowMunicipalityDropdown(false);
    setShowBarangayDropdown(false);
  };

  const toggleGenderDropdown = () => {
    setShowNationalityDropdown(false);
    setShowGenderDropdown(!showGenderDropdown);
  };

  const toggleNationalityDropdown = () => {
    setShowGenderDropdown(false);
    setShowNationalityDropdown(!showNationalityDropdown);
  };

  const toggleCountryDropdown = () => {
    setShowCountryDropdown(!showCountryDropdown);
  };

  const toggleProvinceDropdown = () => {
    setShowProvinceDropdown(!showProvinceDropdown);
  };

  const toggleMunicipalityDropdown = () => {
    setShowMunicipalityDropdown(!showMunicipalityDropdown);
  };

  const toggleBarangayDropdown = () => {
    setShowBarangayDropdown(!showBarangayDropdown);
  };

  // Profile image picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need access to your photos to select a profile picture');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // HeaderWithLogo component with logo inside the profile placeholder
  const HeaderWithLogo = ({ title, onBackPress }) => {
    return (
      <>
        <View style={styles.header}>
          {onBackPress && (
            <TouchableOpacity onPress={onBackPress}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                 <Image 
                           source={require('../assets/LoraLogo.png')}  
                           style={styles.logo}
                         />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // PIN Screen
  if (screen === 'pin') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <HeaderWithLogo 
            title="Set Your PIN" 
            onBackPress={() => setScreen('address')}
          />
          <View style={styles.content}>
            <Text style={styles.title}>Create a four (4) digit PIN for secure login.</Text>

            <Text style={styles.label}>Enter PIN</Text>
            <View style={styles.pinContainer}>
              {[0, 1, 2, 3].map((index) => (
                <TextInput
                  key={`pin-${index}`}
                  ref={(ref) => (pinRefs.current[index] = ref)}
                  style={styles.pinInput}
                  value={pin[index]}
                  onChangeText={(text) => handlePinChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  placeholder="0"
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  textAlign="center"
                />
              ))}
            </View>

            <Text style={styles.label}>Confirm PIN</Text>
            <View style={styles.pinContainer}>
              {[0, 1, 2, 3].map((index) => (
                <TextInput
                  key={`confirm-${index}`}
                  ref={(ref) => (confirmPinRefs.current[index] = ref)}
                  style={styles.pinInput}
                  value={confirmPin[index]}
                  onChangeText={(text) => handlePinChange(text, index, true)}
                  onKeyPress={(e) => handleKeyPress(e, index, true)}
                  placeholder="0"
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  textAlign="center"
                />
              ))}
            </View>

            <View style={styles.reminderBox}>
              <Text style={styles.reminderTitle}>1. REMINDER:</Text>
              <Text style={styles.reminderText}>Don't share your PIN with anyone.</Text>
            </View>

            <TouchableOpacity
              style={[styles.nextButton, (pin.some(d => d === '') || confirmPin.some(d => d === '') && styles.disabledButton)]}
              onPress={handleSubmitPin}
              disabled={pin.some(d => d === '') || confirmPin.some(d => d === '')}
            >
              <Text style={styles.nextButtonText}>Complete Registration</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Address Screen
  if (screen === 'address') {
    return (
      <TouchableWithoutFeedback onPress={closeDropdowns}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <HeaderWithLogo 
              title="Address" 
              onBackPress={() => setScreen('details')}
            />
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>CURRENT ADDRESS</Text>
              
              <Text style={styles.label}>Country *</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdownInputEnhanced,
                  showCountryDropdown && styles.dropdownInputActiveEnhanced
                ]} 
                onPress={toggleCountryDropdown}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.dropdownIconContainer, styles.countryIcon]}>
                    <Text style={styles.iconText}>🌍</Text>
                  </View>
                  <Text style={address.country ? styles.inputTextEnhanced : styles.placeholderTextEnhanced}>
                    {address.country || "Select country"}
                  </Text>
                </View>
                <Text style={[
                  styles.dropdownArrowEnhanced,
                  showCountryDropdown && styles.dropdownArrowActive
                ]}>▼</Text>
              </TouchableOpacity>
              
              {showCountryDropdown && (
                <View style={styles.dropdownList}>
                  {countryOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownListItem,
                        index === countryOptions.length - 1 && styles.dropdownListItemLast
                      ]}
                      onPress={() => selectCountry(option)}
                    >
                      <View style={[styles.dropdownIconContainer, styles.countryIcon]}>
                        <Text style={styles.iconText}>
                          {option === 'Philippines' ? '🇵🇭' : '🌍'}
                        </Text>
                      </View>
                      <Text style={styles.dropdownListItemText}>{option}</Text>
                      {address.country === option && (
                        <Text style={styles.dropdownSelectedIndicator}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <Text style={styles.label}>Province *</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdownInputEnhanced,
                  showProvinceDropdown && styles.dropdownInputActiveEnhanced
                ]} 
                onPress={toggleProvinceDropdown}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.dropdownIconContainer, styles.provinceIcon]}>
                    <Text style={styles.iconText}>🏙️</Text>
                  </View>
                  <Text style={address.province ? styles.inputTextEnhanced : styles.placeholderTextEnhanced}>
                    {address.province || "Select province"}
                  </Text>
                </View>
                <Text style={[
                  styles.dropdownArrowEnhanced,
                  showProvinceDropdown && styles.dropdownArrowActive
                ]}>▼</Text>
              </TouchableOpacity>
              
              {showProvinceDropdown && (
                <View style={styles.dropdownList}>
                  {provinceOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownListItem,
                        index === provinceOptions.length - 1 && styles.dropdownListItemLast
                      ]}
                      onPress={() => selectProvince(option)}
                    >
                      <View style={[styles.dropdownIconContainer, styles.provinceIcon]}>
                        <Text style={styles.iconText}>🏙️</Text>
                      </View>
                      <Text style={styles.dropdownListItemText}>{option}</Text>
                      {address.province === option && (
                        <Text style={styles.dropdownSelectedIndicator}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <Text style={styles.label}>Municipality *</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdownInputEnhanced,
                  showMunicipalityDropdown && styles.dropdownInputActiveEnhanced
                ]} 
                onPress={toggleMunicipalityDropdown}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.dropdownIconContainer, styles.municipalityIcon]}>
                    <Text style={styles.iconText}>🏘️</Text>
                  </View>
                  <Text style={address.municipality ? styles.inputTextEnhanced : styles.placeholderTextEnhanced}>
                    {address.municipality || "Select municipality"}
                  </Text>
                </View>
                <Text style={[
                  styles.dropdownArrowEnhanced,
                  showMunicipalityDropdown && styles.dropdownArrowActive
                ]}>▼</Text>
              </TouchableOpacity>
              
              {showMunicipalityDropdown && (
                <View style={styles.dropdownList}>
                  {municipalityOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownListItem,
                        index === municipalityOptions.length - 1 && styles.dropdownListItemLast
                      ]}
                      onPress={() => selectMunicipality(option)}
                    >
                      <View style={[styles.dropdownIconContainer, styles.municipalityIcon]}>
                        <Text style={styles.iconText}>🏘️</Text>
                      </View>
                      <Text style={styles.dropdownListItemText}>{option}</Text>
                      {address.municipality === option && (
                        <Text style={styles.dropdownSelectedIndicator}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <Text style={styles.label}>Barangay *</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdownInputEnhanced,
                  showBarangayDropdown && styles.dropdownInputActiveEnhanced
                ]} 
                onPress={toggleBarangayDropdown}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.dropdownIconContainer, styles.barangayIcon]}>
                    <Text style={styles.iconText}>🏡</Text>
                  </View>
                  <Text style={address.barangay ? styles.inputTextEnhanced : styles.placeholderTextEnhanced}>
                    {address.barangay || "Select barangay"}
                  </Text>
                </View>
                <Text style={[
                  styles.dropdownArrowEnhanced,
                  showBarangayDropdown && styles.dropdownArrowActive
                ]}>▼</Text>
              </TouchableOpacity>
              
              {showBarangayDropdown && (
                <View style={styles.dropdownList}>
                  {barangayOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownListItem,
                        index === barangayOptions.length - 1 && styles.dropdownListItemLast
                      ]}
                      onPress={() => selectBarangay(option)}
                    >
                      <View style={[styles.dropdownIconContainer, styles.barangayIcon]}>
                        <Text style={styles.iconText}>🏡</Text>
                      </View>
                      <Text style={styles.dropdownListItemText}>{option}</Text>
                      {address.barangay === option && (
                        <Text style={styles.dropdownSelectedIndicator}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <Text style={styles.label}>Unit / House No. / Building / Street *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                value={address.street}
                onChangeText={(text) => setAddress({...address, street: text})}
              />

              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setAddress({...address, agreed: !address.agreed})}
              >
                <View style={[styles.checkbox, address.agreed && styles.checkboxChecked]}>
                  {address.agreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.agreementText}>
                  By clicking next, you confirm that the above information is true and complete.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, (!address.country || !address.province || !address.municipality || !address.barangay || !address.street || !address.agreed) && styles.disabledButton]}
                onPress={handleSubmitAddress}
                disabled={!address.country || !address.province || !address.municipality || !address.barangay || !address.street || !address.agreed}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    );
  }

  // Details Screen
  if (screen === 'details') {
    return (
      <TouchableWithoutFeedback onPress={closeDropdowns}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <HeaderWithLogo 
              title="Details" 
              onBackPress={() => setScreen('verification')}
            />
            <View style={styles.content}>
              <View style={styles.reminderBox}>
                <Text style={styles.reminderText}>REMINDER:</Text>
                <Text style={styles.reminderSubtext}>Please fill in all required fields (*)</Text>
              </View>

              <Text style={styles.sectionTitle}>BASIC DETAILS</Text>
              
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={userDetails.firstName}
                onChangeText={(text) => setUserDetails({...userDetails, firstName: text})}
              />
              
              <Text style={styles.label}>Middle Name (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter middle name"
                value={userDetails.middleName}
                onChangeText={(text) => setUserDetails({...userDetails, middleName: text})}
              />
              
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={userDetails.lastName}
                onChangeText={(text) => setUserDetails({...userDetails, lastName: text})}
              />
              
              <Text style={styles.label}>Suffix (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter suffix (Jr, Sr, II, III, IV, V, VI)"
                value={userDetails.suffix}
                onChangeText={(text) => setUserDetails({...userDetails, suffix: text})}
              />
              
              <Text style={styles.label}>Birthdate *</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/DD/YYYY"
                value={userDetails.birthdate}
                onChangeText={formatBirthdate}
                keyboardType="number-pad"
                maxLength={10}
              />

              <Text style={styles.sectionTitle}>ADDITIONAL INFORMATION</Text>
              
              <Text style={styles.label}>Gender (optional)</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdownInputEnhanced,
                  showGenderDropdown && styles.dropdownInputActiveEnhanced
                ]} 
                onPress={toggleGenderDropdown}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.dropdownIconContainer, styles.genderIcon]}>
                    <Text style={styles.iconText}>👤</Text>
                  </View>
                  <Text style={userDetails.gender ? styles.inputTextEnhanced : styles.placeholderTextEnhanced}>
                    {userDetails.gender || "Select gender"}
                  </Text>
                </View>
                <Text style={[
                  styles.dropdownArrowEnhanced,
                  showGenderDropdown && styles.dropdownArrowActive
                ]}>▼</Text>
              </TouchableOpacity>
              
              {showGenderDropdown && (
                <View style={styles.dropdownList}>
                  {genderOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownListItem,
                        index === genderOptions.length - 1 && styles.dropdownListItemLast
                      ]}
                      onPress={() => selectGender(option)}
                    >
                      <View style={[styles.dropdownIconContainer, styles.genderIcon]}>
                        <Text style={styles.iconText}>
                          {option === 'Male' ? '👨' : option === 'Female' ? '👩' : '👤'}
                        </Text>
                      </View>
                      <Text style={styles.dropdownListItemText}>{option}</Text>
                      {userDetails.gender === option && (
                        <Text style={styles.dropdownSelectedIndicator}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <Text style={styles.label}>Nationality</Text>
              <TouchableOpacity 
                style={[
                  styles.dropdownInputEnhanced,
                  showNationalityDropdown && styles.dropdownInputActiveEnhanced
                ]} 
                onPress={toggleNationalityDropdown}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.dropdownIconContainer, styles.nationalityIcon]}>
                    <Text style={styles.iconText}>🌍</Text>
                  </View>
                  <Text style={userDetails.nationality ? styles.inputTextEnhanced : styles.placeholderTextEnhanced}>
                    {userDetails.nationality || "Select nationality"}
                  </Text>
                </View>
                <Text style={[
                  styles.dropdownArrowEnhanced,
                  showNationalityDropdown && styles.dropdownArrowActive
                ]}>▼</Text>
              </TouchableOpacity>

              {showNationalityDropdown && (
                <View style={styles.dropdownList}>
                  {nationalityOptions.map((option, index) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownListItem,
                        index === nationalityOptions.length - 1 && styles.dropdownListItemLast
                      ]}
                      onPress={() => selectNationality(option)}
                    >
                      <View style={[styles.dropdownIconContainer, styles.nationalityIcon]}>
                        <Text style={styles.iconText}>
                          {option === 'Filipino' ? '🇵🇭' : '🌍'}
                        </Text>
                      </View>
                      <Text style={styles.dropdownListItemText}>{option}</Text>
                      {userDetails.nationality === option && (
                        <Text style={styles.dropdownSelectedIndicator}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setUserDetails({...userDetails, agreed: !userDetails.agreed})}
              >
                <View style={[styles.checkbox, userDetails.agreed && styles.checkboxChecked]}>
                  {userDetails.agreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.agreementText}>
                  By relevant law, you confirm that the above information is true and complete.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, (!userDetails.firstName || !userDetails.lastName || !userDetails.birthdate || !userDetails.agreed) && styles.disabledButton]}
                onPress={handleSubmitDetails}
                disabled={!userDetails.firstName || !userDetails.lastName || !userDetails.birthdate || !userDetails.agreed}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    );
  }

  // Verification Screen
  if (screen === 'verification') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <HeaderWithLogo 
            title="Verify MPIN" 
            onBackPress={() => setScreen('registration')}
          />
          <View style={styles.content}>
            <Text style={styles.subtitle}>Enter 6-digit MPIN for {phoneNumber}</Text>
            
            <Text style={styles.label}>MPIN</Text>
            <View style={styles.mpinContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={styles.mpinInput}
                  value={mpin[index]}
                  onChangeText={(text) => handleMpinChange(text, index)}
                  onKeyPress={(e) => handleKeyPressMpin(e, index)}
                  placeholder="•"
                  keyboardType="number-pad"
                  maxLength={1}
                  secureTextEntry
                  textAlign="center"
                />
              ))}
            </View>

            <View style={styles.resendContainer}>
              <Text style={styles.timerText}>
                {canResend ? 'Ready to resend' : `Resend in ${formatTime(timer)}`}
              </Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={!canResend}
                style={[styles.resendButton, !canResend && styles.disabledButton]}
              >
                <Text style={styles.resendButtonText}>Resend MPIN</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.nextButton, mpin.some(digit => digit === '') && styles.disabledButton]}
              onPress={handleVerify}
              disabled={mpin.some(digit => digit === '')}
            >
              <Text style={styles.nextButtonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Registration Screen
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <HeaderWithLogo 
          title="Registration" 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <Text style={styles.subtitle}>Please enter your Mobile Number</Text>

          <Text style={styles.label}>Mobile Number *</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.phoneInputWrapper}>
              <Text style={styles.flagEmoji}>🇵🇭</Text>
              <TextInput
  style={styles.phoneInput}
  value={phoneNumber}
  onChangeText={(text) => {
    // Ensure it starts with +63
    if (text.startsWith('+63')) {
      // Only allow numbers and limit to 13 characters total (+63 + 10 digits)
      const cleaned = text.replace(/[^0-9+]/g, '');
      setPhoneNumber(cleaned.substring(0, 13));
    } else if (text === '') {
      setPhoneNumber('+63');
    } else if (text.startsWith('+') && !text.startsWith('+63')) {
      // If user tries to enter a different country code, force +63
      setPhoneNumber('+63' + text.replace(/[^0-9]/g, '').substring(0, 10));
    } else {
      // If user starts typing numbers without +, prepend +63
      const numbers = text.replace(/[^0-9]/g, '');
      setPhoneNumber('+63' + numbers.substring(0, 10));
    }
  }}
  placeholder="+639123456789"
  keyboardType="phone-pad"
  maxLength={13}
/>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.linkText}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, (phoneNumber.length < 13 || !agreedToTerms) && styles.disabledButton]}
            onPress={handleNext}
            disabled={phoneNumber.length < 13 || !agreedToTerms}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: '#9333ea',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    color: 'white',
    fontSize: 24,
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: '#e9d5ff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginBottom: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    backgroundColor: 'white',
  },
  subtitle: {
    color: '#333',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  phoneInputContainer: {
    marginBottom: 32,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  dropdownList: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: -15,
    marginBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 1000,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownListItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  dropdownListItemLast: {
    borderBottomWidth: 0,
  },
  dropdownListItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownSelectedIndicator: {
    marginLeft: 'auto',
    color: '#ea580c',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dropdownInputEnhanced: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dropdownInputActiveEnhanced: {
    borderColor: '#ea580c',
    backgroundColor: '#fef7f0',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownArrowEnhanced: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: 'bold',
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowActive: {
    transform: [{ rotate: '180deg' }],
    color: '#ea580c',
  },
  dropdownIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  genderIcon: {
    backgroundColor: '#ddd6fe',
  },
  nationalityIcon: {
    backgroundColor: '#fef3c7',
  },
  countryIcon: {
    backgroundColor: '#dbeafe',
  },
  provinceIcon: {
    backgroundColor: '#e0f2fe',
  },
  municipalityIcon: {
    backgroundColor: '#f0fdf4',
  },
  barangayIcon: {
    backgroundColor: '#fce7f3',
  },
  iconText: {
    fontSize: 12,
  },
  inputTextEnhanced: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderTextEnhanced: {
    color: '#9ca3af',
    fontSize: 16,
    fontStyle: 'italic',
  },
  reminderBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reminderTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  reminderText: {
    color: '#555',
    marginBottom: 5,
  },
  reminderSubtext: {
    color: '#555',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#444',
    marginTop: 10,
  },
  mpinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  mpinInput: {
    width: 48,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
  },
  pinInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 24,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    color: '#555',
    fontSize: 14,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
  },
  termsText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  agreementText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  linkText: {
    color: '#ea580c',
    textDecorationLine: 'underline',
  },
  nextButton: {
    backgroundColor: '#ea580c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CreateAccountScreen;
