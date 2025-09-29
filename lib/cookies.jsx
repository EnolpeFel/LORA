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

export { saveToken, getToken, getPhoneToken, savePhoneToken };