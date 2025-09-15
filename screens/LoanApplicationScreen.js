
import React, { useState, useEffect } from 'react';
import {
View, Text, StyleSheet, ScrollView, TouchableOpacity,
TextInput, Image, Modal, ActivityIndicator, Alert,
Platform, Animated, Dimensions, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Checkbox } from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LoanApplicationScreen = ({ navigation }) => {
// Loan type selection state
const [loanType, setLoanType] = useState(null);

// Step states
const [currentStep, setCurrentStep] = useState(0);
const [progressAnim] = useState(new Animated.Value(0));

// Loan Details states
const [loanAmount, setLoanAmount] = useState('');
const [terms, setTerms] = useState('2');
const [collateral, setCollateral] = useState({
atm: false,
check: false,
passbook: false,
other: false
});
const [monthlyIncome, setMonthlyIncome] = useState('');
const [otherCollateralText, setOtherCollateralText] = useState('');
const [purpose, setPurpose] = useState('');

// Lending Company states
const [selectedCompany, setSelectedCompany] = useState(null);
const [modalVisible, setModalVisible] = useState(false);
const [selectedCompanyInfo, setSelectedCompanyInfo] = useState(null);
const [isTransitioning, setIsTransitioning] = useState(false);

// Document Upload states
const [documents, setDocuments] = useState([]);
const [currentRequirement, setCurrentRequirement] = useState(null);
const [showClassModal, setShowClassModal] = useState(false);
const [showSubclassModal, setShowSubclassModal] = useState(false);
const [requirementClass, setRequirementClass] = useState({});
const [requirementSubclass, setRequirementSubclass] = useState({});

// Success Modal state
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [applicationResult, setApplicationResult] = useState(null);

// Form validation states
const [errors, setErrors] = useState({});
const [touched, setTouched] = useState({});

// Animation values
const [fadeAnim] = useState(new Animated.Value(0));

// Loan purpose options
const loanPurposes = [
'Emergency Expenses',
'Education',
'Home Improvement',
'Business Capital',
'Debt Consolidation',
'Medical Bills',
'Vehicle Purchase',
'Travel',
'Wedding',
'Other'
];

// Document classification options
const documentClasses = [
'Personal Documents',
'Financial Documents',
'Employment Documents',
'Property Documents',
'Legal Documents'
];

const documentSubclasses = {
'Personal Documents': [
'Valid ID',
'Birth Certificate (PSA)',
'Marriage Certificate',
'Barangay Clearance',
'Medical Certificate'
],
'Financial Documents': [
'Bank Statement',
'ITR (Income Tax Return)',
'Certificate of Employment',
'Payslip',
'Proof of Income'
],
'Employment Documents': [
'Certificate of Employment',
'Company ID',
'Job Contract',
'Business Permit'
],
'Property Documents': [
'Land Title',
'Tax Declaration',
'Deed of Sale',
'Property Tax Receipt'
],
'Legal Documents': [
'Affidavit',
'Court Documents',
'Notarized Documents'
]
};

// Updated lending companies with specific requirements
const companies = [
{
id: 1,
name: 'OCS Lending Incorporated',
logo: 'https://placehold.co/50x50',
interestType: 'Straight',
interestRate: '7.5%',
requirements: ['Valid ID', 'Barangay Clearance', 'Collateral (if bank should provide form for the account of the bank)'],
physicalVisitation: true,
minAmount: 5000,
maxAmount: 100000,
minTerm: 2,
maxTerm: 24,
processingFee: 750,
info: 'OCS Lending Incorporated offers straight interest loans with physical visitation requirement. Established in 2010, we have served over 50,000 customers nationwide.',
processingTime: '3-5 business days',
contact: '+63 912 345 6789',
address: '123 Main Street, Manila, Philippines',
rating: 4.5,
reviews: 1245
},
{
id: 2,
name: 'PNJ Lending Company',
logo: 'https://placehold.co/50x50',
interestType: 'Straight',
interestRate: '10%',
requirements: ['Valid ID', 'Barangay Clearance', 'Medical Cert', 'Collateral (if bank should provide form for the account of the bank)'],
physicalVisitation: false,
minAmount: 3000,
maxAmount: 50000,
minTerm: 1,
maxTerm: 12,
processingFee: 0,
info: 'PNJ Lending Company provides straight interest loans with online processing. We offer quick approval and disbursement within 24 hours for qualified applicants.',
processingTime: '1-2 business days',
contact: '+63 917 890 1234',
address: '456 Commerce Ave, Cebu City, Philippines',
rating: 4.2,
reviews: 876
},
{
id: 3,
name: 'San Hec Bro Lending Incorporated',
logo: 'https://placehold.co/50x50',
interestType: 'Diminishing',
interestRate: '5% monthly',
requirements: ['Valid ID', 'PSA', 'Barangay Clearance', 'Medical Cert', 'Collateral (if bank should provide form for the account of the bank)'],
physicalVisitation: false,
minAmount: 10000,
maxAmount: 200000,
minTerm: 3,
maxTerm: 36,
processingFee: 500,
info: 'San Hec Bro Lending Incorporated offers diminishing interest loans with flexible terms. Our mission is to provide affordable credit solutions to Filipinos.',
processingTime: '2-3 business days',
contact: '+63 918 765 4321',
address: '789 Business Park, Davao City, Philippines',
rating: 4.7,
reviews: 1567
}
];

// Animate progress bar on step change
useEffect(() => {
Animated.timing(progressAnim, {
toValue: (currentStep + 1) * (100 / 4),
duration: 500,
useNativeDriver: false
}).start();
}, [currentStep]);

// Fade in animation on mount
useEffect(() => {
Animated.timing(fadeAnim, {
toValue: 1,
duration: 800,
useNativeDriver: true
}).start();
}, []);

// Validate form fields
const validateField = (name, value) => {
let error = '';

switch (name) {
case 'loanAmount':
if (!value) error = 'Loan amount is required';
else if (isNaN(value) || parseFloat(value) <= 0) error = 'Enter a valid amount';
else if (selectedCompany) {
const company = companies.find(c => c.id === selectedCompany);
if (parseFloat(value) < company.minAmount) error = `Minimum amount is \u20b1${company.minAmount.toLocaleString()}`;
if (parseFloat(value) > company.maxAmount) error = `Maximum amount is \u20b1${company.maxAmount.toLocaleString()}`;
}
break;
case 'terms':
if (!value) error = 'Loan term is required';
else if (isNaN(value) || parseInt(value) <= 0) error = 'Enter a valid term';
else if (selectedCompany) {
const company = companies.find(c => c.id === selectedCompany);
if (parseInt(value) < company.minTerm) error = `Minimum term is ${company.minTerm} months`;
if (parseInt(value) > company.maxTerm) error = `Maximum term is ${company.maxTerm} months`;
}
break;
case 'monthlyIncome':
if (!value) error = 'Monthly income is required';
else if (isNaN(value) || parseFloat(value) <= 0) error = 'Enter a valid income';
break;
case 'purpose':
if (!value) error = 'Loan purpose is required';
break;
default:
break;
}

setErrors(prev => ({ ...prev, [name]: error }));
return error === '';
};

const handleBlur = (name, value) => {
setTouched(prev => ({ ...prev, [name]: true }));
validateField(name, value);
};

// Calculate loan details for each company
const calculateLoanDetails = (company) => {
if (!loanAmount || !terms) return null;

const amount = parseFloat(loanAmount);
const termCount = parseInt(terms);

if (company.interestType === 'Straight') {
const interestRate = company.id === 1 ? 0.075 : 0.10; // 7.5% for OCS, 10% for PNJ
const interest = amount * interestRate * termCount;
const totalPayment = amount + interest;
const monthlyPayment = totalPayment / termCount;
const netRelease = amount - company.processingFee;

return {
interest,
totalPayment,
monthlyPayment,
netRelease,
interestRate: interestRate * 100
};
} else { // Diminishing interest
const monthlyRate = 0.05; // 5% monthly
let remainingPrincipal = amount;
let totalInterest = 0;
const monthlyPrincipal = amount / termCount;

for (let i = 0; i < termCount; i++) {
const monthlyInterest = remainingPrincipal * monthlyRate;
totalInterest += monthlyInterest;
remainingPrincipal -= monthlyPrincipal;
}

const totalPayment = amount + totalInterest;
const monthlyPayment = totalPayment / termCount;
const netRelease = amount - company.processingFee;

return {
interest: totalInterest,
totalPayment,
monthlyPayment,
netRelease,
interestRate: monthlyRate * 100
};
}
};

// Calculate estimated monthly payment
const calculateEstimatedPayment = () => {
if (!loanAmount || !terms) return 0;
return parseFloat(loanAmount) / parseInt(terms);
};

// Handle collateral checkbox changes
const handleCollateralChange = (type) => {
setCollateral(prev => ({ ...prev, [type]: !prev[type] }));
};

// Show company info modal
const showCompanyInfo = (company) => {
setSelectedCompanyInfo(company);
setModalVisible(true);
};

// Handle company selection with smooth transition
const handleCompanySelection = (companyId) => {
// Validate loan amount and terms against company limits
const company = companies.find(c => c.id === companyId);
const amountError = validateField('loanAmount', loanAmount);
const termError = validateField('terms', terms);

if (!amountError || !termError) {
Alert.alert(
'Invalid Input',
`Please ensure your loan amount is between \u20b1${company.minAmount.toLocaleString()} and \u20b1${company.maxAmount.toLocaleString()} and term is between ${company.minTerm} and ${company.maxTerm} months for this lender.`,
[{ text: 'OK' }]
);
return;
}

setSelectedCompany(companyId);
setIsTransitioning(true);

// Add a small delay for visual feedback before transitioning
setTimeout(() => {
setCurrentStep(3);
setIsTransitioning(false);
}, 300);
};

// Handle class selection for a specific requirement
const handleClassSelection = (selectedClass) => {
if (currentRequirement) {
setRequirementClass(prev => ({ ...prev, [currentRequirement]: selectedClass }));
setRequirementSubclass(prev => ({ ...prev, [currentRequirement]: '' })); // Reset subclass when class changes
}
setShowClassModal(false);
setCurrentRequirement(null);
};

// Handle subclass selection for a specific requirement
const handleSubclassSelection = (selectedSubclass) => {
if (currentRequirement) {
setRequirementSubclass(prev => ({ ...prev, [currentRequirement]: selectedSubclass }));
}
setShowSubclassModal(false);
setCurrentRequirement(null);
};

// Document upload handler for a specific requirement
const handleDocumentUpload = async (requirement) => {
try {
// Request permission first
if (Platform.OS !== 'web') {
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
if (status !== 'granted') {
alert('Sorry, we need camera roll permissions to make this work!');
return;
}
}

const result = await DocumentPicker.getDocumentAsync({
type: '*/*',
multiple: true,
copyToCacheDirectory: true
});

if (!result.canceled && result.assets) {
const newDocuments = result.assets.map(asset => ({
name: asset.name || `document_${Date.now()}`,
uri: asset.uri,
type: asset.mimeType,
class: requirementClass[requirement] || '',
subclass: requirementSubclass[requirement] || '',
requirement: requirement,
uploadDate: new Date().toLocaleDateString()
}));

setDocuments(prev => [...prev, ...newDocuments]);
}
} catch (err) {
console.error('Document picker error:', err);
Alert.alert('Error', 'Failed to pick document. Please try again.');
}
};

// Camera capture handler for a specific requirement
const handleCameraCapture = async (requirement) => {
try {
const { status } = await ImagePicker.requestCameraPermissionsAsync();
if (status !== 'granted') {
alert('Sorry, we need camera permissions to make this work!');
return;
}

const result = await ImagePicker.launchCameraAsync({
allowsEditing: true,
aspect: [4, 3],
quality: 0.8,
});

if (!result.canceled) {
const newDocument = {
name: `photo_${Date.now()}.jpg`,
uri: result.assets[0].uri,
type: 'image/jpeg',
class: requirementClass[requirement] || '',
subclass: requirementSubclass[requirement] || '',
requirement: requirement,
uploadDate: new Date().toLocaleDateString(),
isImage: true
};

setDocuments(prev => [...prev, newDocument]);
}
} catch (err) {
console.error('Camera error:', err);
Alert.alert('Error', 'Failed to capture image. Please try again.');
}
};

// Remove document
const removeDocument = (index) => {
Alert.alert(
'Remove Document',
'Are you sure you want to remove this document?',
[
{ text: 'Cancel', style: 'cancel' },
{
text: 'Remove',
style: 'destructive',
onPress: () => setDocuments(prev => prev.filter((_, i) => i !== index))
}
]
);
};

// View document
const viewDocument = (document) => {
Alert.alert(
'Document Options',
`What would you like to do with ${document.name}?`,
[
{ text: 'Cancel', style: 'cancel' },
{ text: 'View Details', onPress: () => viewDocumentDetails(document) },
{ text: 'Remove', onPress: () => removeDocument(documents.indexOf(document)), style: 'destructive' }
]
);
};

// View document details
const viewDocumentDetails = (document) => {
Alert.alert(
'Document Details',
`Name: ${document.name}\
Type: ${document.type}\
Class: ${document.class}\
Subclass: ${document.subclass}\
Requirement: ${document.requirement}\
Uploaded: ${document.uploadDate}`,
[{ text: 'OK' }]
);
};

// Submit application
const submitApplication = () => {
// Validate all required fields
const amountValid = validateField('loanAmount', loanAmount);
const termsValid = validateField('terms', terms);
const incomeValid = validateField('monthlyIncome', monthlyIncome);
const purposeValid = validateField('purpose', purpose);

if (!amountValid || !termsValid || !incomeValid || !purposeValid) {
Alert.alert('Validation Error', 'Please fill all required fields correctly before submitting.');
return;
}

// Check if all requirements have at least one document
const selectedCompanyData = companies.find(c => c.id === selectedCompany);
const allRequirementsFulfilled = selectedCompanyData.requirements.every(req =>
documents.some(doc => doc.requirement === req)
);

if (!allRequirementsFulfilled) {
Alert.alert('Documents Required', 'Please upload at least one document for each requirement before submitting.');
return;
}

const loanDetails = calculateLoanDetails(selectedCompanyData);

const applicationData = {
id: 'L-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
type: loanType === 'new' ? 'New Loan' : 'Bonus Loan',
amount: `\u20b1${parseFloat(loanAmount).toLocaleString()}`,
terms: `${terms} months`,
monthlyPayment: `\u20b1${loanDetails.monthlyPayment.toFixed(2)}`,
lender: selectedCompanyData.name,
status: 'Processing',
date: new Date().toLocaleDateString(),
timestamp: new Date().toISOString(),
purpose: purpose,
monthlyIncome: `\u20b1${parseFloat(monthlyIncome).toLocaleString()}`,
collateral: collateral,
documents: documents.length,
// Additional details for the receipt
loanAmount: parseFloat(loanAmount),
interestRate: loanDetails.interestRate,
interestType: selectedCompanyData.interestType,
totalInterest: loanDetails.interest,
processingFee: selectedCompanyData.processingFee,
totalPayment: loanDetails.totalPayment,
netRelease: loanDetails.netRelease
};

// Show bubble notification first
Alert.alert(
'Application Submitted',
'Your loan application has been submitted successfully!',
[{ text: 'OK', onPress: () => navigation.navigate('PayNow', { loanApplication: applicationData }) }]
);
};

// Contact lender
const contactLender = (contactInfo) => {
Alert.alert(
'Contact Lender',
`Would you like to contact ${selectedCompanyInfo.name}?`,
[
{ text: 'Cancel', style: 'cancel' },
{ text: 'Call', onPress: () => Linking.openURL(`tel:${contactInfo}`) },
{ text: 'Text', onPress: () => Linking.openURL(`sms:${contactInfo}`) }
]
);
};

// Render progress bar
const renderProgressBar = () => {
const progressWidth = progressAnim.interpolate({
inputRange: [0, 100],
outputRange: ['0%', '100%'],
extrapolate: 'clamp'
});

return (
<View style={styles.progressContainer}>
<View style={styles.progressBackground}>
<Animated.View style={[styles.progressFill, { width: progressWidth }]} />
</View>
<View style={styles.stepLabelContainer}>
<Text style={[styles.stepLabel, currentStep >= 0 && styles.activeStepLabel]}>Type</Text>
<Text style={[styles.stepLabel, currentStep >= 1 && styles.activeStepLabel]}>Details</Text>
<Text style={[styles.stepLabel, currentStep >= 2 && styles.activeStepLabel]}>Lender</Text>
<Text style={[styles.stepLabel, currentStep >= 3 && styles.activeStepLabel]}>Documents</Text>
</View>
</View>
);
};

// Render loan type selection
const renderLoanTypeSelection = () => (
<Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
<Text style={styles.stepHeader}>Apply Loan</Text>
<Text style={styles.stepSubheader}>Select the type of loan you want to apply for</Text>

<View style={styles.loanTypeContainer}>
<TouchableOpacity
style={[
styles.loanTypeButton,
loanType === 'new' && styles.loanTypeButtonSelected
]}
onPress={() => setLoanType('new')}
>
<View style={styles.loanTypeIcon}>
<Ionicons name="cash-outline" size={32} color={loanType === 'new' ? '#8B5CF6' : '#666'} />
</View>
<Text style={[
styles.loanTypeText,
loanType === 'new' && styles.loanTypeTextSelected
]}>
New Loan
</Text>
<Text style={styles.loanTypeDescription}>
Regular New Loans with competitive rates
</Text>
<View style={styles.loanTypeCheck}>
{loanType === 'new' && <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />}
</View>
</TouchableOpacity>

<TouchableOpacity
style={[
styles.loanTypeButton,
loanType === 'bonus' && styles.loanTypeButtonSelected
]}
onPress={() => setLoanType('bonus')}
>
<View style={styles.loanTypeIcon}>
<Ionicons name="gift-outline" size={32} color={loanType === 'bonus' ? '#8B5CF6' : '#666'} />
</View>
<Text style={[
styles.loanTypeText,
loanType === 'bonus' && styles.loanTypeTextSelected
]}>
Bonus Loan
</Text>
<Text style={styles.loanTypeDescription}>
Bonuses like 13th to 14th pay, other bonuses
</Text>
<View style={styles.loanTypeCheck}>
{loanType === 'bonus' && <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />}
</View>
</TouchableOpacity>
</View>

<TouchableOpacity
style={[styles.nextButton, !loanType && styles.disabledButton]}
onPress={() => setCurrentStep(1)}
disabled={!loanType}
>
<View style={[styles.gradientButton, !loanType && styles.disabledButton]}>
<Text style={styles.nextButtonText}>Continue to Loan Details</Text>
<Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 5 }} />
</View>
</TouchableOpacity>
</Animated.View>
);

// Render Loan Details step
const renderLoanDetails = () => (
<Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
<Text style={styles.stepHeader}>Loan Details</Text>
<Text style={styles.stepSubheader}>Provide information about your loan request</Text>

<View style={styles.formGroup}>
<Text style={styles.label}>Loan Amount (\u20b1)</Text>
<View style={[styles.inputContainer, errors.loanAmount && touched.loanAmount && styles.inputError]}>
<TextInput
style={styles.input}
placeholder="Enter amount (e.g., 10000)"
keyboardType="numeric"
value={loanAmount}
onChangeText={setLoanAmount}
onBlur={() => handleBlur('loanAmount', loanAmount)}
/>
{errors.loanAmount && touched.loanAmount && (
<Text style={styles.errorText}>{errors.loanAmount}</Text>
)}
</View>
</View>

<View style={styles.formGroup}>
<Text style={styles.label}>Loan Term (months)</Text>
<View style={[styles.inputContainer, errors.terms && touched.terms && styles.inputError]}>
<TextInput
style={styles.input}
placeholder="Enter term in months (e.g., 2)"
keyboardType="numeric"
value={terms}
onChangeText={setTerms}
onBlur={() => handleBlur('terms', terms)}
/>
{errors.terms && touched.terms && (
<Text style={styles.errorText}>{errors.terms}</Text>
)}
</View>
</View>

{loanAmount && terms && (
<View style={styles.calculationBox}>
<Text style={styles.calculationTitle}>Estimated Monthly Payment:</Text>
<Text style={styles.calculationAmount}>
\u20b1{calculateEstimatedPayment().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
</Text>
<Text style={styles.calculationNote}>This is an estimate. Final amount may vary.</Text>
</View>
)}

<View style={styles.formGroup}>
<Text style={styles.label}>Monthly Income (\u20b1)</Text>
<View style={[styles.inputContainer, errors.monthlyIncome && touched.monthlyIncome && styles.inputError]}>
<TextInput
style={styles.input}
placeholder="Enter your monthly income"
keyboardType="numeric"
value={monthlyIncome}
onChangeText={setMonthlyIncome}
onBlur={() => handleBlur('monthlyIncome', monthlyIncome)}
/>
{errors.monthlyIncome && touched.monthlyIncome && (
<Text style={styles.errorText}>{errors.monthlyIncome}</Text>
)}
</View>
</View>

<View style={styles.formGroup}>
<Text style={styles.label}>Loan Purpose</Text>
<View style={[styles.inputContainer, errors.purpose && touched.purpose && styles.inputError]}>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.purposeScroll}>
{loanPurposes.map((item, index) => (
<TouchableOpacity
key={index}
style={[styles.purposeChip, purpose === item && styles.purposeChipSelected]}
onPress={() => {
setPurpose(item);
validateField('purpose', item);
}}
>
<Text style={[styles.purposeChipText, purpose === item && styles.purposeChipTextSelected]}>
{item}
</Text>
</TouchableOpacity>
))}
</ScrollView>
{errors.purpose && touched.purpose && (
<Text style={styles.errorText}>{errors.purpose}</Text>
)}
</View>
</View>

<View style={styles.formGroup}>
<Text style={styles.label}>Available Collateral</Text>
<View style={styles.checkboxContainer}>
{Object.keys(collateral).map(type => (
<TouchableOpacity
key={type}
style={styles.checkboxWrapper}
onPress={() => handleCollateralChange(type)}
>
<View style={[styles.checkbox, collateral[type] && styles.checkboxSelected]}>
{collateral[type] && <Ionicons name="checkmark" size={16} color="white" />}
</View>
<Text style={styles.checkboxLabel}>
{type.charAt(0).toUpperCase() + type.slice(1)}
{type === 'atm' && ' Card'}
</Text>
</TouchableOpacity>
))}
{collateral.other && (
<TextInput
style={[styles.input, { marginTop: 10 }]}
placeholder="Specify other collateral"
value={otherCollateralText}
onChangeText={setOtherCollateralText}
/>
)}
</View>
</View>

<View style={styles.stepNavigation}>
<TouchableOpacity
style={styles.backButton}
onPress={() => setCurrentStep(0)}
>
<Ionicons name="arrow-back" size={18} color="#333" />
<Text style={styles.backButtonText}>Back</Text>
</TouchableOpacity>

<TouchableOpacity
style={[styles.nextButton, (!loanAmount || !terms || !monthlyIncome || !purpose) && styles.disabledButton]}
onPress={() => setCurrentStep(2)}
disabled={!loanAmount || !terms || !monthlyIncome || !purpose}
>
<View style={[styles.gradientButton, (!loanAmount || !terms || !monthlyIncome || !purpose) && styles.disabledButton]}>
<Text style={styles.nextButtonText}>Next: Select Lender</Text>
<Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 5 }} />
</View>
</TouchableOpacity>
</View>
</Animated.View>
);

// Render Lending Company selection
const renderLendingCompanies = () => (
<Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
<Text style={styles.stepHeader}>Select Lending Company</Text>
<Text style={styles.stepSubheader}>Compare lenders and choose the best option for you</Text>

<View style={styles.divider} />

{companies.map(company => {
const loanDetails = calculateLoanDetails(company);
return (
<View key={company.id} style={styles.companyCard}>
<View style={styles.companyHeader}>
<Image source={{ uri: company.logo }} style={styles.companyLogo} />
<View style={styles.companyNameContainer}>
<Text style={styles.companyName}>{company.name}</Text>
<View style={styles.ratingContainer}>
<Ionicons name="star" size={14} color="#FFD700" />
<Text style={styles.ratingText}>{company.rating} ({company.reviews} reviews)</Text>
</View>
</View>
<TouchableOpacity
style={styles.infoButton}
onPress={() => showCompanyInfo(company)}
>
<Ionicons name="information-circle-outline" size={24} color="#8B5CF6" />
</TouchableOpacity>
</View>

<View style={styles.companyDetails}>
<View style={styles.detailRow}>
<Ionicons name="pricetag-outline" size={16} color="#666" />
<Text style={styles.detailText}>
Interest: <Text style={styles.detailHighlight}>{company.interestRate}</Text>
</Text>
</View>
<View style={styles.detailRow}>
<Ionicons name="time-outline" size={16} color="#666" />
<Text style={styles.detailText}>
Processing: <Text style={styles.detailHighlight}>{company.processingTime}</Text>
</Text>
</View>
{company.physicalVisitation && (
<View style={styles.detailRow}>
<Ionicons name="business-outline" size={16} color="#666" />
<Text style={styles.detailText}>(Required Physical Visitation)</Text>
</View>
)}
</View>

{loanDetails && (
<View style={styles.loanCalculation}>
<Text style={styles.loanCalculationTitle}>Loan Breakdown</Text>
<View style={styles.loanCalculationRow}>
<Text>Loan Amount:</Text>
<Text>\u20b1{parseFloat(loanAmount).toLocaleString()}</Text>
</View>
<View style={styles.loanCalculationRow}>
<Text>Terms:</Text>
<Text>({terms}) months</Text>
</View>
<View style={styles.loanCalculationRow}>
<Text>Interest ({loanDetails.interestRate.toFixed(1)}%):</Text>
<Text>\u20b1{loanDetails.interest.toFixed(2)}</Text>
</View>
<View style={styles.loanCalculationRow}>
<Text>Monthly Payment:</Text>
<Text>\u20b1{loanDetails.monthlyPayment.toFixed(2)}</Text>
</View>
<View style={[styles.loanCalculationRow, styles.netReleaseRow]}>
<Text>Net Release:</Text>
<Text style={styles.netReleaseText}>\u20b1{loanDetails.netRelease.toFixed(2)}</Text>
</View>
</View>
)}

<TouchableOpacity
style={[
styles.selectButton,
selectedCompany === company.id && styles.selectedButton,
isTransitioning && selectedCompany === company.id && styles.transitioningButton
]}
onPress={() => handleCompanySelection(company.id)}
>
{isTransitioning && selectedCompany === company.id ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="small" color="#FFFFFF" />
<Text style={styles.selectedButtonText}>Processing...</Text>
</View>
) : (
<Text style={[
styles.selectButtonText,
selectedCompany === company.id && styles.selectedButtonText
]}>
{selectedCompany === company.id ? 'Selected' : 'Select Lender'}
</Text>
)}
</TouchableOpacity>
</View>
);
})}

<View style={styles.stepNavigation}>
<TouchableOpacity
style={styles.backButton}
onPress={() => setCurrentStep(1)}
>
<Ionicons name="arrow-back" size={18} color="#333" />
<Text style={styles.backButtonText}>Back</Text>
</TouchableOpacity>
</View>

{/* Company Info Modal */}
<Modal
animationType="slide"
transparent={true}
visible={modalVisible}
onRequestClose={() => setModalVisible(false)}
>
<View style={styles.centeredView}>
<View style={styles.modalView}>
{selectedCompanyInfo && (
<React.Fragment>
<View style={styles.modalHeader}>
<Image source={{ uri: selectedCompanyInfo.logo }} style={styles.modalLogo} />
<View style={styles.modalTitleContainer}>
<Text style={styles.modalTitle}>{selectedCompanyInfo.name}</Text>
<View style={styles.ratingContainer}>
<Ionicons name="star" size={14} color="#FFD700" />
<Text style={styles.ratingText}>{selectedCompanyInfo.rating} ({selectedCompanyInfo.reviews} reviews)</Text>
</View>
</View>
<TouchableOpacity onPress={() => setModalVisible(false)}>
<Ionicons name="close-circle" size={24} color="#999" />
</TouchableOpacity>
</View>

<ScrollView style={styles.modalScroll}>
<Text style={styles.modalSectionTitle}>About:</Text>
<Text style={styles.modalText}>{selectedCompanyInfo.info}</Text>

<Text style={styles.modalSectionTitle}>Loan Details:</Text>
<View style={styles.modalDetailRow}>
<Ionicons name="pricetag-outline" size={16} color="#8B5CF6" />
<Text style={styles.modalDetailText}>Interest Type: {selectedCompanyInfo.interestType}</Text>
</View>
<View style={styles.modalDetailRow}>
<Ionicons name="cash-outline" size={16} color="#8B5CF6" />
<Text style={styles.modalDetailText}>Interest Rate: {selectedCompanyInfo.interestRate}</Text>
</View>
<View style={styles.modalDetailRow}>
<Ionicons name="time-outline" size={16} color="#8B5CF6" />
<Text style={styles.modalDetailText}>Processing Time: {selectedCompanyInfo.processingTime}</Text>
</View>
<View style={styles.modalDetailRow}>
<Ionicons name="wallet-outline" size={16} color="#8B5CF6" />
<Text style={styles.modalDetailText}>Processing Fee: \u20b1{selectedCompanyInfo.processingFee}</Text>
</View>

<Text style={styles.modalSectionTitle}>Requirements:</Text>
{selectedCompanyInfo.requirements.map((req, index) => (
<View key={index} style={styles.modalListItem}>
<Text style={styles.modalBullet}>\u2022</Text>
<Text style={styles.modalListItemText}>{req}</Text>
</View>
))}

<Text style={styles.modalSectionTitle}>Contact Information:</Text>
<View style={styles.modalDetailRow}>
<Ionicons name="call-outline" size={16} color="#8B5CF6" />
<Text style={styles.modalDetailText}>{selectedCompanyInfo.contact}</Text>
</View>
<View style={styles.modalDetailRow}>
<Ionicons name="location-outline" size={16} color="#8B5CF6" />
<Text style={styles.modalDetailText}>{selectedCompanyInfo.address}</Text>
</View>

{selectedCompanyInfo.physicalVisitation && (
<React.Fragment>
<Text style={styles.modalSectionTitle}>Special Requirements:</Text>
<View style={styles.modalListItem}>
<Ionicons name="business-outline" size={16} color="#8B5CF6" />
<Text style={styles.modalListItemText}>Physical visitation required</Text>
</View>
</React.Fragment>
)}
</ScrollView>

<TouchableOpacity
style={[styles.button, styles.buttonClose]}
onPress={() => contactLender(selectedCompanyInfo.contact)}
>
<Ionicons name="call-outline" size={18} color="white" />
<Text style={styles.textStyle}>Contact Lender</Text>
</TouchableOpacity>
</React.Fragment>
)}
</View>
</View>
</Modal>
</Animated.View>
);

// Render Document Upload step with individual requirement inputs
const renderDocumentUpload = () => {
const selectedCompanyData = companies.find(c => c.id === selectedCompany);

return (
<Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
<Text style={styles.stepHeader}>Upload Requirements</Text>
<Text style={styles.stepSubheader}>Upload documents for each requirement</Text>

<View style={styles.selectedLenderInfo}>
<Text style={styles.selectedLenderText}>Selected Lender: {selectedCompanyData.name}</Text>
</View>

{/* Individual requirement upload sections */}
<View style={styles.requirementsContainer}>
<Text style={styles.requirementsTitle}>Required Documents:</Text>

{selectedCompanyData.requirements.map((requirement, index) => {
// Find documents already uploaded for this requirement
const uploadedDocs = documents.filter(doc =>
doc.requirement === requirement
);

return (
<View key={index} style={styles.requirementSection}>
<View style={styles.requirementHeader}>
<Text style={styles.requirementText}>{requirement}</Text>
<Text style={styles.uploadStatus}>
{uploadedDocs.length > 0 ? '\u2713 Uploaded' : 'Pending'}
</Text>
</View>

<View style={styles.requirementUploadSection}>
{/* Class selection for this specific requirement */}
<View style={styles.formGroup}>
<Text style={styles.smallLabel}>Document Class:</Text>
<TouchableOpacity
style={styles.dropdownButton}
onPress={() => {
setCurrentRequirement(requirement);
setShowClassModal(true);
}}
>
<Text style={[styles.dropdownText, !requirementClass[requirement] && styles.placeholderText]}>
{requirementClass[requirement] || 'Select class'}
</Text>
<Ionicons name="chevron-down" size={18} color="#666" />
</TouchableOpacity>
</View>

{/* Subclass selection for this specific requirement */}
<View style={styles.formGroup}>
<Text style={styles.smallLabel}>Document Type:</Text>
<TouchableOpacity
style={[styles.dropdownButton, !requirementClass[requirement] && styles.disabledDropdown]}
onPress={() => {
if (requirementClass[requirement]) {
setCurrentRequirement(requirement);
setShowSubclassModal(true);
}
}}
disabled={!requirementClass[requirement]}
>
<Text style={[styles.dropdownText, !requirementSubclass[requirement] && styles.placeholderText]}>
{requirementSubclass[requirement] ||
(requirementClass[requirement] ? 'Select type' : 'Select class first')}
</Text>
<Ionicons name="chevron-down" size={18} color="#666" />
</TouchableOpacity>
</View>

{/* Upload buttons for this specific requirement */}
<View style={styles.uploadOptions}>
<TouchableOpacity
style={[styles.uploadOption, styles.smallButton]}
onPress={() => handleDocumentUpload(requirement)}
disabled={!requirementSubclass[requirement]}
>
<Ionicons name="document-attach" size={20} color="#8B5CF6" />
<Text style={styles.uploadOptionText}>Upload</Text>
</TouchableOpacity>

<TouchableOpacity
style={[styles.uploadOption, styles.smallButton]}
onPress={() => handleCameraCapture(requirement)}
disabled={!requirementSubclass[requirement]}
>
<Ionicons name="camera" size={20} color="#8B5CF6" />
<Text style={styles.uploadOptionText}>Camera</Text>
</TouchableOpacity>
</View>

{/* Show uploaded documents for this requirement */}
{uploadedDocs.length > 0 && (
<View style={styles.uploadedDocuments}>
{uploadedDocs.map((doc, docIndex) => (
<TouchableOpacity
key={docIndex}
style={styles.documentItem}
onPress={() => viewDocument(doc)}
>
<View style={styles.documentIcon}>
{doc.isImage ? (
<Ionicons name="image" size={16} color="#8B5CF6" />
) : (
<Ionicons name="document" size={16} color="#8B5CF6" />
)}
</View>
<View style={styles.documentInfo}>
<Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
<Text style={styles.documentMeta}>{doc.class} \u2022 {doc.subclass}</Text>
</View>
<TouchableOpacity onPress={() => removeDocument(documents.indexOf(doc))}>
<Ionicons name="close-circle" size={18} color="#FF3B30" />
</TouchableOpacity>
</TouchableOpacity>
))}
</View>
)}
</View>
</View>
);
})}
</View>

<View style={styles.divider} />

<View style={styles.reviewSection}>
<Text style={styles.reviewTitle}>Review Application</Text>

<View style={styles.reviewItem}>
<Text style={styles.reviewLabel}>Loan Type:</Text>
<Text style={styles.reviewValue}>{loanType === 'new' ? 'New Loan' : 'Bonus Loan'}</Text>
</View>

<View style={styles.reviewItem}>
<Text style={styles.reviewLabel}>Loan Amount:</Text>
<Text style={styles.reviewValue}>\u20b1{parseFloat(loanAmount).toLocaleString()}</Text>
</View>

<View style={styles.reviewItem}>
<Text style={styles.reviewLabel}>Term:</Text>
<Text style={styles.reviewValue}>{terms} months</Text>
</View>

<View style={styles.reviewItem}>
<Text style={styles.reviewLabel}>Monthly Income:</Text>
<Text style={styles.reviewValue}>\u20b1{parseFloat(monthlyIncome).toLocaleString()}</Text>
</View>

<View style={styles.reviewItem}>
<Text style={styles.reviewLabel}>Purpose:</Text>
<Text style={styles.reviewValue}>{purpose}</Text>
</View>

<View style={styles.reviewItem}>
<Text style={styles.reviewLabel}>Selected Lender:</Text>
<Text style={styles.reviewValue}>{selectedCompanyData.name}</Text>
</View>
</View>

<View style={styles.stepNavigation}>
<TouchableOpacity
style={styles.backButton}
onPress={() => setCurrentStep(2)}
>
<Ionicons name="arrow-back" size={18} color="#333" />
<Text style={styles.backButtonText}>Back</Text>
</TouchableOpacity>

<TouchableOpacity
style={[styles.submitButton, documents.length === 0 && styles.disabledButton]}
onPress={submitApplication}
disabled={documents.length === 0}
>
<View style={[styles.gradientButton, documents.length === 0 && styles.disabledButton]}>
<Ionicons name="checkmark-done" size={20} color="white" />
<Text style={styles.submitButtonText}>Submit Application</Text>
</View>
</TouchableOpacity>
</View>

{/* Class Selection Modal */}
<Modal
animationType="slide"
transparent={true}
visible={showClassModal}
onRequestClose={() => {
setShowClassModal(false);
setCurrentRequirement(null);
}}
>
<View style={styles.centeredView}>
<View style={styles.dropdownModal}>
<Text style={styles.modalTitle}>Select Document Class</Text>
<ScrollView style={styles.optionsList}>
{documentClasses.map((classOption, index) => (
<TouchableOpacity
key={index}
style={[
styles.optionItem,
requirementClass[currentRequirement] === classOption && styles.selectedOption
]}
onPress={() => handleClassSelection(classOption)}
>
<Text style={[
styles.optionText,
requirementClass[currentRequirement] === classOption && styles.selectedOptionText
]}>
{classOption}
</Text>
</TouchableOpacity>
))}
</ScrollView>
<TouchableOpacity
style={[styles.button, styles.buttonClose]}
onPress={() => {
setShowClassModal(false);
setCurrentRequirement(null);
}}
>
<Text style={styles.textStyle}>Cancel</Text>
</TouchableOpacity>
</View>
</View>
</Modal>

{/* Subclass Selection Modal */}
<Modal
animationType="slide"
transparent={true}
visible={showSubclassModal}
onRequestClose={() => {
setShowSubclassModal(false);
setCurrentRequirement(null);
}}
>
<View style={styles.centeredView}>
<View style={styles.dropdownModal}>
<Text style={styles.modalTitle}>Select Document Type</Text>
<ScrollView style={styles.optionsList}>
{documentSubclasses[requirementClass[currentRequirement]]?.map((subclassOption, index) => (
<TouchableOpacity
key={index}
style={[
styles.optionItem,
requirementSubclass[currentRequirement] === subclassOption && styles.selectedOption
]}
onPress={() => handleSubclassSelection(subclassOption)}
>
<Text style={[
styles.optionText,
requirementSubclass[currentRequirement] === subclassOption && styles.selectedOptionText
]}>
{subclassOption}
</Text>
</TouchableOpacity>
))}
</ScrollView>
<TouchableOpacity
style={[styles.button, styles.buttonClose]}
onPress={() => {
setShowSubclassModal(false);
setCurrentRequirement(null);
}}
>
<Text style={styles.textStyle}>Cancel</Text>
</TouchableOpacity>
</View>
</View>
</Modal>
</Animated.View>
);
};

return (
<SafeAreaView style={styles.container}>
<View style={styles.headerContainer}>
<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
<Ionicons name="arrow-back" size={24} color="#333" />
</TouchableOpacity>
<Text style={styles.header}>Loan Application</Text>
<View style={styles.headerRight} />
</View>

{renderProgressBar()}

<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
{currentStep === 0 && renderLoanTypeSelection()}
{currentStep === 1 && renderLoanDetails()}
{currentStep === 2 && renderLendingCompanies()}
{currentStep === 3 && renderDocumentUpload()}
</ScrollView>

{/* Success Modal */}
<Modal
animationType="fade"
transparent={true}
visible={showSuccessModal}
onRequestClose={() => {
setShowSuccessModal(false);
navigation.navigate('Dashboard');
}}
>
<View style={styles.centeredView}>
<View style={styles.successModal}>
<View style={styles.successIcon}>
<Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
</View>

<Text style={styles.modalTitle}>Application Submitted</Text>

<Text style={styles.modalMessage}>
Your loan application is now being processed. We'll notify you once we have updates.
</Text>

<View style={styles.detailsContainer}>
<Text style={styles.detailTitle}>Application ID: {applicationResult?.id}</Text>

<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Amount:</Text>
<Text style={styles.detailValue}>{applicationResult?.amount}</Text>
</View>

<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Term:</Text>
<Text style={styles.detailValue}>{applicationResult?.terms}</Text>
</View>

<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Lender:</Text>
<Text style={styles.detailValue}>{applicationResult?.lender}</Text>
</View>

<View style={styles.detailRow}>
<Text style={styles.detailLabel}>Status:</Text>
<Text style={[styles.detailValue, styles.statusProcessing]}>{applicationResult?.status}</Text>
</View>
</View>

<TouchableOpacity
style={[styles.button, styles.buttonSuccess]}
onPress={() => {
setShowSuccessModal(false);
navigation.navigate('Dashboard');
}}
>
<Text style={styles.textStyle}>Done</Text>
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
backgroundColor: '#F5F5F5',
},
headerContainer: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingHorizontal: 15,
paddingVertical: 10,
backgroundColor: 'white',
elevation: 2,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
},
backButtonHeader: {
padding: 5,
},
header: {
fontSize: 20,
fontWeight: 'bold',
color: '#333',
},
headerRight: {
width: 34,
},
content: {
padding: 20,
paddingBottom: 30,
},
stepContainer: {
marginBottom: 20,
},
stepHeader: {
fontSize: 22,
fontWeight: 'bold',
marginBottom: 5,
color: '#333',
},
stepSubheader: {
fontSize: 14,
color: '#666',
marginBottom: 20,
},
progressContainer: {
marginBottom: 15,
paddingHorizontal: 20,
},
progressBackground: {
height: 6,
backgroundColor: '#E5E5E5',
borderRadius: 3,
overflow: 'hidden',
marginBottom: 10,
},
progressFill: {
height: '100%',
backgroundColor: '#8B5CF6',
borderRadius: 3,
},
stepLabelContainer: {
flexDirection: 'row',
justifyContent: 'space-between',
paddingHorizontal: 5,
},
stepLabel: {
fontSize: 12,
color: '#999',
textAlign: 'center',
flex: 1,
},
activeStepLabel: {
color: '#8B5CF6',
fontWeight: '600',
},
loanTypeContainer: {
marginBottom: 25,
},
loanTypeButton: {
backgroundColor: 'white',
padding: 20,
borderRadius: 12,
borderWidth: 1.5,
borderColor: '#E5E5E5',
marginBottom: 15,
shadowColor: '#000',
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.1,
shadowRadius: 3,
elevation: 2,
position: 'relative',
},
loanTypeButtonSelected: {
borderColor: '#8B5CF6',
backgroundColor: '#F3E8FF',
shadowColor: '#8B5CF6',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.2,
shadowRadius: 4,
elevation: 3,
},
loanTypeIcon: {
marginBottom: 10,
alignItems: 'center',
},
loanTypeText: {
fontSize: 18,
fontWeight: 'bold',
color: '#555',
marginBottom: 5,
textAlign: 'center',
},
loanTypeTextSelected: {
color: '#8B5CF6',
},
loanTypeDescription: {
fontSize: 14,
color: '#777',
textAlign: 'center',
},
loanTypeCheck: {
position: 'absolute',
top: 10,
right: 10,
},
formGroup: {
marginBottom: 20,
},
label: {
fontSize: 16,
marginBottom: 8,
color: '#555',
fontWeight: '500',
},
smallLabel: {
fontSize: 14,
marginBottom: 5,
color: '#555',
},
inputContainer: {
marginBottom: 5,
},
input: {
backgroundColor: 'white',
padding: 15,
borderRadius: 10,
borderWidth: 1,
borderColor: '#DDD',
fontSize: 16,
},
inputError: {
borderColor: '#FF3B30',
},
errorText: {
color: '#FF3B30',
fontSize: 12,
marginTop: 5,
},
calculationBox: {
backgroundColor: '#F0F9FF',
padding: 15,
borderRadius: 10,
borderWidth: 1,
borderColor: '#BAE6FD',
marginBottom: 20,
},
calculationTitle: {
fontSize: 14,
color: '#0C4A6E',
marginBottom: 5,
},
calculationAmount: {
fontSize: 20,
fontWeight: 'bold',
color: '#0C4A6E',
},
calculationNote: {
fontSize: 12,
color: '#0C4A6E',
marginTop: 5,
fontStyle: 'italic',
},
checkboxContainer: {
marginTop: 10,
},
checkboxWrapper: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12,
},
checkbox: {
width: 22,
height: 22,
borderRadius: 4,
borderWidth: 1,
borderColor: '#8B5CF6',
alignItems: 'center',
justifyContent: 'center',
backgroundColor: 'transparent',
marginRight: 10,
},
checkboxSelected: {
backgroundColor: '#8B5CF6',
},
checkboxLabel: {
fontSize: 16,
color: '#333',
},
purposeScroll: {
marginHorizontal: -5,
},
purposeChip: {
paddingHorizontal: 15,
paddingVertical: 8,
borderRadius: 20,
backgroundColor: '#F5F5F5',
marginRight: 10,
borderWidth: 1,
borderColor: '#E5E5E5',
},
purposeChipSelected: {
backgroundColor: '#8B5CF6',
borderColor: '#8B5CF6',
},
purposeChipText: {
fontSize: 14,
color: '#666',
},
purposeChipTextSelected: {
color: 'white',
fontWeight: '500',
},
gradientButton: {
padding: 16,
borderRadius: 10,
alignItems: 'center',
justifyContent: 'center',
flexDirection: 'row',
backgroundColor: '#8B5CF6',
},
nextButton: {
marginTop: 20,
borderRadius: 10,
overflow: 'hidden',
},
nextButtonText: {
color: 'white',
fontSize: 16,
fontWeight: '600',
},
backButton: {
backgroundColor: '#F0F0F0',
padding: 15,
borderRadius: 10,
alignItems: 'center',
marginTop: 20,
marginRight: 10,
flex: 1,
flexDirection: 'row',
justifyContent: 'center',
},
backButtonText: {
color: '#333',
fontSize: 16,
fontWeight: '600',
marginLeft: 5,
},
submitButton: {
marginTop: 20,
borderRadius: 10,
overflow: 'hidden',
flex: 2,
},
submitButtonText: {
color: 'white',
fontSize: 16,
fontWeight: '600',
marginLeft: 5,
},
disabledButton: {
opacity: 0.6,
},
stepNavigation: {
flexDirection: 'row',
justifyContent: 'space-between',
gap: 10,
},
divider: {
height: 1,
backgroundColor: '#E5E5E5',
marginVertical: 20,
},
companyCard: {
backgroundColor: 'white',
borderRadius: 12,
padding: 15,
marginBottom: 15,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 2,
},
companyHeader: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 10,
},
companyLogo: {
width: 50,
height: 50,
marginRight: 10,
borderRadius: 8,
},
companyNameContainer: {
flex: 1,
},
companyName: {
fontSize: 16,
fontWeight: 'bold',
color: '#333',
},
ratingContainer: {
flexDirection: 'row',
alignItems: 'center',
marginTop: 2,
},
ratingText: {
fontSize: 12,
color: '#666',
marginLeft: 3,
},
infoButton: {
padding: 5,
},
companyDetails: {
marginBottom: 15,
},
detailRow: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 5,
},
detailText: {
fontSize: 14,
color: '#666',
marginLeft: 5,
},
detailHighlight: {
fontWeight: 'bold',
color: '#8B5CF6',
},
loanCalculation: {
backgroundColor: '#F9FAFB',
borderRadius: 10,
padding: 15,
marginBottom: 15,
},
loanCalculationTitle: {
fontSize: 16,
fontWeight: '600',
marginBottom: 10,
color: '#333',
},
loanCalculationRow: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 5,
},
netReleaseRow: {
borderTopWidth: 1,
borderTopColor: '#E5E5E5',
paddingTop: 8,
marginTop: 5,
},
netReleaseText: {
fontWeight: 'bold',
color: '#8B5CF6',
},
selectButton: {
backgroundColor: '#F0F0F0',
padding: 15,
borderRadius: 10,
alignItems: 'center',
},
selectedButton: {
backgroundColor: '#8B5CF6',
},
transitioningButton: {
backgroundColor: '#7C4DFF',
},
loadingContainer: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
},
selectButtonText: {
color: '#333',
fontSize: 16,
fontWeight: '600',
},
selectedButtonText: {
color: 'white',
marginLeft: 5,
},
uploadOptions: {
flexDirection: 'row',
justifyContent: 'space-between',
marginTop: 15,
marginBottom: 20,
},
uploadOption: {
flex: 1,
backgroundColor: 'white',
padding: 15,
borderRadius: 10,
alignItems: 'center',
justifyContent: 'center',
marginHorizontal: 5,
borderWidth: 1,
borderColor: '#E5E5E5',
flexDirection: 'row',
},
smallButton: {
padding: 10,
},
uploadOptionText: {
marginLeft: 8,
color: '#8B5CF6',
fontWeight: '500',
},
uploadedDocuments: {
marginTop: 10,
marginBottom: 20,
},
uploadedTitle: {
fontSize: 16,
fontWeight: '600',
marginBottom: 10,
color: '#333',
},
documentItem: {
flexDirection: 'row',
alignItems: 'center',
padding: 12,
backgroundColor: 'white',
borderRadius: 8,
borderWidth: 1,
borderColor: '#E5E5E5',
marginBottom: 8,
},
documentIcon: {
width: 36,
height: 36,
borderRadius: 18,
backgroundColor: '#F3E8FF',
alignItems: 'center',
justifyContent: 'center',
marginRight: 10,
},
documentInfo: {
flex: 1,
marginRight: 10,
},
documentName: {
fontSize: 14,
color: '#333',
marginBottom: 2,
},
documentMeta: {
fontSize: 12,
color: '#666',
},
selectedLenderInfo: {
backgroundColor: '#F0F9FF',
padding: 15,
borderRadius: 10,
borderWidth: 1,
borderColor: '#BAE6FD',
marginBottom: 20,
},
selectedLenderText: {
fontSize: 16,
fontWeight: '600',
color: '#0C4A6E',
textAlign: 'center',
},
dropdownButton: {
backgroundColor: 'white',
padding: 15,
borderRadius: 10,
borderWidth: 1,
borderColor: '#DDD',
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
disabledDropdown: {
backgroundColor: '#F5F5F5',
borderColor: '#E5E5E5',
},
dropdownText: {
fontSize: 16,
color: '#333',
},
placeholderText: {
color: '#999',
},
dropdownModal: {
backgroundColor: 'white',
borderRadius: 20,
padding: 20,
width: '90%',
maxHeight: '60%',
shadowColor: '#000',
shadowOffset: {
width: 0,
height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 4,
elevation: 5,
},
optionsList: {
maxHeight: 300,
marginVertical: 15,
},
optionItem: {
padding: 15,
borderBottomWidth: 1,
borderBottomColor: '#F0F0F0',
},
selectedOption: {
backgroundColor: '#F3E8FF',
},
optionText: {
fontSize: 16,
color: '#333',
},
selectedOptionText: {
color: '#8B5CF6',
fontWeight: '600',
},
requirementsContainer: {
marginBottom: 20,
},
requirementsTitle: {
fontSize: 16,
fontWeight: 'bold',
color: '#8B5CF6',
marginBottom: 15,
},
requirementSection: {
backgroundColor: 'white',
borderRadius: 10,
padding: 15,
marginBottom: 15,
borderWidth: 1,
borderColor: '#E5E5E5',
},
requirementHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 10,
},
requirementText: {
fontSize: 16,
fontWeight: '600',
color: '#333',
flex: 1,
},
uploadStatus: {
fontSize: 14,
color: '#4CAF50',
fontWeight: '500',
},
requirementUploadSection: {
backgroundColor: '#F9F9F9',
borderRadius: 8,
padding: 12,
},
reviewSection: {
backgroundColor: 'white',
borderRadius: 10,
padding: 15,
marginBottom: 20,
shadowColor: '#000',
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.1,
shadowRadius: 3,
elevation: 1,
},
reviewTitle: {
fontSize: 16,
fontWeight: 'bold',
marginBottom: 15,
color: '#333',
textAlign: 'center',
},
reviewItem: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 10,
paddingVertical: 4,
},
reviewLabel: {
fontSize: 14,
color: '#666',
},
reviewValue: {
fontSize: 14,
fontWeight: '500',
color: '#333',
},
// Modal styles
centeredView: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
backgroundColor: 'rgba(0,0,0,0.5)',
},
modalView: {
margin: 20,
backgroundColor: 'white',
borderRadius: 20,
padding: 20,
width: '90%',
maxHeight: '80%',
shadowColor: '#000',
shadowOffset: {
width: 0,
height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 4,
elevation: 5,
},
successModal: {
margin: 20,
backgroundColor: 'white',
borderRadius: 20,
padding: 25,
width: '90%',
alignItems: 'center',
shadowColor: '#000',
shadowOffset: {
width: 0,
height: 2,
},
shadowOpacity: 0.25,
shadowRadius: 4,
elevation: 5,
},
modalHeader: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 15,
},
modalLogo: {
width: 60,
height: 60,
marginRight: 10,
borderRadius: 10,
},
modalTitleContainer: {
flex: 1,
},
modalTitle: {
fontSize: 20,
fontWeight: 'bold',
color: '#333',
marginBottom: 5,
},
modalSubtitle: {
fontSize: 14,
color: '#666',
},
modalScroll: {
maxHeight: '70%',
},
modalSectionTitle: {
fontSize: 16,
fontWeight: 'bold',
marginTop: 15,
marginBottom: 8,
color: '#8B5CF6',
},
modalText: {
fontSize: 14,
color: '#555',
marginBottom: 10,
lineHeight: 20,
},
modalDetailRow: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 8,
},
modalDetailText: {
fontSize: 14,
color: '#555',
marginLeft: 8,
},
modalListItem: {
flexDirection: 'row',
alignItems: 'flex-start',
marginBottom: 8,
},
modalBullet: {
fontSize: 16,
color: '#8B5CF6',
marginRight: 8,
marginTop: 2,
},
modalListItemText: {
flex: 1,
fontSize: 14,
color: '#555',
lineHeight: 20,
},
button: {
borderRadius: 10,
padding: 12,
elevation: 2,
marginTop: 15,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
},
buttonClose: {
backgroundColor: '#8B5CF6',
},
buttonSuccess: {
backgroundColor: '#4CAF50',
},
textStyle: {
color: 'white',
fontWeight: 'bold',
textAlign: 'center',
marginLeft: 8,
},
// Success Modal styles
successIcon: {
width: 80,
height: 80,
borderRadius: 40,
backgroundColor: '#E8F5E9',
alignItems: 'center',
justifyContent: 'center',
marginBottom: 15,
},
modalMessage: {
fontSize: 16,
color: '#666',
textAlign: 'center',
marginBottom: 20,
lineHeight: 22,
},
detailsContainer: {
width: '100%',
marginBottom: 20,
backgroundColor: '#F9F9F9',
borderRadius: 10,
padding: 15,
},
detailTitle: {
fontSize: 16,
fontWeight: 'bold',
marginBottom: 15,
color: '#333',
textAlign: 'center',
},
detailRow: {
flexDirection: 'row',
justifyContent: 'space-between',
marginBottom: 8,
paddingVertical: 4,
},
detailLabel: {
fontSize: 14,
color: '#666',
},
detailValue: {
fontSize: 14,
color: '#333',
fontWeight: '500',
},
statusProcessing: {
color: '#FF9800',
fontWeight: 'bold',
},
});

export default LoanApplicationScreen;
