import * as SecureStore from 'expo-secure-store';

// Saves the token to the secure store
const saveToken = async (token) => {
  await SecureStore.setItemAsync('token', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED, // iOS option
  });
}

// Retrieves the token from the secure store
const getToken = async () => {
  const token = await SecureStore.getItemAsync('token');
  return token;
}

// Retrieves the phone number from the token
const getPhoneToken = async () => {
  const phone = await SecureStore.getItemAsync('phone-token');
  return phone;
}

// Saves the phone number as token to the secure store
const savePhoneToken = async (token) => {
 await SecureStore.setItemAsync('phone-token', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED, // iOS option
  });
}

// Removes the token from the secure store
const removeToken = async () => {
  await SecureStore.deleteItemAsync('token');
  await SecureStore.deleteItemAsync('phone-token');
}

// Saves account logged in by the user
const saveAccounts = async (account) => {
  await SecureStore.setItemAsync('accounts', account, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED, // iOS option
  });
};

// Get accounts
const getAccounts = async () => {
  const accounts = await SecureStore.getItemAsync('accounts');
  return accounts;
};

export { 
  saveToken, 
  getToken, 
  getPhoneToken, 
  savePhoneToken, 
  removeToken,
  saveAccounts,
  getAccounts
 };